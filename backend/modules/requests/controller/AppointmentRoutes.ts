import express from 'express';
import { AppointmentController } from './AppointmentController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const appointmentController = new AppointmentController(prisma);

// Middleware xác thực cho tất cả routes
router.use(authenticate);

// Tiếp nhận request và tạo lịch hẹn
router.post('/:id/accept', 
    requireRoles('SaleAdmin', 'SystemAdmin', 'BusinessAdmin'), 
    appointmentController.acceptRequest.bind(appointmentController)
);

// Cập nhật lịch hẹn
router.put('/:id/appointment', 
    requireRoles('SaleAdmin', 'SystemAdmin', 'BusinessAdmin'), 
    appointmentController.updateAppointment.bind(appointmentController)
);

// Lấy thông tin lịch hẹn
router.get('/:id/appointment', 
    appointmentController.getAppointment.bind(appointmentController)
);

// Lấy danh sách slot có sẵn (demo)
router.get('/slots/available', 
    requireRoles('SaleAdmin', 'SystemAdmin', 'BusinessAdmin'), 
    appointmentController.getAvailableSlots.bind(appointmentController)
);

export default router;
