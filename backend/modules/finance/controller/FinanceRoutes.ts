import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import invoiceCtrl from './InvoiceController';
import paymentCtrl from './PaymentController';
import serviceCatalogCtrl from './ServiceCatalogController';

const router = Router();
router.use(authenticate, requireRoles('SaleAdmin','SystemAdmin'));

// Invoices
router.get('/invoices', (req, res) => invoiceCtrl.list(req as any, res));
router.post('/invoices', (req, res) => invoiceCtrl.create(req as any, res));
router.post('/invoices/:id/issue', (req, res) => invoiceCtrl.issue(req as any, res));
router.get('/invoices/:id', (req, res) => invoiceCtrl.get(req as any, res));
router.patch('/invoices/:id', (req, res) => invoiceCtrl.patch(req as any, res));
router.post('/invoices/:id/cancel', (req, res) => invoiceCtrl.cancel(req as any, res));

// Payments
router.get('/payments', (req, res) => paymentCtrl.list(req as any, res));
router.post('/payments', (req, res) => paymentCtrl.create(req as any, res));

// Service Catalog (temporary in-memory)
router.get('/services', (_req, res) => serviceCatalogCtrl.listServices(_req as any, res));

export default router;



