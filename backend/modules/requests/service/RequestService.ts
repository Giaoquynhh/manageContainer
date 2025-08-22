import repo from '../repository/RequestRepository';
import { audit } from '../../../shared/middlewares/audit';
import path from 'path';
import fs from 'fs';
import chatService from '../../chat/service/ChatService';
import RequestStateMachine from './RequestStateMachine';
import appointmentService from './AppointmentService';

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
		
		await audit(actor._id, 'REQUEST.CREATED', 'ServiceRequest', req.id);
		
		// Tự động tạo chat room cho request mới
		try {
			await chatService.createChatRoom(actor, req.id);
		} catch (error) {
			console.error('Không thể tạo chat room:', error);
		}
		
		return req;
	}

	async createBySaleAdmin(actor: any, payload: any) {
		const req = await repo.create({ ...payload, created_by: actor._id, status: 'SCHEDULED', history: [{ at: new Date().toISOString(), by: actor._id, action: 'SCHEDULED' }] });
		await audit(actor._id, 'REQUEST.SCHEDULED', 'ServiceRequest', req.id);
		return req;
	}

	/**
	 * Forward request từ Kho sang Gate
	 */
	async forwardToGate(actor: any, requestId: string) {
		const request = await repo.findById(requestId);
		if (!request) {
			throw new Error('Request không tồn tại');
		}

		if (request.status !== 'SCHEDULED') {
			throw new Error('Chỉ có thể forward request có trạng thái SCHEDULED');
		}

		const updatedRequest = await repo.update(requestId, {
			status: 'FORWARDED',
			forwarded_at: new Date(),
			forwarded_by: actor._id,
			history: [
				...(Array.isArray(request.history) ? request.history : []),
				{ at: new Date().toISOString(), by: actor._id, action: 'FORWARDED' }
			]
		});

		await audit(actor._id, 'REQUEST.FORWARDED', 'ServiceRequest', requestId);
		return updatedRequest;
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

		// Sử dụng State Machine để validate và execute transition
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			status,
			reason
		);

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
		return updated;
	}

	async rejectRequest(actor: any, id: string, reason?: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		
		// Sử dụng State Machine để validate và execute transition
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			'REJECTED',
			reason
		);
		
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
		await audit(actor._id, 'REQUEST.DELETED', 'ServiceRequest', id, { scope });
		
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
		await audit(actor._id, 'REQUEST.RESTORED', 'ServiceRequest', id, { scope });
		
		return { 
			ok: true, 
			id, 
			scope, 
			restored_at: new Date().toISOString() 
		};
	}

	// Documents
	async uploadDocument(actor: any, request_id: string, type: 'EIR'|'LOLO'|'INVOICE'|'SUPPLEMENT', file: Express.Multer.File) {
		console.log('Upload document debug:', { actor: actor.role, request_id, type, fileSize: file?.size });
		const req = await repo.findById(request_id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		console.log('Request found:', { status: req.status, tenant_id: req.tenant_id, actor_tenant: actor.tenant_id });
		
		// Validation based on document type
		if (type === 'SUPPLEMENT') {
			// SUPPLEMENT: chỉ upload khi SCHEDULED và chỉ Customer
			if (req.status !== 'SCHEDULED') {
				throw new Error('Chỉ upload tài liệu bổ sung khi yêu cầu đã được lên lịch hẹn');
			}
			if (!['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
				throw new Error('Chỉ khách hàng được upload tài liệu bổ sung');
			}
			// Scope check: customer chỉ upload cho tenant của mình
			if (req.tenant_id !== actor.tenant_id) {
				throw new Error('Không có quyền upload cho yêu cầu này');
			}
		} else {
			// EIR/LOLO/INVOICE: chỉ upload khi COMPLETED hoặc EXPORTED
			if (!['COMPLETED','EXPORTED'].includes(req.status)) {
				throw new Error('Chỉ upload khi yêu cầu đã hoàn tất hoặc đã xuất kho');
			}
			// Role check
			if ((type === 'INVOICE' && actor.role !== 'Accountant') || ((type === 'EIR' || type === 'LOLO') && actor.role !== 'SaleAdmin')) {
				throw new Error('Không có quyền upload loại phiếu này');
			}
		}
		
		const last = await repo.getLastDocVersion(request_id, type);
		const version = (last?.version || 0) + 1;
		
		// Xử lý file upload
		const uploadDir = path.join(process.cwd(), 'uploads');
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		
		// Tạo tên file unique
		const timestamp = Date.now();
		const fileExtension = path.extname(file.originalname);
		const fileName = `${timestamp}_${request_id}_${type}${fileExtension}`;
		const filePath = path.join(uploadDir, fileName);
		
		// Lưu file
		fs.writeFileSync(filePath, file.buffer);
		
		const doc = await repo.createDoc({
			request_id,
			type,
			name: file.originalname,
			size: file.size,
			version,
			uploader_id: actor._id,
			storage_key: fileName
		});
		
		// Nếu là SUPPLEMENT document, tự động chuyển trạng thái sang FORWARDED
		if (type === 'SUPPLEMENT') {
			try {
				console.log(`Attempting to auto-forward request ${request_id} from ${req.status} to FORWARDED`);
				console.log(`Actor role: ${actor.role}, Actor ID: ${actor._id}`);
				
				// Kiểm tra xem có thể chuyển trạng thái không
				const canTransition = RequestStateMachine.canTransition(req.status, 'FORWARDED', actor.role);
				console.log(`Can transition from ${req.status} to FORWARDED: ${canTransition}`);
				
				if (!canTransition) {
					console.warn(`Cannot transition from ${req.status} to FORWARDED for role ${actor.role}`);
					return doc; // Upload thành công nhưng không chuyển trạng thái
				}
				
				// Sử dụng State Machine để chuyển trạng thái
				await RequestStateMachine.executeTransition(
					actor,
					request_id,
					req.status,
					'FORWARDED',
					'Tự động chuyển tiếp sau khi khách hàng bổ sung tài liệu'
				);
				
				console.log(`State machine transition successful, updating database...`);
				
				// Cập nhật trạng thái request
				const updatedRequest = await repo.update(request_id, {
					status: 'FORWARDED',
					forwarded_at: new Date(),
					forwarded_by: actor._id,
					history: [
						...(Array.isArray(req.history) ? req.history : []),
						{
							at: new Date().toISOString(),
							by: actor._id,
							action: 'FORWARDED',
							reason: 'Tự động chuyển tiếp sau khi khách hàng bổ sung tài liệu',
							document_id: doc.id,
							document_type: 'SUPPLEMENT'
						}
					]
				});
				
				console.log(`Request ${request_id} successfully updated to FORWARDED:`, {
					newStatus: updatedRequest.status,
					forwardedAt: updatedRequest.forwarded_at,
					forwardedBy: updatedRequest.forwarded_by
				});
				
			} catch (error) {
				console.error('Error auto-forwarding request after SUPPLEMENT upload:', error);
				console.error('Error details:', {
					message: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : 'No stack trace',
					actorRole: actor.role,
					requestId: request_id,
					currentStatus: req.status
				});
				// Không throw error để upload vẫn thành công, chỉ log warning
			}
		}
		
		// Audit log với action khác nhau cho SUPPLEMENT
		const auditAction = type === 'SUPPLEMENT' ? 'DOC.UPLOADED_SUPPLEMENT' : 'DOC.UPLOADED';
		await audit(actor._id, auditAction, 'DOC', doc.id, { request_id, type, version });
		
		return doc;
	}

	async listDocuments(actor: any, request_id: string, type?: string) {
		const req = await repo.findById(request_id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		// scope: customer chỉ xem tenant của mình
		if ((actor.role === 'CustomerAdmin' || actor.role === 'CustomerUser') && req.tenant_id !== actor.tenant_id) throw new Error('Không có quyền');
		return repo.listDocs(request_id, type);
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
		await audit(actor._id, 'PAYMENT.SENT', 'ServiceRequest', request_id);
		return pr;
	}

	// State Machine Methods
	async scheduleRequest(actor: any, id: string, appointmentData: any) {
		return await appointmentService.scheduleAppointment(actor, id, appointmentData);
	}

	async updateAppointment(actor: any, id: string, appointmentData: any) {
		return await appointmentService.updateAppointment(actor, id, appointmentData);
	}

	async addInfoToRequest(actor: any, id: string, documents: any[], notes?: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		// Validate transition
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			'SCHEDULED_INFO_ADDED'
		);

		const updateData: any = {
			status: 'SCHEDULED_INFO_ADDED',
			attachments_count: (req.attachments_count || 0) + documents.length,
			history: [
				...(Array.isArray(req.history) ? req.history : []),
				{
					at: new Date().toISOString(),
					by: actor._id,
					action: 'INFO_ADDED',
					documents_count: documents.length,
					notes
				}
			]
		};

		// Xử lý documents nếu có
		if (documents && documents.length > 0) {
			// TODO: Implement document upload logic
			console.log('Documents to be processed:', documents);
		}

		const updated = await repo.update(id, updateData);
		return updated;
	}

	async sendToGate(actor: any, id: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		// Validate transition
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			'SENT_TO_GATE'
		);

		const updateData = {
			status: 'SENT_TO_GATE',
			history: [
				...(Array.isArray(req.history) ? req.history : []),
				{
					at: new Date().toISOString(),
					by: actor._id,
					action: 'SENT_TO_GATE'
				}
			]
		};

		const updated = await repo.update(id, updateData);
		return updated;
	}

	async completeRequest(actor: any, id: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		// Validate transition
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			'COMPLETED'
		);

		const updateData = {
			status: 'COMPLETED',
			history: [
				...(Array.isArray(req.history) ? req.history : []),
				{
					at: new Date().toISOString(),
					by: actor._id,
					action: 'COMPLETED'
				}
			]
		};

		const updated = await repo.update(id, updateData);
		return updated;
	}

	// Helper methods
	async getValidTransitions(actor: any, id: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		return RequestStateMachine.getValidTransitions(req.status, actor.role);
	}

	async getStateInfo(state: string) {
		return {
			state,
			description: RequestStateMachine.getStateDescription(state),
			color: RequestStateMachine.getStateColor(state)
		};
	}

	async getAppointmentInfo(id: string) {
		return await appointmentService.getAppointmentInfo(id);
	}
}

export default new RequestService();
