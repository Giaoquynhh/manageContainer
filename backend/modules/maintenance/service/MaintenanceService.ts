import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';

export class MaintenanceService {
  async listRepairs(query: any) {
    const where: any = {};
    if (query.status) where.status = query.status;
    return prisma.repairTicket.findMany({ where, orderBy: { createdAt: 'desc' }, include: { items: true, equipment: true } });
  }

  async createRepair(actor: any, payload: any) {
    // Equipment must be ACTIVE
    const eq = await prisma.equipment.findUnique({ where: { id: payload.equipment_id } });
    if (!eq || eq.status !== 'ACTIVE') throw new Error('Thiết bị không hợp lệ hoặc không ACTIVE');
    const ticket = await prisma.repairTicket.create({ data: {
      code: payload.code,
      equipment_id: payload.equipment_id,
      created_by: actor._id,
      problem_description: payload.problem_description,
      estimated_cost: payload.estimated_cost || 0,
      items: payload.items ? { create: payload.items.map((it: any)=>({ inventory_item_id: it.inventory_item_id, quantity: it.quantity })) } : undefined
    }, include: { items: true } });
    await audit(actor._id, 'REPAIR.CREATED', 'REPAIR', ticket.id);
    return ticket;
  }

  async approveRepair(actor: any, id: string, manager_comment?: string) {
    // Transaction: minus inventory
    return prisma.$transaction(async (tx) => {
      const ticket = await tx.repairTicket.findUnique({ where: { id }, include: { items: true } });
      if (!ticket) throw new Error('Phiếu không tồn tại');
      if (ticket.status !== 'PENDING_APPROVAL') throw new Error('Chỉ duyệt phiếu đang chờ duyệt');
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
      const updated = await tx.repairTicket.update({ where: { id }, data: { status: 'APPROVED', manager_comment } });
      await audit(actor._id, 'REPAIR.APPROVED', 'REPAIR', id);
      return updated;
    });
  }

  async rejectRepair(actor: any, id: string, manager_comment?: string) {
    const ticket = await prisma.repairTicket.findUnique({ where: { id } });
    if (!ticket) throw new Error('Phiếu không tồn tại');
    if (ticket.status !== 'PENDING_APPROVAL') throw new Error('Chỉ từ chối phiếu đang chờ duyệt');
    const updated = await prisma.repairTicket.update({ where: { id }, data: { status: 'REJECTED', manager_comment } });
    await audit(actor._id, 'REPAIR.REJECTED', 'REPAIR', id);
    return updated;
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

  async updateInventory(actor: any, id: string, payload: { qty_on_hand: number; reorder_point: number }) {
    if (payload.qty_on_hand < 0) throw new Error('Số lượng âm không hợp lệ');
    const updated = await prisma.inventoryItem.update({ where: { id }, data: { qty_on_hand: payload.qty_on_hand, reorder_point: payload.reorder_point } });
    await audit(actor._id, 'INVENTORY.UPDATED', 'INVENTORY', id, payload);
    return updated;
  }
}

export default new MaintenanceService();


