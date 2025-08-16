import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import controller from './ReportsController';

const router = Router();

// Allow roles according to spec: SystemAdmin, BusinessAdmin, SaleAdmin, Accountant
router.use(authenticate, requireRoles('SystemAdmin','BusinessAdmin','SaleAdmin','Accountant'));

router.get('/dashboard', (req, res) => controller.dashboard(req as any, res));
router.post('/custom/preview', (req, res) => controller.customPreview(req as any, res));
router.post('/export', (req, res) => controller.exportReport(req as any, res));
router.get('/containers', (req, res) => controller.containers(req as any, res));

export default router;


