import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/CustomerService';
import { createCustomerSchema, updateCustomerSchema } from '../dto/CustomerDtos';

export class CustomerController {
	async list(req: AuthRequest, res: Response) { return res.json(await service.list(req.query)); }
	async create(req: AuthRequest, res: Response) {
		const { error, value } = createCustomerSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.status(201).json(await service.create(req.user!._id, value)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async update(req: AuthRequest, res: Response) {
		const { error, value } = updateCustomerSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.update(req.user!._id, req.params.id, value)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async disable(req: AuthRequest, res: Response) { try { await service.disable(req.user!._id, req.params.id); return res.json({ success: true }); } catch (e: any) { return res.status(400).json({ message: e.message }); } }
}

export default new CustomerController();
