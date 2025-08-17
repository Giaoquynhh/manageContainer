import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
	id: string;
	message: string;
	sender: {
		id: string;
		full_name: string;
		role: string;
	};
	createdAt: string;
}

interface DepotChatDemoProps {
	requestId: string;
	containerNo: string;
	requestType: string;
	requestStatus: string;
	onClose: () => void;
	onMinimize: () => void;
	onMouseDown: (e: React.MouseEvent) => void;
}

export default function DepotChatDemo({
	requestId,
	containerNo,
	requestType,
	requestStatus,
	onClose,
	onMinimize,
	onMouseDown
}: DepotChatDemoProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [sending, setSending] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Check if chat is allowed based on request status (allow SCHEDULED for demo)
	const isChatAllowed = requestStatus === 'SCHEDULED' || 
						 requestStatus === 'APPROVED' || 
						 requestStatus === 'IN_PROGRESS' || 
						 requestStatus === 'COMPLETED' || 
						 requestStatus === 'EXPORTED';

	// Auto scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Load demo messages when component mounts
	useEffect(() => {
		if (isChatAllowed) {
			setMessages([
				{
					id: '1',
					message: 'Xin chào! Tôi cần hỗ trợ về container này.',
					sender: {
						id: 'customer1',
						full_name: 'Khách hàng ABC',
						role: 'Customer'
					},
					createdAt: new Date(Date.now() - 300000).toISOString()
				},
				{
					id: '2',
					message: 'Chào bạn! Tôi sẽ hỗ trợ bạn ngay. Container này đang được xử lý.',
					sender: {
						id: 'depot1',
						full_name: 'Nhân viên Kho',
						role: 'Depot Staff'
					},
					createdAt: new Date(Date.now() - 180000).toISOString()
				}
			]);
		}
	}, [isChatAllowed]);

	const sendMessage = () => {
		if (!newMessage.trim()) return;

		setSending(true);
		
		// Simulate API delay
		setTimeout(() => {
			const newMsg: ChatMessage = {
				id: Date.now().toString(),
				message: newMessage.trim(),
				sender: {
					id: 'depot1',
					full_name: 'Nhân viên Kho',
					role: 'Depot Staff'
				},
				createdAt: new Date().toISOString()
			};
			
			setMessages(prev => [...prev, newMsg]);
			setNewMessage('');
			setSending(false);
		}, 500);
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
						<p><strong>Demo:</strong> Đây là phiên bản demo, không cần backend</p>
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
					💬 Chat - {containerNo} (Demo)
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
								className={`chat-message ${message.sender.id === 'depot1' ? 'chat-message-own' : 'chat-message-other'}`}
							>
								<div className="chat-message-header">
									<span className="chat-message-sender">
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
							placeholder="Nhập tin nhắn... (Demo mode)"
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
					<div style={{ fontSize: '11px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
						💡 Demo mode - Tin nhắn chỉ được lưu tạm thời
					</div>
				</div>
			</div>
		</div>
	);
}
