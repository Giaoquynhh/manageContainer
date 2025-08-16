import { Router } from 'express';
import controller from './userController';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();

router.get('/', requireRoles('SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin','PartnerAdmin'), (req, res) => controller.list(req as any, res));
router.post('/', requireRoles('SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin','PartnerAdmin'), (req, res) => controller.create(req as any, res));
router.patch('/:id', requireRoles('SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin'), (req, res) => controller.update(req as any, res));
router.patch('/:id/disable', requireRoles('SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin'), (req, res) => controller.disable(req as any, res));
router.patch('/:id/enable', requireRoles('SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin'), (req, res) => controller.enable(req as any, res));
router.patch('/:id/lock', requireRoles('SystemAdmin','BusinessAdmin'), (req, res) => controller.lock(req as any, res));
router.patch('/:id/unlock', requireRoles('SystemAdmin','BusinessAdmin'), (req, res) => controller.unlock(req as any, res));
router.post('/:id/send-invite', requireRoles('SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin'), (req, res) => controller.sendInvite(req as any, res));
router.delete('/:id', requireRoles('SystemAdmin','BusinessAdmin'), (req, res) => controller.delete(req as any, res));

export default router;
