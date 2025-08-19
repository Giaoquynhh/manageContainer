import { useState } from 'react';

interface ContainerRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: any) => void;
  selectedContainer: any;
}

export default function ContainerRepairModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedContainer 
}: ContainerRepairModalProps) {
  const [repairFormData, setRepairFormData] = useState({
    problem_description: '',
    estimated_cost: 0
  });

  const handleSubmit = () => {
    onSubmit(repairFormData);
    // Reset form
    setRepairFormData({
      problem_description: '',
      estimated_cost: 0
    });
  };

  if (!isOpen || !selectedContainer) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Tạo phiếu sửa chữa cho Container {selectedContainer.container_no}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ gap: 16 }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: 14, color: '#475569', marginBottom: '4px', display: 'block' }}>
              Container No
            </label>
            <input 
              value={selectedContainer.container_no || ''}
              disabled
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                background: '#f9fafb',
                color: '#6b7280'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: 14, color: '#475569', marginBottom: '4px', display: 'block' }}>
              Loại
            </label>
            <input 
              value={selectedContainer.type === 'IMPORT' ? 'Import' : 
                     selectedContainer.type === 'EXPORT' ? 'Export' : selectedContainer.type || ''}
              disabled
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                background: '#f9fafb',
                color: '#6b7280'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: 14, color: '#475569', marginBottom: '4px', display: 'block' }}>
              Mô tả lỗi
            </label>
            <textarea 
              value={repairFormData.problem_description}
              onChange={(e) => setRepairFormData(prev => ({
                ...prev,
                problem_description: e.target.value
              }))}
              placeholder="Nhập mô tả chi tiết về lỗi cần sửa chữa..."
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: 14, color: '#475569', marginBottom: '4px', display: 'block' }}>
              Chi phí dự toán (đồng)
            </label>
            <input 
              type="number"
              min="0"
              step="1000"
              value={repairFormData.estimated_cost}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 0) {
                  setRepairFormData(prev => ({
                    ...prev,
                    estimated_cost: value
                  }));
                }
              }}
              onBlur={(e) => {
                const value = Number(e.target.value);
                if (value < 0) {
                  setRepairFormData(prev => ({
                    ...prev,
                    estimated_cost: 0
                  }));
                }
              }}
              placeholder="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
            marginTop: '20px'
          }}>
            <button 
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Hủy
            </button>
            <button 
              onClick={handleSubmit}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                background: '#1e40af',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Tạo phiếu sửa chữa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
