import React, { useState, useEffect } from 'react';
import { yardApi } from '@services/yard';
import { useTranslation } from '../../hooks/useTranslation';

interface YardConfigurationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface YardConfig {
  depotCount: number;
  slotsPerDepot: number;
  tiersPerSlot: number;
}

export default function YardConfigurationModal({ 
  visible, 
  onCancel, 
  onSuccess 
}: YardConfigurationModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [config, setConfig] = useState<YardConfig>({
    depotCount: 2,
    slotsPerDepot: 20,
    tiersPerSlot: 5
  });

  // Load current configuration when modal opens
  useEffect(() => {
    if (visible) {
      loadCurrentConfig();
    }
  }, [visible]);

  const loadCurrentConfig = async () => {
    try {
      const currentConfig = await yardApi.getConfiguration();
      if (currentConfig) {
        setConfig(currentConfig);
      }
    } catch (error) {
      console.error('Error loading current configuration:', error);
      // Keep default values if loading fails
    }
  };

  const handleInputChange = (field: keyof YardConfig, value: number) => {
    setConfig(prev => ({
      ...prev,
      [field]: Math.max(1, value) // Ensure minimum value is 1
    }));
  };

  const handleApply = async () => {
    try {
      setLoading(true);
      setSuccess(false);
      await yardApi.configureYard(config);
      setSuccessMessage('Cấu hình bãi đã được cập nhật thành công!');
      setSuccess(true);
      
      // Hiển thị thông báo thành công trong 2 giây rồi đóng modal
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Có lỗi xảy ra khi cấu hình bãi');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Bạn có chắc chắn muốn reset về cấu hình mặc định? Tất cả dữ liệu hiện tại sẽ bị xóa!')) {
      return;
    }

    try {
      setLoading(true);
      setSuccess(false);
      await yardApi.resetYard();
      
      // Reset form về giá trị mặc định
      setConfig({
        depotCount: 2,
        slotsPerDepot: 20,
        tiersPerSlot: 5
      });
      
      setSuccessMessage('Bãi đã được reset về cấu hình mặc định!');
      setSuccess(true);
      
      // Hiển thị thông báo thành công trong 2 giây rồi đóng modal
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Có lỗi xảy ra khi reset bãi');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setSuccess(false);
      // Chỉ làm mới dữ liệu, không thay đổi cấu hình
      onSuccess();
    } catch (error: any) {
      alert('Có lỗi xảy ra khi làm mới dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    const depotNames = Array.from({ length: config.depotCount }, (_, i) => `B${i + 1}`);
    const totalSlots = config.depotCount * config.slotsPerDepot;
    const totalTiers = totalSlots * config.tiersPerSlot;

    return {
      depotNames,
      totalSlots,
      totalTiers
    };
  };

  const preview = generatePreview();

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container yard-config-modal">
        <div className="modal-header">
          <h2 className="modal-title">⚙️ Cấu hình bãi container</h2>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="config-form">
            <div className="form-group">
              <label className="form-label">
                🏗️ Số lượng depot
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.depotCount}
                onChange={(e) => handleInputChange('depotCount', parseInt(e.target.value) || 1)}
                className="form-input"
                placeholder="Nhập số lượng depot"
              />
              <div className="form-help">
                Tên depot sẽ được tạo tự động: {preview.depotNames.slice(0, 5).join(', ')}
                {preview.depotNames.length > 5 && `, ... (${preview.depotNames.length} depot)`}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                📦 Số lượng chỗ trong mỗi depot
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={config.slotsPerDepot}
                onChange={(e) => handleInputChange('slotsPerDepot', parseInt(e.target.value) || 1)}
                className="form-input"
                placeholder="Nhập số lượng chỗ"
              />
              <div className="form-help">
                Mỗi depot sẽ có {config.slotsPerDepot} chỗ (B1-1, B1-2, ..., B1-{config.slotsPerDepot})
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                🏢 Số lượng tầng trong mỗi chỗ
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.tiersPerSlot}
                onChange={(e) => handleInputChange('tiersPerSlot', parseInt(e.target.value) || 1)}
                className="form-input"
                placeholder="Nhập số lượng tầng"
              />
              <div className="form-help">
                Mỗi chỗ sẽ có {config.tiersPerSlot} tầng (T1, T2, ..., T{config.tiersPerSlot})
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="config-preview">
            <h3 className="preview-title">📊 Xem trước cấu hình</h3>
            <div className="preview-stats">
              <div className="preview-stat">
                <div className="stat-icon">🏗️</div>
                <div className="stat-content">
                  <div className="stat-value">{config.depotCount}</div>
                  <div className="stat-label">Depot</div>
                </div>
              </div>
              <div className="preview-stat">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <div className="stat-value">{preview.totalSlots}</div>
                  <div className="stat-label">Tổng số chỗ</div>
                </div>
              </div>
              <div className="preview-stat">
                <div className="stat-icon">🏢</div>
                <div className="stat-content">
                  <div className="stat-value">{preview.totalTiers}</div>
                  <div className="stat-label">Tổng số tầng</div>
                </div>
              </div>
            </div>
            

          </div>

          {/* Success Message */}
          {success && (
            <div className="config-success">
              <div className="success-icon">✅</div>
              <div className="success-content">
                <strong>Thành công!</strong> {successMessage}
                <br />
                <small>Đang làm mới dữ liệu...</small>
              </div>
            </div>
          )}

          {/* Warning */}
          {!success && (
            <div className="config-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <strong>Lưu ý:</strong> Việc thay đổi cấu hình sẽ xóa tất cả dữ liệu hiện tại trong bãi. 
                Hãy đảm bảo bạn đã sao lưu dữ liệu quan trọng trước khi tiếp tục.
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={loading}
          >
            Hủy
          </button>
          <button 
            className="btn btn-warning" 
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : '🔄 Cài đặt mặc định'}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleApply}
            disabled={loading}
          >
            {loading ? 'Đang cập nhật...' : '💾 Cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );
}
