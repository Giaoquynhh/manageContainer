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

interface ChatMessageProps {
  message: ChatMessage;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  // Determine if message is from current user based on role or sender info
  const isOwn = message.sender?.role === 'Customer' || message.type === 'user';
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // System message
  if (message.type === 'system') {
    return (
      <div className="chat-message-wrapper chat-message-system">
        <div className="chat-message chat-message-system-content">
          <div className="chat-message-text">{message.message}</div>
          <div className="chat-message-time">{formatTime(message.createdAt)}</div>
        </div>
      </div>
    );
  }

  // User/Agent message
  return (
    <div className={`chat-message-wrapper ${isOwn ? 'chat-message-own' : 'chat-message-other'}`}>
      <div className="chat-message">
        {!isOwn && message.sender && (
          <div className="chat-message-sender">
            <div className="chat-message-avatar">
              <span>{message.sender.full_name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="chat-message-sender-info">
              <div className="chat-message-sender-name">{message.sender.full_name}</div>
              <div className="chat-message-sender-role">{message.sender.role}</div>
            </div>
          </div>
        )}
        
        <div className={`chat-message-bubble ${isOwn ? 'chat-message-bubble-own' : 'chat-message-bubble-other'}`}>
          <div className="chat-message-text">{message.message}</div>
          <div className="chat-message-time">{formatTime(message.createdAt)}</div>
        </div>
      </div>
    </div>
  );
}
