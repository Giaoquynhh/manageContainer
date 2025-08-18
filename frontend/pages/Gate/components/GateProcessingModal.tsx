import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface GateRequest {
  id: string;
  container_no: string;
  type: string;
  status: string;
  eta?: string;
  docs: any[];
  attachments: any[];
}

interface GateProcessingModalProps {
  request: GateRequest;
  visible: boolean;
  onClose: () => void;
}

interface DriverInfo {
  driver_name: string;
  license_plate: string;
  id_card: string;
  seal_number: string;
  note: string;
}

export default function GateProcessingModal({
  request,
  visible,
  onClose
}: GateProcessingModalProps) {
  const [driverInfo, setDriverInfo] = useState<DriverInfo>({
    driver_name: '',
    license_plate: '',
    id_card: '',
    seal_number: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (visible) {
      setDriverInfo({
        driver_name: '',
        license_plate: '',
        id_card: '',
        seal_number: '',
        note: ''
      });
      setRejectReason('');
      setShowRejectForm(false);
    }
  }, [visible]);

  const handleInputChange = (field: keyof DriverInfo, value: string) => {
    setDriverInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      await api.patch(`/gate/requests/${request.id}/gate-accept`, driverInfo);
      onClose();
    } catch (error: any) {
      alert(`Lỗi: ${error.response?.data?.message || 'Không thể chấp nhận xe'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setLoading(true);
      await api.patch(`/gate/requests/${request.id}/gate-reject`, { reason: rejectReason });
      onClose();
    } catch (error: any) {
      alert(`Lỗi: ${error.response?.data?.message || 'Không thể từ chối xe'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Xử lý xe vào cổng - {request.container_no}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="gate-processing-layout">
            {/* Cột trái - Thông tin chứng từ */}
            <div className="documents-section">
              <h3>📋 Thông tin chứng từ</h3>
              <div className="document-info">
                <p><strong>Container:</strong> {request.container_no}</p>
                <p><strong>Loại:</strong> {request.type}</p>
                <p><strong>ETA:</strong> {request.eta ? new Date(request.eta).toLocaleString('vi-VN') : 'N/A'}</p>
                <p><strong>Số chứng từ:</strong> {request.docs?.length || 0}</p>
              </div>

              {request.docs && request.docs.length > 0 && (
                <div className="documents-list">
                  <h4>Chứng từ đính kèm:</h4>
                  <ul>
                    {request.docs.map((doc, index) => (
                      <li key={index}>
                        📎 {doc.name} ({doc.type})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Cột phải - Form nhập thông tin tài xế */}
            <div className="driver-form-section">
              <h3>🚗 Thông tin tài xế</h3>
              
              {!showRejectForm ? (
                <form className="driver-form">
                  <div className="form-group">
                    <label htmlFor="driver_name">Tên tài xế *</label>
                    <input
                      type="text"
                      id="driver_name"
                      value={driverInfo.driver_name}
                      onChange={(e) => handleInputChange('driver_name', e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="license_plate">Biển số xe *</label>
                    <input
                      type="text"
                      id="license_plate"
                      value={driverInfo.license_plate}
                      onChange={(e) => handleInputChange('license_plate', e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="id_card">CMND/CCCD *</label>
                    <input
                      type="text"
                      id="id_card"
                      value={driverInfo.id_card}
                      onChange={(e) => handleInputChange('id_card', e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="seal_number">Số seal</label>
                    <input
                      type="text"
                      id="seal_number"
                      value={driverInfo.seal_number}
                      onChange={(e) => handleInputChange('seal_number', e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="note">Ghi chú</label>
                    <textarea
                      id="note"
                      value={driverInfo.note}
                      onChange={(e) => handleInputChange('note', e.target.value)}
                      className="form-textarea"
                      rows={3}
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(true)}
                      className="btn btn-danger"
                      disabled={loading}
                    >
                      ❌ Từ chối
                    </button>
                    <button
                      type="button"
                      onClick={handleAccept}
                      className="btn btn-success"
                      disabled={loading || !driverInfo.driver_name || !driverInfo.license_plate || !driverInfo.id_card}
                    >
                      {loading ? '⏳ Đang xử lý...' : '✅ Chấp nhận'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="reject-form">
                  <h4>Lý do từ chối</h4>
                  <div className="form-group">
                    <label htmlFor="reject_reason">Lý do *</label>
                    <textarea
                      id="reject_reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="form-textarea"
                      rows={4}
                      placeholder="Nhập lý do từ chối xe vào cổng..."
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="btn btn-outline"
                      disabled={loading}
                    >
                      ← Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      className="btn btn-danger"
                      disabled={loading || !rejectReason.trim()}
                    >
                      {loading ? '⏳ Đang xử lý...' : '❌ Từ chối'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
