import repo from '../repository/RequestRepository';
import { audit } from '../../../shared/middlewares/audit';

export class RequestService {
	async createByCustomer(actor: any, payload: { type: string; container_no: string; eta?: Date }) {
		const data = {
			tenant_id: actor.tenant_id || null,
			created_by: actor._id,
			type: payload.type,
			container_no: payload.container_no,
			eta: payload.eta || null,
			status: 'PENDING',
			history: [{ at: new Date().toISOString(), by: actor._id, action: 'CREATE' }]
		};
		const req = await repo.create(data);
		await audit(actor._id, 'REQUEST.CREATED', 'REQUEST', req.id);
		return req;
	}

	async createBySaleAdmin(actor: any, payload: any) {
		const req = await repo.create({ ...payload, created_by: actor._id, status: 'RECEIVED', history: [{ at: new Date().toISOString(), by: actor._id, action: 'RECEIVED' }] });
		await audit(actor._id, 'REQUEST.RECEIVED', 'REQUEST', req.id);
		return req;
	}

	async list(actor: any, query: any) {
		const filter: any = {};
		if (query.type) filter.type = query.type;
		if (query.status) filter.status = query.status;
		// Scope: Customer chỉ xem tenant của mình; Accountant/SaleAdmin xem tất cả
		if (actor.tenant_id && (actor.role === 'CustomerAdmin' || actor.role === 'CustomerUser')) {
			filter.tenant_id = actor.tenant_id;
		}
		const page = Math.max(1, Number(query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
		const skip = (page - 1) * limit;
		const [data, total] = await Promise.all([repo.list(filter, skip, limit), repo.count(filter)]);
		// Gắn thông tin payment mới nhất (nếu có) để FE hiển thị nhãn
		const withPayment = await Promise.all(
			data.map(async (r: any) => {
				const pay = await repo.getLatestPayment(r.id);
				return { ...r, latest_payment: pay || null };
			})
		);
		return { data: withPayment, total, page, totalPages: Math.ceil(total / limit) };
	}

	async updateStatus(actor: any, id: string, status: string, reason?: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		// Chỉ SaleAdmin được phép thay đổi trạng thái
		if (actor.role !== 'SaleAdmin') throw new Error('Không có quyền');

		// Xác định luồng hợp lệ
		const currentStatus: string = req.status;
		const allowedTransitions: Record<string, string[]> = {
			PENDING: ['RECEIVED','REJECTED'],
			RECEIVED: ['COMPLETED','EXPORTED','REJECTED','IN_YARD'],
			COMPLETED: ['EXPORTED','IN_YARD'],
			IN_YARD: ['LEFT_YARD'],
			LEFT_YARD: [],
			EXPORTED: [],
			REJECTED: []
		};
		const allowed = allowedTransitions[currentStatus] || [];
		if (!allowed.includes(status)) {
			throw new Error(`Không thể chuyển từ ${currentStatus} sang ${status}`);
		}
		// Lý do bắt buộc khi từ chối
		if (status === 'REJECTED' && (!reason || !String(reason).trim())) {
			throw new Error('Vui lòng nhập lý do từ chối');
		}

		const prevHistory = Array.isArray(req.history) ? (req.history as any[]) : [];
		const updated = await repo.update(id, {
			status,
			history: [
				...prevHistory,
				{ at: new Date().toISOString(), by: actor._id, action: status, reason }
			]
		});
		await audit(actor._id, `REQUEST.${status}`, 'REQUEST', id);
		return updated;
	}

	// Documents
	async uploadDocument(actor: any, request_id: string, type: 'EIR'|'LOLO'|'INVOICE', file: Express.Multer.File) {
		const req = await repo.findById(request_id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		// AC1: chỉ upload khi COMPLETED hoặc EXPORTED
		if (!['COMPLETED','EXPORTED'].includes(req.status)) throw new Error('Chỉ upload khi yêu cầu đã hoàn tất hoặc đã xuất kho');
		// Role check
		if ((type === 'INVOICE' && actor.role !== 'Accountant') || ((type === 'EIR' || type === 'LOLO') && actor.role !== 'SaleAdmin')) {
			throw new Error('Không có quyền upload loại phiếu này');
		}
		const last = await repo.getLastDocVersion(request_id, type);
		const version = (last?.version || 0) + 1;
		const doc = await repo.createDoc({
			request_id,
			type,
			name: file.originalname,
			size: file.size,
			version,
			uploader_id: actor._id,
			storage_key: file.path
		});
		await audit(actor._id, 'DOC.UPLOADED', 'DOC', doc.id, { request_id, type, version });
		return doc;
	}

	async listDocuments(actor: any, request_id: string) {
		const req = await repo.findById(request_id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		// scope: customer chỉ xem tenant của mình
		if ((actor.role === 'CustomerAdmin' || actor.role === 'CustomerUser') && req.tenant_id !== actor.tenant_id) throw new Error('Không có quyền');
		return repo.listDocs(request_id);
	}

	async deleteDocument(actor: any, id: string, reason?: string) {
		const doc = await repo.getDoc(id);
		if (!doc) throw new Error('Phiếu không tồn tại');
		// only uploader or higher role
		if (doc.uploaderId !== actor._id && !['SystemAdmin','BusinessAdmin','SaleAdmin','Accountant'].includes(actor.role)) throw new Error('Không có quyền xóa');
		const deleted = await repo.softDeleteDoc(id, actor._id, reason);
		await audit(actor._id, 'DOC.DELETED', 'DOC', id, { reason });
		return deleted;
	}

	// Payment
	async sendPaymentRequest(actor: any, request_id: string) {
		const req = await repo.findById(request_id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		if (req.status !== 'COMPLETED') throw new Error('Chỉ gửi yêu cầu thanh toán khi yêu cầu đã hoàn tất');
		const pr = await repo.createPayment({ request_id, created_by: actor._id, status: 'SENT' });
		await audit(actor._id, 'PAYMENT.SENT', 'REQUEST', request_id);
		return pr;
	}
}

export default new RequestService();
