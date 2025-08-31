import React from 'react';

interface AppointmentHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export default function AppointmentHeader({
  title,
  subtitle,
  onClose,
  onDragStart
}: AppointmentHeaderProps) {
  return (
    <div className="appointment-header" onMouseDown={onDragStart}>
      <div className="appointment-header-content">
        <div className="appointment-header-info">
          <div className="appointment-header-text">
            <h3 className="appointment-header-title">{title}</h3>
            {subtitle && (
              <p className="appointment-header-subtitle">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="appointment-header-actions">
          
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





