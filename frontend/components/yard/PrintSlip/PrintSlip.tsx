import React from 'react';

interface PrintSlipProps {
  containerInfo: any;
  selectedPosition: any;
}

export const PrintSlip: React.FC<PrintSlipProps> = ({ containerInfo, selectedPosition }) => {
  if (!containerInfo || !selectedPosition) return null;

  return (
    <div className="print-slip">
      <div className="slip-header">
        <h1>PHIẾU ĐẶT CONTAINER</h1>
        <div className="slip-info">
          <span>Ngày: {new Date().toLocaleDateString('vi-VN')}</span>
          <span>Giờ: {new Date().toLocaleTimeString('vi-VN')}</span>
        </div>
      </div>

      <div className="slip-content">
        <div className="info-section">
          <h2>THÔNG TIN CONTAINER</h2>
          <div className="info-grid">
            <div className="info-row">
              <span className="label">Container No:</span>
              <span className="value">{containerInfo.container_no}</span>
            </div>
            <div className="info-row">
              <span className="label">Loại:</span>
              <span className="value">{containerInfo.type || 'Chưa xác định'}</span>
            </div>
            <div className="info-row">
              <span className="label">Trạng thái cổng:</span>
              <span className="value">GATE IN</span>
            </div>
            <div className="info-row">
              <span className="label">Cổng xe đã vào:</span>
              <span className="value">Cổng 1</span>
            </div>
          </div>
        </div>

        <div className="position-section">
          <h2>VỊ TRÍ ĐÃ CHỌN</h2>
          <div className="position-highlight">
            <div className="position-code-large">
              {selectedPosition.block}-{selectedPosition.slot}
            </div>
            <div className="position-details">
              <span className="yard-name">{selectedPosition.yard}</span>
              <span className="status">Trạng thái: Trống</span>
            </div>
          </div>
        </div>

        <div className="instructions-section">
          <h2>HƯỚNG DẪN</h2>
          <ul>
            <li>Đưa container đến vị trí: <strong>{selectedPosition.block}-{selectedPosition.slot}</strong></li>
            <li>Đặt container theo hướng dẫn của nhân viên bãi</li>
            <li>Xác nhận vị trí đã đặt với nhân viên quản lý</li>
            <li>Giữ phiếu này để đối chiếu</li>
          </ul>
        </div>
      </div>

      <div className="slip-footer">
        <div className="signature-section">
          <div className="signature-line">
            <span>Người đặt container</span>
            <span>Nhân viên bãi</span>
          </div>
          <div className="signature-line">
            <span>Chữ ký</span>
            <span>Chữ ký</span>
          </div>
        </div>
      </div>
    </div>
  );
};
