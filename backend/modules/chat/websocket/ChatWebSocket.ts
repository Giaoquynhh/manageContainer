import { Server as SocketIOServer } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { appConfig } from '../../../shared/config/database';

export class ChatWebSocket {
	private io: SocketIOServer;
	private connectedUsers = new Map<string, any>();

	constructor(server: any) {
		this.io = new SocketIOServer(server, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"]
			}
		});

		this.setupMiddleware();
		this.setupEventHandlers();
	}

	private setupMiddleware() {
		this.io.use((socket, next) => {
			const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
			
			if (!token) {
				return next(new Error('Token không tồn tại'));
			}

			try {
				const decoded = verify(token, appConfig.jwtSecret) as any;
				socket.handshake.auth.userId = decoded._id;
				socket.handshake.auth.role = decoded.role;
				socket.handshake.auth.tenant_id = decoded.tenant_id;
				next();
			} catch (err) {
				next(new Error('Token không hợp lệ'));
			}
		});
	}

	private setupEventHandlers() {
		this.io.on('connection', (socket) => {
			const userId = socket.handshake.auth.userId;
			if (userId) {
				this.connectedUsers.set(userId, socket);
				console.log(`User ${userId} connected to chat`);
			}

			socket.on('join_chat_room', (payload: { chat_room_id: string }) => {
				socket.join(`chat_room_${payload.chat_room_id}`);
				console.log(`User joined chat room: ${payload.chat_room_id}`);
			});

			socket.on('leave_chat_room', (payload: { chat_room_id: string }) => {
				socket.leave(`chat_room_${payload.chat_room_id}`);
				console.log(`User left chat room: ${payload.chat_room_id}`);
			});

			socket.on('send_message', (payload: { 
				chat_room_id: string; 
				message: string; 
				type?: string;
				file_url?: string;
				file_name?: string;
				file_size?: number;
			}) => {
				// Broadcast message to all users in the chat room
				this.io.to(`chat_room_${payload.chat_room_id}`).emit('new_message', {
					chat_room_id: payload.chat_room_id,
					message: payload.message,
					type: payload.type || 'text',
					file_url: payload.file_url,
					file_name: payload.file_name,
					file_size: payload.file_size,
					sender_id: socket.handshake.auth.userId,
					timestamp: new Date().toISOString()
				});
			});

			socket.on('disconnect', () => {
				if (userId) {
					this.connectedUsers.delete(userId);
					console.log(`User ${userId} disconnected from chat`);
				}
			});
		});
	}

	// Method để gửi system message
	sendSystemMessage(chat_room_id: string, message: string) {
		this.io.to(`chat_room_${chat_room_id}`).emit('system_message', {
			chat_room_id,
			message,
			type: 'system',
			timestamp: new Date().toISOString()
		});
	}

	// Method để gửi notification cho user cụ thể
	sendNotificationToUser(userId: string, notification: any) {
		const userSocket = this.connectedUsers.get(userId);
		if (userSocket) {
			userSocket.emit('notification', notification);
		}
	}

	// Method để broadcast cho tất cả users trong chat room
	broadcastToChatRoom(chat_room_id: string, event: string, data: any) {
		this.io.to(`chat_room_${chat_room_id}`).emit(event, data);
	}

	getIO() {
		return this.io;
	}
}
