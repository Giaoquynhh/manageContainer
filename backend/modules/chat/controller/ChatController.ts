import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/ChatService';
import { createChatRoomSchema, sendMessageSchema, queryMessagesSchema, updateChatRoomSchema } from '../dto/ChatDtos';

export class ChatController {
	async createChatRoom(req: AuthRequest, res: Response) {
		const { error, value } = createChatRoomSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		
		try {
			const result = await service.createChatRoom(req.user!, value.request_id);
			return res.status(201).json(result);
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}

	async getChatRoom(req: AuthRequest, res: Response) {
		try {
			console.log('getChatRoom called with request_id:', req.params.request_id);
			console.log('user:', req.user);
			
			const result = await service.getChatRoom(req.user!, req.params.request_id);
			console.log('getChatRoom result:', result);
			
			return res.json(result);
		} catch (e: any) {
			console.error('getChatRoom error:', e);
			return res.status(400).json({ message: e.message });
		}
	}

	async sendMessage(req: AuthRequest, res: Response) {
		const { error, value } = sendMessageSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		
		try {
			const result = await service.sendMessage(req.user!, req.params.chat_room_id, value);
			return res.status(201).json(result);
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}

	async listMessages(req: AuthRequest, res: Response) {
		const { error, value } = queryMessagesSchema.validate(req.query);
		if (error) return res.status(400).json({ message: error.message });
		
		try {
			const result = await service.listMessages(req.user!, req.params.chat_room_id, value);
			return res.json(result);
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}

	async getUserChatRooms(req: AuthRequest, res: Response) {
		const { error, value } = queryMessagesSchema.validate(req.query);
		if (error) return res.status(400).json({ message: error.message });
		
		try {
			const result = await service.getUserChatRooms(req.user!, value);
			return res.json(result);
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}
}

export default new ChatController();
