import { useState } from 'react';
import { api } from '@services/api';
import DocumentUpload from './DocumentUpload';

interface RequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RequestForm({ onSuccess, onCancel }: RequestFormProps) {
  const [form, setForm] = useState({
    type: 'IMPORT',
    container_no: '',
    eta: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ngăn chặn duplicate submission
    if (loading) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/requests', {
        ...form,
        eta: form.eta || undefined
      });
      
      setCreatedRequestId(response.data.id);
      setMessage({ text: 'Đã tạo yêu cầu thành công. Bạn có thể đính kèm chứng từ bên dưới.', ok: true });
      
      // Không tự động đóng form để cho phép upload documents
    } catch (error: any) {
      setMessage({
        text: error?.response?.data?.message || 'Có lỗi xảy ra khi tạo yêu cầu',
        ok: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Request Type */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 8
            }}>
              Loại yêu cầu *
            </label>
            <select
              value={form.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                background: 'white',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="IMPORT">Nhập container</option>
              <option value="EXPORT">Xuất container</option>
              <option value="CONVERT">Chuyển đổi container</option>
            </select>
          </div>

          {/* Container Number */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 8
            }}>
              Mã container *
            </label>
            <input
              type="text"
              value={form.container_no}
              onChange={(e) => handleInputChange('container_no', e.target.value)}
              placeholder="Nhập mã định danh container"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'monospace',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* ETA */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 8
            }}>
              Thời gian dự kiến đến (ETA)
            </label>
            <input
              type="datetime-local"
              value={form.eta}
              onChange={(e) => handleInputChange('eta', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{
              fontSize: 12,
              color: '#6b7280',
              marginTop: 4
            }}>
              Để trống nếu chưa biết thời gian chính xác
            </div>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: 14,
              color: message.ok ? '#065f46' : '#dc2626',
              background: message.ok ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${message.ok ? '#a7f3d0' : '#fecaca'}`
            }}>
              {message.text}
            </div>
          )}

                     {/* Document Upload Section */}
           {createdRequestId && (
             <DocumentUpload
               requestId={createdRequestId}
               onUploadSuccess={() => {
                 setMessage({ text: 'Chứng từ đã được upload thành công!', ok: true });
               }}
               onUploadError={(error) => {
                 setMessage({ text: `Lỗi upload: ${error}`, ok: false });
               }}
             />
           )}

           {/* Action Buttons */}
           <div style={{
             display: 'flex',
             gap: 12,
             justifyContent: 'flex-end',
             marginTop: 20
           }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                background: 'white',
                color: '#374151',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !form.container_no.trim()}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: 8,
                background: loading || !form.container_no.trim() ? '#9ca3af' : '#3b82f6',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !form.container_no.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading && form.container_no.trim()) {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && form.container_no.trim()) {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
                             {loading ? 'Đang tạo...' : createdRequestId ? 'Hoàn tất' : 'Tạo yêu cầu'}
             </button>
             {createdRequestId && (
               <button
                 type="button"
                 onClick={onSuccess}
                 style={{
                   padding: '12px 24px',
                   border: '1px solid #d1d5db',
                   borderRadius: 8,
                   background: 'white',
                   color: '#374151',
                   fontSize: 14,
                   fontWeight: 600,
                   cursor: 'pointer',
                   transition: 'all 0.2s ease'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.background = '#f9fafb';
                   e.currentTarget.style.borderColor = '#9ca3af';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.background = 'white';
                   e.currentTarget.style.borderColor = '#d1d5db';
                 }}
               >
                 Đóng
               </button>
             )}
           </div>
        </div>
      </form>
    </div>
  );
}
