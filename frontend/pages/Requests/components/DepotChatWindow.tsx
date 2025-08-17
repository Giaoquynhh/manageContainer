import React, { useState, useEffect, useRef } from 'react';
import { api } from '@services/api';

interface ChatMessage {
	id: string;
	message: string;
	sender: {
		id: string;
		full_name: string;
		email: string;
		role: string;
	};
	createdAt: string;
}

interface DepotChatWindowProps {
	requestId: string;
	containerNo: string;
	requestType: string;
	requestStatus: string;
	onClose: () => void;
	onMinimize: () => void;
	onMouseDown: (e: React.MouseEvent) => void;
	// Thêm props để theo dõi thay đổi thông tin
	hasSupplementDocuments?: boolean;
	lastSupplementUpdate?: string;
}

export default function DepotChatWindow({
	requestId,
	containerNo,
	requestType,
	requestStatus,
	onClose,
	onMinimize,
	onMouseDown,
	hasSupplementDocuments = false,
	lastSupplementUpdate
}: DepotChatWindowProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [chatRoomId, setChatRoomId] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [me, setMe] = useState<any>(null);

	// Check if chat is allowed based on request status (allow SCHEDULED for demo)
	const isChatAllowed = requestStatus === 'SCHEDULED' || 
						 requestStatus === 'APPROVED' || 
						 requestStatus === 'IN_PROGRESS' || 
						 requestStatus === 'COMPLETED' || 
						 requestStatus === 'EXPORTED';

	// Load user info
	useEffect(() => {
		api.get('/auth/me').then(r => setMe(r.data)).catch(() => {});
	}, []);

	// Auto scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Load chat room and messages
	useEffect(() => {
		if (!requestId || !isChatAllowed) return;

		const loadChatRoom = async () => {
			setLoading(true);
			try {
				// Get or create chat room for this request
				const response = await api.get(`/chat/request/${requestId}`);
				setChatRoomId(response.data.id);
				
				// Load messages
				const messagesResponse = await api.get(`/chat/${response.data.id}/messages`);
				setMessages(messagesResponse.data.data || messagesResponse.data); // Handle both response formats
			} catch (error) {
				console.error('Error loading chat room:', error);
				// Fallback to demo messages if backend fails
				setMessages([
					{
						id: '1',
						message: 'Xin chào! Tôi cần hỗ trợ về container này.',
						sender: {
							id: 'customer1',
							full_name: 'Khách hàng ABC',
							email: 'customer@example.com',
							role: 'Customer'
						},
						createdAt: new Date(Date.now() - 300000).toISOString()
					},
					{
						id: '2',
						message: 'Chào bạn! Tôi sẽ hỗ trợ bạn ngay.',
						sender: {
							id: me?.id || 'depot1',
							full_name: me?.full_name || 'Nhân viên Kho',
							email: me?.email || 'depot@example.com',
							role: me?.role || 'Depot Staff'
						},
						createdAt: new Date(Date.now() - 180000).toISOString()
					}
				]);
			} finally {
				setLoading(false);
			}
		};

		loadChatRoom();
	}, [requestId, isChatAllowed, me]);

	// Thêm thông báo khi khách hàng bổ sung thông tin
	useEffect(() => {
		// Debug log để kiểm tra
		console.log('Supplement check:', { hasSupplementDocuments, lastSupplementUpdate, isChatAllowed, containerNo });
		
		if (hasSupplementDocuments && lastSupplementUpdate && isChatAllowed) {
			console.log('Creating supplement notification...');
			
			const supplementMessage: ChatMessage = {
				id: `supplement-${Date.now()}`,
				message: `📋 **THÔNG BÁO:** Khách hàng đã bổ sung thông tin cho đơn hàng!\n\n📅 Thời gian cập nhật: ${new Date(lastSupplementUpdate).toLocaleString('vi-VN')}\n📦 Container: ${containerNo}\n\nVui lòng kiểm tra và xử lý thông tin mới.`,
				sender: {
					id: 'system',
					full_name: 'Hệ thống',
					email: 'system@depot.com',
					role: 'System'
				},
				createdAt: new Date().toISOString()
			};

			// Thêm message vào đầu danh sách để hiển thị ở trên cùng
			setMessages(prev => [supplementMessage, ...prev]);
		}
	}, [hasSupplementDocuments, lastSupplementUpdate, isChatAllowed, containerNo]);

	// Tự động tạo supplement notification khi mở chat lần đầu
	useEffect(() => {
		// Chỉ tạo notification khi thực sự có supplement documents
		if (isChatAllowed && hasSupplementDocuments && lastSupplementUpdate && messages.length === 0) {
			console.log('Auto-creating supplement notification on first chat open...');
			
			const autoSupplementMessage: ChatMessage = {
				id: `auto-supplement-${Date.now()}`,
				message: `📋 **THÔNG BÁO:** Khách hàng đã bổ sung thông tin cho đơn hàng!\n\n📅 Thời gian cập nhật: ${new Date(lastSupplementUpdate).toLocaleString('vi-VN')}\n📦 Container: ${containerNo}\n\nVui lòng kiểm tra và xử lý thông tin mới.`,
				sender: {
					id: 'system',
					full_name: 'Hệ thống',
					email: 'system@depot.com',
					role: 'System'
				},
				createdAt: new Date().toISOString()
			};

			// Thêm message vào đầu danh sách
			setMessages([autoSupplementMessage]);
		}
	}, [isChatAllowed, hasSupplementDocuments, lastSupplementUpdate, containerNo, messages.length]);

	// Poll for new messages
	useEffect(() => {
		if (!chatRoomId) return;

		const pollMessages = async () => {
			try {
				const response = await api.get(`/chat/${chatRoomId}/messages`);
				setMessages(response.data.data || response.data); // Handle both response formats
			} catch (error) {
				console.error('Error polling messages:', error);
			}
		};

		const interval = setInterval(pollMessages, 3000); // Poll every 3 seconds
		return () => clearInterval(interval);
	}, [chatRoomId]);

	const sendMessage = async () => {
		if (!newMessage.trim() || !chatRoomId || !me) return;

		setSending(true);
		try {
			const response = await api.post(`/chat/${chatRoomId}/messages`, {
				message: newMessage.trim()
			});

			// Add new message to local state
			setMessages(prev => [...prev, response.data]);
			setNewMessage('');
		} catch (error) {
			console.error('Error sending message:', error);
			// Fallback to local message if backend fails
			const newMsg: ChatMessage = {
				id: Date.now().toString(),
				message: newMessage.trim(),
				sender: {
					id: me?.id || 'depot1',
					full_name: me?.full_name || 'Nhân viên Kho',
					email: me?.email || 'depot@example.com',
					role: me?.role || 'Depot Staff'
				},
				createdAt: new Date().toISOString()
			};
			setMessages(prev => [...prev, newMsg]);
			setNewMessage('');
		} finally {
			setSending(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const getStatusMessage = () => {
		const statusMessages: Record<string, string> = {
			'SCHEDULED': '📅 Đơn hàng đã được lên lịch hẹn - Chat đã được kích hoạt',
			'APPROVED': '✅ Đơn hàng đã được chấp nhận - Chat đã được kích hoạt',
			'IN_PROGRESS': '🔄 Đơn hàng đang được xử lý tại kho - Chat đã được kích hoạt',
			'COMPLETED': '✅ Đơn hàng đã hoàn tất - Chat vẫn hoạt động',
			'EXPORTED': '📦 Đơn hàng đã xuất kho - Chat vẫn hoạt động',
			'PENDING': '📋 Đơn hàng đang chờ xử lý - Chat sẽ được kích hoạt khi đơn hàng được lên lịch',
			'RECEIVED': '📥 Đơn hàng đã được tiếp nhận - Chat sẽ được kích hoạt khi được chấp nhận',
			'REJECTED': '❌ Đơn hàng bị từ chối - Chat không khả dụng'
		};
		return statusMessages[requestStatus] || `🔄 Trạng thái đơn hàng: ${requestStatus}`;
	};

	if (!isChatAllowed) {
		return (
			<div 
				className="depot-chat-window"
				onMouseDown={onMouseDown}
			>
				<div className="chat-header">
					<div className="chat-title">
						💬 Chat - {containerNo}
					</div>
					<div className="chat-actions">
						<button onClick={onMinimize} className="chat-btn chat-minimize">−</button>
						<button onClick={onClose} className="chat-btn chat-close">×</button>
					</div>
				</div>
				<div className="chat-body">
					<div className="chat-status-message">
						{getStatusMessage()}
					</div>
					<div className="chat-info">
						<p><strong>Container:</strong> {containerNo}</p>
						<p><strong>Loại:</strong> {requestType === 'IMPORT' ? 'Nhập' : requestType === 'EXPORT' ? 'Xuất' : 'Chuyển đổi'}</p>
						<p><strong>Trạng thái:</strong> {requestStatus}</p>
						<p><strong>Lưu ý:</strong> Chat khả dụng khi đơn hàng ở trạng thái SCHEDULED trở lên</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div 
			className="depot-chat-window"
			onMouseDown={onMouseDown}
		>
			<div className="chat-header">
				<div className="chat-title">
					💬 Chat - {containerNo}
				</div>
				<div className="chat-actions">
					<button onClick={onMinimize} className="chat-btn chat-minimize">−</button>
					<button onClick={onClose} className="chat-btn chat-close">×</button>
				</div>
			</div>
			
			<div className="chat-body">
				{loading ? (
					<div className="chat-loading">
						<div className="loading-spinner"></div>
						<p>Đang tải tin nhắn...</p>
					</div>
				) : (
					<>
						<div className="chat-status-message">
							{getStatusMessage()}
							
							{/* Test button để demo supplement notification */}
							{process.env.NODE_ENV === 'development' && (
								<div style={{ marginTop: '8px' }}>
									<button
										onClick={() => {
											const testMessage: ChatMessage = {
												id: `test-supplement-${Date.now()}`,
												message: `📋 **THÔNG BÁO:** Khách hàng đã bổ sung thông tin cho đơn hàng!\n\n📅 Thời gian cập nhật: ${new Date().toLocaleString('vi-VN')}\n📦 Container: ${containerNo}\n\nVui lòng kiểm tra và xử lý thông tin mới.`,
												sender: {
													id: 'system',
													full_name: 'Hệ thống',
													email: 'system@depot.com',
													role: 'System'
												},
												createdAt: new Date().toISOString()
											};
											setMessages(prev => [testMessage, ...prev]);
										}}
										style={{
											background: '#f59e0b',
											color: 'white',
											border: 'none',
											padding: '4px 8px',
											borderRadius: '4px',
											fontSize: '11px',
											cursor: 'pointer'
										}}
									>
										🧪 Test Supplement Notification
									</button>
								</div>
							)}
						</div>
						
						<div className="chat-messages">
							{messages.length === 0 ? (
								<div className="chat-empty">
									<p>Chưa có tin nhắn nào</p>
									<small>Bắt đầu cuộc trò chuyện với khách hàng</small>
								</div>
							) : (
								messages.map((message) => (
									<div 
										key={message.id} 
										className={`chat-message ${
											message.sender.id === 'system' 
												? 'chat-message-system' 
												: message.sender.id === me?.id 
													? 'chat-message-own' 
													: 'chat-message-other'
										}`}
									>
										<div className="chat-message-header">
											<span className="chat-message-sender">
												{message.sender.id === 'system' ? '🔔 ' : ''}
												{message.sender.full_name} ({message.sender.role})
											</span>
											<span className="chat-message-time">
												{new Date(message.createdAt).toLocaleString('vi-VN')}
											</span>
										</div>
										<div className="chat-message-content">
											{message.message}
										</div>
									</div>
								))
							)}
							<div ref={messagesEndRef} />
						</div>
						
						<div className="chat-input-area">
							<div className="chat-input-wrapper">
								<textarea
									className="chat-input"
									placeholder="Nhập tin nhắn..."
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onKeyPress={handleKeyPress}
									disabled={sending}
									rows={2}
								/>
								<button
									className="chat-send-btn"
									onClick={sendMessage}
									disabled={!newMessage.trim() || sending}
								>
									{sending ? '⏳' : '📤'}
								</button>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
