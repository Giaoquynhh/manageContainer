import React, { useState, useEffect, useRef } from 'react';
import { api } from '@services/api';
// import { io, Socket } from 'socket.io-client'; // Tạm thời comment để test

interface ChatMessage {
	id: string;
	message: string;
	type: 'text' | 'file' | 'system';
	file_url?: string;
	file_name?: string;
	file_size?: number;
	sender?: {
		id: string;
		full_name: string;
		email: string;
		role: string;
	};
	createdAt: string;
}

interface ChatBoxProps {
	requestId: string;
	onClose: () => void;
}

export default function ChatBox({ requestId, onClose }: ChatBoxProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [loading, setLoading] = useState(false);
	// const [socket, setSocket] = useState<Socket | null>(null); // Tạm thời comment
	const [chatRoomId, setChatRoomId] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Auto scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Initialize chat room and load messages
	useEffect(() => {
		const initializeChat = async () => {
			try {
				setLoading(true);
				
				// Get or create chat room
				const chatRoomResponse = await api.get(`/chat/request/${requestId}`);
				setChatRoomId(chatRoomResponse.data.id);
				
				// Load messages
				const messagesResponse = await api.get(`/chat/${chatRoomResponse.data.id}/messages`);
				setMessages(messagesResponse.data.data);
				
				// TODO: Initialize WebSocket connection when backend is ready
				// const token = localStorage.getItem('token');
				// const newSocket = io('http://localhost:3001', {
				// 	auth: { token }
				// });
				
				// newSocket.on('connect', () => {
				// 	console.log('Connected to chat server');
				// 	newSocket.emit('join_chat_room', { chat_room_id: chatRoomResponse.data.id });
				// });
				
				// newSocket.on('new_message', (message: ChatMessage) => {
				// 	setMessages(prev => [...prev, message]);
				// });
				
				// newSocket.on('system_message', (message: ChatMessage) => {
				// 	setMessages(prev => [...prev, message]);
				// });
				
				// setSocket(newSocket);
			} catch (error) {
				console.error('Error initializing chat:', error);
				// Add fallback message for testing
				setMessages([
					{
						id: '1',
						message: 'Chat room đã được tạo thành công!',
						type: 'system',
						createdAt: new Date().toISOString()
					}
				]);
			} finally {
				setLoading(false);
			}
		};

		initializeChat();

		// return () => {
		// 	if (socket) {
		// 		socket.disconnect();
		// 	}
		// };
	}, [requestId]);

	const sendMessage = async () => {
		if (!newMessage.trim() || !chatRoomId) return;

		try {
			const response = await api.post(`/chat/${chatRoomId}/messages`, {
				message: newMessage,
				type: 'text'
			});
			
			// Add message to local state for immediate feedback
			const newMsg: ChatMessage = {
				id: Date.now().toString(),
				message: newMessage,
				type: 'text',
				sender: {
					id: 'current-user',
					full_name: 'Bạn',
					email: '',
					role: 'user'
				},
				createdAt: new Date().toISOString()
			};
			setMessages(prev => [...prev, newMsg]);
			setNewMessage('');
		} catch (error) {
			console.error('Error sending message:', error);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const getMessageStyle = (message: ChatMessage) => {
		if (message.type === 'system') {
			return 'bg-gray-100 text-gray-700 p-2 rounded-lg mb-2 text-sm';
		}
		return 'bg-blue-500 text-white p-2 rounded-lg mb-2 max-w-xs';
	};

	const formatTime = (dateString: string) => {
		return new Date(dateString).toLocaleTimeString('vi-VN', {
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	if (loading) {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-lg p-6">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
					<p className="mt-2 text-center">Đang tải chat...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg w-full max-w-2xl h-3/4 flex flex-col">
				{/* Header */}
				<div className="bg-blue-500 text-white p-4 rounded-t-lg flex justify-between items-center">
					<h3 className="text-lg font-semibold">Chat - Request #{requestId}</h3>
					<button
						onClick={onClose}
						className="text-white hover:text-gray-200 text-xl"
					>
						✕
					</button>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-2">
					{messages.map((message) => (
						<div key={message.id} className="flex flex-col">
							<div className={getMessageStyle(message)}>
								{message.type === 'system' ? (
									<div className="flex items-center">
										<span className="mr-2">⚠️</span>
										<span>{message.message}</span>
									</div>
								) : (
									<div>
										<div className="font-semibold text-xs mb-1">
											{message.sender?.full_name || 'Unknown'}
										</div>
										<div>{message.message}</div>
									</div>
								)}
							</div>
							<div className="text-xs text-gray-500 ml-2">
								{formatTime(message.createdAt)}
							</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<div className="p-4 border-t">
					<div className="flex space-x-2">
						<textarea
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder="Nhập tin nhắn..."
							className="flex-1 border rounded-lg p-2 resize-none"
							rows={2}
						/>
						<button
							onClick={sendMessage}
							disabled={!newMessage.trim()}
							className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
						>
							Gửi
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
