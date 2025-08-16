import { Router } from 'express';
import controller from './GateController';
import { authenticate } from '../../../shared/middlewares/auth';
import { gateMode } from '../middleware/gateMode';

const router = Router();

// All gate actions require authentication + gate mode check
router.use(authenticate, gateMode);

router.get('/lookup', (req, res) => controller.lookup(req as any, res));
router.post('/checkin', (req, res) => controller.checkin(req as any, res));
router.post('/checkout', (req, res) => controller.checkout(req as any, res));
router.post('/print', (req, res) => controller.print(req as any, res));

export default router;


