import { PrismaClient } from '@prisma/client';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentResponseDto } from '../dto/AppointmentDtos';
import { audit } from '../../../shared/middlewares/audit';

export class AppointmentService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // Tạo lịch hẹn và tiếp nhận request
    async acceptRequest(
        requestId: string, 
        appointmentData: CreateAppointmentDto, 
        actor: any
    ): Promise<{ request: any; appointment: AppointmentResponseDto; chat_room_id: string }> {
        // Kiểm tra request tồn tại và có thể tiếp nhận
        const request = await this.prisma.serviceRequest.findFirst({
            where: {
                id: requestId,
                status: 'PENDING',
                depot_deleted_at: null
            }
        });

        if (!request) {
            throw new Error('REQUEST_NOT_FOUND_OR_INVALID_STATUS');
        }

        // Validate thời gian lịch hẹn
        const appointmentTime = new Date(appointmentData.appointment_time);
        if (appointmentTime <= new Date()) {
            throw new Error('APPOINTMENT_TIME_MUST_BE_FUTURE');
        }

        // Kiểm tra slot có sẵn (có thể mở rộng logic này)
        const isSlotAvailable = await this.checkSlotAvailability(
            appointmentData.location_type,
            appointmentData.location_id,
            appointmentTime,
            requestId
        );

        if (!isSlotAvailable) {
            throw new Error('APPOINTMENT_SLOT_UNAVAILABLE');
        }

        // TODO: Tạo hoặc lấy chat room khi ChatService được implement
        // let chatRoom = await this.chatService.getChatRoomByRequestId(requestId);
        // if (!chatRoom) {
        //     chatRoom = await this.chatService.createChatRoom(requestId, [request.created_by, actor._id]);
        // }
        const chatRoomId = `chat_${requestId}`; // Temporary chat room ID

        // Cập nhật request với thông tin appointment
        const updatedRequest = await this.prisma.serviceRequest.update({
            where: { id: requestId },
            data: {
                status: 'RECEIVED',
                appointment_time: appointmentTime,
                appointment_location_type: appointmentData.location_type,
                appointment_location_id: appointmentData.location_id,
                gate_ref: appointmentData.gate_ref,
                appointment_note: appointmentData.note,
                updatedAt: new Date()
            }
        });

        // Tạo appointment response
        const appointment: AppointmentResponseDto = {
            id: requestId,
            appointment_time: appointmentTime.toISOString(),
            location_type: appointmentData.location_type,
            location_id: appointmentData.location_id,
            gate_ref: appointmentData.gate_ref,
            note: appointmentData.note,
            created_at: updatedRequest.createdAt.toISOString(),
            updated_at: updatedRequest.updatedAt.toISOString()
        };

        // TODO: Gửi system message vào chat khi ChatService được implement
        // try {
        //     const systemMessage = `✅ Đơn hàng đã được tiếp nhận và lịch hẹn: ${appointmentTime.toLocaleString('vi-VN')} tại ${appointmentData.location_type} ${appointmentData.location_id}`;
        //     await this.chatService.sendSystemMessage(chatRoom.id, systemMessage);
        // } catch (error) {
        //     console.error('Không thể gửi system message:', error);
        // }
        console.log(`✅ Đơn hàng đã được tiếp nhận và lịch hẹn: ${appointmentTime.toLocaleString('vi-VN')} tại ${appointmentData.location_type} ${appointmentData.location_id}`);

        // Audit log
        await audit(actor._id, 'REQUEST.ACCEPTED', 'SERVICEREQUEST', requestId, {
            appointment: appointmentData,
            chat_room_id: chatRoomId
        });

        return {
            request: updatedRequest,
            appointment,
            chat_room_id: chatRoomId
        };
    }

    // Cập nhật lịch hẹn
    async updateAppointment(
        requestId: string,
        updateData: UpdateAppointmentDto,
        actor: any
    ): Promise<AppointmentResponseDto> {
        // Kiểm tra request tồn tại và có thể cập nhật
        const request = await this.prisma.serviceRequest.findFirst({
            where: {
                id: requestId,
                status: 'RECEIVED',
                depot_deleted_at: null
            }
        });

        if (!request) {
            throw new Error('REQUEST_NOT_FOUND_OR_INVALID_STATUS');
        }

        // TODO: Lưu thông tin cũ khi Prisma schema được cập nhật
        const oldAppointment = {
            appointment_time: null, // request.appointment_time,
            location_type: null, // request.appointment_location_type,
            location_id: null, // request.appointment_location_id,
            gate_ref: null, // request.gate_ref,
            note: null // request.appointment_note
        };

        // Validate thời gian mới nếu có
        if (updateData.appointment_time) {
            const newTime = new Date(updateData.appointment_time);
            if (newTime <= new Date()) {
                throw new Error('APPOINTMENT_TIME_MUST_BE_FUTURE');
            }

            // TODO: Kiểm tra slot khi Prisma schema được cập nhật
            // Kiểm tra slot mới có sẵn
            const isSlotAvailable = await this.checkSlotAvailability(
                updateData.location_type || 'gate', // request.appointment_location_type!,
                updateData.location_id || 'default', // request.appointment_location_id!,
                newTime,
                requestId
            );

            if (!isSlotAvailable) {
                throw new Error('APPOINTMENT_SLOT_UNAVAILABLE');
            }
        }

        // TODO: Cập nhật khi Prisma schema được cập nhật
        const updatedRequest = await this.prisma.serviceRequest.update({
            where: { id: requestId },
            data: {
                // ...(updateData.appointment_time && { appointment_time: new Date(updateData.appointment_time) }),
                // ...(updateData.location_type && { appointment_location_type: updateData.location_type }),
                // ...(updateData.location_id && { appointment_location_id: updateData.location_id }),
                // ...(updateData.gate_ref !== undefined && { gate_ref: updateData.gate_ref }),
                // ...(updateData.note !== undefined && { appointment_note: updateData.note }),
                updatedAt: new Date()
            }
        });

        // TODO: Gửi system message vào chat khi ChatService được implement
        // try {
        //     const chatRoom = await this.chatService.getChatRoomByRequestId(requestId);
        //     if (chatRoom) {
        //         const systemMessage = `🔄 Lịch hẹn đã được cập nhật: ${updatedRequest.appointment_time?.toLocaleString('vi-VN')} tại ${updatedRequest.appointment_location_type} ${updatedRequest.appointment_location_id}`;
        //         await this.chatService.sendSystemMessage(chatRoom.id, systemMessage);
        //     }
        // } catch (error) {
        //     console.error('Không thể gửi system message:', error);
        // }
        // TODO: Log khi Prisma schema được cập nhật
        console.log(`🔄 Lịch hẹn đã được cập nhật: ${updateData.appointment_time ? new Date(updateData.appointment_time).toLocaleString('vi-VN') : 'N/A'} tại ${updateData.location_type || 'gate'} ${updateData.location_id || 'default'}`);

        // Audit log
        await audit(actor._id, 'APPOINTMENT.UPDATED', 'SERVICEREQUEST', requestId, {
            old: oldAppointment,
            new: updateData
        });

        // TODO: Tạo response khi Prisma schema được cập nhật
        const appointment: AppointmentResponseDto = {
            id: requestId,
            appointment_time: new Date().toISOString(), // updatedRequest.appointment_time!.toISOString(),
            location_type: updateData.location_type || 'gate', // updatedRequest.appointment_location_type!,
            location_id: updateData.location_id || 'default', // updatedRequest.appointment_location_id!,
            gate_ref: updateData.gate_ref || undefined, // updatedRequest.gate_ref || undefined,
            note: updateData.note || undefined, // updatedRequest.appointment_note || undefined,
            created_at: updatedRequest.createdAt.toISOString(),
            updated_at: updatedRequest.updatedAt.toISOString()
        };

        return appointment;
    }

    // Kiểm tra slot có sẵn (có thể mở rộng logic này)
    private async checkSlotAvailability(
        locationType: string,
        locationId: string,
        appointmentTime: Date,
        excludeRequestId: string
    ): Promise<boolean> {
        // Logic kiểm tra slot có sẵn
        // Có thể kiểm tra:
        // 1. Giờ mở cửa
        // 2. Slot đã được đặt
        // 3. Khả năng xử lý của location

        // TODO: Kiểm tra slot khi Prisma schema được cập nhật
        // Demo: chỉ kiểm tra xem có request nào khác đặt cùng thời gian và location không
        // const conflictingRequest = await this.prisma.serviceRequest.findFirst({
        //     where: {
        //         id: { not: excludeRequestId },
        //         status: 'RECEIVED',
        //         appointment_location_type: locationType,
        //         appointment_location_id: locationId,
        //         appointment_time: {
        //             gte: new Date(appointmentTime.getTime() - 30 * 60 * 1000), // 30 phút trước
        //             lte: new Date(appointmentTime.getTime() + 30 * 60 * 1000)  // 30 phút sau
        //         }
        //     }
        // });
        
        // Temporary: always return true for demo
        return true;
    }

    // Lấy thông tin appointment từ database
    async getAppointmentByRequestId(requestId: string): Promise<AppointmentResponseDto | null> {
        const request = await this.prisma.serviceRequest.findFirst({
            where: {
                id: requestId,
                appointment_time: { not: null }
            }
        });

        if (!request || !request.appointment_time) {
            return null;
        }

        // Return real appointment data
        return {
            id: request.id,
            appointment_time: request.appointment_time.toISOString(),
            location_type: request.appointment_location_type || 'gate',
            location_id: request.appointment_location_id || 'default',
            gate_ref: request.gate_ref || undefined,
            note: request.appointment_note || undefined,
            created_at: request.createdAt.toISOString(),
            updated_at: request.updatedAt.toISOString()
        };
    }
}
