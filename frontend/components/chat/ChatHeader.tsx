interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onMinimize: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export default function ChatHeader({
  title,
  subtitle,
  onClose,
  onMinimize,
  onMouseDown
}: ChatHeaderProps) {
  return (
    <div className="chat-header" onMouseDown={onMouseDown}>
      <div className="chat-header-content">
        <div className="chat-header-info">
          <div className="chat-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="chat-header-text">
            <h3 className="chat-header-title">{title}</h3>
            {subtitle && <p className="chat-header-subtitle">{subtitle}</p>}
          </div>
        </div>
        
        <div className="chat-header-actions">
          <button
            className="chat-header-btn chat-minimize-btn"
            onClick={onMinimize}
            title="Thu nhỏ"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          
          <button
            className="chat-header-btn chat-close-btn"
            onClick={onClose}
            title="Đóng chat"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}





