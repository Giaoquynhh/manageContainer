import Joi from 'joi';

export const createChatRoomSchema = Joi.object({
	request_id: Joi.string().required()
});

export const sendMessageSchema = Joi.object({
	message: Joi.string().min(1).max(1000).required(),
	type: Joi.string().valid('text', 'file', 'system').default('text'),
	file_url: Joi.string().optional(),
	file_name: Joi.string().optional(),
	file_size: Joi.number().optional()
});

export const queryMessagesSchema = Joi.object({
	page: Joi.number().integer().min(1).optional(),
	limit: Joi.number().integer().min(1).max(100).optional()
});

export const updateChatRoomSchema = Joi.object({
	status: Joi.string().valid('active', 'closed').required()
});


