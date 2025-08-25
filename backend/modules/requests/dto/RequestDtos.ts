import Joi from 'joi';

export const createRequestSchema = Joi.object({
	type: Joi.string().valid('IMPORT','EXPORT','CONVERT').required(),
	container_no: Joi.string().min(4).max(20).required(),
	eta: Joi.date().required()
});

export const updateRequestStatusSchema = Joi.object({
	status: Joi.string().valid('PENDING','SCHEDULED','SCHEDULED_INFO_ADDED','FORWARDED','SENT_TO_GATE','CHECKING','REJECTED','COMPLETED').required(),
	reason: Joi.string().optional()
});

export const rejectRequestSchema = Joi.object({
	reason: Joi.string().optional()
});

export const softDeleteRequestSchema = Joi.object({
	scope: Joi.string().valid('depot', 'customer').required()
});

export const restoreRequestSchema = Joi.object({
	scope: Joi.string().valid('depot', 'customer').required()
});

export const queryRequestSchema = Joi.object({
	type: Joi.string().optional(),
	status: Joi.string().optional(),
	actor: Joi.string().valid('depot', 'customer').optional(),
	includeHidden: Joi.boolean().optional(),
	page: Joi.number().integer().min(1).optional(),
	limit: Joi.number().integer().min(1).max(100).optional()
});

export const uploadDocSchema = Joi.object({
	type: Joi.string().valid('EIR','LOLO','INVOICE','SUPPLEMENT').required()
});

// New DTOs for State Machine
export const scheduleRequestSchema = Joi.object({
	appointment_time: Joi.date().required(),
	appointment_location_type: Joi.string().valid('gate', 'yard').optional(),
	appointment_location_id: Joi.string().optional(),
	gate_ref: Joi.string().optional(),
	appointment_note: Joi.string().optional()
});

export const addInfoSchema = Joi.object({
	documents: Joi.array().items(Joi.object({
		name: Joi.string().required(),
		type: Joi.string().required(),
		size: Joi.number().required()
	})).optional(),
	notes: Joi.string().optional()
});

export const sendToGateSchema = Joi.object({});

export const completeRequestSchema = Joi.object({});
