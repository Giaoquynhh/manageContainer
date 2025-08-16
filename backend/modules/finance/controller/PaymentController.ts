import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/PaymentService';
import { createPaymentSchema } from '../dto/FinanceDtos';

export class PaymentController {
  async list(req: AuthRequest, res: Response){
    try{ return res.json(await service.list(req.user!, req.query)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  async create(req: AuthRequest, res: Response){
    const { error, value } = createPaymentSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try{ const idem = req.headers['idempotency-key'] as string | undefined; const pay = await service.create(req.user!, value, idem); return res.status(201).json(pay); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
}

export default new PaymentController();



