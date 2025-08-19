import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getGateStatusText, getStatusColor } from '../../utils/containerUtils';
import { PDFSlip } from '../PDFSlip/PDFSlip';
import { forkliftApi } from '@services/forklift';
import { yardApi } from '@services/yard';
import { mutate } from 'swr';

interface ContainerInfoModalProps {
  isOpen: boolean;
  containerInfo: any;
  isDuplicate: boolean;
  existingContainers: any[];
  onClose: () => void;
}

export const ContainerInfoModal: React.FC<ContainerInfoModalProps> = ({
  isOpen,
  containerInfo,
  isDuplicate,
  existingContainers,
  onClose
}) => {
  const [showPositionSuggestions, setShowPositionSuggestions] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [showPDFSlip, setShowPDFSlip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ slot: any; score: number }>>([]);
  const router = useRouter();

  console.log('🔍 ContainerInfoModal render:', {
    isOpen,
    containerInfo: containerInfo ? 'Có data' : 'Không có data',
    isDuplicate,
    existingContainersLength: existingContainers?.length || 0
  });

  if (!isOpen) return null; // Only check isOpen here

  // Mock data cho gợi ý vị trí
  const positionSuggestions = [
    { id: 1, block: 'B1', slot: '11', yard: 'Bãi B1', status: 'Trống', distance: 'Gần nhất' },
    { id: 2, block: 'B1', slot: '12', yard: 'Bãi B1', status: 'Trống', distance: 'Gần nhất' },
    { id: 3, block: 'B2', slot: '05', yard: 'Bãi B2', status: 'Trống', distance: 'Trung bình' },
    { id: 4, block: 'A1', slot: '08', yard: 'Bãi A1', status: 'Trống', distance: 'Xa nhất' },
    { id: 5, block: 'C1', slot: '03', yard: 'Bãi C1', status: 'Trống', distance: 'Trung bình' }
  ];

  const handleContinue = async () => {
    setShowPositionSuggestions(true);
    if (containerInfo?.container_no) {
      try {
        const data = await yardApi.suggest(containerInfo.container_no);
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Lỗi lấy gợi ý vị trí:', e);
        setSuggestions([]);
      }
    }
  };

  const handleSelectPosition = (position: any) => {
    setSelectedPosition(position);
    // Ở đây có thể thêm logic để in phiếu
    console.log('📍 Vị trí đã chọn:', position);
  };

  const handleGenerateSlip = () => {
    if (selectedPosition) {
      setShowPDFSlip(true);
      console.log('🖨️ Tạo phiếu với vị trí:', selectedPosition);
    }
  };

  const handleBackToInfo = () => {
    setShowPositionSuggestions(false);
    setSelectedPosition(null);
  };

  const handleBackToSuggestions = () => {
    setShowPDFSlip(false);
  };

  const handleFinish = async () => {
    if (!containerInfo) return;
    try {
      setSubmitting(true);
      if (selectedPosition?.slot?.id) {
        await yardApi.assign(containerInfo.container_no, selectedPosition.slot.id);
        await mutate('yard_map');
      }
      await forkliftApi.assign({ container_no: containerInfo.container_no, to_slot_id: selectedPosition?.slot?.id });
      onClose();
      router.push('/Forklift');
    } catch (error) {
      console.error('Lỗi khi tạo công việc xe nâng:', error);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (showPDFSlip) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content pdf-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Phiếu đặt container</h3>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          
          <div className="modal-body">
            <PDFSlip 
              containerInfo={containerInfo} 
              selectedPosition={selectedPosition} 
            />
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleBackToSuggestions}>
              Quay lại
            </button>
            <button className="btn btn-primary" onClick={handleFinish} disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Hoàn tất'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showPositionSuggestions) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Gợi ý vị trí</h3>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          
          <div className="modal-body">
            <div className="position-suggestions">
              <h4>Chọn vị trí phù hợp cho container:</h4>
              <div className="suggestions-grid">
                {suggestions.map((s) => (
                  <div
                    key={s.slot.id}
                    className={`suggestion-card ${selectedPosition?.slot?.id === s.slot.id ? 'selected' : ''}`}
                    onClick={() => handleSelectPosition(s)}
                  >
                    <div className="suggestion-header">
                      <span className="position-code">{s.slot.code}</span>
                      <span className="status-badge available">Trống</span>
                    </div>
                    <div className="suggestion-details">
                      <span className="yard-name">{s.slot.block?.code || s.slot.block_code || 'Bãi'}</span>
                      <span className="distance">Điểm: {Math.round((s.score || 0) * 100) / 100}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleBackToInfo}>
              Quay lại
            </button>
            {selectedPosition && (
              <button className="btn btn-primary" onClick={handleGenerateSlip}>
                Tạo phiếu
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Thông tin Container</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {!containerInfo ? (
            <div className="no-info-message">
              <div className="no-info-icon">❌</div>
              <h4>Container không có thông tin</h4>
              <p>Container này không có trạng thái Gate In hoặc chưa được đăng ký trong hệ thống.</p>
            </div>
          ) : (
            <>
              {isDuplicate && (
                <div className="duplicate-warning">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-content">
                    <h4>Container No này đã tồn tại trong hệ thống!</h4>
                    <p>Vui lòng kiểm tra lại thông tin hoặc sử dụng Container No khác.</p>
                  </div>
                </div>
              )}

              <div className="info-section">
                <div className="info-header">
                  <div className="info-header-icon">📦</div>
                  <h4>THÔNG TIN CƠ BẢN</h4>
                </div>
                <div className="info-grid">
                  <div className="info-card">
                    <div className="info-card-icon">🔢</div>
                    <div className="info-card-content">
                      <span className="info-label">CONTAINER NO</span>
                      <span className="info-value container-no">{containerInfo.container_no}</span>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-icon">🚪</div>
                    <div className="info-card-content">
                      <span className="info-label">TRẠNG THÁI CỔNG</span>
                      <span className="info-value status-badge gate-status">
                        GATE IN
                      </span>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-icon">📍</div>
                    <div className="info-card-content">
                      <span className="info-label">CỔNG XE ĐÃ VÀO</span>
                      <span className="info-value location">
                        Cổng 1
                      </span>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-icon">📊</div>
                    <div className="info-card-content">
                      <span className="info-label">Ô SỐ</span>
                      <span className={`info-value status-badge ${getStatusColor(containerInfo.status)}`}>
                        {containerInfo.status_text}
                      </span>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-icon">🏷️</div>
                    <div className="info-card-content">
                      <span className="info-label">LOẠI</span>
                      <span className="info-value type-badge">
                        {containerInfo.type || 'Chưa xác định'}
                      </span>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-icon">🏭</div>
                    <div className="info-card-content">
                      <span className="info-label">BÃI</span>
                      <span className="info-value yard">
                        {containerInfo.yard_name || 'Chưa xác định'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {isDuplicate && existingContainers.length > 0 && (
                <div className="info-section">
                  <h4>CONTAINER ĐANG TỒN TẠI</h4>
                  <div className="duplicate-list">
                    {existingContainers.slice(0, 5).map((container: any) => (
                      <div key={container.id} className="duplicate-item">
                        <div className="duplicate-header">
                          <span className="duplicate-container-no">{container.container_no}</span>
                          <span className={`duplicate-status status-badge ${getStatusColor(container.status)}`}>
                            {container.status}
                          </span>
                        </div>
                        <div className="duplicate-details">
                          <span>Loại: {container.type || 'N/A'}</span>
                          <span>Bãi: {container.yard_name || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                    {existingContainers.length > 5 && (
                      <div className="duplicate-more">
                        Và {existingContainers.length - 5} container khác...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
          {containerInfo && (
            <button className="btn btn-primary" onClick={handleContinue}>
              Tiếp tục
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
