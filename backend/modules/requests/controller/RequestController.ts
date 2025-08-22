import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/RequestService';
import { createRequestSchema, updateRequestStatusSchema, queryRequestSchema, uploadDocSchema, rejectRequestSchema, softDeleteRequestSchema, restoreRequestSchema, scheduleRequestSchema, addInfoSchema, sendToGateSchema, completeRequestSchema } from '../dto/RequestDtos';
import path from 'path';

export class RequestController {
	async create(req: AuthRequest, res: Response) {
		try {
			// Xử lý form data với file upload
			const formData = req.body;
			const file = (req as any).file;
			
			// Validate form data
			const { error, value } = createRequestSchema.validate(formData);
			if (error) return res.status(400).json({ message: error.message });
			
			// Validate file nếu có
			if (file) {
				const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
				const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
				
				const fileExtension = path.extname(file.originalname).toLowerCase();
				const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
				const hasValidExtension = allowedExtensions.includes(fileExtension);
				
				if (!hasValidMimeType && !hasValidExtension) {
					return res.status(400).json({ message: 'Chỉ chấp nhận file PDF hoặc ảnh (JPG, PNG)' });
				}
				
				if (file.size > 10 * 1024 * 1024) {
					return res.status(400).json({ message: 'File quá lớn. Kích thước tối đa là 10MB' });
				}
			}
			
			const result = await service.createByCustomer(req.user!, value, file);
			return res.status(201).json(result);
		} catch (e: any) { 
			return res.status(400).json({ message: e.message }); 
		}
	}
	async createBySale(req: AuthRequest, res: Response) {
		const { error, value } = createRequestSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.status(201).json(await service.createBySaleAdmin(req.user!, value)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async list(req: AuthRequest, res: Response) {
		const { error, value } = queryRequestSchema.validate(req.query);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.list(req.user!, value)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async updateStatus(req: AuthRequest, res: Response) {
		const { error, value } = updateRequestStatusSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.updateStatus(req.user!, req.params.id, value.status, value.reason)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	
	async rejectRequest(req: AuthRequest, res: Response) {
		const { error, value } = rejectRequestSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.rejectRequest(req.user!, req.params.id, value.reason)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	
	async softDeleteRequest(req: AuthRequest, res: Response) {
		const { error, value } = softDeleteRequestSchema.validate(req.query);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.softDeleteRequest(req.user!, req.params.id, value.scope)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	
	async restoreRequest(req: AuthRequest, res: Response) {
		const { error, value } = restoreRequestSchema.validate(req.query);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.restoreRequest(req.user!, req.params.id, value.scope)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	// Documents
	async uploadDoc(req: AuthRequest, res: Response) {
		const { error, value } = uploadDocSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.status(201).json(await service.uploadDocument(req.user!, req.params.id, value.type, (req as any).file)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async listDocs(req: AuthRequest, res: Response) {
		try { 
			const type = req.query.type as string;
			return res.json(await service.listDocuments(req.user!, req.params.id, type)); 
		} catch (e: any) { 
			return res.status(400).json({ message: e.message }); 
		}
	}
	async deleteDoc(req: AuthRequest, res: Response) {
		try { return res.json(await service.deleteDocument(req.user!, req.params.docId, req.body?.reason)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	// Payment
	async sendPayment(req: AuthRequest, res: Response) {
		try { return res.status(201).json(await service.sendPaymentRequest(req.user!, req.params.id)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}

	// State Machine Methods
	async scheduleRequest(req: AuthRequest, res: Response) {
		const { error, value } = scheduleRequestSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.scheduleRequest(req.user!, req.params.id, value)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}

	async updateAppointment(req: AuthRequest, res: Response) {
		const { error, value } = scheduleRequestSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.updateAppointment(req.user!, req.params.id, value)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}

	async addInfoToRequest(req: AuthRequest, res: Response) {
		const { error, value } = addInfoSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.addInfoToRequest(req.user!, req.params.id, value.documents || [], value.notes)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}

	async sendToGate(req: AuthRequest, res: Response) {
		const { error, value } = sendToGateSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.sendToGate(req.user!, req.params.id)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}

	async completeRequest(req: AuthRequest, res: Response) {
		const { error, value } = completeRequestSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.completeRequest(req.user!, req.params.id)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}

	async getValidTransitions(req: AuthRequest, res: Response) {
		try { return res.json(await service.getValidTransitions(req.user!, req.params.id)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}

	async getStateInfo(req: AuthRequest, res: Response) {
		try { return res.json(await service.getStateInfo(req.params.state)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}

	async getAppointmentInfo(req: AuthRequest, res: Response) {
		try { return res.json(await service.getAppointmentInfo(req.params.id)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
}

export default new RequestController();
