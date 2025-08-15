import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import { DocumentController } from './DocumentController';
import { upload } from './DocumentUpload';

const router = Router();

// Upload document (Customer/Admin)
router.post(
  '/upload-document',
  authenticate,
  requireRoles('CustomerAdmin', 'CustomerUser', 'SaleAdmin', 'SystemAdmin'),
  upload.single('file'),
  DocumentController.uploadDocument
);

// List documents by request
router.get(
  '/:requestId/documents',
  authenticate,
  DocumentController.listDocuments
);

// View document (inline)
router.get(
  '/:requestId/documents/:docId/view',
  authenticate,
  DocumentController.viewDocument
);

// Download document (attachment)
router.get(
  '/:requestId/documents/:docId/download',
  authenticate,
  DocumentController.downloadDocument
);

// Delete document (soft delete)
router.delete(
  '/documents/:docId',
  authenticate,
  DocumentController.deleteDocument
);

export default router;
