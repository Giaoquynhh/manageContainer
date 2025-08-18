import React from 'react';

interface SelectedSlot {
  id: string;
  code: string;
  block_code: string;
}

interface YardActionsCardProps {
  selectedSlot: SelectedSlot | null;
  loading: boolean;
  onConfirmPosition: () => void;
  onCancel: () => void;
  onReset: () => void;
  containerInfo: any;
}

export const YardActionsCard: React.FC<YardActionsCardProps> = ({
  selectedSlot,
  loading,
  onConfirmPosition,
  onCancel,
  onReset,
  containerInfo
}) => {
  if (!containerInfo) return null;

  return (
    <>
      {/* Yard Actions */}
      {selectedSlot && (
        <div className="actions-section">
          <div className="selected-position-info">
            <h4>Vị trí đã chọn:</h4>
            <p><strong>Block:</strong> {selectedSlot.block_code}</p>
            <p><strong>Slot:</strong> {selectedSlot.code}</p>
          </div>
          
          <div className="action-buttons">
            <button
              type="button"
              className="btn btn-primary confirm-btn"
              onClick={onConfirmPosition}
              disabled={loading}
            >
              ✅ Xác nhận vị trí
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              ❌ Hủy bỏ
            </button>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <div className="actions-section">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onReset}
          disabled={loading}
        >
          🔄 Tìm kiếm mới
        </button>
      </div>
    </>
  );
};
