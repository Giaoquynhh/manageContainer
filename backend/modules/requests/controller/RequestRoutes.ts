import { Router } from 'express';
import controller from './RequestController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireRoles } from '../../../shared/middlewares/rbac';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Cấu hình multer cho file upload
const upload = multer({
	storage: multer.memoryStorage(), // Lưu file trong memory để xử lý
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
	fileFilter: (_req: any, file: any, cb: any) => {
		const allowed = ['application/pdf','image/jpeg','image/png','image/jpg'];
		if (allowed.includes(file.mimetype)) cb(null, true); 
		else cb(new Error('Định dạng không hỗ trợ'));
	}
});

const router = Router();

// Customer create/list - với file upload
router.post('/', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin'), upload.single('document'), (req, res) => ((req as any).user?.role === 'SaleAdmin' ? controller.createBySale(req as any, res) : controller.create(req as any, res)));
router.get('/', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','Accountant','SystemAdmin'), (req, res) => controller.list(req as any, res));



// Status changes (SaleAdmin/SystemAdmin)
router.patch('/:id/status', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.updateStatus(req as any, res));

// Reject request (SaleAdmin/SystemAdmin)
router.patch('/:id/reject', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.rejectRequest(req as any, res));

// Soft delete theo scope
router.delete('/:id', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin','Accountant'), (req, res) => controller.softDeleteRequest(req as any, res));

// Restore theo scope
router.post('/:id/restore', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin','Accountant'), (req, res) => controller.restoreRequest(req as any, res));

// Documents
router.post('/:id/docs', requireRoles('SaleAdmin','Accountant','CustomerAdmin','CustomerUser'), upload.single('file'), (req, res) => controller.uploadDoc(req as any, res));
router.get('/:id/docs', requireRoles('SaleAdmin','Accountant','CustomerAdmin','CustomerUser'), (req, res) => controller.listDocs(req as any, res));
router.delete('/:id/docs/:docId', requireRoles('SaleAdmin','Accountant','SystemAdmin','BusinessAdmin'), (req, res) => controller.deleteDoc(req as any, res));

// Payment request
router.post('/:id/payment-request', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.sendPayment(req as any, res));

// State Machine Routes
router.patch('/:id/schedule', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.scheduleRequest(req as any, res));
router.patch('/:id/add-info', requireRoles('CustomerAdmin','CustomerUser'), (req, res) => controller.addInfoToRequest(req as any, res));
router.patch('/:id/send-to-gate', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.sendToGate(req as any, res));
router.patch('/:id/complete', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.completeRequest(req as any, res));

// Helper routes
router.get('/:id/transitions', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin'), (req, res) => controller.getValidTransitions(req as any, res));
router.get('/state/:state/info', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin'), (req, res) => controller.getStateInfo(req as any, res));
router.get('/:id/appointment', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin'), (req, res) => controller.getAppointmentInfo(req as any, res));

export default router;
