import { Router } from 'express';
import controller from './auditController';

const router = Router();

router.get('/', (req, res) => controller.list(req, res));

export default router;
