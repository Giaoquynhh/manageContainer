import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/InvoiceService';
import { createInvoiceSchema, issueInvoiceSchema, patchInvoiceSchema } from '../dto/FinanceDtos';

export class InvoiceController {
  async list(req: AuthRequest, res: Response){
    try{ return res.json(await service.list(req.user!, req.query)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  async create(req: AuthRequest, res: Response){
    const { error, value } = createInvoiceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try{ const inv = await service.create(req.user!, value); return res.status(201).json(inv); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  async issue(req: AuthRequest, res: Response){
    const { error, value } = issueInvoiceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try{ return res.json(await service.issue(req.user!, req.params.id, value)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  async get(req: AuthRequest, res: Response){
    try{ const inv = await service.get(req.params.id); if (!inv) return res.status(404).json({ message: 'INVOICE_NOT_FOUND' }); return res.json(inv); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  async patch(req: AuthRequest, res: Response){
    const { error, value } = patchInvoiceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try{ return res.json(await service.patch(req.user!, req.params.id, value)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  async cancel(req: AuthRequest, res: Response){
    try{ return res.json(await service.cancel(req.user!, req.params.id)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
}

export default new InvoiceController();



