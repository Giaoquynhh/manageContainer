import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';

export class ForkliftService {
	async list(status?: string) {
		return prisma.forkliftTask.findMany({ where: status? { status } : {}, orderBy: { createdAt: 'desc' } });
	}

	async assign(actor: any, payload: { container_no: string; from_slot_id?: string; to_slot_id?: string; driver_id?: string; }) {
		const task = await prisma.forkliftTask.create({ data: {
			container_no: payload.container_no,
			from_slot_id: payload.from_slot_id || null,
			to_slot_id: payload.to_slot_id || null,
			status: 'PENDING',
			assigned_driver_id: payload.driver_id || null,
			created_by: actor._id
		}});
		await audit(actor._id, 'FORKLIFT.ASSIGN', 'TASK', task.id, payload);
		return task;
	}

	async updateStatus(actor: any, id: string, status: string, reason?: string) {
		if (!['PENDING','IN_PROGRESS','COMPLETED','CANCELLED'].includes(status)) throw new Error('Status không hợp lệ');
		const data: any = { status };
		if (status === 'CANCELLED') data.cancel_reason = reason || 'N/A';
		const updated = await prisma.forkliftTask.update({ where: { id }, data });
		await audit(actor._id, 'FORKLIFT.STATUS', 'TASK', id, { status, reason });
		return updated;
	}
}

export default new ForkliftService();


