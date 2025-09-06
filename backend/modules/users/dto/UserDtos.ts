import Joi from 'joi';
import { AppRole } from '../../../shared/middlewares/auth';

export const createEmployeeSchema = Joi.object({
	full_name: Joi.string().required(),
	email: Joi.string().email().required(),
	role: Joi.string().valid('SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','Driver').required()
});

export const createCustomerUserSchema = Joi.object({
	full_name: Joi.string().required(),
	email: Joi.string().email().required(),
	role: Joi.string().valid('CustomerAdmin','CustomerUser').required(),
	tenant_id: Joi.string().optional(),
	company_name: Joi.string().optional()
});

export const updateUserSchema = Joi.object({
	full_name: Joi.string().optional(),
	role: Joi.string().valid('SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin','CustomerUser','PartnerAdmin','Security','YardManager','MaintenanceManager','Accountant').optional(),
	permissions: Joi.array()
		.items(Joi.string().trim().min(1).max(64).pattern(/^[A-Za-z0-9:_\-\.]+$/))
		.max(50)
		.optional()
});
