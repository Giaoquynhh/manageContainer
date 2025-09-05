import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

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
  const { t } = useTranslation();
  
  return (
    <div className="supplement-header">
      <div className="supplement-header-content">
        <div className="supplement-title">
          <span className="supplement-icon">📋</span>
          <span className="supplement-text">{t('pages.requests.supplementTitle')}</span>
        </div>
        <div className="supplement-controls">
          <button
            className="supplement-control-btn"
            onClick={onMinimize}
            title={isMinimized ? t('pages.requests.supplementExpand') : t('pages.requests.supplementMinimize')}
          >
            {isMinimized ? "🔽" : "🔼"}
          </button>
          <button
            className="supplement-control-btn"
            onClick={onClose}
            title={t('pages.requests.supplementClose')}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
