import Joi from 'joi';

export const createCustomerSchema = Joi.object({
	name: Joi.string().required(),
	tax_code: Joi.string().required(),
	address: Joi.string().optional(),
	contact_email: Joi.string().email().optional()
});

export const updateCustomerSchema = Joi.object({
	name: Joi.string().optional(),
	address: Joi.string().optional(),
	contact_email: Joi.string().email().optional()
});
