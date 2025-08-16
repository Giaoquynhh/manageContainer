import React from 'react';

interface AppointmentHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onMinimize: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export default function AppointmentHeader({
  title,
  subtitle,
  onClose,
  onMinimize,
  onDragStart
}: AppointmentHeaderProps) {
  return (
    <div className="appointment-header" onMouseDown={onDragStart}>
      <div className="appointment-header-content">
        <div className="appointment-header-info">
          <div className="appointment-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="appointment-header-text">
            <h3 className="appointment-header-title">{title}</h3>
            {subtitle && (
              <p className="appointment-header-subtitle">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="appointment-header-actions">
          <button 
            onClick={onMinimize} 
            className="appointment-header-btn appointment-minimize-btn"
            aria-label="Thu nhỏ"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          
          <button 
            onClick={onClose} 
            className="appointment-header-btn appointment-close-btn"
            aria-label="Đóng"
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
