import Joi from 'joi';

export const createRepairSchema = Joi.object({
  code: Joi.string().required(),
  container_no: Joi.string().optional(), // Container number (optional)
  equipment_id: Joi.string().optional(), // Làm cho equipment_id optional thay vì required
  problem_description: Joi.string().required(),
  estimated_cost: Joi.number().min(0).optional(),
  items: Joi.array().items(Joi.object({
    inventory_item_id: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required()
  })).optional()
});

export const listRepairsSchema = Joi.object({
  status: Joi.string().valid('PENDING_APPROVAL','APPROVED','REJECTED').optional()
});

export const approveSchema = Joi.object({
  manager_comment: Joi.string().optional()
});

export const rejectSchema = Joi.object({
  manager_comment: Joi.string().allow('').optional()
});

export const updateInventorySchema = Joi.object({
  qty_on_hand: Joi.number().integer().required(),
  reorder_point: Joi.number().integer().min(0).required()
});



