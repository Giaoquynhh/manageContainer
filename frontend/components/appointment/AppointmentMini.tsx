import React, { useState, useEffect, useRef } from 'react';
import AppointmentWindow from './AppointmentWindow';

interface AppointmentMiniProps {
  requestId: string;
  requestData?: {
    id: string;
    container_no: string;
    type: string;
    status: string;
    created_by: string;
  };
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function AppointmentMini({
  requestId,
  requestData,
  onClose,
  onSuccess,
}: AppointmentMiniProps) {
  const [isOpen, setIsOpen] = useState(true); // Auto-open when component is rendered
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Debug log
  useEffect(() => {
    console.log('AppointmentMini rendered for request:', requestId, requestData);
  }, [requestId, requestData]);
  const appointmentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Initialize position when opened
  useEffect(() => {
    if (isOpen && !isDragging) {
      const initialX = typeof window !== 'undefined' ? window.innerWidth - 450 : 20;
      const initialY = typeof window !== 'undefined' ? window.innerHeight - 600 : 20;
      setPosition({ x: initialX, y: initialY });
    }
  }, [isOpen, isDragging]);

  // Handle drag functionality
  const handleDragStart = (e: React.MouseEvent) => {
    if (isMinimized) return;
    setIsDragging(true);
    const rect = appointmentRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleSuccess = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  // Trigger button
  if (!isOpen) {
    return (
      <button 
        className="appointment-mini-toggle" 
        onClick={() => setIsOpen(true)}
        aria-label="Tạo lịch hẹn"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        Tạo lịch hẹn
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div
        className="appointment-mini-minimized"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 1000
        }}
        onClick={handleRestore}
      >
        <div className="appointment-mini-minimized-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>Lịch hẹn - {requestData?.container_no}</span>
        </div>
      </div>
    );
  }

  // Full appointment window
  return (
    <div
      ref={appointmentRef}
      className={`appointment-mini-container ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <AppointmentWindow
        requestId={requestId}
        requestData={requestData}
        onClose={handleClose}
        onSuccess={handleSuccess}
        onMinimize={handleMinimize}
        onDragStart={handleDragStart}
      />
    </div>
  );
}
