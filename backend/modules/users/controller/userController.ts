import { Response } from 'express';
import service from '../service/UserService';
import { AuthRequest } from '../../../shared/middlewares/auth';
import { createCustomerUserSchema, createEmployeeSchema, updateUserSchema } from '../dto/UserDtos';

export class UserController {
	async list(req: AuthRequest, res: Response) {
		const result = await service.list((req as any).userDoc || { ...req.user } as any, req.query);
		return res.json(result);
	}
	async create(req: AuthRequest, res: Response) {
		const role = req.body.role as string;
		if (['CustomerAdmin','CustomerUser'].includes(role)) {
			const { error, value } = createCustomerUserSchema.validate(req.body);
			if (error) return res.status(400).json({ message: error.message });
			try { return res.status(201).json(await service.createCustomerUser((req as any).userDoc || (req.user as any), value)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
		}
		const { error, value } = createEmployeeSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.status(201).json(await service.createByHR((req as any).userDoc || (req.user as any), value)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async update(req: AuthRequest, res: Response) {
		const { error, value } = updateUserSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.update((req as any).userDoc || (req.user as any), req.params.id, value)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async disable(req: AuthRequest, res: Response) { try { await service.disable((req as any).userDoc || (req.user as any), req.params.id); return res.json({ success: true }); } catch (e: any) { return res.status(400).json({ message: e.message }); } }
	async enable(req: AuthRequest, res: Response) { try { await service.enable((req as any).userDoc || (req.user as any), req.params.id); return res.json({ success: true }); } catch (e: any) { return res.status(400).json({ message: e.message }); } }
	async lock(req: AuthRequest, res: Response) { try { await service.lock((req as any).userDoc || (req.user as any), req.params.id); return res.json({ success: true }); } catch (e: any) { return res.status(400).json({ message: e.message }); } }
	async unlock(req: AuthRequest, res: Response) { try { await service.unlock((req as any).userDoc || (req.user as any), req.params.id); return res.json({ success: true }); } catch (e: any) { return res.status(400).json({ message: e.message }); } }
	async sendInvite(req: AuthRequest, res: Response) { 
		try { 
			const result = await service.sendInvite((req as any).userDoc || (req.user as any), req.params.id); 
			return res.json({ success: true, ...result }); 
		} catch (e: any) { 
			return res.status(400).json({ message: e.message }); 
		} 
	}

	async delete(req: AuthRequest, res: Response) {
		try {
			await service.delete((req as any).userDoc || (req.user as any), req.params.id);
			return res.json({ success: true });
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}
}

export default new UserController();
