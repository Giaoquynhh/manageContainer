import { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';

interface ChatMiniProps {
  requestId: string;
  requestStatus?: string;
  rejectedReason?: string;
  requestType?: string;
  containerNo?: string;
  onStatusChange?: (status: string) => void;
}

export default function ChatMini({
  requestId,
  requestStatus,
  rejectedReason,
  requestType,
  containerNo,
  onStatusChange
}: ChatMiniProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    setIsDragging(true);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Position chat window at bottom-right by default
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 420, // 400px width + 20px margin
        y: window.innerHeight - 520  // 500px height + 20px margin
      });
    }
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  // Chat trigger button (when closed)
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="chat-mini-trigger"
        title="Mở chat hỗ trợ"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div
        className="chat-mini-minimized"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}
        onClick={handleRestore}
      >
        <div className="chat-mini-minimized-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Chat</span>
        </div>
      </div>
    );
  }

  // Full chat window
  return (
    <div
      className="chat-mini-container"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <ChatWindow
        requestId={requestId}
        requestStatus={requestStatus}
        rejectedReason={rejectedReason}
        requestType={requestType}
        containerNo={containerNo}
        onClose={handleClose}
        onMinimize={handleMinimize}
        onMouseDown={handleMouseDown}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}





