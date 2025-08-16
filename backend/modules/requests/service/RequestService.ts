import repo from '../repository/RequestRepository';
import { audit } from '../../../shared/middlewares/audit';
import path from 'path';
import fs from 'fs';
import chatService from '../../chat/service/ChatService';

export class RequestService {
	async createByCustomer(actor: any, payload: { type: string; container_no: string; eta?: Date }, file?: Express.Multer.File) {
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
		
		// Xử lý upload file nếu có
		if (file) {
			const uploadDir = path.join(process.cwd(), 'uploads');
			if (!fs.existsSync(uploadDir)) {
				fs.mkdirSync(uploadDir, { recursive: true });
			}
			
			// Tạo tên file unique
			const timestamp = Date.now();
			const fileExtension = path.extname(file.originalname);
			const fileName = `${timestamp}_${req.id}${fileExtension}`;
			const filePath = path.join(uploadDir, fileName);
			
			// Lưu file
			fs.writeFileSync(filePath, file.buffer);
			
			// Tạo document record
			await repo.createDoc({
				request_id: req.id,
				type: 'INITIAL_DOC',
				name: file.originalname,
				size: file.size,
				version: 1,
				uploader_id: actor._id,
				storage_key: fileName
			});
		}
		
		await audit(actor._id, 'REQUEST.CREATED', 'REQUEST', req.id);
		
		// Tự động tạo chat room cho request mới
		try {
			await chatService.createChatRoom(actor, req.id);
		} catch (error) {
			console.error('Không thể tạo chat room:', error);
		}
		
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
		
		// Xác định actor type để filter soft-delete
		let actorType: 'depot' | 'customer' | undefined;
		if (['SaleAdmin', 'SystemAdmin', 'Accountant'].includes(actor.role)) {
			actorType = 'depot';
		} else if (['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
			actorType = 'customer';
		}
		
		// Scope: Customer chỉ xem tenant của mình; Accountant/SaleAdmin xem tất cả
		if (actor.tenant_id && (actor.role === 'CustomerAdmin' || actor.role === 'CustomerUser')) {
			filter.tenant_id = actor.tenant_id;
		}
		
		const page = Math.max(1, Number(query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
		const skip = (page - 1) * limit;
		const includeHidden = query.includeHidden === 'true';
		
		const [data, total] = await Promise.all([
			repo.list(filter, skip, limit, actorType, includeHidden), 
			repo.count(filter, actorType, includeHidden)
		]);
		
		// Gắn thông tin payment mới nhất và documents để FE hiển thị
		const withPaymentAndDocs = await Promise.all(
			data.map(async (r: any) => {
				const [pay, docs] = await Promise.all([
					repo.getLatestPayment(r.id),
					repo.listDocs(r.id)
				]);
				return { 
					...r, 
					latest_payment: pay || null,
					documents: docs || []
				};
			})
		);
		return { data: withPaymentAndDocs, total, page, totalPages: Math.ceil(total / limit) };
	}

	async updateStatus(actor: any, id: string, status: string, reason?: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		// SaleAdmin và SystemAdmin được phép thay đổi trạng thái
		if (!['SaleAdmin', 'SystemAdmin'].includes(actor.role)) throw new Error('Không có quyền');

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
		const updateData: any = {
			status,
			history: [
				...prevHistory,
				{ at: new Date().toISOString(), by: actor._id, action: status, reason }
			]
		};
		
		// Nếu reject, lưu thông tin reject
		if (status === 'REJECTED') {
			updateData.rejected_reason = reason;
			updateData.rejected_by = actor._id;
			updateData.rejected_at = new Date();
		}
		
		const updated = await repo.update(id, updateData);
		await audit(actor._id, `REQUEST.${status}`, 'REQUEST', id);
		
		// Gửi system message vào chat room khi status thay đổi
		try {
			const chatRoom = await chatService.getChatRoom(actor, id);
			if (chatRoom) {
				let systemMessage = '';
				switch (status) {
					case 'PENDING':
						systemMessage = '📋 Đơn hàng đã được tạo và đang chờ xử lý';
						break;
					case 'RECEIVED':
						systemMessage = '✅ Đơn hàng đã được tiếp nhận và đang xử lý';
						break;
					case 'IN_PROGRESS':
						systemMessage = '🔄 Đơn hàng đang được xử lý tại kho';
						break;
					case 'COMPLETED':
						systemMessage = '✅ Đơn hàng đã hoàn tất';
						break;
					case 'EXPORTED':
						systemMessage = '📦 Đơn hàng đã xuất kho';
						break;
					case 'REJECTED':
						systemMessage = `❌ Đơn hàng bị từ chối${reason ? `: ${reason}` : ''}`;
						break;
					case 'CANCELLED':
						systemMessage = '❌ Đơn hàng đã bị hủy';
						break;
					case 'IN_YARD':
						systemMessage = '🏭 Container đã vào kho';
						break;
					case 'LEFT_YARD':
						systemMessage = '🚛 Container đã rời kho';
						break;
					default:
						systemMessage = `🔄 Trạng thái đơn hàng đã thay đổi thành: ${status}`;
				}
				await chatService.sendSystemMessageUnrestricted(chatRoom.id, systemMessage);
			}
		} catch (error) {
			console.error('Không thể gửi system message:', error);
		}
		
		return updated;
	}

	async rejectRequest(actor: any, id: string, reason?: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		
		// Chỉ SaleAdmin và SystemAdmin được phép reject
		if (!['SaleAdmin', 'SystemAdmin'].includes(actor.role)) {
			throw new Error('Không có quyền reject request');
		}
		
		// Chỉ cho phép reject khi status hợp lệ
		if (!['PENDING', 'RECEIVED', 'IN_YARD'].includes(req.status)) {
			throw new Error('Không thể reject request ở trạng thái hiện tại');
		}
		
		const prevHistory = Array.isArray(req.history) ? (req.history as any[]) : [];
		const updated = await repo.update(id, {
			status: 'REJECTED',
			rejected_reason: reason || null,
			rejected_by: actor._id,
			rejected_at: new Date(),
			history: [
				...prevHistory,
				{ at: new Date().toISOString(), by: actor._id, action: 'REJECTED', reason }
			]
		});
		
		await audit(actor._id, 'REQUEST.REJECTED', 'REQUEST', id, { reason });
		
		// Gửi system message vào chat room khi request bị từ chối
		try {
			const chatRoom = await chatService.getChatRoom(actor, id);
			if (chatRoom) {
				const systemMessage = `❌ Đơn hàng bị từ chối${reason ? `: ${reason}` : ''}`;
				await chatService.sendSystemMessageUnrestricted(chatRoom.id, systemMessage);
			}
		} catch (error) {
			console.error('Không thể gửi system message khi reject:', error);
		}
		
		return updated;
	}

	async softDeleteRequest(actor: any, id: string, scope: 'depot' | 'customer') {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		
		// Kiểm tra quyền theo scope
		if (scope === 'depot') {
			if (!['SaleAdmin', 'SystemAdmin', 'Accountant'].includes(actor.role)) {
				throw new Error('Không có quyền xóa request khỏi depot');
			}
			// Depot chỉ có thể xóa REJECTED, COMPLETED, EXPORTED
			if (!['REJECTED', 'COMPLETED', 'EXPORTED'].includes(req.status)) {
				throw new Error('Depot chỉ có thể xóa request đã reject, completed hoặc exported');
			}
		} else if (scope === 'customer') {
			if (!['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
				throw new Error('Không có quyền xóa request khỏi customer');
			}
			// Customer chỉ có thể xóa REJECTED
			if (req.status !== 'REJECTED') {
				throw new Error('Customer chỉ có thể xóa request đã reject');
			}
			// Kiểm tra tenant
			if (req.tenant_id !== actor.tenant_id) {
				throw new Error('Không có quyền xóa request của tenant khác');
			}
		}
		
		await repo.softDelete(id, scope);
		await audit(actor._id, 'REQUEST.DELETED', 'REQUEST', id, { scope });
		
		return { 
			ok: true, 
			id, 
			scope, 
			deleted_at: new Date().toISOString() 
		};
	}

	async restoreRequest(actor: any, id: string, scope: 'depot' | 'customer') {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		
		// Kiểm tra quyền theo scope
		if (scope === 'depot') {
			if (!['SaleAdmin', 'SystemAdmin', 'Accountant'].includes(actor.role)) {
				throw new Error('Không có quyền khôi phục request trong depot');
			}
		} else if (scope === 'customer') {
			if (!['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
				throw new Error('Không có quyền khôi phục request trong customer');
			}
			// Kiểm tra tenant
			if (req.tenant_id !== actor.tenant_id) {
				throw new Error('Không có quyền khôi phục request của tenant khác');
			}
		}
		
		await repo.restore(id, scope);
		await audit(actor._id, 'REQUEST.RESTORED', 'REQUEST', id, { scope });
		
		return { 
			ok: true, 
			id, 
			scope, 
			restored_at: new Date().toISOString() 
		};
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
		if (doc.uploader_id !== actor._id && !['SystemAdmin','BusinessAdmin','SaleAdmin','Accountant'].includes(actor.role)) throw new Error('Không có quyền xóa');
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
