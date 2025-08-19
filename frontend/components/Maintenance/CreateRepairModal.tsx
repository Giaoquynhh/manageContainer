import useSWR from 'swr';
import { maintenanceApi } from '@services/maintenance';
import { useEffect, useState } from 'react';

interface CreateRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: any) => void;
}

export default function CreateRepairModal({ isOpen, onClose, onSubmit }: CreateRepairModalProps) {
  const { data: equipments } = useSWR('equipments', async () => maintenanceApi.listEquipments());
  const [form, setForm] = useState<any>({ 
    code: '', 
    equipment_id: '', 
    problem_description: '', 
    estimated_cost: 0, 
    items: [] as any[] 
  });
  const [costStr, setCostStr] = useState<string>('0');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!form.equipment_id && equipments?.[0]) {
      setForm((f: any) => ({ ...f, equipment_id: equipments[0].id }));
    }
  }, [equipments]);

  const handleSubmit = () => {
    const payload = { ...form, estimated_cost: Number(costStr) };
    onSubmit(payload);
    // Reset form
    setForm({ code: '', equipment_id: form.equipment_id, problem_description: '', estimated_cost: 0, items: [] });
    setCostStr('0');
    setMsg('');
  };

  if (!isOpen) return null;

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
      zIndex: 1000
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
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Tạo phiếu sửa chữa</h3>
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

        <div className="grid" style={{ gap: 16 }}>
          <div>
            <label style={{ fontSize: 14, color: '#475569', marginBottom: '4px', display: 'block' }}>Mã phiếu</label>
            <input 
              value={form.code} 
              onChange={e => setForm({ ...form, code: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 14, color: '#475569', marginBottom: '4px', display: 'block' }}>Thiết bị</label>
            <select 
              value={form.equipment_id} 
              onChange={e => setForm({ ...form, equipment_id: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              {equipments?.map((e: any) => (<option key={e.id} value={e.id}>{e.code}</option>))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 14, color: '#475569', marginBottom: '4px', display: 'block' }}>Mô tả lỗi</label>
            <textarea 
              value={form.problem_description} 
              onChange={e => setForm({ ...form, problem_description: e.target.value })}
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

          <div>
            <label style={{ fontSize: 14, color: '#475569', marginBottom: '4px', display: 'block' }}>Chi phí dự toán</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                value={costStr} 
                onChange={e => setCostStr(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <span style={{ fontSize: 14, color: '#334155' }}>đồng</span>
            </div>
          </div>

          {msg && <div style={{ fontSize: 12, color: '#1e3a8a' }}>{msg}</div>}

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
              Tạo phiếu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
