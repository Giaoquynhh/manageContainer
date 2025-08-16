import { Router } from 'express';
import controller from './YardController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();

router.use(authenticate, requireRoles('SaleAdmin','SystemAdmin'));
router.get('/map', (req, res) => controller.map(req as any, res));
router.get('/container/:container_no', (req, res) => controller.container(req as any, res));
router.get('/suggest-position', (req, res) => controller.suggest(req as any, res));
router.patch('/assign-position', (req, res) => controller.assign(req as any, res));

export default router;


