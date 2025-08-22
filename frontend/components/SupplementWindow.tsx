import React from 'react';
import SupplementHeader from './SupplementHeader';
import SupplementForm from './SupplementForm';

interface SupplementWindowProps {
  requestId: string;
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SupplementWindow({ 
  requestId, 
  isMinimized, 
  onMinimize, 
  onClose,
  onSuccess
}: SupplementWindowProps) {
  return (
    <div className="supplement-window">
      <SupplementHeader
        isMinimized={isMinimized}
        onMinimize={onMinimize}
        onClose={onClose}
      />
      {!isMinimized && (
        <SupplementForm requestId={requestId} onSuccess={onSuccess} />
      )}
    </div>
  );
}
