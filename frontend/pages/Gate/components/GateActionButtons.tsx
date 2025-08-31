import React, { useState } from 'react';
import { api } from '@services/api';
import { useTranslation } from '../../../hooks/useTranslation';

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
  const { t } = useTranslation();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [plateNo, setPlateNo] = useState('');
  const [driverName, setDriverName] = useState('');

  const statusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return t('pages.gate.statusOptions.scheduled');
      case 'FORWARDED':
        return t('pages.gate.statusOptions.forwarded');
      case 'GATE_IN':
        return t('pages.gate.statusOptions.gateIn');
      case 'GATE_OUT':
        return t('pages.gate.statusOptions.gateOut');
      case 'GATE_REJECTED':
        return t('pages.gate.statusOptions.gateRejected');
      case 'COMPLETED':
        return t('pages.gate.statusOptions.completed');
      default:
        return status;
    }
  };

  const confirmApprove = async () => {
    try {
      const normalizedPlate = plateNo.trim().toUpperCase();
      const normalizedDriver = driverName.trim();
      
      // Validate biển số xe: 5-20 ký tự, chữ/số/gạch/space/dấu chấm
      const validPlate = /^[A-Z0-9\-\s\.]{5,20}$/.test(normalizedPlate);
      if (!validPlate) {
        alert(t('pages.gate.validation.invalidPlate'));
        return;
      }
      
      // Validate tên tài xế: 2-100 ký tự
      if (normalizedDriver.length < 2) {
        alert(t('pages.gate.validation.invalidDriver'));
        return;
      }
      
      setIsLoading(true);
      await api.patch(`/gate/requests/${requestId}/approve`, { 
        license_plate: normalizedPlate,
        driver_name: normalizedDriver
      });
      
      // Hiển thị thông báo thành công
      const newStatus = requestType === 'EXPORT' ? 'GATE_OUT' : 'GATE_IN';
      const newStatusLabel = statusLabel(newStatus);
      alert(`${t('pages.gate.statusLabel')}: ${newStatusLabel}.\n${t('pages.gate.tableHeaders.driverName')}: ${normalizedDriver}\n${t('pages.gate.tableHeaders.licensePlate')}: ${normalizedPlate}`);
      
      setIsApproveModalOpen(false);
      setPlateNo('');
      setDriverName('');
      onActionSuccess();
    } catch (error: any) {
      alert(`${t('pages.gate.messages.approveErrorPrefix')}: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = () => {
    setIsApproveModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.length < 5) {
      alert(t('pages.gate.validation.rejectReasonMin'));
      return;
    }

    try {
      setIsLoading(true);
      await api.patch(`/gate/requests/${requestId}/reject`, {
        reason: rejectReason
      });
      
      alert(t('pages.gate.messages.rejected'));
      setIsRejectModalOpen(false);
      setRejectReason('');
      onActionSuccess();
    } catch (error: any) {
      alert(`${t('pages.gate.messages.rejectErrorPrefix')}: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGateOut = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/gate/requests/${requestId}/gate-out`);
      alert('Đã chuyển trạng thái: GATE_OUT - Xe rời kho.');
      onActionSuccess();
    } catch (error: any) {
      alert(`Lỗi khi GATE_OUT: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Chỉ hiển thị buttons khi status là FORWARDED
  if (currentStatus !== 'FORWARDED') {
    // Hiển thị action GATE_OUT cho IN_YARD và IN_CAR
    if (currentStatus === 'IN_YARD' || currentStatus === 'IN_CAR') {
      return (
        <button
          onClick={handleGateOut}
          disabled={isLoading}
          className="action-btn action-btn-success"
          style={{ backgroundColor: 'var(--color-green-600)' }}
        >
          {isLoading ? 'Đang xử lý...' : 'GATE_OUT - Xe rời kho'}
        </button>
      );
    }
    
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
        {currentStatus === 'IN_YARD' && 'Đã ở bãi - Chờ xe rời kho'}
        {currentStatus === 'IN_CAR' && 'Đã lên xe - Chờ xe rời kho'}
        {statusLabel(currentStatus)}
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
          {isLoading ? t('common.processing') : t('pages.gate.actions.approve')}
        </button>
        
        <button
          onClick={() => setIsRejectModalOpen(true)}
          disabled={isLoading}
          className="action-btn action-btn-danger"
        >
          {t('pages.gate.actions.reject')}
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
              {t('pages.gate.modals.approve.title')}
            </h3>

            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-gray-700)',
                marginBottom: 'var(--space-2)'
              }}>
                {t('pages.gate.tableHeaders.driverName')} *
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder={t('pages.gate.placeholders.driverName')}
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
                {t('pages.gate.tableHeaders.licensePlate')} *
              </label>
              <input
                type="text"
                value={plateNo}
                onChange={(e) => setPlateNo(e.target.value.toUpperCase())}
                placeholder={t('pages.gate.placeholders.plateNo')}
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
                {t('pages.gate.actions.cancel')}
              </button>
              <button
                onClick={confirmApprove}
                disabled={isLoading}
                className="action-btn action-btn-primary"
              >
                {isLoading ? t('common.processing') : t('pages.gate.actions.confirmApprove')}
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
              {t('pages.gate.modals.reject.title')}
            </h3>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('pages.gate.placeholders.rejectReason')}
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
                {t('pages.gate.actions.cancel')}
              </button>
              
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="action-btn action-btn-danger"
              >
                {isLoading ? t('common.processing') : t('pages.gate.actions.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
