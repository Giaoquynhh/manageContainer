import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/GateService';
import { gateLookupSchema, checkinSchema, checkoutSchema, printSchema } from '../dto/GateDtos';

export class GateController {
	async lookup(req: AuthRequest, res: Response) {
		const { error, value } = gateLookupSchema.validate(req.query);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.lookup(req.user!, value.code)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async checkin(req: AuthRequest, res: Response) {
		const { error, value } = checkinSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.checkin(req.user!, value.request_id, value.plate_no)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async checkout(req: AuthRequest, res: Response) {
		const { error, value } = checkoutSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.checkout(req.user!, value.request_id, value.supervisor_pin)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
	async print(req: AuthRequest, res: Response) {
		const { error, value } = printSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try { return res.json(await service.print(req.user!, value.request_id, value.type)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
	}
}

export default new GateController();


