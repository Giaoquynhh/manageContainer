import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';
import { RepairStatus } from '@prisma/client';

export class MaintenanceService {
  async listRepairs(query: any) {
    const where: any = {};
    if (query.status) where.status = query.status;
    return prisma.repairTicket.findMany({ where, orderBy: { createdAt: 'desc' }, include: { items: true, equipment: true } });
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
}

export default new MaintenanceService();


