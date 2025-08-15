import Joi from 'joi';

export const UploadDocumentBody = Joi.object({
  request_id: Joi.string().required(),
  type: Joi.string().valid('DOCUMENT').required(),
});

export const DeleteDocumentBody = Joi.object({
  reason: Joi.string().optional(),
});

export const DocumentQuery = Joi.object({
  request_id: Joi.string().required(),
});

export const DocumentViewQuery = Joi.object({
  request_id: Joi.string().required(),
  doc_id: Joi.string().required(),
  action: Joi.string().valid('view', 'download').default('view'),
});
