import { Router } from 'express';
import controller from './partnerController';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();

router.get('/', requireRoles('SystemAdmin','BusinessAdmin','SaleAdmin','PartnerAdmin'), (req, res) => controller.list(req as any, res));
router.post('/', requireRoles('SystemAdmin','BusinessAdmin','SaleAdmin'), (req, res) => controller.create(req as any, res));
router.patch('/:id', requireRoles('SystemAdmin','BusinessAdmin'), (req, res) => controller.update(req as any, res));
router.post('/:id/activate', requireRoles('SystemAdmin','BusinessAdmin'), (req, res) => controller.activate(req as any, res));
router.post('/:id/deactivate', requireRoles('SystemAdmin','BusinessAdmin'), (req, res) => controller.deactivate(req as any, res));
router.post('/:id/primary-admin', requireRoles('SystemAdmin','BusinessAdmin','SaleAdmin'), (req, res) => controller.primaryAdmin(req as any, res));

export default router;
