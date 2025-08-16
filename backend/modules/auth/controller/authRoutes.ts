import { Router } from 'express';
import controller from './authController';
import { authenticate } from '../../../shared/middlewares/auth';

const router = Router();

router.post('/login', (req, res) => controller.login(req, res));
router.post('/accept-invite', (req, res) => controller.acceptInvite(req, res));
// Chặn đăng ký trực tiếp
router.post('/register', (req, res) => controller.registerDirect(req, res));
router.post('/refresh', (req, res) => controller.refresh(req, res));
router.get('/me', authenticate, (req, res) => controller.me(req, res));
router.patch('/me', authenticate, (req, res) => controller.updateMe(req, res));
router.post('/me/change-password', authenticate, (req, res) => controller.changePassword(req, res));

export default router;
