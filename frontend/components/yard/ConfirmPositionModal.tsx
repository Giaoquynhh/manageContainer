import React from 'react';

interface ConfirmPositionModalProps {
  isOpen: boolean;
  containerNo: string;
  selectedSlot: {
    id: string;
    code: string;
    block_code: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmPositionModal({
  isOpen,
  containerNo,
  selectedSlot,
  onConfirm,
  onCancel,
  loading = false
}: ConfirmPositionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-position-modal">
        <div className="modal-header">
          <h3>Xác nhận vị trí</h3>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="confirmation-details">
            <div className="detail-item">
              <span className="label">Container No:</span>
              <span className="value container-no">{containerNo}</span>
            </div>
            
            <div className="detail-item">
              <span className="label">Vị trí được chọn:</span>
              <span className="value position">{selectedSlot.code}</span>
            </div>
            
            <div className="detail-item">
              <span className="label">Block:</span>
              <span className="value block">{selectedSlot.block_code}</span>
            </div>
          </div>

          <div className="confirmation-message">
            <p>
              Bạn có chắc chắn muốn đặt container <strong>{containerNo}</strong> vào vị trí <strong>{selectedSlot.code}</strong>?
            </p>
            <p className="warning">
              ⚠️ Hành động này sẽ cập nhật trạng thái slot và không thể hoàn tác.
            </p>
          </div>

          <div className="action-preview">
            <h4>Sau khi xác nhận:</h4>
            <ul>
              <li>✅ Container sẽ được gán vào vị trí {selectedSlot.code}</li>
              <li>✅ Phiếu hướng dẫn sẽ được tạo cho tài xế</li>
              <li>✅ Trạng thái slot sẽ chuyển thành "OCCUPIED"</li>
              <li>✅ Sơ đồ bãi sẽ được cập nhật real-time</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-outline cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Hủy bỏ
          </button>
          <button
            className="btn btn-primary confirm-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận vị trí'}
          </button>
        </div>
      </div>
    </div>
  );
}
