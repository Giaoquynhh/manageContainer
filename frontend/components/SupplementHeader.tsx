import React from 'react';

interface SupplementHeaderProps {
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}

export default function SupplementHeader({ 
  isMinimized, 
  onMinimize, 
  onClose 
}: SupplementHeaderProps) {
  return (
    <div className="supplement-header">
      <div className="supplement-header-content">
        <div className="supplement-title">
          <span className="supplement-icon">📋</span>
          <span className="supplement-text">Bổ sung thông tin</span>
        </div>
        <div className="supplement-controls">
          <button
            className="supplement-control-btn"
            onClick={onMinimize}
            title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
          >
            {isMinimized ? "🔽" : "🔼"}
          </button>
          <button
            className="supplement-control-btn"
            onClick={onClose}
            title="Đóng"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
