import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@services/api';

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

interface SimpleChatBoxProps {
	requestId: string;
	requestStatus?: string;
	rejectedReason?: string;
	requestType?: string;
	containerNo?: string;
	onClose: () => void;
	onStatusChange?: (newStatus: string) => void; // Callback để thông báo khi trạng thái thay đổi
}

export default function SimpleChatBox({ requestId, requestStatus, rejectedReason, requestType, containerNo, onClose, onStatusChange }: SimpleChatBoxProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [loading, setLoading] = useState(false);
	const [chatRoomId, setChatRoomId] = useState<string | null>(null);
	const [currentRequestStatus, setCurrentRequestStatus] = useState(requestStatus);
	const [lastMessageCount, setLastMessageCount] = useState(0);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Check if chat is allowed based on request status
	const isChatAllowed = currentRequestStatus === 'RECEIVED' || currentRequestStatus === 'IN_PROGRESS' || currentRequestStatus === 'COMPLETED' || currentRequestStatus === 'EXPORTED';
	const isRejected = currentRequestStatus === 'REJECTED';

	// Auto scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Get status message based on request status
	const getStatusMessage = (status: string) => {
		const statusMessages: Record<string, string> = {
			'PENDING': '📋 Đơn hàng đã được tạo và đang chờ xử lý',
			'RECEIVED': '✅ Đơn hàng đã được tiếp nhận và đang xử lý',
			'IN_PROGRESS': '🔄 Đơn hàng đang được xử lý tại kho',
			'COMPLETED': '✅ Đơn hàng đã hoàn tất',
			'EXPORTED': '📦 Đơn hàng đã xuất kho',
			'REJECTED': `❌ Đơn hàng bị từ chối${rejectedReason ? `: ${rejectedReason}` : ''}`,
			'CANCELLED': '❌ Đơn hàng đã bị hủy',
			'IN_YARD': '🏭 Container đã vào kho',
			'LEFT_YARD': '🚛 Container đã rời kho'
		};
		return statusMessages[status] || `🔄 Trạng thái đơn hàng: ${status}`;
	};

	// Load messages from server
	const loadMessages = useCallback(async () => {
		if (!chatRoomId) return;
		
		try {
			const messagesResponse = await api.get(`/chat/${chatRoomId}/messages`);
			const serverMessages = messagesResponse.data.data || [];
			
			// Check if we have new messages
			if (serverMessages.length !== lastMessageCount) {
				setMessages(serverMessages);
				
				// Check for status change messages in new messages
				if (serverMessages.length > lastMessageCount) {
					const latestMessages = serverMessages.slice(lastMessageCount);
					const statusMessages = latestMessages.filter((msg: ChatMessage) => 
						msg.type === 'system' && msg.message.includes('Đơn hàng')
					);
					
					if (statusMessages.length > 0) {
						// Extract status from the latest status message
						const latestStatusMessage = statusMessages[statusMessages.length - 1];
						if (latestStatusMessage.message.includes('tiếp nhận')) {
							setCurrentRequestStatus('RECEIVED');
							onStatusChange?.('RECEIVED');
						} else if (latestStatusMessage.message.includes('hoàn tất')) {
							setCurrentRequestStatus('COMPLETED');
							onStatusChange?.('COMPLETED');
						} else if (latestStatusMessage.message.includes('xuất kho')) {
							setCurrentRequestStatus('EXPORTED');
							onStatusChange?.('EXPORTED');
						} else if (latestStatusMessage.message.includes('từ chối')) {
							setCurrentRequestStatus('REJECTED');
							onStatusChange?.('REJECTED');
						} else if (latestStatusMessage.message.includes('vào kho')) {
							setCurrentRequestStatus('IN_YARD');
							onStatusChange?.('IN_YARD');
						} else if (latestStatusMessage.message.includes('rời kho')) {
							setCurrentRequestStatus('LEFT_YARD');
							onStatusChange?.('LEFT_YARD');
						}
					}
				}
				
				setLastMessageCount(serverMessages.length);
			}
		} catch (error) {
			console.error('Error loading messages:', error);
		}
	}, [chatRoomId, lastMessageCount, onStatusChange]);

	// Start polling for new messages
	const startPolling = useCallback(() => {
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
		}
		
		pollingIntervalRef.current = setInterval(() => {
			loadMessages();
		}, 3000); // Poll every 3 seconds
	}, [loadMessages]);

	// Stop polling
	const stopPolling = useCallback(() => {
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
	}, []);

	// Initialize chat room and load messages
	useEffect(() => {
		const initializeChat = async () => {
			try {
				setLoading(true);
				
				// Get or create chat room from backend
				const chatRoomResponse = await api.get(`/chat/request/${requestId}`);
				setChatRoomId(chatRoomResponse.data.id);
				
				// Load existing messages
				const messagesResponse = await api.get(`/chat/${chatRoomResponse.data.id}/messages`);
				let initialMessages = messagesResponse.data.data || [];
				
				setMessages(initialMessages);
				setLastMessageCount(initialMessages.length);
				
			} catch (error) {
				console.error('Error initializing chat:', error);
				const errorMessages: ChatMessage[] = [
					{
						id: '1',
						message: 'Không thể kết nối chat server. Vui lòng thử lại sau.',
						type: 'system' as const,
						createdAt: new Date().toISOString()
					}
				];
				
				setMessages(errorMessages);
				setLastMessageCount(errorMessages.length);
			} finally {
				setLoading(false);
			}
		};

		initializeChat();
	}, [requestId]);

	// Start polling when chat room is ready
	useEffect(() => {
		if (chatRoomId) {
			startPolling();
		}
		
		return () => {
			stopPolling();
		};
	}, [chatRoomId, startPolling, stopPolling]);

	// Update current status when prop changes
	useEffect(() => {
		setCurrentRequestStatus(requestStatus);
	}, [requestStatus]);

	const sendMessage = async () => {
		if (!newMessage.trim() || !chatRoomId || !isChatAllowed) return;

		try {
			// Send message to backend
			const response = await api.post(`/chat/${chatRoomId}/messages`, {
				message: newMessage,
				type: 'text'
			});
			
			// Add message to local state for immediate feedback
			const newMsg: ChatMessage = {
				id: response.data.id || Date.now().toString(),
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
			
			// Trigger immediate refresh to get server response
			setTimeout(() => {
				loadMessages();
			}, 500);
		} catch (error) {
			console.error('Error sending message:', error);
			// Show error message
			const errorMsg: ChatMessage = {
				id: Date.now().toString(),
				message: 'Không thể gửi tin nhắn. Vui lòng thử lại.',
				type: 'system',
				createdAt: new Date().toISOString()
			};
			setMessages(prev => [...prev, errorMsg]);
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
			return 'bg-gray-100 text-gray-700 p-3 rounded-lg mb-2 text-sm border-l-4 border-blue-500';
		}
		return 'bg-blue-500 text-white p-2 rounded-lg mb-2 max-w-xs ml-auto';
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
					<div>
						<h3 className="text-lg font-semibold">Chat - Request #{requestId}</h3>
						<p className="text-sm opacity-90">
							{requestType} - {containerNo} | Trạng thái: {currentRequestStatus}
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-white hover:text-gray-200 text-xl"
					>
						✕
					</button>
				</div>

				{/* Current Status Banner */}
				{currentRequestStatus && (
					<div className="bg-blue-50 border-b border-blue-200 p-3">
						<div className="flex items-center">
							<span className="mr-2">📋</span>
							<span className="text-blue-800 font-medium">
								{getStatusMessage(currentRequestStatus)}
							</span>
						</div>
					</div>
				)}

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-2">
					{messages.length === 0 ? (
						<div className="text-center text-gray-500 mt-8">
							<div className="text-4xl mb-2">💬</div>
							<p>Chưa có tin nhắn nào</p>
							<p className="text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
						</div>
					) : (
						messages.map((message) => (
							<div key={message.id} className="flex flex-col">
								<div className={getMessageStyle(message)}>
									{message.type === 'system' ? (
										<div className="flex items-center">
											<span className="mr-2">🔔</span>
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
						))
					)}
					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<div className="p-4 border-t">
					{!isChatAllowed && (
						<div className="mb-3 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
							<div className="flex items-center">
								<span className="mr-2">⚠️</span>
								<span className="text-yellow-800">
									{isRejected 
										? `Đơn hàng đã bị từ chối${rejectedReason ? `: ${rejectedReason}` : ''}. Không thể gửi tin nhắn.`
										: 'Chỉ có thể chat khi đơn hàng đã được chấp nhận.'
									}
								</span>
							</div>
						</div>
					)}
					<div className="flex space-x-2">
						<textarea
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder={isChatAllowed ? "Nhập tin nhắn..." : "Chat không khả dụng..."}
							className="flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
							rows={2}
							disabled={!isChatAllowed}
						/>
						<button
							onClick={sendMessage}
							disabled={!newMessage.trim() || !isChatAllowed}
							className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
						>
							Gửi
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}



