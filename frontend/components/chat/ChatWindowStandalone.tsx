import { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';

interface ChatWindowStandaloneProps {
  requestId: string;
  requestStatus?: string;
  rejectedReason?: string;
  requestType?: string;
  containerNo?: string;
  appointmentTime?: string;
  appointmentLocation?: string;
  appointmentNote?: string;
  onClose: () => void;
  onStatusChange?: (status: string) => void;
  position?: { x: number; y: number };
}

export default function ChatWindowStandalone({
  requestId,
  requestStatus,
  rejectedReason,
  requestType,
  containerNo,
  appointmentTime,
  appointmentLocation,
  appointmentNote,
  onClose,
  onStatusChange,
  position = { x: 20, y: 20 }
}: ChatWindowStandaloneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);

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
    setCurrentPosition({
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

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  // Minimized state
  if (isMinimized) {
    return (
      <div
        className="chat-mini-minimized"
        style={{
          position: 'fixed',
          left: `${currentPosition.x}px`,
          top: `${currentPosition.y}px`,
          zIndex: 1000
        }}
        onClick={handleRestore}
      >
        <div className="chat-mini-minimized-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Chat - {containerNo}</span>
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
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
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
        appointmentTime={appointmentTime}
        appointmentLocation={appointmentLocation}
        appointmentNote={appointmentNote}
        onClose={onClose}
        onMinimize={handleMinimize}
        onMouseDown={handleMouseDown}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
