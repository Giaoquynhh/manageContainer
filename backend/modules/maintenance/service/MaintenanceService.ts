import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';
import { RepairStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export class MaintenanceService {
  async listRepairs(query: any) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.container_no) {
      console.log('🔍 Backend: Searching for container_no:', query.container_no);
      where.container_no = query.container_no;
    }
    
    console.log('🔍 Backend: Final where clause:', where);
    const result = await prisma.repairTicket.findMany({ where, orderBy: { createdAt: 'desc' }, include: { items: true, equipment: true } });
    console.log('🔍 Backend: Found repairs:', result.length, 'items');
    if (result.length > 0) {
      console.log('🔍 Backend: First repair container_no:', result[0].container_no);
    }
    return result;
  }

  async createRepair(actor: any, payload: any) {
    console.log('=== DEBUG: createRepair START ===');
    console.log('Actor:', actor);
    console.log('Payload:', payload);
    
    // Nếu có equipment_id thì kiểm tra equipment phải ACTIVE
    if (payload.equipment_id) {
      const eq = await prisma.equipment.findUnique({ where: { id: payload.equipment_id } });
      if (!eq || eq.status !== 'ACTIVE') throw new Error('Thiết bị không hợp lệ hoặc không ACTIVE');
    }
    
    const createData = {
      code: payload.code,
      container_no: payload.container_no || null, // Lưu container number nếu có
      equipment_id: payload.equipment_id || null, // Cho phép null nếu không có equipment_id
      created_by: actor._id,
      status: 'CHECKING' as any, // Explicitly set status to CHECKING with type assertion
      problem_description: payload.problem_description,
      estimated_cost: payload.estimated_cost || 0,
      items: payload.items ? { create: payload.items.map((it: any)=>({ inventory_item_id: it.inventory_item_id, quantity: it.quantity })) } : undefined
    };
    
    console.log('Create data:', createData);
    
    const ticket = await prisma.repairTicket.create({ 
      data: createData, 
      include: { items: true } 
    });
    
    console.log('Created ticket:', ticket);
    console.log('=== DEBUG: createRepair END ===');
    
    await audit(actor._id, 'REPAIR.CREATED', 'REPAIR', ticket.id);
    return ticket;
  }

  async approveRepair(actor: any, id: string, manager_comment?: string) {
    // Transaction: minus inventory
    return prisma.$transaction(async (tx: any) => {
      const ticket = await tx.repairTicket.findUnique({ where: { id }, include: { items: true } });
      if (!ticket) throw new Error('Phiếu không tồn tại');
      if (ticket.status !== 'CHECKING') throw new Error('Chỉ duyệt phiếu đang kiểm tra (CHECKING)');
      // Check stock
      for (const it of ticket.items) {
        const item = await tx.inventoryItem.findUnique({ where: { id: it.inventory_item_id } });
        if (!item || item.qty_on_hand < it.quantity) throw new Error('Tồn kho không đủ cho một hoặc nhiều vật tư');
      }
      // Deduct stock & add movements
      for (const it of ticket.items) {
        await tx.inventoryItem.update({ where: { id: it.inventory_item_id }, data: { qty_on_hand: { decrement: it.quantity } } });
        await tx.inventoryMovement.create({ data: { inventory_item_id: it.inventory_item_id, type: 'OUT', quantity: it.quantity, ref_type: 'REPAIR', ref_id: id } });
      }
      const updated = await tx.repairTicket.update({ where: { id }, data: { status: 'PENDING_ACCEPT' as any, manager_comment } });
      await audit(actor._id, 'REPAIR.APPROVED', 'REPAIR', id);
      return updated;
    });
  }

  async rejectRepair(actor: any, id: string, manager_comment?: string) {
    const ticket = await prisma.repairTicket.findUnique({ where: { id } });
    if (!ticket) throw new Error('Phiếu không tồn tại');
    if (ticket.status !== 'CHECKING') throw new Error('Chỉ từ chối phiếu đang kiểm tra (CHECKING)');
    const updated = await prisma.repairTicket.update({ where: { id }, data: { status: 'REJECTED' as any, manager_comment } });
    await audit(actor._id, 'REPAIR.REJECTED', 'REPAIR', id);
    return updated;
  }

  async updateRepairStatus(actor: any, id: string, status: string, manager_comment?: string) {
    console.log('=== DEBUG: updateRepairStatus START ===');
    console.log('Actor:', actor);
    console.log('ID:', id);
    console.log('New status:', status);
    console.log('Manager comment:', manager_comment);
    
    const ticket = await prisma.repairTicket.findUnique({ where: { id } });
    if (!ticket) throw new Error('Phiếu không tồn tại');
    
    console.log('Current ticket:', ticket);
    
    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['CHECKING', 'PENDING_ACCEPT', 'REPAIRING', 'CHECKED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Trạng thái không hợp lệ');
    }
    
    const updateData = { 
      status: status as any, 
      manager_comment: manager_comment || ticket.manager_comment 
    };
    
    console.log('Update data:', updateData);
    
    const updated = await prisma.repairTicket.update({ 
      where: { id }, 
      data: updateData
    });
    
    console.log('Updated ticket:', updated);
    
    // Cập nhật trạng thái request nếu cần
    if (ticket.container_no && (status === 'CHECKED' || status === 'REJECTED')) {
      try {
        await this.updateRequestStatusByContainer(ticket.container_no, status);
      } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái request:', error);
        // Không throw error vì việc cập nhật request không ảnh hưởng đến việc cập nhật phiếu sửa chữa
      }
    }
    
    await audit(actor._id, `REPAIR.STATUS_UPDATED`, 'REPAIR', id, { 
      oldStatus: ticket.status, 
      newStatus: status 
    });
    
    console.log('=== DEBUG: updateRepairStatus END ===');
    return updated;
  }

  async completeRepairCheck(actor: any, id: string, result: 'PASS' | 'FAIL', manager_comment?: string) {
    const ticket = await prisma.repairTicket.findUnique({ where: { id } });
    if (!ticket) throw new Error('Phiếu không tồn tại');
    
    if (ticket.status !== 'CHECKING') {
      throw new Error('Chỉ hoàn thành kiểm tra cho phiếu đang kiểm tra (CHECKING)');
    }
    
    let newStatus: string;
    if (result === 'PASS') {
      newStatus = 'CHECKED';
    } else {
      newStatus = 'REJECTED';
    }
    
    const updated = await prisma.repairTicket.update({ 
      where: { id }, 
      data: { 
        status: newStatus as any, 
        manager_comment: manager_comment || ticket.manager_comment 
      } 
    });
    
    // Cập nhật trạng thái request
    if (ticket.container_no) {
      try {
        await this.updateRequestStatusByContainer(ticket.container_no, newStatus);
      } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái request:', error);
      }
    }
    
    await audit(actor._id, `REPAIR.CHECK_COMPLETED`, 'REPAIR', id, { 
      result,
      oldStatus: ticket.status, 
      newStatus 
    });
    
    return updated;
  }

  private async updateRequestStatusByContainer(containerNo: string, repairStatus: string) {
    // Tìm request có container_no tương ứng
    const request = await prisma.serviceRequest.findFirst({
      where: { container_no: containerNo }
    });

    if (request) {
      let newRequestStatus: string;
      
      if (repairStatus === 'CHECKED') {
        newRequestStatus = 'CHECKED';
      } else if (repairStatus === 'REJECTED') {
        newRequestStatus = 'REJECTED';
      } else {
        return; // Không cập nhật nếu không phải CHECKED hoặc REJECTED
      }

      // Cập nhật trạng thái request
      await prisma.serviceRequest.update({
        where: { id: request.id },
        data: { 
          status: newRequestStatus,
          updatedAt: new Date()
        }
      });

      console.log(`Đã cập nhật trạng thái request cho container ${containerNo} từ ${request.status} thành ${newRequestStatus}`);
    }
  }

  async listInventory(query?: any) {
    const where: any = {};
    if (query?.q) where.name = { contains: String(query.q), mode: 'insensitive' };
    if (String(query?.low || '').toLowerCase() === '1' || String(query?.low || '').toLowerCase() === 'true') {
      where.OR = [
        { qty_on_hand: { lte: 0 } },
        // Prisma không hỗ trợ trực tiếp so sánh giữa 2 cột; lấy tạm toàn bộ, FE có thể lọc bổ sung.
      ];
    }
    return prisma.inventoryItem.findMany({ where, orderBy: { name: 'asc' } });
  }

  async updateInventory(actor: any, id: string, payload: { qty_on_hand: number; reorder_point: number; unit_price: number }) {
    if (payload.qty_on_hand < 0) throw new Error('Số lượng âm không hợp lệ');
    if (payload.unit_price < 0) throw new Error('Đơn giá âm không hợp lệ');
    const updated = await prisma.inventoryItem.update({ 
      where: { id }, 
      data: { 
        qty_on_hand: payload.qty_on_hand, 
        reorder_point: payload.reorder_point,
        unit_price: payload.unit_price
      } 
    });
    await audit(actor._id, 'INVENTORY.UPDATED', 'INVENTORY', id, payload);
    return updated;
  }

  async createInventory(actor: any, payload: { name: string; uom: string; qty_on_hand: number; reorder_point: number; unit_price: number }) {
    if (payload.qty_on_hand < 0) throw new Error('Số lượng âm không hợp lệ');
    if (payload.unit_price < 0) throw new Error('Đơn giá âm không hợp lệ');
    
    const created = await prisma.inventoryItem.create({ 
      data: { 
        name: payload.name,
        uom: payload.uom,
        qty_on_hand: payload.qty_on_hand, 
        reorder_point: payload.reorder_point,
        unit_price: payload.unit_price
      } 
    });
    await audit(actor._id, 'INVENTORY.CREATED', 'INVENTORY', created.id, payload);
    return created;
  }

  async createRepairInvoice(actor: any, payload: { repair_ticket_id: string; labor_cost: number; selected_parts: Array<{ inventory_item_id: string; quantity: number }> }) {
    // Kiểm tra phiếu sửa chữa tồn tại
    const repairTicket = await prisma.repairTicket.findUnique({ 
      where: { id: payload.repair_ticket_id },
      include: { items: true }
    });
    if (!repairTicket) throw new Error('Phiếu sửa chữa không tồn tại');
    if (repairTicket.status !== 'CHECKING') throw new Error('Chỉ tạo hóa đơn cho phiếu đang kiểm tra');

    // Tính toán chi phí phụ tùng
    let partsCost = 0;
    for (const part of payload.selected_parts) {
      const inventoryItem = await prisma.inventoryItem.findUnique({ where: { id: part.inventory_item_id } });
      if (!inventoryItem) throw new Error(`Phụ tùng ${part.inventory_item_id} không tồn tại`);
      partsCost += inventoryItem.unit_price * part.quantity;
    }

    // Tính tổng chi phí
    const totalCost = partsCost + payload.labor_cost;

    // Cập nhật phiếu sửa chữa với thông tin hóa đơn
    const updatedTicket = await prisma.repairTicket.update({
      where: { id: payload.repair_ticket_id },
      data: {
        estimated_cost: totalCost,
        labor_cost: payload.labor_cost,
        status: 'PENDING_ACCEPT' as any,
        items: {
          deleteMany: {}, // Xóa items cũ
          create: payload.selected_parts.map(part => ({
            inventory_item_id: part.inventory_item_id,
            quantity: part.quantity
          }))
        }
      },
      include: { items: true }
    });

    // Cập nhật trạng thái request thành PENDING_ACCEPT nếu có
    if (repairTicket.container_no) {
      try {
        await prisma.serviceRequest.updateMany({
          where: { 
            container_no: repairTicket.container_no,
            status: { not: 'COMPLETED' } // Chỉ cập nhật request chưa hoàn thành
          },
          data: {
            status: 'PENDING_ACCEPT'
          }
        });
      } catch (error) {
        console.log('Không thể cập nhật trạng thái request:', error);
        // Không throw error vì đây không phải lỗi nghiêm trọng
      }
    }

    await audit(actor._id, 'REPAIR.INVOICE_CREATED', 'REPAIR', payload.repair_ticket_id, {
      labor_cost: payload.labor_cost,
      parts_cost: partsCost,
      total_cost: totalCost,
      selected_parts: payload.selected_parts
    });

    return {
      ...updatedTicket,
      parts_cost: partsCost,
      total_cost: totalCost
    };
  }

  async getRepairInvoice(repairTicketId: string) {
    const repairTicket = await prisma.repairTicket.findUnique({
      where: { id: repairTicketId },
      include: { 
        items: { 
          include: { 
            inventoryItem: true 
          } 
        } 
      }
    });

    if (!repairTicket) throw new Error('Phiếu sửa chữa không tồn tại');

    // Tính toán chi phí
    let partsCost = 0;
    const partsDetails = repairTicket.items.map((item: any) => {
      const itemCost = item.inventoryItem.unit_price * item.quantity;
      partsCost += itemCost;
      return {
        ...item,
        item_cost: itemCost
      };
    });

    const totalCost = partsCost + (repairTicket.labor_cost || 0);

    // Kiểm tra xem file PDF có tồn tại không
    const pdfPath = await this.getRepairInvoicePDFPath(repairTicketId, repairTicket.code);
    const pdfExists = !!pdfPath; // Chuyển đường dẫn thành boolean

    return {
      ...repairTicket,
      parts_cost: partsCost,
      total_cost: totalCost,
      parts_details: partsDetails,
      pdfExists // Thêm trường này vào kết quả trả về
    };
  }

  async uploadRepairInvoicePDF(repairTicketId: string, pdfBase64: string, fileName: string) {
    try {
      // Tạo thư mục uploads nếu chưa có
      const uploadsDir = path.join(__dirname, '../../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Tạo thư mục con cho repair invoices
      const repairInvoicesDir = path.join(uploadsDir, 'repair-invoices');
      if (!fs.existsSync(repairInvoicesDir)) {
        fs.mkdirSync(repairInvoicesDir, { recursive: true });
      }

      // Tạo tên file đơn giản: ten_phieu.pdf
      const simpleFileName = `${fileName.replace('.pdf', '')}.pdf`;
      const filePath = path.join(repairInvoicesDir, simpleFileName);

      // Chuyển base64 thành buffer và lưu file
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      fs.writeFileSync(filePath, pdfBuffer);

      // Lưu thông tin file vào database (nếu cần)
      // Có thể tạo bảng mới để lưu thông tin file

      return {
        fileName: simpleFileName,
        filePath: filePath,
        fileSize: pdfBuffer.length,
        uploadedAt: new Date()
      };
    } catch (error: any) {
      throw new Error('Lỗi khi upload PDF: ' + error.message);
    }
  }

  async getRepairTicketById(repairTicketId: string) {
    try {
      const repairTicket = await prisma.repairTicket.findUnique({
        where: { id: repairTicketId },
        select: {
          id: true,
          code: true,
          container_no: true,
          status: true,
          problem_description: true,
          estimated_cost: true,
          createdAt: true
        }
      });
      
      if (!repairTicket) {
        throw new Error('Phiếu sửa chữa không tồn tại');
      }
      
      return repairTicket;
    } catch (error: any) {
      throw new Error('Lỗi khi lấy thông tin phiếu: ' + error.message);
    }
  }

  async getRepairInvoicePDFPath(repairTicketId: string, ticketCode?: string) {
    try {
      // Tìm file PDF trong thư mục uploads/repair-invoices
      const uploadsDir = path.join(__dirname, '../../../uploads');
      const repairInvoicesDir = path.join(uploadsDir, 'repair-invoices');
      
      if (!fs.existsSync(repairInvoicesDir)) {
        return null;
      }

      // Tìm file PDF theo cả 2 định dạng: cũ và mới
      const files = fs.readdirSync(repairInvoicesDir);
      
      // Tìm file PDF theo thứ tự ưu tiên:
      // 1. Định dạng mới: REP-xxx.pdf
      // 2. Định dạng cũ: repairTicketId_timestamp_filename.pdf
      // 3. Tìm theo pattern matching với cả repairTicketId và ticketCode
      let pdfFile = null;
      
      if (ticketCode) {
        // Tìm theo định dạng mới: REP-xxx.pdf
        pdfFile = files.find(file => {
          const isPdf = file.endsWith('.pdf');
          const isNewFormat = file.startsWith(`${ticketCode}`);
          return isPdf && isNewFormat;
        });
      }
      
      // Nếu không tìm thấy định dạng mới, tìm định dạng cũ
      if (!pdfFile) {
        pdfFile = files.find(file => {
          const isPdf = file.endsWith('.pdf');
          const isOldFormat = file.startsWith(repairTicketId + '_');
          return isPdf && isOldFormat;
        });
      }
      
      // Nếu vẫn không tìm thấy, tìm bất kỳ file PDF nào có chứa repairTicketId hoặc ticketCode
      if (!pdfFile) {
        pdfFile = files.find(file => {
          const isPdf = file.endsWith('.pdf');
          const containsRepairId = file.includes(repairTicketId);
          const containsTicketCode = ticketCode ? file.includes(ticketCode) : false;
          return isPdf && (containsRepairId || containsTicketCode);
        });
      }
      
      // Nếu vẫn không tìm thấy, tìm bất kỳ file PDF nào có chứa một phần của repairTicketId hoặc ticketCode
      if (!pdfFile) {
        pdfFile = files.find(file => {
          const isPdf = file.endsWith('.pdf');
          
          // Tìm theo một phần của repairTicketId (ví dụ: 6 ký tự cuối)
          const last6CharsOfRepairId = repairTicketId.slice(-6);
          const containsLast6Chars = file.includes(last6CharsOfRepairId);
          
          // Tìm theo một phần của ticketCode (ví dụ: số cuối)
          let containsTicketCodePart = false;
          if (ticketCode) {
            const ticketCodeMatch = ticketCode.match(/\d+$/);
            if (ticketCodeMatch) {
              const ticketCodeNumber = ticketCodeMatch[0];
              containsTicketCodePart = file.includes(ticketCodeNumber);
            }
          }
          
          return isPdf && (containsLast6Chars || containsTicketCodePart);
        });
      }
      
      if (!pdfFile) {
        return null;
      }

      const fullPath = path.join(repairInvoicesDir, pdfFile);
      return fullPath;
    } catch (error: any) {
      console.error('Lỗi khi tìm file PDF:', error);
      return null;
    }
  }

  // Cập nhật hóa đơn sửa chữa
  async updateRepairInvoice(actor: any, repairTicketId: string, invoiceData: any) {
    try {
      // Kiểm tra phiếu sửa chữa tồn tại và có trạng thái phù hợp
      const repairTicket = await prisma.repairTicket.findUnique({
        where: { id: repairTicketId },
        include: { items: true }
      });

      if (!repairTicket) {
        throw new Error('Phiếu sửa chữa không tồn tại');
      }

      if (repairTicket.status !== 'PENDING_ACCEPT') {
        throw new Error('Chỉ có thể cập nhật hóa đơn khi phiếu ở trạng thái "Chờ chấp nhận"');
      }

      // Cập nhật thông tin phiếu sửa chữa với dữ liệu hóa đơn mới
      const updatedTicket = await prisma.repairTicket.update({
        where: { id: repairTicketId },
        data: {
          estimated_cost: invoiceData.total_amount || repairTicket.estimated_cost,
          problem_description: invoiceData.problem_description || repairTicket.problem_description,
          updatedAt: new Date()
        }
      });

      // Cập nhật items nếu có
      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        // Xóa items cũ
        await prisma.repairTicketItem.deleteMany({
          where: { repair_ticket_id: repairTicketId }
        });

        // Tạo items mới
        for (const item of invoiceData.items) {
          await prisma.repairTicketItem.create({
            data: {
              repair_ticket_id: repairTicketId,
              inventory_item_id: item.inventory_item_id,
              quantity: item.quantity
            }
          });
        }
      }

      await audit(actor._id, 'REPAIR_INVOICE.UPDATED', 'REPAIR_TICKET', updatedTicket.id);
      return updatedTicket;
    } catch (error: any) {
      throw new Error('Lỗi khi cập nhật hóa đơn: ' + error.message);
    }
  }

  // Gửi yêu cầu xác nhận - chuyển trạng thái request server thành PENDING_ACCEPT
  async sendConfirmationRequest(actor: any, repairTicketId: string) {
    try {
      // Kiểm tra phiếu sửa chữa tồn tại
      const repairTicket = await prisma.repairTicket.findUnique({
        where: { id: repairTicketId },
        include: { equipment: true }
      });

      if (!repairTicket) {
        throw new Error('Phiếu sửa chữa không tồn tại');
      }

      if (repairTicket.status !== 'PENDING_ACCEPT') {
        throw new Error('Chỉ có thể gửi yêu cầu xác nhận khi phiếu ở trạng thái "Chờ chấp nhận"');
      }

      // Tìm ServiceRequest tương ứng với container_no
      let serviceRequest = null;
      if (repairTicket.container_no) {
        serviceRequest = await prisma.serviceRequest.findFirst({
          where: { 
            container_no: repairTicket.container_no,
            status: { not: 'COMPLETED' } // Không phải request đã hoàn thành
          },
          orderBy: { createdAt: 'desc' } // Lấy request mới nhất
        });
      }

      // Nếu không tìm thấy theo container_no, thử tìm theo equipment.code
      if (!serviceRequest && repairTicket.equipment_id) {
        const equipment = await prisma.equipment.findUnique({
          where: { id: repairTicket.equipment_id }
        });
        
        if (equipment) {
          serviceRequest = await prisma.serviceRequest.findFirst({
            where: { 
              container_no: equipment.code,
              status: { not: 'COMPLETED' }
            },
            orderBy: { createdAt: 'desc' }
          });
        }
      }

      // Cập nhật trạng thái ServiceRequest thành PENDING_ACCEPT
      if (serviceRequest) {
        await prisma.serviceRequest.update({
          where: { id: serviceRequest.id },
          data: { 
            status: 'PENDING_ACCEPT',
            updatedAt: new Date()
          }
        });
      }

      // Nếu có equipment (container), cũng cập nhật trạng thái
      if (repairTicket.equipment_id) {
        await prisma.equipment.update({
          where: { id: repairTicket.equipment_id },
          data: { 
            status: 'PENDING_ACCEPT',
            updatedAt: new Date()
          }
        });
      }

      // Ghi log audit
      await audit(actor._id, 'REPAIR.CONFIRMATION_REQUEST_SENT', 'REPAIR', repairTicketId);

      return {
        success: true,
        message: serviceRequest 
          ? 'Đã gửi yêu cầu xác nhận thành công và cập nhật trạng thái request server'
          : 'Đã gửi yêu cầu xác nhận thành công (không tìm thấy request server tương ứng)',
        repairTicket: repairTicket,
        serviceRequest: serviceRequest
      };
    } catch (error: any) {
      throw new Error('Lỗi khi gửi yêu cầu xác nhận: ' + error.message);
    }
  }
}

export default new MaintenanceService();


