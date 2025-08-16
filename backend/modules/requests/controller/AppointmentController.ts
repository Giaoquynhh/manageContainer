import { Response } from 'express';
import { AppointmentService } from '../service/AppointmentService';
import { createAppointmentSchema, updateAppointmentSchema } from '../dto/AppointmentDtos';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../../shared/middlewares/auth';

export class AppointmentController {
    private appointmentService: AppointmentService;
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        this.appointmentService = new AppointmentService(prisma);
    }

    // Tiếp nhận request và tạo lịch hẹn
    async acceptRequest(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const appointmentData = req.body;
            const actor = req.user!;
            
            console.log('Accept request - ID:', id);
            console.log('Appointment data:', appointmentData);
            console.log('Actor:', actor);

            // Validate input
            const { error } = createAppointmentSchema.validate(appointmentData);
            if (error) {
                console.log('Validation error:', error.details);
                return res.status(400).json({
                    message: 'Dữ liệu không hợp lệ',
                    errors: error.details.map(detail => detail.message)
                });
            }

            // Kiểm tra quyền (chỉ SaleAdmin, SystemAdmin mới được tiếp nhận)
            if (!['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(actor.role)) {
                return res.status(403).json({
                    message: 'Không đủ quyền để tiếp nhận yêu cầu'
                });
            }

            const result = await this.appointmentService.acceptRequest(id, appointmentData, actor);

            return res.status(200).json({
                message: 'Đã tiếp nhận yêu cầu thành công',
                data: {
                    request_id: result.request.id,
                    status: result.request.status,
                    chat_room_id: result.chat_room_id,
                    appointment: result.appointment
                }
            });

        } catch (error: any) {
            console.error('Error accepting request:', error);

            // Xử lý các loại lỗi cụ thể
            switch (error.message) {
                case 'REQUEST_NOT_FOUND_OR_INVALID_STATUS':
                    return res.status(404).json({
                        message: 'Không tìm thấy yêu cầu hoặc trạng thái không hợp lệ'
                    });
                case 'APPOINTMENT_TIME_MUST_BE_FUTURE':
                    return res.status(400).json({
                        message: 'Thời gian lịch hẹn phải trong tương lai'
                    });
                case 'APPOINTMENT_SLOT_UNAVAILABLE':
                    return res.status(422).json({
                        message: 'Khung giờ này không khả dụng, vui lòng chọn thời gian khác'
                    });
                default:
                    return res.status(500).json({
                        message: 'Lỗi nội bộ server'
                    });
            }
        }
    }

    // Cập nhật lịch hẹn
    async updateAppointment(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const actor = req.user!;

            // Validate input
            const { error } = updateAppointmentSchema.validate(updateData);
            if (error) {
                return res.status(400).json({
                    message: 'Dữ liệu không hợp lệ',
                    errors: error.details.map(detail => detail.message)
                });
            }

            // Kiểm tra quyền
            if (!['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(actor.role)) {
                return res.status(403).json({
                    message: 'Không đủ quyền để cập nhật lịch hẹn'
                });
            }

            const appointment = await this.appointmentService.updateAppointment(id, updateData, actor);

            return res.status(200).json({
                message: 'Đã cập nhật lịch hẹn thành công',
                data: appointment
            });

        } catch (error: any) {
            console.error('Error updating appointment:', error);

            switch (error.message) {
                case 'REQUEST_NOT_FOUND_OR_INVALID_STATUS':
                    return res.status(404).json({
                        message: 'Không tìm thấy yêu cầu hoặc trạng thái không hợp lệ'
                    });
                case 'APPOINTMENT_TIME_MUST_BE_FUTURE':
                    return res.status(400).json({
                        message: 'Thời gian lịch hẹn phải trong tương lai'
                    });
                case 'APPOINTMENT_SLOT_UNAVAILABLE':
                    return res.status(422).json({
                        message: 'Khung giờ này không khả dụng, vui lòng chọn thời gian khác'
                    });
                default:
                    return res.status(500).json({
                        message: 'Lỗi nội bộ server'
                    });
            }
        }
    }

    // Lấy thông tin lịch hẹn theo request_id
    async getAppointment(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const actor = req.user!;

            const appointment = await this.appointmentService.getAppointmentByRequestId(id);

            if (!appointment) {
                return res.status(404).json({
                    message: 'Không tìm thấy lịch hẹn cho yêu cầu này'
                });
            }

            return res.status(200).json({
                data: appointment
            });

        } catch (error: any) {
            console.error('Error getting appointment:', error);
            return res.status(500).json({
                message: 'Lỗi nội bộ server'
            });
        }
    }

    // Lấy danh sách slot có sẵn (demo)
    async getAvailableSlots(req: AuthRequest, res: Response) {
        try {
            const { location_type, location_id, date } = req.query;
            const actor = req.user!;

            // Kiểm tra quyền
            if (!['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(actor.role)) {
                return res.status(403).json({
                    message: 'Không đủ quyền để xem slot có sẵn'
                });
            }

            // Demo: trả về các slot mẫu
            const slots = [
                { time: '08:00', available: true },
                { time: '09:00', available: true },
                { time: '10:00', available: false },
                { time: '11:00', available: true },
                { time: '13:00', available: true },
                { time: '14:00', available: true },
                { time: '15:00', available: false },
                { time: '16:00', available: true }
            ];

            return res.status(200).json({
                data: {
                    location_type,
                    location_id,
                    date,
                    slots
                }
            });

        } catch (error: any) {
            console.error('Error getting available slots:', error);
            return res.status(500).json({
                message: 'Lỗi nội bộ server'
            });
        }
    }
}
