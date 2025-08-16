import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/PartnerService';
import { createPartnerSchema, updatePartnerSchema } from '../dto/PartnerDtos';

export class PartnerController {
	async list(req: AuthRequest, res: Response) { return res.json(await service.list(req.query)); }
	async create(req: AuthRequest, res: Response) {
		const { error, value } = createPartnerSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.status(201).json(await service.create(req.user!._id, value)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async update(req: AuthRequest, res: Response) {
		const { error, value } = updatePartnerSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.update(req.user!._id, req.params.id, value)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async activate(req: AuthRequest, res: Response) { try { await service.activate(req.user!._id, req.params.id); return res.json({ success: true }); } catch (e: any) { return res.status(400).json({ message: e.message }); } }
	async deactivate(req: AuthRequest, res: Response) { try { await service.deactivate(req.user!._id, req.params.id); return res.json({ success: true }); } catch (e: any) { return res.status(400).json({ message: e.message }); } }
	async primaryAdmin(req: AuthRequest, res: Response) { try { return res.status(201).json(await service.createPrimaryAdmin(req.user!._id, req.params.id, req.body)); } catch (e: any) { return res.status(400).json({ message: e.message }); } }
}

export default new PartnerController();
