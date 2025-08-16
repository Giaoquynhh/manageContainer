import express from 'express';
import { AttachmentController } from './AttachmentController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const attachmentController = new AttachmentController(prisma);

// Middleware xác thực cho tất cả routes
router.use(authenticate);

// Upload attachment
router.post('/:id/attachments', 
    attachmentController.uploadAttachment.bind(attachmentController)
);

// Lấy danh sách attachments theo request_id
router.get('/:id/attachments', 
    attachmentController.getAttachments.bind(attachmentController)
);

// Lấy thông tin attachment theo ID
router.get('/attachments/:attachmentId', 
    attachmentController.getAttachment.bind(attachmentController)
);

// Xóa attachment
router.delete('/:id/attachments/:attachmentId', 
    attachmentController.deleteAttachment.bind(attachmentController)
);

// Khóa attachments của request (chỉ Admin)
router.post('/:id/attachments/lock', 
    requireRoles('SystemAdmin', 'BusinessAdmin', 'SaleAdmin'), 
    attachmentController.lockAttachments.bind(attachmentController)
);

// Mở khóa attachments của request (chỉ Admin)
router.post('/:id/attachments/unlock', 
    requireRoles('SystemAdmin', 'BusinessAdmin', 'SaleAdmin'), 
    attachmentController.unlockAttachments.bind(attachmentController)
);

// Lấy thống kê attachments
router.get('/:id/attachments/stats', 
    attachmentController.getAttachmentStats.bind(attachmentController)
);

export default router;
