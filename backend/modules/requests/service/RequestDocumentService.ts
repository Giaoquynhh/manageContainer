import repo from '../repository/RequestRepository';
import { audit } from '../../../shared/middlewares/audit';
import RequestStateMachine from './RequestStateMachine';
import path from 'path';
import fs from 'fs';

export class RequestDocumentService {
	/**
	 * Upload document
	 */
	async uploadDocument(actor: any, request_id: string, type: 'EIR'|'LOLO'|'INVOICE'|'SUPPLEMENT'|'EXPORT_DOC', file: Express.Multer.File) {
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
		} else if (type === 'EXPORT_DOC') {
			// EXPORT_DOC: chỉ upload khi PICK_CONTAINER và chỉ SaleAdmin/SystemAdmin/BusinessAdmin
			if (req.status !== 'PICK_CONTAINER') {
				throw new Error('Chỉ upload chứng từ xuất khi yêu cầu đang ở trạng thái chọn container');
			}
			if (req.type !== 'EXPORT') {
				throw new Error('Chỉ upload chứng từ xuất cho yêu cầu loại EXPORT');
			}
			if (!['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(actor.role)) {
				throw new Error('Chỉ admin được upload chứng từ xuất');
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
		const uploadDir = path.join(process.cwd(), 'backend', 'uploads');
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
			await this.handleSupplementUpload(actor, request_id, req, doc);
		}
		
		// Nếu là EXPORT_DOC document, tự động chuyển trạng thái sang SCHEDULED
		if (type === 'EXPORT_DOC') {
			await this.handleExportDocUpload(actor, request_id, req, doc);
		}
		
		// Audit log với action khác nhau cho SUPPLEMENT và EXPORT_DOC
		let auditAction = 'DOC.UPLOADED';
		if (type === 'SUPPLEMENT') {
			auditAction = 'DOC.UPLOADED_SUPPLEMENT';
		} else if (type === 'EXPORT_DOC') {
			auditAction = 'DOC.UPLOADED_EXPORT_DOC';
		}
		await audit(actor._id, auditAction, 'DOC', doc.id, { request_id, type, version });
		
		return doc;
	}

	/**
	 * Upload multiple documents
	 */
	async uploadMultipleDocuments(actor: any, request_id: string, type: 'EIR'|'LOLO'|'INVOICE'|'SUPPLEMENT'|'EXPORT_DOC', files: Express.Multer.File[]) {
		console.log('Upload multiple documents debug:', { actor: actor.role, request_id, type, fileCount: files.length });
		
		const req = await repo.findById(request_id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		console.log('Request found:', { status: req.status, tenant_id: req.tenant_id, actor_tenant: actor.tenant_id });
		
		// Validation based on document type (same as single upload)
		if (type === 'SUPPLEMENT') {
			if (req.status !== 'SCHEDULED') {
				throw new Error('Chỉ upload tài liệu bổ sung khi yêu cầu đã được lên lịch hẹn');
			}
			if (!['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
				throw new Error('Chỉ khách hàng được upload tài liệu bổ sung');
			}
			if (req.tenant_id !== actor.tenant_id) {
				throw new Error('Không có quyền upload cho yêu cầu này');
			}
		} else if (type === 'EXPORT_DOC') {
			if (req.status !== 'PICK_CONTAINER') {
				throw new Error('Chỉ upload chứng từ xuất khi yêu cầu đang ở trạng thái chọn container');
			}
			if (req.type !== 'EXPORT') {
				throw new Error('Chỉ upload chứng từ xuất cho yêu cầu loại EXPORT');
			}
			if (!['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(actor.role)) {
				throw new Error('Chỉ admin được upload chứng từ xuất');
			}
		} else {
			if (!['COMPLETED','EXPORTED'].includes(req.status)) {
				throw new Error('Chỉ upload khi yêu cầu đã hoàn tất hoặc đã xuất kho');
			}
			if ((type === 'INVOICE' && actor.role !== 'Accountant') || ((type === 'EIR' || type === 'LOLO') && actor.role !== 'SaleAdmin')) {
				throw new Error('Không có quyền upload loại phiếu này');
			}
		}

		const uploadDir = path.join(process.cwd(), 'backend', 'uploads');
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		const uploadedDocs = [];
		let lastVersion = await repo.getLastDocVersion(request_id, type);
		let currentVersion = lastVersion?.version || 0;

		// Upload từng file
		for (const file of files) {
			currentVersion++;
			
			// Tạo tên file unique
			const timestamp = Date.now();
			const fileExtension = path.extname(file.originalname);
			const fileName = `${timestamp}_${request_id}_${type}_${currentVersion}${fileExtension}`;
			const filePath = path.join(uploadDir, fileName);
			
			// Lưu file
			fs.writeFileSync(filePath, file.buffer);
			
			const doc = await repo.createDoc({
				request_id,
				type,
				name: file.originalname,
				size: file.size,
				version: currentVersion,
				uploader_id: actor._id,
				storage_key: fileName
			});
			
			uploadedDocs.push(doc);
		}

		// Nếu là SUPPLEMENT documents, tự động chuyển trạng thái sang FORWARDED
		if (type === 'SUPPLEMENT') {
			await this.handleSupplementUpload(actor, request_id, req, uploadedDocs[0]); // Chỉ cần 1 doc để trigger
		}
		
		// Nếu là EXPORT_DOC documents, tự động chuyển trạng thái sang SCHEDULED
		if (type === 'EXPORT_DOC') {
			await this.handleExportDocUpload(actor, request_id, req, uploadedDocs[0]); // Chỉ cần 1 doc để trigger
		}
		
		// Audit log
		let auditAction = 'DOC.UPLOADED_MULTIPLE';
		if (type === 'SUPPLEMENT') {
			auditAction = 'DOC.UPLOADED_SUPPLEMENT_MULTIPLE';
		} else if (type === 'EXPORT_DOC') {
			auditAction = 'DOC.UPLOADED_EXPORT_DOC_MULTIPLE';
		}
		await audit(actor._id, auditAction, 'DOC', request_id, { request_id, type, count: uploadedDocs.length });
		
		return uploadedDocs;
	}

	/**
	 * Handle SUPPLEMENT document upload with auto-forward
	 */
	private async handleSupplementUpload(actor: any, request_id: string, req: any, doc: any) {
		try {
			console.log(`Attempting to auto-forward request ${request_id} from ${req.status} to FORWARDED`);
			console.log(`Actor role: ${actor.role}, Actor ID: ${actor._id}`);
			
			// Kiểm tra xem có thể chuyển trạng thái không
			const canTransition = RequestStateMachine.canTransition(req.status, 'FORWARDED', actor.role);
			console.log(`Can transition from ${req.status} to FORWARDED: ${canTransition}`);
			
			if (!canTransition) {
				console.warn(`Cannot transition from ${req.status} to FORWARDED for role ${actor.role}`);
				return; // Upload thành công nhưng không chuyển trạng thái
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

	/**
	 * Handle EXPORT_DOC document upload with auto-status change
	 */
	private async handleExportDocUpload(actor: any, request_id: string, req: any, doc: any) {
		try {
			console.log(`Attempting to auto-status change request ${request_id} from ${req.status} to SCHEDULED`);
			console.log(`Actor role: ${actor.role}, Actor ID: ${actor._id}`);
			
			// Kiểm tra xem có thể chuyển trạng thái không
			const canTransition = RequestStateMachine.canTransition(req.status, 'SCHEDULED', actor.role);
			console.log(`Can transition from ${req.status} to SCHEDULED: ${canTransition}`);
			
			if (!canTransition) {
				console.warn(`Cannot transition from ${req.status} to SCHEDULED for role ${actor.role}`);
				return; // Upload thành công nhưng không chuyển trạng thái
			}
			
			// Sử dụng State Machine để chuyển trạng thái
			await RequestStateMachine.executeTransition(
				actor,
				request_id,
				req.status,
				'SCHEDULED',
				'Tự động chuyển trạng thái sau khi upload chứng từ xuất'
			);
			
			console.log(`State machine transition successful, updating database...`);
			
			// Cập nhật trạng thái request
			const updatedRequest = await repo.update(request_id, {
				status: 'SCHEDULED',
				history: [
					...(Array.isArray(req.history) ? req.history : []),
					{
						at: new Date().toISOString(),
						by: actor._id,
						action: 'SCHEDULED',
						reason: 'Tự động chuyển trạng thái sau khi upload chứng từ xuất',
						document_id: doc.id,
						document_type: 'EXPORT_DOC'
					}
				]
			});
			
			console.log(`Request ${request_id} successfully updated to SCHEDULED:`, {
				newStatus: updatedRequest.status,
				updatedAt: updatedRequest.updatedAt,
				updatedBy: actor._id
			});
			
		} catch (error) {
			console.error('Error auto-status change after EXPORT_DOC upload:', error);
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

	/**
	 * List documents for a request
	 */
	async listDocuments(actor: any, request_id: string, type?: string) {
		const req = await repo.findById(request_id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		// scope: customer chỉ xem tenant của mình
		if ((actor.role === 'CustomerAdmin' || actor.role === 'CustomerUser') && req.tenant_id !== actor.tenant_id) throw new Error('Không có quyền');
		return repo.listDocs(request_id, type);
	}

	/**
	 * Delete document
	 */
	async deleteDocument(actor: any, id: string, reason?: string) {
		const doc = await repo.getDoc(id);
		if (!doc) throw new Error('Phiếu không tồn tại');
		// only uploader or higher role
		if (doc.uploader_id !== actor._id && !['SystemAdmin','BusinessAdmin','SaleAdmin','Accountant'].includes(actor.role)) throw new Error('Không có quyền xóa');
		const deleted = await repo.softDeleteDoc(id, actor._id, reason);
		await audit(actor._id, 'DOC.DELETED', 'DOC', id, { reason });
		return deleted;
	}
}

export default new RequestDocumentService();
