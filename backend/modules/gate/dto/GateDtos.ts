import Joi from 'joi';

export const gateLookupSchema = Joi.object({
	code: Joi.string().min(4).required()
});

export const checkinSchema = Joi.object({
	request_id: Joi.string().required(),
	plate_no: Joi.string().min(5).max(20).required()
});

export const checkoutSchema = Joi.object({
	request_id: Joi.string().required(),
	supervisor_pin: Joi.string().optional()
});

export const printSchema = Joi.object({
	request_id: Joi.string().required(),
	type: Joi.string().valid('IN','OUT').required()
});


