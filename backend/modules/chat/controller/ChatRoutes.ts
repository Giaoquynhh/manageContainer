import { Router } from 'express';
import controller from './ChatController';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();

// Chat room management
router.post('/', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin'), (req, res) => controller.createChatRoom(req as any, res));
router.get('/request/:request_id', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin'), (req, res) => controller.getChatRoom(req as any, res));

// Messages
router.post('/:chat_room_id/messages', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin'), (req, res) => controller.sendMessage(req as any, res));
router.get('/:chat_room_id/messages', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin'), (req, res) => controller.listMessages(req as any, res));

// User's chat rooms
router.get('/user/rooms', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin'), (req, res) => controller.getUserChatRooms(req as any, res));

export default router;


