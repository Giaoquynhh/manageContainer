import { Router } from 'express';
import { GateController } from './GateController';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();
const gateController = new GateController();

// Không cần auth middleware vì đã có trong main.ts

// Forward request từ Kho sang Gate (SaleAdmin)
router.patch(
  '/requests/:id/forward',
  requireRoles('SaleAdmin'),
  gateController.forwardRequest.bind(gateController)
);

// Gate approve request (SaleAdmin)
router.patch(
  '/requests/:id/approve',
  requireRoles('SaleAdmin'),
  gateController.approveGate.bind(gateController)
);

// Gate reject request (SaleAdmin)
router.patch(
  '/requests/:id/reject',
  requireRoles('SaleAdmin'),
  gateController.rejectGate.bind(gateController)
);

// Gate chấp nhận xe vào (YardManager)
router.patch(
  '/requests/:id/gate-accept',
  requireRoles('YardManager'),
  gateController.acceptGate.bind(gateController)
);

// Gate từ chối xe (YardManager)
router.patch(
  '/requests/:id/gate-reject',
  requireRoles('YardManager'),
  gateController.rejectGate.bind(gateController)
);

// Tìm kiếm requests ở Gate (YardManager, SaleAdmin)
router.get(
  '/requests/search',
  requireRoles('YardManager', 'SaleAdmin'),
  gateController.searchRequests.bind(gateController)
);

// Lấy chi tiết request để xử lý ở Gate (YardManager, SaleAdmin)
router.get(
  '/requests/:id',
  requireRoles('YardManager', 'SaleAdmin'),
  gateController.getRequestDetails.bind(gateController)
);

// Lấy danh sách chứng từ của request (YardManager, SaleAdmin)
router.get(
  '/requests/:id/documents',
  requireRoles('YardManager', 'SaleAdmin'),
  gateController.getRequestDocuments.bind(gateController)
);

// Xem file chứng từ (YardManager, SaleAdmin)
router.get(
  '/requests/:requestId/documents/:documentId/view',
  requireRoles('YardManager', 'SaleAdmin'),
  gateController.viewDocument.bind(gateController)
);

export default router;


