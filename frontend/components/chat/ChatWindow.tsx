import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@services/api';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatMessage {
  id: string;
  message: string;
  type: 'text' | 'system';
  sender?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

interface ChatWindowProps {
  requestId: string;
  requestStatus?: string;
  rejectedReason?: string;
  requestType?: string;
  containerNo?: string;
  appointmentTime?: string;
  appointmentLocation?: string;
  appointmentNote?: string;
  onClose: () => void;
  onMinimize: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onStatusChange?: (status: string) => void;
}

export default function ChatWindow({
  requestId,
  requestStatus = 'PENDING',
  rejectedReason,
  requestType,
  containerNo,
  appointmentTime,
  appointmentLocation,
  appointmentNote,
  onClose,
  onMinimize,
  onMouseDown,
  onStatusChange
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [currentRequestStatus, setCurrentRequestStatus] = useState(requestStatus);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if chat is allowed based on request status (match backend logic)
  const isChatAllowed = currentRequestStatus === 'SCHEDULED' || 
                       currentRequestStatus === 'APPROVED' || 
                       currentRequestStatus === 'IN_PROGRESS' || 
                       currentRequestStatus === 'COMPLETED' || 
                       currentRequestStatus === 'EXPORTED' ||
                       currentRequestStatus === 'PENDING_ACCEPT'; // Thêm PENDING_ACCEPT
  const isRejected = currentRequestStatus === 'REJECTED';
  const isReceived = currentRequestStatus === 'RECEIVED';

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
      'RECEIVED': '✅ Đơn hàng đã được tiếp nhận. Chat sẽ khả dụng khi được chấp nhận (APPROVED).',
      'SCHEDULED': '📅 Đơn hàng đã được lên lịch hẹn',
      'PENDING_ACCEPT': '📧 Đơn hàng đã được gửi xác nhận - Chat đã được kích hoạt', // Thêm PENDING_ACCEPT
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

  // Get appointment message
  const getAppointmentMessage = () => {
    if (!appointmentTime) return '';
    
    const formattedTime = new Date(appointmentTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let message = `📅 Lịch hẹn: ${formattedTime}`;
    
    if (appointmentLocation) {
      message += ` tại ${appointmentLocation}`;
    }
    
    if (appointmentNote) {
      message += `\n📝 Ghi chú: ${appointmentNote}`;
    }
    
    return message;
  };

  // Get real appointment message from API data
  const getRealAppointmentMessage = (time?: string, location?: string, note?: string) => {
    if (!time) return '';
    
    const formattedTime = new Date(time).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let message = `📅 Lịch hẹn: ${formattedTime}`;
    
    if (location) {
      message += ` tại ${location}`;
    }
    
    if (note) {
      message += `\n📝 Ghi chú: ${note}`;
    }
    
    return message;
  };

  // Load messages from server
  const loadMessages = useCallback(async () => {
    if (!chatRoomId) return;

    try {
      const response = await api.get(`/chat/${chatRoomId}/messages`);
      const newMessages = response.data.data || [];
      
      if (newMessages.length !== lastMessageCount) {
        setMessages(newMessages);
        setLastMessageCount(newMessages.length);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [chatRoomId, lastMessageCount]);

  // Initialize chat room
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        
        // Cho trạng thái PENDING_ACCEPT, load từ localStorage
        if (currentRequestStatus === 'PENDING_ACCEPT') {
          const storageKey = `chat_messages_${requestId}`;
          const savedMessages = localStorage.getItem(storageKey);
          
          if (savedMessages) {
            try {
              const parsedMessages = JSON.parse(savedMessages);
              setMessages(parsedMessages);
              console.log('Loaded messages from localStorage for PENDING_ACCEPT:', parsedMessages);
              setLoading(false);
              return;
            } catch (error) {
              console.error('Error parsing saved messages:', error);
              localStorage.removeItem(storageKey);
            }
          }
          
          // Nếu không có tin nhắn đã lưu, tạo welcome message
          const welcomeMessage: ChatMessage = {
            id: 'welcome-pending-accept-' + Date.now(),
            message: `📧 **XÁC NHẬN ĐÃ GỬI:** Đơn hàng đã được gửi xác nhận cho khách hàng!\n\n📦 Container: ${containerNo || 'N/A'}\n📋 Trạng thái: Chờ chấp nhận\n\nBây giờ bạn có thể chat trực tiếp với nhân viên kho để trao đổi thông tin chi tiết.`,
            type: 'system',
            createdAt: new Date().toISOString()
          };
          
          setMessages([welcomeMessage]);
          localStorage.setItem(storageKey, JSON.stringify([welcomeMessage]));
          setLoading(false);
          return;
        }
        
        // Get or create chat room
        const chatRoomResponse = await api.get(`/chat/request/${requestId}`);
        setChatRoomId(chatRoomResponse.data.id);
        
        // Load initial messages
        const messagesResponse = await api.get(`/chat/${chatRoomResponse.data.id}/messages`);
        const initialMessages = messagesResponse.data.data || [];
        
        // Try to get real appointment data from API
        let realAppointmentTime = appointmentTime;
        let realAppointmentLocation = appointmentLocation;
        let realAppointmentNote = appointmentNote;
        
        try {
          const appointmentResponse = await api.get(`/requests/${requestId}/appointment`);
          if (appointmentResponse.data?.data) {
            const appt = appointmentResponse.data.data;
            realAppointmentTime = appt.appointment_time;
            realAppointmentLocation = `${appt.location_type} ${appt.location_id}`;
            realAppointmentNote = appt.note;
            console.log('Fetched real appointment data:', appt);
          }
        } catch (error) {
          console.log('No appointment data from API, using props or demo data');
        }
        
        // Add status message as first message
        const statusMessage: ChatMessage = {
          id: 'status-' + Date.now(),
          message: getStatusMessage(currentRequestStatus),
          type: 'system',
          createdAt: new Date().toISOString()
        };
        
        // Add appointment message if exists
        const messages = [statusMessage];
        
        // Debug: Log appointment data
        console.log('Appointment data in ChatWindow:', {
          realAppointmentTime,
          realAppointmentLocation,
          realAppointmentNote,
          currentRequestStatus,
          shouldShowAppointment: realAppointmentTime && (currentRequestStatus === 'RECEIVED' || currentRequestStatus === 'APPROVED')
        });
        
        if (realAppointmentTime && (currentRequestStatus === 'RECEIVED' || currentRequestStatus === 'APPROVED' || currentRequestStatus === 'SCHEDULED')) {
          const appointmentMessage: ChatMessage = {
            id: 'appointment-' + Date.now(),
            message: getRealAppointmentMessage(realAppointmentTime, realAppointmentLocation, realAppointmentNote),
            type: 'system',
            createdAt: new Date().toISOString()
          };
          console.log('Created appointment message:', appointmentMessage.message);
          messages.push(appointmentMessage);
        }
        

        
        setMessages([...messages, ...initialMessages]);
        setLastMessageCount(initialMessages.length);
        
      } catch (error) {
        console.error('Error initializing chat:', error);
        // Add fallback message
        const fallbackMessage: ChatMessage = {
          id: 'fallback-' + Date.now(),
          message: 'Chào bạn! Tôi là hệ thống hỗ trợ chat. Có thể giúp gì cho bạn?',
          type: 'system',
          createdAt: new Date().toISOString()
        };
        setMessages([fallbackMessage]);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [requestId, currentRequestStatus, rejectedReason]);

  // Polling for new messages
  useEffect(() => {
    // Không poll cho trạng thái PENDING_ACCEPT
    if (chatRoomId && isChatAllowed && currentRequestStatus !== 'PENDING_ACCEPT') {
      pollingIntervalRef.current = setInterval(() => {
        loadMessages();
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [chatRoomId, isChatAllowed, currentRequestStatus, loadMessages]);

  // Poll localStorage cho trạng thái PENDING_ACCEPT để đồng bộ tin nhắn
  useEffect(() => {
    if (currentRequestStatus !== 'PENDING_ACCEPT') return;

    const pollLocalStorage = () => {
      const storageKey = `chat_messages_${requestId}`;
      const savedMessages = localStorage.getItem(storageKey);
      
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          // Chỉ cập nhật nếu có tin nhắn mới
          if (parsedMessages.length !== messages.length) {
            setMessages(parsedMessages);
            console.log('Synced messages from localStorage:', parsedMessages);
          }
        } catch (error) {
          console.error('Error parsing saved messages during polling:', error);
        }
      }
    };

    const interval = setInterval(pollLocalStorage, 1000); // Poll every 1 second for real-time sync
    return () => clearInterval(interval);
  }, [requestId, currentRequestStatus, messages.length]);

  // Update status when prop changes
  useEffect(() => {
    setCurrentRequestStatus(requestStatus);
  }, [requestStatus]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || !isChatAllowed) return;

    // Cho trạng thái PENDING_ACCEPT, luôn sử dụng local message (offline mode)
    if (currentRequestStatus === 'PENDING_ACCEPT') {
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        message: message.trim(),
        type: 'text',
        sender: {
          id: 'current-user',
          full_name: 'Bạn',
          email: '',
          role: 'user'
        },
        createdAt: new Date().toISOString()
      };
      
      // Cập nhật state và lưu vào localStorage
      setMessages(prev => {
        const updatedMessages = [...prev, newMsg];
        const storageKey = `chat_messages_${requestId}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
        return updatedMessages;
      });
      
      return;
    }

    // Cho các trạng thái khác, gọi API
    if (!chatRoomId) return;

    try {
      // Send message to backend
      const response = await api.post(`/chat/${chatRoomId}/messages`, {
        message: message.trim(),
        type: 'text',
        requestId: requestId
      });
      
      // Add message to local state for immediate feedback
      const newMsg: ChatMessage = {
        id: response.data.id || Date.now().toString(),
        message: message.trim(),
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
      
      // Trigger immediate refresh to get server response
      setTimeout(() => {
        loadMessages();
      }, 500);
    } catch (error: any) {
      console.error('Error sending message:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Không thể gửi tin nhắn. Vui lòng thử lại.';
      
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        message: `Lỗi: ${errorMessage}`,
        type: 'system',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  if (loading) {
    return (
      <div className="chat-window-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Đang tải chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <ChatHeader
        title="Hỗ trợ Chat"
        subtitle={containerNo ? `Container: ${containerNo}` : undefined}
        onClose={onClose}
        onMinimize={onMinimize}
        onMouseDown={onMouseDown}
      />
      
      <div className="chat-messages">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={sendMessage}
        disabled={!isChatAllowed}
        placeholder={
          isRejected 
            ? "Chat không khả dụng cho đơn hàng bị từ chối" 
            : isReceived
              ? "Chat sẽ khả dụng khi đơn hàng được chấp nhận (APPROVED)"
              : !isChatAllowed 
                ? "Chat chỉ khả dụng khi đơn hàng được chấp nhận"
                : "Nhập tin nhắn..."
        }
      />
    </div>
  );
}
