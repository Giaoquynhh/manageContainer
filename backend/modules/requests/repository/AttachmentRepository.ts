import { PrismaClient } from '@prisma/client';
import { UploadAttachmentDto, AttachmentResponseDto } from '../dto/AttachmentDtos';

export class AttachmentRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // Tạo attachment mới
    async create(data: UploadAttachmentDto & { request_id: string; uploader_id: string; uploader_role: 'customer' | 'depot' }): Promise<AttachmentResponseDto> {
        const attachment = await this.prisma.requestAttachment.create({
            data: {
                request_id: data.request_id,
                uploader_id: data.uploader_id,
                uploader_role: data.uploader_role,
                file_name: data.file_name,
                file_type: data.file_type,
                file_size: data.file_size,
                storage_url: data.storage_url
            }
        });

        // Cập nhật số lượng attachments trong request
        await this.updateRequestAttachmentCount(data.request_id);

        return this.mapToResponseDto(attachment);
    }

    // Lấy danh sách attachments theo request_id
    async findByRequestId(requestId: string): Promise<AttachmentResponseDto[]> {
        const attachments = await this.prisma.requestAttachment.findMany({
            where: {
                request_id: requestId,
                deleted_at: null
            },
            orderBy: {
                uploaded_at: 'desc'
            }
        });

        return attachments.map(this.mapToResponseDto);
    }

    // Lấy attachment theo ID
    async findById(id: string): Promise<AttachmentResponseDto | null> {
        const attachment = await this.prisma.requestAttachment.findFirst({
            where: {
                id,
                deleted_at: null
            }
        });

        return attachment ? this.mapToResponseDto(attachment) : null;
    }

    // Xóa attachment (soft delete)
    async delete(id: string, reason?: string): Promise<boolean> {
        const result = await this.prisma.requestAttachment.update({
            where: { id },
            data: {
                deleted_at: new Date(),
                delete_reason: reason
            }
        });

        if (result) {
            // Cập nhật số lượng attachments trong request
            await this.updateRequestAttachmentCount(result.request_id);
            return true;
        }

        return false;
    }

    // Kiểm tra xem user có quyền xóa attachment không
    async canDelete(userId: string, attachmentId: string): Promise<boolean> {
        const attachment = await this.prisma.requestAttachment.findFirst({
            where: {
                id: attachmentId,
                deleted_at: null
            },
            include: {
                request: true
            }
        });

        if (!attachment) return false;

        // Chỉ cho phép xóa nếu:
        // 1. Là người upload
        // 2. Request chưa bị khóa attachments
        // 3. Request đang ở trạng thái cho phép
        return attachment.uploader_id === userId &&
               !attachment.request.locked_attachments &&
               !['REJECTED', 'CANCELLED'].includes(attachment.request.status);
    }

    // Đếm số attachments theo request_id
    async countByRequestId(requestId: string): Promise<number> {
        return this.prisma.requestAttachment.count({
            where: {
                request_id: requestId,
                deleted_at: null
            }
        });
    }

    // Cập nhật số lượng attachments trong request
    private async updateRequestAttachmentCount(requestId: string): Promise<void> {
        const count = await this.countByRequestId(requestId);
        
        await this.prisma.serviceRequest.update({
            where: { id: requestId },
            data: { attachments_count: count }
        });
    }

    // Kiểm tra giới hạn số file upload
    async checkUploadLimit(requestId: string, maxFiles: number): Promise<boolean> {
        const currentCount = await this.countByRequestId(requestId);
        return currentCount < maxFiles;
    }

    // Map Prisma model sang DTO response
    private mapToResponseDto(attachment: any): AttachmentResponseDto {
        return {
            id: attachment.id,
            request_id: attachment.request_id,
            uploader_id: attachment.uploader_id,
            uploader_role: attachment.uploader_role,
            file_name: attachment.file_name,
            file_type: attachment.file_type,
            file_size: attachment.file_size,
            storage_url: attachment.storage_url,
            uploaded_at: attachment.uploaded_at.toISOString(),
            deleted_at: attachment.deleted_at?.toISOString()
        };
    }
}




