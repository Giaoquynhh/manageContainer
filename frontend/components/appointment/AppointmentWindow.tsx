import React, { useState, useEffect } from 'react';
import AppointmentHeader from './AppointmentHeader';
import AppointmentForm from './AppointmentForm';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AppointmentWindowProps {
  requestId: string;
  requestData?: {
    id: string;
    container_no: string;
    type: string;
    status: string;
    created_by: string;
  };
  onClose: () => void;
  onSuccess: () => void;
  onMinimize: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export default function AppointmentWindow({
  requestId,
  requestData,
  onClose,
  onSuccess,
  onMinimize,
  onDragStart
}: AppointmentWindowProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (appointmentData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Form will handle the API call
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const handleFormError = (errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="appointment-window-loading">
        <AppointmentHeader
          title="Tạo lịch hẹn"
          subtitle={`Container: ${requestData?.container_no || requestId}`}
          onClose={onClose}
          onMinimize={onMinimize}
          onDragStart={onDragStart}
        />
        <div className="appointment-loading-content">
          <LoadingSpinner size="md" color="primary" />
          <p>Đang xử lý lịch hẹn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-window">
      <AppointmentHeader
        title="Tạo lịch hẹn"
        subtitle={`Container: ${requestData?.container_no || requestId}`}
        onClose={onClose}
        onMinimize={onMinimize}
        onDragStart={onDragStart}
      />
      
      <div className="appointment-content">
        {error && (
          <div className="appointment-error">
            <div className="appointment-error-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span>{error}</span>
            </div>
            <button 
              className="appointment-error-close"
              onClick={() => setError(null)}
              aria-label="Đóng thông báo lỗi"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        <AppointmentForm
          requestId={requestId}
          requestData={requestData}
          onSubmit={handleFormSubmit}
          onError={handleFormError}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
}
