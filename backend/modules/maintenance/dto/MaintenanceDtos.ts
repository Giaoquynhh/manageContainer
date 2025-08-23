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
  status: Joi.string().valid('GATE_IN','CHECKING','CHECKED','CHECKING_CONFIRM','REPAIRING','APPROVED','REJECTED').optional()
});

export const approveSchema = Joi.object({
  manager_comment: Joi.string().optional()
});

export const rejectSchema = Joi.object({
  manager_comment: Joi.string().allow('', null).optional(),
  reason: Joi.string().allow('', null).optional(), // Accept cả reason và manager_comment
  action: Joi.string().valid('can_repair', 'cannot_repair').optional()
}).unknown(true); // Cho phép các field khác

export const updateInventorySchema = Joi.object({
  qty_on_hand: Joi.number().integer().required(),
  reorder_point: Joi.number().integer().min(0).required()
});



