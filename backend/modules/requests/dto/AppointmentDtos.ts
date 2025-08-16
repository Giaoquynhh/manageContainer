import Joi from 'joi';

// DTO cho việc tạo lịch hẹn
export interface CreateAppointmentDto {
    appointment_time: string; // ISO8601 datetime
    location_type: 'gate' | 'yard';
    location_id: string;
    gate_ref?: string;
    note?: string;
}

// DTO cho việc cập nhật lịch hẹn
export interface UpdateAppointmentDto {
    appointment_time?: string;
    location_type?: 'gate' | 'yard';
    location_id?: string;
    gate_ref?: string;
    note?: string;
}

// DTO cho response appointment
export interface AppointmentResponseDto {
    id: string;
    appointment_time: string;
    location_type: string;
    location_id: string;
    gate_ref?: string;
    note?: string;
    created_at: string;
    updated_at: string;
}

// Validation schemas
export const createAppointmentSchema = Joi.object({
    appointment_time: Joi.string().isoDate().required().messages({
        'string.isoDate': 'Thời gian phải đúng định dạng ISO8601',
        'any.required': 'Thời gian lịch hẹn là bắt buộc'
    }),
    location_type: Joi.string().valid('gate', 'yard').required().messages({
        'any.only': 'Loại địa điểm phải là gate hoặc yard',
        'any.required': 'Loại địa điểm là bắt buộc'
    }),
    location_id: Joi.string().required().messages({
        'any.required': 'ID địa điểm là bắt buộc'
    }),
    gate_ref: Joi.string().allow('').optional().max(100).messages({
        'string.max': 'GATE REF không được quá 100 ký tự'
    }),
    note: Joi.string().allow('').optional().max(500).messages({
        'string.max': 'Ghi chú không được quá 500 ký tự'
    })
});

export const updateAppointmentSchema = Joi.object({
    appointment_time: Joi.string().isoDate().optional().messages({
        'string.isoDate': 'Thời gian phải đúng định dạng ISO8601'
    }),
    location_type: Joi.string().valid('gate', 'yard').optional().messages({
        'any.only': 'Loại địa điểm phải là gate hoặc yard'
    }),
    location_id: Joi.string().optional(),
    gate_ref: Joi.string().allow('').optional().max(100).messages({
        'string.max': 'GATE REF không được quá 100 ký tự'
    }),
    note: Joi.string().allow('').optional().max(500).messages({
        'string.max': 'Ghi chú không được quá 500 ký tự'
    })
});




