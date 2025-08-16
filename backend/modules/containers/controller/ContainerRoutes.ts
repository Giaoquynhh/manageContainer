import { Router } from 'express';
import controller from './ContainerController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();
router.use(authenticate, requireRoles('SaleAdmin','SystemAdmin','Accountant'));
router.get('/:container_no', (req, res) => controller.get(req as any, res));
router.get('/alerts/list', (req, res) => controller.alerts(req as any, res));

export default router;


