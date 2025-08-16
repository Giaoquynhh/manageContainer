import Joi from 'joi';

export const loginSchema = Joi.object({
	username: Joi.string().required(), // email or username (we use email as username)
	password: Joi.string().required()
});

export const updateProfileSchema = Joi.object({
	full_name: Joi.string().optional(),
	phone: Joi.string()
		.pattern(/^\+?\d{7,15}$/)
		.message('Số điện thoại không hợp lệ (chỉ gồm số, có thể bắt đầu bằng +, 7-15 ký tự).')
		.optional(),
	address: Joi.string().optional(),
	email: Joi.string().email().optional()
});

export const changePasswordSchema = Joi.object({
	old: Joi.string().required(),
	new: Joi.string().required(),
	confirm: Joi.string().required()
});

export const acceptInviteSchema = Joi.object({
	token: Joi.string().required(),
	password: Joi.string().required(),
	confirm: Joi.string().required()
});
