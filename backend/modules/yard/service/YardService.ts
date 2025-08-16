import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';

export class YardService {
	async getMap() {
		const yards = await prisma.yard.findMany({ include: { blocks: { include: { slots: true } } } });
		return yards;
	}

	async findContainer(container_no: string) {
		const slot = await prisma.yardSlot.findFirst({ where: { occupant_container_no: container_no }, include: { block: { include: { yard: true } } } });
		return slot;
	}

	async suggestPosition(container_no: string) {
		// Nếu container đã có vị trí -> không gợi ý, yêu cầu thao tác di chuyển
		if (container_no) {
			const current = await prisma.yardSlot.findFirst({ where: { occupant_container_no: container_no } });
			if (current) {
				throw new Error(`Container đã được gán tại ${current.code}. Vui lòng giải phóng/di chuyển trước khi gán mới`);
			}
		}
		// simple scoring demo according to weights
		const slots: any[] = await prisma.yardSlot.findMany({ where: { status: 'EMPTY' }, take: 50 });
		const scored: Array<{ slot: any; score: number }> = slots.map((s: any) => {
			const near = s.near_gate || 0; // higher is closer
			const sameType = 1; // placeholder
			const avoid = s.avoid_main || 0;
			const odd = s.is_odd ? 1 : 0;
			const score = 0.4*near + 0.3*sameType + 0.2*(1-avoid) + 0.1*odd;
			return { slot: s, score };
		}).sort((a: {score:number}, b: {score:number})=>b.score-a.score);
		return scored.slice(0,10);
	}

	async assignPosition(actor: any, container_no: string, slot_id: string) {
		// Chặn gán khi container đã có vị trí hiện hữu
		const existing = await prisma.yardSlot.findFirst({ where: { occupant_container_no: container_no } });
		if (existing) {
			throw new Error(`Container đã được gán tại ${existing.code}. Không thể gán trùng.`);
		}
		const slot = await prisma.yardSlot.findUnique({ where: { id: slot_id } });
		if (!slot) throw new Error('Slot không tồn tại');
		if (!['EMPTY','RESERVED'].includes(slot.status)) throw new Error('Slot không khả dụng');
		const updated = await prisma.yardSlot.update({ where: { id: slot_id }, data: { status: 'OCCUPIED', occupant_container_no: container_no, reserved_expire_at: null } });
		await audit(actor._id, 'YARD.POSITION_ASSIGNED', 'YARD_SLOT', slot_id, { container_no });
		return updated;
	}
}

export default new YardService();


