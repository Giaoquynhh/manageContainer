import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/YardService';

export class YardController {
	async map(_req: AuthRequest, res: Response) {
		try { return res.json(await service.getMap()); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async container(req: AuthRequest, res: Response) {
		try { return res.json(await service.findContainer(String(req.params.container_no))); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async suggest(req: AuthRequest, res: Response) {
		try { return res.json(await service.suggestPosition(String(req.query.container_no||''))); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async assign(req: AuthRequest, res: Response) {
		const { container_no, slot_id } = req.body || {};
		if (!container_no || !slot_id) return res.status(400).json({ message: 'Thiếu dữ liệu' });
		try { return res.json(await service.assignPosition(req.user!, container_no, slot_id)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
}

export default new YardController();


