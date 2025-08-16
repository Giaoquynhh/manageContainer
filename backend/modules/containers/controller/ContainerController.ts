import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/ContainerService';

export class ContainerController {
	async get(req: AuthRequest, res: Response) {
		try { return res.json(await service.get(String(req.params.container_no))); } catch (e:any) { return res.status(400).json({ message: e.message }); }
	}
	async alerts(_req: AuthRequest, res: Response) {
		try { return res.json(await service.alerts()); } catch (e:any) { return res.status(400).json({ message: e.message }); }
	}
}

export default new ContainerController();


