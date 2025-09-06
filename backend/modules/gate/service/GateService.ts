import { PrismaClient } from '@prisma/client';
import { GateAcceptData, GateRejectData, GateSearchParams, GateApproveData } from '../dto/GateDtos';
import { audit } from '../../../shared/middlewares/audit';

const prisma = new PrismaClient();

export class GateService {

  /**
   * Forward request từ Kho sang Gate
   */
  async forwardRequest(requestId: string, actorId: string): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { docs: true }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    if (request.status !== 'SCHEDULED') {
      throw new Error('Chỉ có thể forward request có trạng thái SCHEDULED');
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'FORWARDED',
        forwarded_at: new Date(),
        forwarded_by: actorId
      }
    });

    // Audit log
    await audit(actorId, 'REQUEST.FORWARDED', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: 'FORWARDED'
    });

    return updatedRequest;
  }

  /**
   * Gate chấp nhận xe vào
   */
  async acceptGate(requestId: string, actorId: string, driverInfo: GateAcceptData): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    if (request.status !== 'FORWARDED') {
      throw new Error('Chỉ có thể chấp nhận request có trạng thái FORWARDED');
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'GATE_IN',
        gate_checked_at: new Date(),
        gate_checked_by: actorId,
        driver_name: driverInfo.driver_name,
        license_plate: driverInfo.license_plate,
        history: {
          ...(request.history as any || {}),
          gate_accept: {
            driver_name: driverInfo.driver_name,
            license_plate: driverInfo.license_plate,
            accepted_at: new Date().toISOString()
          }
        }
      }
    });

    // Audit log
    await audit(actorId, 'REQUEST.GATE_ACCEPTED', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: 'GATE_IN',
      driver_info: driverInfo
    });

    return updatedRequest;
  }

  /**
   * Gate approve request (Import → GATE_IN, Export → GATE_OUT)
   */
  async approveGate(requestId: string, actorId: string, data?: GateApproveData): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { docs: true }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    if (request.status !== 'FORWARDED') {
      throw new Error('Chỉ có thể approve request có trạng thái FORWARDED');
    }

    // Xác định trạng thái mới dựa trên loại request
    let newStatus: string;
    if (request.type === 'IMPORT') {
      newStatus = 'GATE_IN';
    } else if (request.type === 'EXPORT') {
      newStatus = 'GATE_IN'; // Thay đổi từ GATE_OUT thành GATE_IN để phù hợp với logic
    } else {
      newStatus = 'GATE_IN'; // Default cho các loại khác
    }

    const currentTime = new Date();
    
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        gate_checked_at: currentTime,
        gate_checked_by: actorId,
        // Tự động điền thời gian vào khi chuyển sang GATE_IN
        time_in: newStatus === 'GATE_IN' ? currentTime : null,
        // Lưu thông tin tài xế và biển số xe
        driver_name: data?.driver_name || null,
        license_plate: data?.license_plate || null,
        history: {
          ...(request.history as any || {}),
          gate_approve: {
            ...(request as any).history?.gate_approve,
            driver_name: data?.driver_name || null,
            license_plate: data?.license_plate || null,
            approved_at: currentTime.toISOString(),
            time_in: newStatus === 'GATE_IN' ? currentTime.toISOString() : null
          }
        }
      }
    });

    // Tự động tạo ForkliftTask cho EXPORT requests khi chuyển sang GATE_IN
    if (request.type === 'EXPORT' && request.container_no) {
      try {
        await this.createForkliftTaskForExport(request.container_no, actorId);
      } catch (error) {
        console.error('Error creating forklift task for export:', error);
        // Không throw error để không ảnh hưởng đến việc approve gate
      }
    }

    // Audit log
    await audit(actorId, 'REQUEST.GATE_APPROVED', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: newStatus,
      request_type: request.type,
      license_plate: data?.license_plate || undefined
    });

    return updatedRequest;
  }

  /**
   * Tự động tạo ForkliftTask cho EXPORT requests khi chuyển sang GATE_IN
   */
  private async createForkliftTaskForExport(containerNo: string, actorId: string): Promise<void> {
    // Kiểm tra xem đã có ForkliftTask cho container này chưa
    const existingTask = await prisma.forkliftTask.findFirst({
      where: { container_no: containerNo }
    });

    if (existingTask) {
      console.log(`ForkliftTask already exists for container ${containerNo}`);
      return;
    }

    // Tìm vị trí hiện tại của container trong yard
    const currentLocation = await prisma.yardPlacement.findFirst({
      where: { 
        container_no: containerNo, 
        status: { in: ['HOLD', 'OCCUPIED'] } 
      },
      include: { 
        slot: { 
          include: { 
            block: { 
              include: { 
                yard: true 
              } 
            } 
          } 
        } 
      }
    });

    // Tìm hoặc tạo slot đặc biệt cho gate (vị trí đích)
    let gateSlot = await prisma.yardSlot.findFirst({
      where: { 
        code: 'GATE_EXPORT',
        block: {
          code: 'GATE'
        }
      }
    });

    // Nếu chưa có slot gate, tạo mới
    if (!gateSlot) {
      // Tìm hoặc tạo yard và block cho gate
      let gateYard = await prisma.yard.findFirst({
        where: { name: 'Gate Yard' }
      });

      if (!gateYard) {
        gateYard = await prisma.yard.create({
          data: { name: 'Gate Yard' }
        });
      }

      let gateBlock = await prisma.yardBlock.findFirst({
        where: { 
          yard_id: gateYard.id,
          code: 'GATE'
        }
      });

      if (!gateBlock) {
        gateBlock = await prisma.yardBlock.create({
          data: {
            yard_id: gateYard.id,
            code: 'GATE'
          }
        });
      }

      gateSlot = await prisma.yardSlot.create({
        data: {
          block_id: gateBlock.id,
          code: 'GATE_EXPORT',
          status: 'RESERVED',
          kind: 'EXPORT',
          near_gate: 10, // Ưu tiên cao cho gate
          avoid_main: 0,
          is_odd: false
        }
      });
    }

    // Tạo ForkliftTask mới với đầy đủ thông tin
    const forkliftTask = await prisma.forkliftTask.create({
      data: {
        container_no: containerNo,
        from_slot_id: currentLocation?.slot_id || null, // Vị trí hiện tại của container trong yard
        to_slot_id: gateSlot.id, // Vị trí đích: Gate
        status: 'PENDING',
        assigned_driver_id: null,
        created_by: actorId,
        cost: 0
      }
    });

    // Audit log
    await audit(actorId, 'FORKLIFT.AUTO_CREATED', 'ForkliftTask', forkliftTask.id, {
      container_no: containerNo,
      trigger: 'GATE_IN_EXPORT',
      from_slot_id: currentLocation?.slot_id || null,
      to_slot_id: gateSlot.id,
      task_purpose: 'Move container from yard to gate for export'
    });

    console.log(`Auto-created ForkliftTask ${forkliftTask.id} for container ${containerNo} from ${currentLocation?.slot_id || 'unknown'} to ${gateSlot.id}`);
  }

  /**
   * Gate reject request
   */
  async rejectGate(requestId: string, actorId: string, rejectData: GateRejectData): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    if (request.status !== 'FORWARDED') {
      throw new Error('Chỉ có thể từ chối request có trạng thái FORWARDED');
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        gate_checked_at: new Date(),
        gate_checked_by: actorId,
        gate_reason: rejectData.reason,
        rejected_reason: rejectData.reason,
        rejected_by: actorId,
        rejected_at: new Date()
      }
    });

    // Audit log
    await audit(actorId, 'REQUEST.GATE_REJECTED', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: 'REJECTED',
      reason: rejectData.reason
    });

    return updatedRequest;
  }

  /**
   * Tìm kiếm requests ở Gate
   */
  async searchRequests(params: GateSearchParams, actorId: string): Promise<any> {
    const { status, statuses, container_no, type, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Xử lý status filter
    if (status) {
      // Nếu có status cụ thể, sử dụng nó
      where.status = status;
    } else if (statuses) {
      // Nếu có statuses (comma-separated), split và sử dụng
      const statusArray = statuses.split(',').map(s => s.trim());
      where.status = { in: statusArray };
    } else {
      // Default: hiển thị 4 trạng thái cụ thể khi chọn "Tất cả trạng thái"
      where.status = { in: ['FORWARDED', 'IN_YARD', 'IN_CAR', 'GATE_IN'] };
    }

    if (container_no) {
      where.container_no = { contains: container_no, mode: 'insensitive' };
    }

    if (type) {
      where.type = type;
    }

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          docs: true,
          attachments: true
        },
        orderBy: { forwarded_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.serviceRequest.count({ where })
    ]);

    // Bổ sung thông tin tài xế và biển số xe
    const mapped = requests.map((r: any) => {
      // Ưu tiên sử dụng trường từ database, fallback về history nếu cần
      const licensePlate = r.license_plate || (r.history as any)?.gate_approve?.license_plate || null;
      const driverName = r.driver_name || (r.history as any)?.gate_approve?.driver_name || null;
      return { ...r, license_plate: licensePlate, driver_name: driverName };
    });

    return {
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Gate OUT - Xe rời kho (chuyển từ IN_YARD hoặc IN_CAR sang GATE_OUT)
   */
  async gateOut(requestId: string, actorId: string): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    // Chỉ cho phép chuyển từ IN_YARD hoặc IN_CAR sang GATE_OUT
    if (request.status !== 'IN_YARD' && request.status !== 'IN_CAR') {
      throw new Error(`Không thể chuyển từ trạng thái ${request.status} sang GATE_OUT. Chỉ cho phép từ IN_YARD hoặc IN_CAR.`);
    }

    const currentTime = new Date();
    
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'GATE_OUT',
        // Tự động điền thời gian ra khi chuyển sang GATE_OUT
        time_out: currentTime,
        history: {
          ...(request.history as any || {}),
          gate_out: {
            previous_status: request.status,
            gate_out_at: currentTime.toISOString(),
            gate_out_by: actorId,
            time_out: currentTime.toISOString()
          }
        }
      }
    });

    // Audit log
    await audit(actorId, 'REQUEST.GATE_OUT', 'ServiceRequest', requestId, {
      previous_status: request.status,
      new_status: 'GATE_OUT',
      request_type: request.type
    });

    return updatedRequest;
  }

  /**
   * Lấy chi tiết request để xử lý ở Gate
   */
  async getRequestDetails(requestId: string): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        docs: true,
        attachments: true
      }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    // Ưu tiên sử dụng trường từ database, fallback về history nếu cần
    const licensePlate = request.license_plate || (request.history as any)?.gate_approve?.license_plate || null;
    const driverName = request.driver_name || (request.history as any)?.gate_approve?.driver_name || null;
    return { ...request, license_plate: licensePlate, driver_name: driverName };
  }

  /**
   * Validate thông tin tài xế với chứng từ
   */
  private async validateDriverInfo(request: any, driverInfo: GateAcceptData): Promise<boolean> {
    // TODO: Implement validation logic
    // So sánh container_no, seal number, booking info với chứng từ
    return true; // Tạm thời return true
  }

  /**
   * Lấy danh sách chứng từ của request
   */
  async getRequestDocuments(requestId: string): Promise<any> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        docs: {
          where: { deleted_at: null },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    return {
      request_id: request.id,
      container_no: request.container_no,
      documents: request.docs.map(doc => ({
        id: doc.id,
        type: doc.type,
        name: doc.name,
        size: doc.size,
        version: doc.version,
        created_at: doc.createdAt,
        storage_key: doc.storage_key
      }))
    };
  }

  /**
   * Xem file chứng từ
   */
  async viewDocument(requestId: string, documentId: string): Promise<any> {
    // Kiểm tra request tồn tại
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request không tồn tại');
    }

    // Lấy thông tin document
    const document = await prisma.documentFile.findFirst({
      where: {
        id: documentId,
        request_id: requestId,
        deleted_at: null
      }
    });

    if (!document) {
      throw new Error('Chứng từ không tồn tại');
    }

    // Đọc file từ storage
    const fs = require('fs');
    const path = require('path');
    
    try {
      const filePath = path.join(__dirname, '../../../uploads', document.storage_key);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('File không tồn tại trên server');
      }

      const fileBuffer = fs.readFileSync(filePath);
      const contentType = this.getContentType(document.name);

      return {
        fileName: document.name,
        contentType,
        fileBuffer,
        size: document.size
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      throw new Error('Không thể đọc file: ' + errorMessage);
    }
  }

  /**
   * Xác định content type của file
   */
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }
}


