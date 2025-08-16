import { Router } from 'express';
import controller from './ForkliftController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();

router.use(authenticate, requireRoles('SaleAdmin','SystemAdmin'));
router.get('/tasks', (req, res) => controller.list(req as any, res));
router.post('/assign', (req, res) => controller.assign(req as any, res));
router.patch('/task/:id/status', (req, res) => controller.update(req as any, res));

export default router;


