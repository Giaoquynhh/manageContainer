import { Router } from 'express';
import controller from './MaintenanceController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();
router.use(authenticate, requireRoles('SaleAdmin','SystemAdmin'));

// Repairs
router.get('/repairs', (req, res) => controller.listRepairs(req as any, res));
router.post('/repairs', (req, res) => controller.createRepair(req as any, res));
router.post('/repairs/:id/approve', (req, res) => controller.approve(req as any, res));
router.post('/repairs/:id/reject', (req, res) => controller.reject(req as any, res));
router.patch('/repairs/:id/status', (req, res) => controller.updateStatus(req as any, res));
router.post('/repairs/:id/complete-check', (req, res) => controller.completeCheck(req as any, res));

// Inventory
router.get('/inventory/items', (req, res) => controller.listInventory(req as any, res));
router.put('/inventory/items/:id', (req, res) => controller.updateInventory(req as any, res));

// Expose equipments for FE select (simple list)
router.get('/equipments', async (req, res) => {
  try{
    const { prisma } = await import('../../../shared/config/database');
    const items = await prisma.equipment.findMany({ orderBy: { code: 'asc' } });
    return res.json(items);
  }catch(e:any){ return res.status(400).json({ message: e.message }); }
});

export default router;


