import Joi from 'joi';

export const createPartnerSchema = Joi.object({
	type: Joi.string().valid('TRUCKING','SHIPPING','RAIL','DEPOT','OTHER').required(),
	name: Joi.string().required(),
	tax_code: Joi.string().optional(),
	contact_email: Joi.string().email().optional()
});

export const updatePartnerSchema = Joi.object({
	name: Joi.string().optional(),
	contact_email: Joi.string().email().optional()
});
