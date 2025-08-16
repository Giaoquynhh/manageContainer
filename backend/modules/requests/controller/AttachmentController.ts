import { Response } from 'express';
import { AttachmentService } from '../service/AttachmentService';
import { uploadAttachmentSchema, deleteAttachmentSchema } from '../dto/AttachmentDtos';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../../shared/middlewares/auth';

export class AttachmentController {
    private attachmentService: AttachmentService;
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        this.attachmentService = new AttachmentService(prisma);
    }

    // Upload attachment
    async uploadAttachment(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const fileData = req.body;
            const actor = req.user!;

            // Validate input
            const { error } = uploadAttachmentSchema.validate(fileData);
            if (error) {
                return res.status(400).json({
                    message: 'Dữ liệu file không hợp lệ',
                    errors: error.details.map(detail => detail.message)
                });
            }

            // Xác định role của uploader
            let uploaderRole: 'customer' | 'depot';
            if (['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
                uploaderRole = 'customer';
            } else if (['SaleAdmin', 'SystemAdmin', 'BusinessAdmin', 'Accountant'].includes(actor.role)) {
                uploaderRole = 'depot';
            } else {
                return res.status(403).json({
                    message: 'Không đủ quyền để upload file'
                });
            }

            const attachment = await this.attachmentService.uploadAttachment(
                id, 
                fileData, 
                actor._id, 
                uploaderRole
            );

            return res.status(201).json({
                message: 'Upload file thành công',
                data: attachment
            });

        } catch (error: any) {
            console.error('Error uploading attachment:', error);

            switch (error.message) {
                case 'REQUEST_NOT_FOUND_OR_INVALID_STATUS':
                    return res.status(404).json({
                        message: 'Không tìm thấy yêu cầu hoặc trạng thái không hợp lệ'
                    });
                case 'ATTACHMENTS_LOCKED':
                    return res.status(409).json({
                        message: 'Chứng từ đã bị khóa, không thể upload thêm'
                    });
                case 'UPLOAD_LIMIT_EXCEEDED':
                    return res.status(400).json({
                        message: 'Đã vượt quá giới hạn số file upload cho yêu cầu này'
                    });
                case 'FILE_TYPE_NOT_ALLOWED':
                    return res.status(400).json({
                        message: 'Định dạng file không được hỗ trợ'
                    });
                case 'FILE_SIZE_EXCEEDED':
                    return res.status(400).json({
                        message: 'Kích thước file vượt quá giới hạn cho phép'
                    });
                default:
                    return res.status(500).json({
                        message: 'Lỗi nội bộ server'
                    });
            }
        }
    }

    // Lấy danh sách attachments theo request_id
    async getAttachments(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const actor = req.user!;

            const attachments = await this.attachmentService.getAttachmentsByRequestId(id);

            return res.status(200).json({
                data: attachments
            });

        } catch (error: any) {
            console.error('Error getting attachments:', error);

            if (error.message === 'REQUEST_NOT_FOUND') {
                return res.status(404).json({
                    message: 'Không tìm thấy yêu cầu'
                });
            }

            return res.status(500).json({
                message: 'Lỗi nội bộ server'
            });
        }
    }

    // Xóa attachment
    async deleteAttachment(req: AuthRequest, res: Response) {
        try {
            const { id, attachmentId } = req.params;
            const { reason } = req.body;
            const actor = req.user!;

            // Validate input
            const { error } = deleteAttachmentSchema.validate({ reason });
            if (error) {
                return res.status(400).json({
                    message: 'Dữ liệu không hợp lệ',
                    errors: error.details.map(detail => detail.message)
                });
            }

            const deleted = await this.attachmentService.deleteAttachment(attachmentId, actor._id, reason);

            if (deleted) {
                return res.status(200).json({
                    message: 'Đã xóa file thành công'
                });
            } else {
                return res.status(404).json({
                    message: 'Không tìm thấy file để xóa'
                });
            }

        } catch (error: any) {
            console.error('Error deleting attachment:', error);

            if (error.message === 'FORBIDDEN_TO_DELETE_ATTACHMENT') {
                return res.status(403).json({
                    message: 'Không có quyền xóa file này'
                });
            }

            return res.status(500).json({
                message: 'Lỗi nội bộ server'
            });
        }
    }

    // Lấy thông tin attachment theo ID
    async getAttachment(req: AuthRequest, res: Response) {
        try {
            const { attachmentId } = req.params;
            const actor = req.user!;

            const attachment = await this.attachmentService.getAttachmentById(attachmentId);

            if (!attachment) {
                return res.status(404).json({
                    message: 'Không tìm thấy file'
                });
            }

            return res.status(200).json({
                data: attachment
            });

        } catch (error: any) {
            console.error('Error getting attachment:', error);
            return res.status(500).json({
                message: 'Lỗi nội bộ server'
            });
        }
    }

    // Khóa attachments của request
    async lockAttachments(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const actor = req.user!;

            const locked = await this.attachmentService.lockAttachments(id, actor._id);

            if (locked) {
                return res.status(200).json({
                    message: 'Đã khóa chứng từ thành công'
                });
            }

            return res.status(400).json({
                message: 'Không thể khóa chứng từ'
            });

        } catch (error: any) {
            console.error('Error locking attachments:', error);

            if (error.message === 'INSUFFICIENT_PERMISSIONS') {
                return res.status(403).json({
                    message: 'Không đủ quyền để khóa chứng từ'
                });
            }

            if (error.message === 'REQUEST_NOT_FOUND') {
                return res.status(404).json({
                    message: 'Không tìm thấy yêu cầu'
                });
            }

            return res.status(500).json({
                message: 'Lỗi nội bộ server'
            });
        }
    }

    // Mở khóa attachments của request
    async unlockAttachments(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const actor = req.user!;

            const unlocked = await this.attachmentService.unlockAttachments(id, actor._id);

            if (unlocked) {
                return res.status(200).json({
                    message: 'Đã mở khóa chứng từ thành công'
                });
            }

            return res.status(400).json({
                message: 'Không thể mở khóa chứng từ'
            });

        } catch (error: any) {
            console.error('Error unlocking attachments:', error);

            if (error.message === 'INSUFFICIENT_PERMISSIONS') {
                return res.status(403).json({
                    message: 'Không đủ quyền để mở khóa chứng từ'
                });
            }

            if (error.message === 'REQUEST_NOT_FOUND') {
                return res.status(404).json({
                    message: 'Không tìm thấy yêu cầu'
                });
            }

            return res.status(500).json({
                message: 'Lỗi nội bộ server'
            });
        }
    }

    // Lấy thống kê attachments
    async getAttachmentStats(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const actor = req.user!;

            const stats = await this.attachmentService.getAttachmentStats(id);

            return res.status(200).json({
                data: stats
            });

        } catch (error: any) {
            console.error('Error getting attachment stats:', error);
            return res.status(500).json({
                message: 'Lỗi nội bộ server'
            });
        }
    }
}
