import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/ReportsService';
import { dashboardQuerySchema, customReportSchema, exportSchema } from '../dto/ReportDtos';

class ReportsController {
  async dashboard(req: AuthRequest, res: Response){
    const { error, value } = dashboardQuerySchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.message });
    try{ const data = await service.dashboard(req.user!, value); return res.json(data); }
    catch(e:any){ return res.status(400).json({ message: e.message }); }
  }

  async customPreview(req: AuthRequest, res: Response){
    const { error, value } = customReportSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try{ const data = await service.customPreview(req.user!, value); return res.json(data); }
    catch(e:any){ return res.status(400).json({ message: e.message }); }
  }

  async exportReport(req: AuthRequest, res: Response){
    const { error, value } = exportSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try{ const file = await service.exportReport(req.user!, value); return file.pipe(res); }
    catch(e:any){ return res.status(400).json({ message: e.message }); }
  }

  async containers(req: AuthRequest, res: Response){
    try{ return res.json(await service.listContainers(req.user!, req.query)); }
    catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
}

export default new ReportsController();


