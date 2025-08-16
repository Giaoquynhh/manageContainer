import Joi from 'joi';

export const createRequestSchema = Joi.object({
	type: Joi.string().valid('IMPORT','EXPORT','CONVERT').required(),
	container_no: Joi.string().min(4).max(20).required(),
	eta: Joi.date().required()
});

export const updateRequestStatusSchema = Joi.object({
	status: Joi.string().valid('PENDING','RECEIVED','REJECTED','COMPLETED','EXPORTED','IN_YARD','LEFT_YARD').required(),
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
	type: Joi.string().valid('EIR','LOLO','INVOICE').required()
});
