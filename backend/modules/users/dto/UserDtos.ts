import Joi from 'joi';
import { AppRole } from '../../../shared/middlewares/auth';

export const createEmployeeSchema = Joi.object({
	full_name: Joi.string().required(),
	email: Joi.string().email().required(),
	role: Joi.string().valid('SystemAdmin','BusinessAdmin','HRManager','SaleAdmin').required()
});

export const createCustomerUserSchema = Joi.object({
	full_name: Joi.string().required(),
	email: Joi.string().email().required(),
	role: Joi.string().valid('CustomerAdmin','CustomerUser').required(),
	tenant_id: Joi.string().required()
});

export const updateUserSchema = Joi.object({
	full_name: Joi.string().optional(),
	role: Joi.string().valid('SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin','CustomerUser').optional()
});
