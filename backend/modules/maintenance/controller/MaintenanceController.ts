import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/MaintenanceService';
import { approveSchema, createRepairSchema, listRepairsSchema, rejectSchema, updateInventorySchema } from '../dto/MaintenanceDtos';

export class MaintenanceController {
  async listRepairs(req: AuthRequest, res: Response) {
    const { error, value } = listRepairsSchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.json(await service.listRepairs(value)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }
  async createRepair(req: AuthRequest, res: Response) {
    const { error, value } = createRepairSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.status(201).json(await service.createRepair(req.user!, value)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }
  async approve(req: AuthRequest, res: Response) {
    const { error, value } = approveSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.json(await service.approveRepair(req.user!, req.params.id, value.manager_comment)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }
  async reject(req: AuthRequest, res: Response) {
    const { error, value } = rejectSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.json(await service.rejectRepair(req.user!, req.params.id, value.manager_comment)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async listInventory(req: AuthRequest, res: Response) {
    try { return res.json(await service.listInventory(req.query)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }
  async updateInventory(req: AuthRequest, res: Response) {
    const { error, value } = updateInventorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.json(await service.updateInventory(req.user!, req.params.id, value)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }
}

export default new MaintenanceController();


