import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';

export class GateService {
	async lookup(actor: any, code: string) {
		// Demo: code chính là container_no hoặc request id
		const req = await prisma.serviceRequest.findFirst({
			where: { OR: [{ id: code }, { container_no: code }] }
		});
		if (!req) throw new Error('Không tìm thấy lịch hẹn. Vui lòng xác minh thông tin');
		await audit(actor._id, 'GATE.LOOKUP', 'REQUEST', req.id, { code });
		return req;
	}

	async checkin(actor: any, request_id: string, plate_no: string) {
		const req = await prisma.serviceRequest.findUnique({ where: { id: request_id } });
		if (!req) throw new Error('Yêu cầu không tồn tại');
		if (!['RECEIVED','COMPLETED'].includes(req.status)) {
			throw new Error('Chỉ check-in khi yêu cầu đã được tiếp nhận');
		}
		const updated = await prisma.serviceRequest.update({
			where: { id: request_id },
			data: {
				status: 'IN_YARD',
				history: [
					...(Array.isArray(req.history) ? (req.history as any[]) : []),
					{ at: new Date().toISOString(), by: actor._id, action: 'GATE_CHECKIN', plate_no }
				]
			}
		});
		await audit(actor._id, 'GATE.CHECKIN', 'REQUEST', request_id, { plate_no });
		return updated;
	}

	async checkout(actor: any, request_id: string, supervisor_pin?: string) {
		const req = await prisma.serviceRequest.findUnique({ where: { id: request_id } });
		if (!req) throw new Error('Yêu cầu không tồn tại');
		if (req.status !== 'IN_YARD') throw new Error('Chỉ check-out khi xe đang ở trong bãi');
		// Double-confirm nếu chính người đã nhận yêu cầu
		const receivedBySelf = (Array.isArray(req.history) ? (req.history as any[]) : []).some(h => h.action==='RECEIVED' && h.by===actor._id);
		if (receivedBySelf && (!supervisor_pin || supervisor_pin !== process.env.GATE_SUP_PIN)) {
			throw new Error('Yêu cầu nhập PIN trưởng ca hợp lệ');
		}
		const updated = await prisma.serviceRequest.update({
			where: { id: request_id },
			data: {
				status: 'LEFT_YARD',
				history: [
					...(Array.isArray(req.history) ? (req.history as any[]) : []),
					{ at: new Date().toISOString(), by: actor._id, action: 'GATE_CHECKOUT' }
				]
			}
		});
		await audit(actor._id, 'GATE.CHECKOUT', 'REQUEST', request_id);
		return updated;
	}

	async print(actor: any, request_id: string, type: 'IN'|'OUT') {
		const req = await prisma.serviceRequest.findUnique({ where: { id: request_id } });
		if (!req) throw new Error('Yêu cầu không tồn tại');
		if ((type==='IN' && req.status!=='IN_YARD') || (type==='OUT' && req.status!=='LEFT_YARD')) {
			throw new Error('Yêu cầu đang được xử lý, không thể in phiếu');
		}
		// Demo: chỉ trả dữ liệu; tích hợp PDF/thực tế ở bước sau
		await audit(actor._id, 'GATE.PRINT', 'REQUEST', request_id, { type });
		return {
			fileName: `Gate_${type}_${req.container_no}.pdf`,
			payload: {
				container_no: req.container_no,
				status: req.status
			}
		};
	}
}

export default new GateService();


