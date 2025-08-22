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
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [plateNo, setPlateNo] = useState('');
  const [driverName, setDriverName] = useState('');

  const confirmApprove = async () => {
    try {
      const normalizedPlate = plateNo.trim().toUpperCase();
      const normalizedDriver = driverName.trim();
      
      // Validate biển số xe: 5-20 ký tự, chữ/số/gạch/space/dấu chấm
      const validPlate = /^[A-Z0-9\-\s\.]{5,20}$/.test(normalizedPlate);
      if (!validPlate) {
        alert('Vui lòng nhập biển số xe hợp lệ (tối thiểu 5 ký tự).');
        return;
      }
      
      // Validate tên tài xế: 2-100 ký tự
      if (normalizedDriver.length < 2) {
        alert('Vui lòng nhập tên tài xế (tối thiểu 2 ký tự).');
        return;
      }
      
      setIsLoading(true);
      await api.patch(`/gate/requests/${requestId}/approve`, { 
        license_plate: normalizedPlate,
        driver_name: normalizedDriver
      });
      
      // Hiển thị thông báo thành công
      const newStatus = requestType === 'EXPORT' ? 'GATE_OUT' : 'GATE_IN';
      alert(`Đã chuyển trạng thái: ${newStatus}.\nTài xế: ${normalizedDriver}\nBiển số: ${normalizedPlate}`);
      
      setIsApproveModalOpen(false);
      setPlateNo('');
      setDriverName('');
      onActionSuccess();
    } catch (error: any) {
      alert(`Lỗi khi approve: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = () => {
    setIsApproveModalOpen(true);
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

      {/* Approve Modal - yêu cầu nhập biển số */}
      {isApproveModalOpen && (
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
            maxWidth: '420px',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-4)',
              color: 'var(--color-gray-900)'
            }}>
              Nhập thông tin tài xế và biển số xe
            </h3>

            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-gray-700)',
                marginBottom: 'var(--space-2)'
              }}>
                Tên tài xế *
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  border: '2px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-lg)'
                }}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-gray-700)',
                marginBottom: 'var(--space-2)'
              }}>
                Biển số xe *
              </label>
              <input
                type="text"
                value={plateNo}
                onChange={(e) => setPlateNo(e.target.value.toUpperCase())}
                placeholder="VD: 51C-123.45"
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  border: '2px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-lg)'
                }}
                disabled={isLoading}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setIsApproveModalOpen(false); setPlateNo(''); setDriverName(''); }}
                disabled={isLoading}
                className="action-btn action-btn-secondary"
              >
                Hủy
              </button>
              <button
                onClick={confirmApprove}
                disabled={isLoading}
                className="action-btn action-btn-primary"
              >
                {isLoading ? 'Đang xử lý...' : 'Xác nhận cho phép'}
              </button>
            </div>
          </div>
        </div>
      )}

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
