import Joi from 'joi';

export const invoiceItemSchema = Joi.object({
  service_code: Joi.string().required(),
  description: Joi.string().required(),
  qty: Joi.number().precision(3).required(),
  unit_price: Joi.number().precision(4).required(),
  tax_code: Joi.string().optional(),
  tax_rate: Joi.number().precision(2).optional()
});

export const createInvoiceSchema = Joi.object({
  customer_id: Joi.string().required(),
  currency: Joi.string().length(3).default('VND'),
  issue_date: Joi.date().optional(),
  due_date: Joi.date().optional(),
  notes: Joi.string().allow('').optional(),
  items: Joi.array().items(invoiceItemSchema).min(1).required()
});

export const issueInvoiceSchema = Joi.object({
  issue_date: Joi.date().required(),
  due_date: Joi.date().required()
});

export const patchInvoiceSchema = Joi.object({
  due_date: Joi.date().optional(),
  notes: Joi.string().allow('').optional()
});

export const createPaymentSchema = Joi.object({
  customer_id: Joi.string().required(),
  amount: Joi.number().precision(2).required(),
  currency: Joi.string().length(3).default('VND'),
  paid_date: Joi.date().required(),
  method: Joi.string().required(),
  reference_no: Joi.string().optional(),
  notes: Joi.string().allow('').optional(),
  allocations: Joi.array().items(Joi.object({
    invoice_id: Joi.string().required(),
    allocated_amount: Joi.number().precision(2).required()
  })).min(1).required()
});



