import repo from '../repository/ChatRepository';
import { audit } from '../../../shared/middlewares/audit';

export class ChatService {
	async createChatRoom(actor: any, request_id: string) {
		// Kiểm tra request có tồn tại không
		const existingChatRoom = await repo.findChatRoomByRequestId(request_id);
		if (existingChatRoom) {
			return existingChatRoom; // Trả về chat room đã tồn tại
		}

		// Xác định participants dựa trên role
		let participants = [actor._id];
		
		// Thêm depot staff dựa trên role
		if (['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
			// Customer tạo chat room, thêm depot staff
			participants.push('system_depot'); // Placeholder, sẽ thay bằng logic thực tế
		} else if (['SaleAdmin', 'SystemAdmin'].includes(actor.role)) {
			// Depot staff tạo chat room, thêm customer
			// Cần logic để tìm customer của request
		}

		const chatRoom = await repo.createChatRoom({
			request_id,
			participants,
			status: 'active'
		});

		await audit(actor._id, 'CHAT_ROOM.CREATED', 'CHAT_ROOM', chatRoom.id);
		return chatRoom;
	}

	async getChatRoom(actor: any, request_id: string) {
		// Tìm chat room theo request_id
		const chatRoom = await repo.findChatRoomByRequestId(request_id);
		
		// Nếu chưa có chat room, tạo mới
		if (!chatRoom) {
			return await this.createChatRoom(actor, request_id);
		}

		// Kiểm tra quyền truy cập
		if (!this.canUserAccessChatRoom(actor, chatRoom)) {
			throw new Error('Không có quyền truy cập chat room này');
		}

		return chatRoom;
	}

	async sendMessage(actor: any, chat_room_id: string, payload: any) {
		// Kiểm tra quyền truy cập
		const canAccess = await repo.canUserAccessChatRoom(actor._id, chat_room_id);
		if (!canAccess) {
			throw new Error('Không có quyền truy cập chat room này');
		}

		// Kiểm tra trạng thái request để quyết định có cho phép chat không
		const chatRoom = await repo.findChatRoomById(chat_room_id);
		if (chatRoom && chatRoom.request) {
			const requestStatus = chatRoom.request.status;
			const allowedStatuses = ['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'EXPORTED'];
			
			if (!allowedStatuses.includes(requestStatus)) {
				throw new Error('Chỉ có thể chat khi đơn hàng đã được chấp nhận');
			}
		}

		const message = await repo.createMessage({
			chat_room_id,
			sender_id: actor._id,
			message: payload.message,
			type: payload.type || 'text',
			file_url: payload.file_url,
			file_name: payload.file_name,
			file_size: payload.file_size
		});

		// Cập nhật updatedAt của chat room
		await repo.updateChatRoom(chat_room_id, { updatedAt: new Date() });

		await audit(actor._id, 'CHAT_MESSAGE.SENT', 'CHAT_MESSAGE', message.id);
		return message;
	}

	async listMessages(actor: any, chat_room_id: string, query: any) {
		// Kiểm tra quyền truy cập
		const canAccess = await repo.canUserAccessChatRoom(actor._id, chat_room_id);
		if (!canAccess) {
			throw new Error('Không có quyền truy cập chat room này');
		}

		const page = Math.max(1, Number(query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
		const skip = (page - 1) * limit;

		const [messages, total] = await Promise.all([
			repo.listMessages(chat_room_id, skip, limit),
			repo.countMessages(chat_room_id)
		]);

		return {
			data: messages.reverse(), // Đảo ngược để hiển thị theo thứ tự thời gian
			total,
			page,
			totalPages: Math.ceil(total / limit)
		};
	}

	async getUserChatRooms(actor: any, query: any) {
		const page = Math.max(1, Number(query.page) || 1);
		const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
		const skip = (page - 1) * limit;

		const [chatRooms, total] = await Promise.all([
			repo.getUserChatRooms(actor._id, skip, limit),
			repo.countUserChatRooms(actor._id)
		]);

		return {
			data: chatRooms,
			total,
			page,
			totalPages: Math.ceil(total / limit)
		};
	}

	async sendSystemMessage(chat_room_id: string, message: string) {
		const systemMessage = await repo.createMessage({
			chat_room_id,
			sender_id: 'system', // System user ID
			message,
			type: 'system'
		});

		// Cập nhật updatedAt của chat room
		await repo.updateChatRoom(chat_room_id, { updatedAt: new Date() });

		return systemMessage;
	}

	// Method để gửi system message mà không cần kiểm tra trạng thái
	async sendSystemMessageUnrestricted(chat_room_id: string, message: string) {
		const systemMessage = await repo.createMessage({
			chat_room_id,
			sender_id: 'system',
			message,
			type: 'system'
		});

		// Cập nhật updatedAt của chat room
		await repo.updateChatRoom(chat_room_id, { updatedAt: new Date() });

		return systemMessage;
	}

	// Helper method để kiểm tra quyền truy cập
	private canUserAccessChatRoom(actor: any, chatRoom: any): boolean {
		// SystemAdmin có quyền truy cập tất cả
		if (actor.role === 'SystemAdmin') return true;

		// Depot staff có quyền truy cập
		if (['SaleAdmin', 'Accountant'].includes(actor.role)) {
			return true;
		}

		// Kiểm tra tenant access cho Customer
		if (['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
			return chatRoom.request && chatRoom.request.tenant_id === actor.tenant_id;
		}

		// Kiểm tra user có trong participants không (fallback)
		try {
			const participants = Array.isArray(chatRoom.participants) 
				? chatRoom.participants 
				: JSON.parse(chatRoom.participants as string);
			
			if (participants.includes(actor._id)) return true;
		} catch (error) {
			console.error('Error parsing participants:', error);
		}

		return false;
	}
}

export default new ChatService();
