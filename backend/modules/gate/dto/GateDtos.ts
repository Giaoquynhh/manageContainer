import Joi from 'joi';

// DTO cho việc forward request từ Kho sang Gate
export const forwardRequestSchema = Joi.object({
  // Không cần body, chỉ cần request ID
});

// DTO cho việc Gate chấp nhận xe vào
export const gateAcceptSchema = Joi.object({
  driver_name: Joi.string().required().min(2).max(100),
  license_plate: Joi.string().required().min(5).max(20),
  id_card: Joi.string().required().min(9).max(20),
  seal_number: Joi.string().optional().max(50),
  note: Joi.string().optional().max(500)
});

// Gate Approve DTO - yêu cầu nhập biển số và tên tài xế
export const gateApproveSchema = Joi.object({
  license_plate: Joi.string().required().min(5).max(20).messages({
    'any.required': 'Biển số xe là bắt buộc',
    'string.min': 'Biển số xe phải có ít nhất 5 ký tự'
  }),
  driver_name: Joi.string().required().min(2).max(100).messages({
    'any.required': 'Tên tài xế là bắt buộc',
    'string.min': 'Tên tài xế phải có ít nhất 2 ký tự',
    'string.max': 'Tên tài xế không được quá 100 ký tự'
  })
});

export interface GateApproveData {
  license_plate: string;
  driver_name: string;
}

// Gate Reject DTO  
export const gateRejectSchema = Joi.object({
  reason: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Lý do từ chối phải có ít nhất 5 ký tự',
    'string.max': 'Lý do từ chối không được quá 500 ký tự',
    'any.required': 'Lý do từ chối là bắt buộc'
  })
});

export interface GateRejectData {
  reason: string;
}

// DTO cho việc tìm kiếm requests ở Gate
export const gateSearchSchema = Joi.object({
  status: Joi.string().valid('FORWARDED', 'GATE_IN', 'GATE_REJECTED').optional(),
  container_no: Joi.string().optional(),
  type: Joi.string().valid('IMPORT', 'EXPORT', 'CONVERT').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

// Types
export interface GateAcceptData {
  driver_name: string;
  license_plate: string;
  id_card: string;
  seal_number?: string;
  note?: string;
}

export interface GateSearchParams {
  status?: string;
  container_no?: string;
  type?: string;
  page?: number;
  limit?: number;
}


