import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';

export class MaintenanceService {
  async listRepairs(query: any) {
    const where: any = {};
    if (query.status) where.status = query.status;
    
    // Lấy phiếu sửa chữa
    const repairs = await prisma.repairTicket.findMany({ 
      where, 
      orderBy: { createdAt: 'desc' }, 
      include: { items: true, equipment: true } 
    });

    // Nếu không có filter status hoặc filter là GATE_IN, CHECKING hoặc REPAIRING, thêm container đang chờ
    if (!query.status || query.status === 'GATE_IN' || query.status === 'CHECKING' || query.status === 'REPAIRING') {
      const pendingContainers = await prisma.serviceRequest.findMany({
        where: {
          status: { in: ['GATE_IN', 'CHECKING', 'REPAIRING'] }, // Lấy container ở trạng thái GATE_IN, CHECKING và REPAIRING
          type: 'IMPORT',
          // Chỉ lấy container chưa có phiếu sửa chữa (trừ trường hợp đang ở trạng thái CHECKING hoặc REPAIRING)
          container_no: {
            notIn: repairs
              .filter(r => r.status !== 'CHECKING' && r.status !== 'REPAIRING') // Không loại trừ container đang ở trạng thái CHECKING hoặc REPAIRING
              .map(r => r.container_no)
              .filter((no): no is string => no !== null && no !== undefined)
          }
        },
        select: {
          id: true,
          container_no: true,
          type: true,
          status: true,
          createdAt: true,
          driver_name: true,
          license_plate: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Chuyển đổi container thành format giống phiếu sửa chữa
      const containerRepairs = pendingContainers.map(container => ({
        id: `container-${container.id}`,
        code: container.status === 'GATE_IN' ? `PENDING-${container.container_no}` : 
              container.status === 'CHECKING' ? `CHECKING-${container.container_no}` :
              `REPAIRING-${container.container_no}`,
        container_no: container.container_no,
        status: container.status, // Sử dụng trạng thái thật của container
        problem_description: container.status === 'GATE_IN' 
          ? `Container ${container.container_no} đang chờ bắt đầu kiểm tra - nhấn "Bắt đầu kiểm tra" để tạo phiếu sửa chữa`
          : container.status === 'CHECKING' 
          ? `Container ${container.container_no} đang được kiểm tra - nhấn "Đạt chuẩn" hoặc "Không đạt chuẩn"`
          : `Container ${container.container_no} đang được sửa chữa`,
        estimated_cost: 0,
        createdAt: container.createdAt,
        isContainer: true, // Flag để phân biệt với phiếu sửa chữa thật
        driver_name: container.driver_name,
        license_plate: container.license_plate
      }));

      // Kết hợp và sắp xếp theo thời gian
      return [...repairs, ...containerRepairs].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return repairs;
  }

  async createRepair(actor: any, payload: any) {
    // Nếu có equipment_id thì kiểm tra equipment phải ACTIVE
    if (payload.equipment_id) {
      const eq = await prisma.equipment.findUnique({ where: { id: payload.equipment_id } });
      if (!eq || eq.status !== 'ACTIVE') throw new Error('Thiết bị không hợp lệ hoặc không ACTIVE');
    }
    
          const ticket = await prisma.repairTicket.create({ data: {
        code: payload.code,
        container_no: payload.container_no || null, // Lưu container number nếu có
        equipment_id: payload.equipment_id || null, // Cho phép null nếu không có equipment_id
        created_by: actor._id,
        problem_description: payload.problem_description,
        estimated_cost: payload.estimated_cost || 0,
        items: payload.items ? { create: payload.items.map((it: any)=>({ inventory_item_id: it.inventory_item_id, quantity: it.quantity })) } : undefined
      }, include: { items: true } });
    await audit(actor._id, 'REPAIR.CREATED', 'REPAIR', ticket.id);
    return ticket;
  }

  async approveRepair(actor: any, id: string, manager_comment?: string) {
    // Kiểm tra nếu đây là container đang chờ (không phải phiếu sửa chữa thật)
    if (id.startsWith('container-')) {
      return this.createRepairFromContainer(actor, id, manager_comment);
    }

    // Xử lý phiếu sửa chữa thật
    // Transaction: minus inventory
    return prisma.$transaction(async (tx) => {
      const ticket = await tx.repairTicket.findUnique({ where: { id }, include: { items: true } });
      if (!ticket) throw new Error('Phiếu không tồn tại');
      
      // Xử lý theo workflow trạng thái mới
      let newStatus = ticket.status;
      let auditAction = '';
      
      if (ticket.status === 'GATE_IN') {
        // Chuyển từ chờ kiểm tra sang đang kiểm tra
        newStatus = 'CHECKING';
        auditAction = 'REPAIR.CHECKING';
      } else if (ticket.status === 'CHECKING') {
        // Chuyển từ đang kiểm tra sang đã kiểm tra xong (đạt chuẩn)
        newStatus = 'CHECKED';
        auditAction = 'REPAIR.CHECKED';
        
        // Cập nhật trạng thái container thành COMPLETED nếu có
        if (ticket.container_no) {
          try {
            await tx.serviceRequest.updateMany({
              where: { 
                container_no: ticket.container_no,
                status: 'CHECKING'
              },
              data: { 
                status: 'COMPLETED',
                history: {
                  maintenance_completed: {
                    completed_at: new Date().toISOString(),
                    completed_by: actor._id,
                    result: 'Đạt chuẩn',
                    repair_ticket_id: id
                  }
                }
              }
            });
          } catch (error) {
            console.error('Lỗi cập nhật trạng thái container:', error);
          }
        }
      } else if (ticket.status === 'CHECKED') {
        // Chuyển từ đã kiểm tra sang đang chờ xác nhận
        newStatus = 'CHECKING_CONFIRM';
        auditAction = 'REPAIR.CHECKING_CONFIRM';
      } else if (ticket.status === 'CHECKING_CONFIRM') {
        // Chuyển từ đang chờ xác nhận sang đã duyệt (cần kiểm tra tồn kho)
        if (ticket.items && ticket.items.length > 0) {
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
        }
        newStatus = 'APPROVED';
        auditAction = 'REPAIR.APPROVED';
      } else {
        throw new Error('Trạng thái hiện tại không thể duyệt');
      }
      
      const updated = await tx.repairTicket.update({ where: { id }, data: { status: newStatus, manager_comment } });
      await audit(actor._id, auditAction, 'REPAIR', id);
      return updated;
    });
  }

  async rejectRepair(actor: any, id: string, manager_comment?: string, action?: string) {
    // Kiểm tra nếu đây là container đang chờ
    if (id.startsWith('container-')) {
      return this.handleContainerRejection(actor, id, manager_comment, action);
    }

    const ticket = await prisma.repairTicket.findUnique({ where: { id } });
    if (!ticket) throw new Error('Phiếu không tồn tại');
    
    // Cho phép từ chối từ các trạng thái khác nhau
    const allowedRejectStatuses = ['GATE_IN', 'CHECKING', 'CHECKED', 'CHECKING_CONFIRM'];
    if (!allowedRejectStatuses.includes(ticket.status)) {
      throw new Error('Trạng thái hiện tại không thể từ chối');
    }
    
    // Xử lý đặc biệt cho trạng thái CHECKING (không đạt chuẩn)
    if (ticket.status === 'CHECKING') {
      return prisma.$transaction(async (tx) => {
        // Cập nhật phiếu thành REJECTED
        const updated = await tx.repairTicket.update({ 
          where: { id }, 
          data: { 
            status: 'REJECTED', 
            manager_comment: manager_comment || 'Không đạt chuẩn kiểm tra'
          } 
        });
        
        // Cập nhật trạng thái container thành REJECTED nếu có
        if (ticket.container_no) {
          try {
            await tx.serviceRequest.updateMany({
              where: { 
                container_no: ticket.container_no,
                status: 'CHECKING'
              },
              data: { 
                status: 'REJECTED',
                history: {
                  maintenance_rejected: {
                    rejected_at: new Date().toISOString(),
                    rejected_by: actor._id,
                    reason: manager_comment || 'Không đạt chuẩn kiểm tra',
                    repair_ticket_id: id
                  }
                }
              }
            });
          } catch (error) {
            console.error('Lỗi cập nhật trạng thái container:', error);
          }
        }
        
        await audit(actor._id, 'REPAIR.REJECTED_INSPECTION', 'REPAIR', id, {
          reason: manager_comment || 'Không đạt chuẩn kiểm tra',
          container_no: ticket.container_no
        });
        
        return updated;
      });
    }
    
    // Xử lý các trạng thái khác như bình thường
    const updated = await prisma.repairTicket.update({ where: { id }, data: { status: 'REJECTED', manager_comment } });
    await audit(actor._id, 'REPAIR.REJECTED', 'REPAIR', id);
    return updated;
  }

  /**
   * Bắt đầu kiểm tra container và tạo phiếu sửa chữa
   */
  private async createRepairFromContainer(actor: any, containerId: string, manager_comment?: string) {
    // Lấy container ID thật từ format "container-{id}"
    const realContainerId = containerId.replace('container-', '');
    
    // Sử dụng transaction để đảm bảo tính nhất quán
    return prisma.$transaction(async (tx) => {
      // Lấy thông tin container
      const container = await tx.serviceRequest.findUnique({
        where: { id: realContainerId }
      });

      if (!container) {
        throw new Error('Container không tồn tại');
      }

      if (container.status !== 'GATE_IN') {
        throw new Error('Container phải ở trạng thái GATE_IN');
      }

      // Cập nhật trạng thái container thành CHECKING
      await tx.serviceRequest.update({
        where: { id: realContainerId },
        data: { 
          status: 'CHECKING',
          history: {
            ...(container.history as any || {}),
            maintenance_start: {
              started_at: new Date().toISOString(),
              started_by: actor._id,
              action: 'Bắt đầu kiểm tra'
            }
          }
        }
      });

      // Tạo phiếu sửa chữa mới với trạng thái "Đang kiểm tra"
      const ticketCode = `MANUAL-${container.container_no}-${Date.now()}`;
      
      const repairTicket = await tx.repairTicket.create({
        data: {
          code: ticketCode,
          container_no: container.container_no,
          created_by: actor._id,
          status: 'CHECKING', // Trạng thái "Đang kiểm tra"
          problem_description: `Container ${container.container_no} - đang được kiểm tra và đánh giá tình trạng`,
          estimated_cost: 0,
          manager_comment: manager_comment || 'Bắt đầu kiểm tra từ container đang chờ'
        }
      });

      // Audit log cho việc bắt đầu kiểm tra
      await audit(actor._id, 'CONTAINER.MAINTENANCE_STARTED', 'ServiceRequest', realContainerId, {
        container_no: container.container_no,
        new_status: 'CHECKING',
        repair_ticket_id: repairTicket.id,
        action: 'Bắt đầu kiểm tra'
      });

      // Audit log cho việc tạo phiếu
      await audit(actor._id, 'REPAIR.CREATED_FROM_CONTAINER', 'RepairTicket', repairTicket.id, {
        container_no: container.container_no,
        container_request_id: realContainerId,
        manual_created: true,
        initial_status: 'UNDER_INSPECTION'
      });

      return repairTicket;
    });
  }

  /**
   * Xử lý từ chối container với 2 lựa chọn: có thể sửa chữa hoặc không thể sửa chữa
   */
  private async handleContainerRejection(actor: any, containerId: string, manager_comment?: string, action?: string) {
    console.log('handleContainerRejection called with:', { containerId, manager_comment, action }); // Debug log
    
    const realContainerId = containerId.replace('container-', '');
    const container = await prisma.serviceRequest.findUnique({ where: { id: realContainerId } });
    if (!container) throw new Error('Container không tồn tại');

    console.log('Container found:', container); // Debug log

    if (action === 'can_repair') {
      // Có thể sửa chữa - chuyển sang trạng thái sửa chữa
      return prisma.$transaction(async (tx) => {
        // Cập nhật trạng thái container thành REPAIRING
        await tx.serviceRequest.update({
          where: { id: realContainerId },
          data: { 
            status: 'REPAIRING',
            history: {
              maintenance_repair_started: {
                started_at: new Date().toISOString(),
                started_by: actor._id,
                action: 'Bắt đầu sửa chữa container'
              }
            }
          }
        });

        // Tạo phiếu sửa chữa với trạng thái REPAIRING
        const repairTicket = await tx.repairTicket.create({
          data: {
            code: `REPAIR-${container.container_no}-${Date.now()}`,
            container_no: container.container_no,
            status: 'REPAIRING',
            problem_description: `Container ${container.container_no} - cần sửa chữa sau khi kiểm tra`,
            estimated_cost: 0,
            manager_comment: manager_comment || 'Container cần sửa chữa sau khi kiểm tra',
            created_by: actor._id
          }
        });

        console.log('Repair ticket created:', repairTicket); // Debug log

        // Audit log
        await audit(actor._id, 'CONTAINER.REPAIR_STARTED', 'ServiceRequest', realContainerId, {
          container_no: container.container_no,
          new_status: 'REPAIRING',
          repair_ticket_id: repairTicket.id,
          action: 'Bắt đầu sửa chữa'
        });

        await audit(actor._id, 'REPAIR.CREATED_FOR_REPAIR', 'RepairTicket', repairTicket.id, {
          container_no: container.container_no,
          container_request_id: realContainerId,
          reason: 'Container cần sửa chữa sau khi kiểm tra'
        });

        const result = { 
          success: true, 
          message: 'Đã bắt đầu sửa chữa container', 
          repairTicket: {
            id: repairTicket.id,
            code: repairTicket.code,
            container_no: repairTicket.container_no,
            status: repairTicket.status,
            problem_description: repairTicket.problem_description,
            estimated_cost: repairTicket.estimated_cost,
            manager_comment: repairTicket.manager_comment,
            createdAt: repairTicket.createdAt,
            created_by: repairTicket.created_by
          }
        };
        console.log('Returning result:', result); // Debug log
        return result;
      });
    } else if (action === 'cannot_repair') {
      // Không thể sửa chữa - từ chối container
      return prisma.$transaction(async (tx) => {
        // Cập nhật trạng thái container thành REJECTED
        await tx.serviceRequest.update({
          where: { id: realContainerId },
          data: { 
            status: 'REJECTED',
            history: {
              maintenance_rejected: {
                rejected_at: new Date().toISOString(),
                reason: 'Container không đạt chuẩn và không thể sửa chữa'
              }
            }
          }
        });

        // Audit log
        await audit(actor._id, 'CONTAINER.REJECTED_UNREPAIRABLE', 'ServiceRequest', realContainerId, {
          container_no: container.container_no,
          reason: 'Container không đạt chuẩn và không thể sửa chữa'
        });

        return { success: true, message: 'Đã từ chối container - không thể sửa chữa' };
      });
    } else {
      throw new Error('Hành động không hợp lệ');
    }
  }

  /**
   * Bỏ qua container đang chờ (không tạo phiếu sửa chữa)
   */
  private async skipContainer(actor: any, containerId: string, manager_comment?: string) {
    // Lấy container ID thật từ format "container-{id}"
    const realContainerId = containerId.replace('container-', '');
    
    // Lấy thông tin container
    const container = await prisma.serviceRequest.findUnique({
      where: { id: realContainerId }
    });

    if (!container) {
      throw new Error('Container không tồn tại');
    }

    if (container.status !== 'GATE_IN') {
      throw new Error('Container phải ở trạng thái GATE_IN');
    }

    // Cập nhật trạng thái container thành SKIPPED hoặc có thể xóa khỏi danh sách chờ
    // Tạm thời chỉ log audit
    await audit(actor._id, 'CONTAINER.SKIPPED', 'ServiceRequest', realContainerId, {
      container_no: container.container_no,
      reason: manager_comment || 'Bỏ qua - không tạo phiếu sửa chữa',
      skipped_by: actor._id
    });

    return { message: 'Container đã được bỏ qua', container_no: container.container_no };
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

  async updateInventory(actor: any, id: string, payload: { qty_on_hand: number; reorder_point: number; unit_price?: number }) {
    if (payload.qty_on_hand < 0) throw new Error('Số lượng âm không hợp lệ');
    const updateData: any = { 
      qty_on_hand: payload.qty_on_hand, 
      reorder_point: payload.reorder_point 
    };
    if (payload.unit_price !== undefined) {
      updateData.unit_price = payload.unit_price;
    }
    const updated = await prisma.inventoryItem.update({ where: { id }, data: updateData });
    await audit(actor._id, 'INVENTORY.UPDATED', 'INVENTORY', id, payload);
    return updated;
  }
}

export default new MaintenanceService();


