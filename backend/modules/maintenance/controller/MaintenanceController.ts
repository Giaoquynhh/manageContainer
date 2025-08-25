import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/MaintenanceService';
import { approveSchema, createRepairSchema, listRepairsSchema, rejectSchema, updateInventorySchema, createInventorySchema, createRepairInvoiceSchema } from '../dto/MaintenanceDtos';
import { Request } from 'express';

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

  async updateStatus(req: AuthRequest, res: Response) {
    const { status, manager_comment } = req.body;
    if (!status) return res.status(400).json({ message: 'Trạng thái là bắt buộc' });
    try { return res.json(await service.updateRepairStatus(req.user!, req.params.id, status, manager_comment)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async completeCheck(req: AuthRequest, res: Response) {
    const { result, manager_comment } = req.body;
    if (!result || !['PASS', 'FAIL'].includes(result)) return res.status(400).json({ message: 'Kết quả kiểm tra phải là PASS hoặc FAIL' });
    try { return res.json(await service.completeRepairCheck(req.user!, req.params.id, result, manager_comment)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async listInventory(req: AuthRequest, res: Response) {
    try { return res.json(await service.listInventory(req.query)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }
  async updateInventory(req: AuthRequest, res: Response) {
    const { error, value } = updateInventorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.json(await service.updateInventory(req.user!, req.params.id, value)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async createInventory(req: AuthRequest, res: Response) {
    const { error, value } = createInventorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.status(201).json(await service.createInventory(req.user!, value)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async createRepairInvoice(req: AuthRequest, res: Response) {
    const { error, value } = createRepairInvoiceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.status(201).json(await service.createRepairInvoice(req.user!, value)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async getRepairInvoice(req: AuthRequest, res: Response) {
    try { return res.json(await service.getRepairInvoice(req.params.id)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async uploadRepairInvoicePDF(req: Request, res: Response) {
    try {
      const { repairTicketId } = req.params;
      const { pdfBase64, fileName } = req.body;

      if (!pdfBase64 || !fileName) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu dữ liệu PDF hoặc tên file'
        });
      }

      // Gọi service để xử lý upload
      const result = await service.uploadRepairInvoicePDF(
        repairTicketId,
        pdfBase64,
        fileName
      );

      res.json({
        success: true,
        message: 'Đã upload PDF thành công',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi upload PDF: ' + error.message
      });
    }
  }
}

export default new MaintenanceController();


