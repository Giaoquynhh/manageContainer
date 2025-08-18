import React, { useState } from 'react';
import { api } from '@services/api';

interface GateActionButtonsProps {
  requestId: string;
  requestType: string;
  currentStatus: string;
  onActionSuccess: () => void;
}

export default function GateActionButtons({ 
  requestId, 
  requestType, 
  currentStatus, 
  onActionSuccess 
}: GateActionButtonsProps) {
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/gate/requests/${requestId}/approve`);
      
      // Hiển thị thông báo thành công
      const newStatus = requestType === 'EXPORT' ? 'GATE_OUT' : 'GATE_IN';
      alert(`Đã chuyển trạng thái: ${newStatus}`);
      
      onActionSuccess();
    } catch (error: any) {
      alert(`Lỗi khi approve: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.length < 5) {
      alert('Lý do từ chối phải có ít nhất 5 ký tự');
      return;
    }

    try {
      setIsLoading(true);
      await api.patch(`/gate/requests/${requestId}/reject`, {
        reason: rejectReason
      });
      
      alert('Đơn hàng bị từ chối');
      setIsRejectModalOpen(false);
      setRejectReason('');
      onActionSuccess();
    } catch (error: any) {
      alert(`Lỗi khi từ chối: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Chỉ hiển thị buttons khi status là FORWARDED
  if (currentStatus !== 'FORWARDED') {
    return (
      <span style={{ 
        color: 'var(--color-gray-500)', 
        fontSize: 'var(--font-size-sm)',
        fontStyle: 'italic'
      }}>
        {currentStatus === 'GATE_IN' && 'Đã cho phép vào'}
        {currentStatus === 'GATE_OUT' && 'Đã cho phép ra'}
        {currentStatus === 'GATE_REJECTED' && 'Đã từ chối'}
        {currentStatus === 'COMPLETED' && 'Hoàn tất'}
        {currentStatus === 'SCHEDULED' && 'Đã lên lịch'}
      </span>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="action-btn action-btn-primary"
        >
          {isLoading ? 'Đang xử lý...' : 'Cho phép'}
        </button>
        
        <button
          onClick={() => setIsRejectModalOpen(true)}
          disabled={isLoading}
          className="action-btn action-btn-danger"
        >
          Từ chối
        </button>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            width: '90%',
            maxWidth: '400px',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-4)',
              color: 'var(--color-gray-900)'
            }}>
              Lý do từ chối
            </h3>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối (tối thiểu 5 ký tự)..."
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '2px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-4)',
                height: '100px',
                resize: 'none',
                fontFamily: 'inherit',
                fontSize: 'var(--font-size-sm)'
              }}
              disabled={isLoading}
            />
            
            <div style={{
              display: 'flex',
              gap: 'var(--space-3)',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason('');
                }}
                disabled={isLoading}
                className="action-btn action-btn-secondary"
              >
                Hủy
              </button>
              
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="action-btn action-btn-danger"
              >
                {isLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
