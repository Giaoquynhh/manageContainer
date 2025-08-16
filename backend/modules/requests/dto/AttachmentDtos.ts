import Joi from 'joi';

// DTO cho việc upload attachment
export interface UploadAttachmentDto {
    file_name: string;
    file_type: 'pdf' | 'jpg' | 'jpeg' | 'png';
    file_size: number;
    storage_url: string;
}

// DTO cho response attachment
export interface AttachmentResponseDto {
    id: string;
    request_id: string;
    uploader_id: string;
    uploader_role: 'customer' | 'depot';
    file_name: string;
    file_type: string;
    file_size: number;
    storage_url: string;
    uploaded_at: string;
    deleted_at?: string;
}

// DTO cho việc xóa attachment
export interface DeleteAttachmentDto {
    reason?: string;
}

// Validation schemas
export const uploadAttachmentSchema = Joi.object({
    file_name: Joi.string().required().max(255).messages({
        'any.required': 'Tên file là bắt buộc',
        'string.max': 'Tên file không được quá 255 ký tự'
    }),
    file_type: Joi.string().valid('pdf', 'jpg', 'jpeg', 'png').required().messages({
        'any.only': 'Định dạng file không được hỗ trợ',
        'any.required': 'Định dạng file là bắt buộc'
    }),
    file_size: Joi.number().positive().max(10 * 1024 * 1024).required().messages({
        'number.positive': 'Kích thước file phải dương',
        'number.max': 'Kích thước file không được vượt quá 10MB',
        'any.required': 'Kích thước file là bắt buộc'
    }),
    storage_url: Joi.string().uri().required().messages({
        'string.uri': 'URL lưu trữ không hợp lệ',
        'any.required': 'URL lưu trữ là bắt buộc'
    })
});

export const deleteAttachmentSchema = Joi.object({
    reason: Joi.string().optional().max(200).messages({
        'string.max': 'Lý do xóa không được quá 200 ký tự'
    })
});

// File upload configuration
export const FILE_UPLOAD_CONFIG = {
    ALLOWED_TYPES: ['pdf', 'jpg', 'jpeg', 'png'],
    MAX_SIZE_MB: 10,
    MAX_FILES_PER_REQUEST: 20
} as const;




