import { PrismaClient } from '@prisma/client';
import { UploadAttachmentDto, AttachmentResponseDto, FILE_UPLOAD_CONFIG } from '../dto/AttachmentDtos';
// import { AttachmentRepository } from '../repository/AttachmentRepository';
import { audit } from '../../../shared/middlewares/audit';

export class AttachmentService {
    // private attachmentRepo: AttachmentRepository;
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        // this.attachmentRepo = new AttachmentRepository(prisma);
    }

    // Upload attachment cho request
    async uploadAttachment(
        requestId: string,
        fileData: UploadAttachmentDto,
        uploaderId: string,
        uploaderRole: 'customer' | 'depot'
    ): Promise<AttachmentResponseDto> {
        // Kiểm tra request tồn tại và có thể upload
        const request = await this.prisma.serviceRequest.findFirst({
            where: {
                id: requestId,
                status: { notIn: ['REJECTED', 'CANCELLED'] },
                depot_deleted_at: null
            }
        });

        if (!request) {
            throw new Error('REQUEST_NOT_FOUND_OR_INVALID_STATUS');
        }

        // TODO: Kiểm tra khi Prisma schema được cập nhật
        // Kiểm tra request có bị khóa attachments không
        // if (request.locked_attachments) {
        //     throw new Error('ATTACHMENTS_LOCKED');
        // }

        // TODO: Kiểm tra giới hạn số file khi AttachmentRepository được implement
        // Kiểm tra giới hạn số file
        // const canUpload = await this.attachmentRepo.checkUploadLimit(
        //     requestId, 
        //     FILE_UPLOAD_CONFIG.MAX_FILES_PER_REQUEST
        // );

        // if (!canUpload) {
        //     throw new Error('UPLOAD_LIMIT_EXCEEDED');
        // }

        // Validate file type
        if (!FILE_UPLOAD_CONFIG.ALLOWED_TYPES.includes(fileData.file_type)) {
            throw new Error('FILE_TYPE_NOT_ALLOWED');
        }

        // Validate file size
        if (fileData.file_size > FILE_UPLOAD_CONFIG.MAX_SIZE_MB * 1024 * 1024) {
            throw new Error('FILE_SIZE_EXCEEDED');
        }

        // TODO: Tạo attachment khi AttachmentRepository được implement
        // Tạo attachment
        // const attachment = await this.attachmentRepo.create({
        //     ...fileData,
        //     request_id: requestId,
        //     uploader_id: uploaderId,
        //     uploader_role: uploaderRole
        // });

        // Temporary: return demo data
        const attachment: AttachmentResponseDto = {
            id: `temp_${Date.now()}`,
            request_id: requestId,
            uploader_id: uploaderId,
            uploader_role: uploaderRole,
            file_name: fileData.file_name,
            file_type: fileData.file_type,
            file_size: fileData.file_size,
            storage_url: fileData.storage_url,
            uploaded_at: new Date().toISOString()
        };

        // Audit log
        await audit(uploaderId, 'ATTACHMENT.UPLOADED', 'REQUESTATTACHMENT', attachment.id, {
            request_id: requestId,
            file_name: fileData.file_name,
            file_size: fileData.file_size,
            file_type: fileData.file_type
        });

        return attachment;
    }

    // Lấy danh sách attachments theo request_id
    async getAttachmentsByRequestId(requestId: string): Promise<AttachmentResponseDto[]> {
        // Kiểm tra request tồn tại
        const request = await this.prisma.serviceRequest.findFirst({
            where: { id: requestId }
        });

        if (!request) {
            throw new Error('REQUEST_NOT_FOUND');
        }

        // TODO: Lấy attachments khi AttachmentRepository được implement
        // return this.attachmentRepo.findByRequestId(requestId);
        
        // Temporary: return empty array
        return [];
    }

    // Xóa attachment
    async deleteAttachment(
        attachmentId: string,
        userId: string,
        reason?: string
    ): Promise<boolean> {
        // TODO: Kiểm tra quyền và xóa khi AttachmentRepository được implement
        // Kiểm tra quyền xóa
        // const canDelete = await this.attachmentRepo.canDelete(userId, attachmentId);
        // if (!canDelete) {
        //     throw new Error('FORBIDDEN_TO_DELETE_ATTACHMENT');
        // }

        // Xóa attachment
        // const deleted = await this.attachmentRepo.delete(attachmentId, reason);
        
        // Temporary: always return true for demo
        const deleted = true;

        if (deleted) {
            // Audit log
            await audit(userId, 'ATTACHMENT.DELETED', 'REQUESTATTACHMENT', attachmentId, {
                reason
            });
        }

        return deleted;
    }

    // TODO: Lấy attachment theo ID khi AttachmentRepository được implement
    async getAttachmentById(attachmentId: string): Promise<AttachmentResponseDto | null> {
        // return this.attachmentRepo.findById(attachmentId);
        
        // Temporary: return null for demo
        return null;
    }

    // Khóa attachments của request (chỉ System Admin hoặc Depot Admin)
    async lockAttachments(requestId: string, actorId: string): Promise<boolean> {
        // Kiểm tra quyền
        const actor = await this.prisma.user.findFirst({
            where: { id: actorId }
        });

        if (!actor || !['SystemAdmin', 'BusinessAdmin', 'SaleAdmin'].includes(actor.role)) {
            throw new Error('INSUFFICIENT_PERMISSIONS');
        }

        // Kiểm tra request tồn tại
        const request = await this.prisma.serviceRequest.findFirst({
            where: { id: requestId }
        });

        if (!request) {
            throw new Error('REQUEST_NOT_FOUND');
        }

        // TODO: Khóa attachments khi Prisma schema được cập nhật
        // Khóa attachments
        // await this.prisma.serviceRequest.update({
        //     where: { id: requestId },
        //     data: { locked_attachments: true }
        // });
        console.log(`Đã khóa attachments cho request ${requestId}`);

        // Audit log
        await audit(actorId, 'ATTACHMENTS.LOCKED', 'SERVICEREQUEST', requestId, {
            locked_by: actorId,
            locked_at: new Date().toISOString()
        });

        return true;
    }

    // Mở khóa attachments của request
    async unlockAttachments(requestId: string, actorId: string): Promise<boolean> {
        // Kiểm tra quyền
        const actor = await this.prisma.user.findFirst({
            where: { id: actorId }
        });

        if (!actor || !['SystemAdmin', 'BusinessAdmin', 'SaleAdmin'].includes(actor.role)) {
            throw new Error('INSUFFICIENT_PERMISSIONS');
        }

        // Kiểm tra request tồn tại
        const request = await this.prisma.serviceRequest.findFirst({
            where: { id: requestId }
        });

        if (!request) {
            throw new Error('REQUEST_NOT_FOUND');
        }

        // TODO: Mở khóa attachments khi Prisma schema được cập nhật
        // Mở khóa attachments
        // await this.prisma.serviceRequest.update({
        //     where: { id: requestId },
        //     data: { locked_attachments: false }
        // });
        console.log(`Đã mở khóa attachments cho request ${requestId}`);

        // Audit log
        await audit(actorId, 'ATTACHMENTS.UNLOCKED', 'SERVICEREQUEST', requestId, {
            unlocked_by: actorId,
            unlocked_at: new Date().toISOString()
        });

        return true;
    }

    // Lấy thống kê attachments
    async getAttachmentStats(requestId: string): Promise<{
        total_count: number;
        total_size: number;
        by_type: Record<string, number>;
    }> {
        // const attachments = await this.attachmentRepo.findByRequestId(requestId);
        
        // TODO: Tính stats khi AttachmentRepository được implement
        // const stats = {
        //     total_count: attachments.length,
        //     total_size: 0,
        //     by_type: {} as Record<string, number>
        // };

        // attachments.forEach(attachment => {
        //     stats.total_size += attachment.file_size;
        //     stats.by_type[attachment.file_type] = (stats.by_type[attachment.file_type] || 0) + 1;
        // });

        // return stats;
        
        // Temporary: return demo stats
        return {
            total_count: 0,
            total_size: 0,
            by_type: {}
        };
    }
}
