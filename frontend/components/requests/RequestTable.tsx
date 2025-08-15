import { useState } from 'react';
import { api } from '@services/api';
import { mutate } from 'swr';
import DocumentViewer from './DocumentViewer';

interface RequestTableProps {
  data: any[];
  loading: boolean;
  onStatusChange: (id: string, status: string) => void;
  onPaymentRequest: (id: string) => void;
  loadingId: string;
  userRole?: string;
}

export default function RequestTable({ 
  data, 
  loading, 
  onStatusChange, 
  onPaymentRequest, 
  loadingId,
  userRole 
}: RequestTableProps) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  const statusLabels: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    RECEIVED: 'Đã tiếp nhận',
    REJECTED: 'Từ chối',
    COMPLETED: 'Hoàn tất',
    EXPORTED: 'Đã xuất kho',
    IN_YARD: 'Trong bãi',
    LEFT_YARD: 'Đã rời bãi'
  };

  const statusColors: Record<string, string> = {
    PENDING: '#fef3c7',
    RECEIVED: '#dbeafe',
    REJECTED: '#fee2e2',
    COMPLETED: '#d1fae5',
    EXPORTED: '#e0e7ff',
    IN_YARD: '#f3e8ff',
    LEFT_YARD: '#fef2f2'
  };

  const statusTextColors: Record<string, string> = {
    PENDING: '#92400e',
    RECEIVED: '#1e40af',
    REJECTED: '#dc2626',
    COMPLETED: '#065f46',
    EXPORTED: '#3730a3',
    IN_YARD: '#7c3aed',
    LEFT_YARD: '#991b1b'
  };

  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setMessage({ text: `Đã sao chép ${label}`, ok: true });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ text: 'Không thể sao chép', ok: false });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '16px', color: '#6b7280' }}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '16px', color: '#6b7280' }}>Không có yêu cầu nào</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid #e8eef6' }}>
        <table className="table" style={{ margin: 0 }}>
          <thead style={{ background: '#f7f9ff' }}>
            <tr>
              <th style={{ padding: '16px 12px' }}>Loại</th>
              <th style={{ padding: '16px 12px' }}>Container</th>
              <th style={{ padding: '16px 12px' }}>ETA</th>
              <th style={{ padding: '16px 12px' }}>Trạng thái</th>
                             <th style={{ padding: '16px 12px' }}>Mã tra cứu</th>
               <th style={{ padding: '16px 12px' }}>Chứng từ</th>
               {userRole && (userRole === 'SALE_ADMIN' || userRole === 'SYSTEM_ADMIN' || userRole === 'ACCOUNTANT') && (
                 <th style={{ padding: '16px 12px' }}>Hành động</th>
               )}
            </tr>
          </thead>
          <tbody>
            {data.map((item: any) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 12px', fontWeight: 600 }}>
                  {item.type === 'IMPORT' ? 'Nhập' : item.type === 'EXPORT' ? 'Xuất' : 'Chuyển đổi'}
                </td>
                <td style={{ padding: '16px 12px', fontFamily: 'monospace', fontSize: '14px' }}>
                  {item.container_no}
                </td>
                <td style={{ padding: '16px 12px', fontSize: '14px' }}>
                  {formatDate(item.eta)}
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <span style={{
                    background: statusColors[item.status] || '#f3f4f6',
                    color: statusTextColors[item.status] || '#374151',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}>
                    {statusLabels[item.status] || item.status}
                  </span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#1e3a8a', fontFamily: 'monospace' }}>
                      {item.container_no}
                    </span>
                    <button 
                      className="btn" 
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px',
                        background: '#f8fafc',
                        color: '#475569',
                        border: '1px solid #e2e8f0'
                      }}
                      onClick={() => copyToClipboard(item.container_no, 'mã container')}
                    >
                      Sao chép
                    </button>
                  </div>
                                 </td>
                 <td style={{ padding: '16px 12px' }}>
                   <button
                     onClick={() => {
                       setSelectedRequestId(item.id);
                       setShowDocumentViewer(true);
                     }}
                     style={{
                       padding: '6px 12px',
                       fontSize: '12px',
                       background: '#f3f4f6',
                       color: '#374151',
                       border: '1px solid #d1d5db',
                       borderRadius: 6,
                       cursor: 'pointer',
                       transition: 'all 0.2s ease'
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.background = '#e5e7eb';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.background = '#f3f4f6';
                     }}
                   >
                     Xem chi tiết ({item.documentsCount || 0})
                   </button>
                 </td>
                 {userRole && (userRole === 'SALE_ADMIN' || userRole === 'SYSTEM_ADMIN' || userRole === 'ACCOUNTANT') && (
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {item.status === 'PENDING' && (
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px',
                            background: '#10b981',
                            color: 'white'
                          }}
                          disabled={loadingId === item.id + 'RECEIVED'}
                          onClick={() => onStatusChange(item.id, 'RECEIVED')}
                        >
                          {loadingId === item.id + 'RECEIVED' ? 'Đang xử lý...' : 'Tiếp nhận'}
                        </button>
                      )}
                      {(item.status === 'PENDING' || item.status === 'RECEIVED') && (
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px',
                            background: '#ef4444',
                            color: 'white'
                          }}
                          disabled={loadingId === item.id + 'REJECTED'}
                          onClick={() => onStatusChange(item.id, 'REJECTED')}
                        >
                          {loadingId === item.id + 'REJECTED' ? 'Đang xử lý...' : 'Từ chối'}
                        </button>
                      )}
                      {item.status === 'RECEIVED' && (
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px',
                            background: '#3b82f6',
                            color: 'white'
                          }}
                          disabled={loadingId === item.id + 'COMPLETED'}
                          onClick={() => onStatusChange(item.id, 'COMPLETED')}
                        >
                          {loadingId === item.id + 'COMPLETED' ? 'Đang xử lý...' : 'Hoàn tất'}
                        </button>
                      )}
                      {(item.status === 'RECEIVED' || item.status === 'COMPLETED') && (
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px',
                            background: '#8b5cf6',
                            color: 'white'
                          }}
                          disabled={loadingId === item.id + 'EXPORTED'}
                          onClick={() => onStatusChange(item.id, 'EXPORTED')}
                        >
                          {loadingId === item.id + 'EXPORTED' ? 'Đang xử lý...' : 'Đã xuất kho'}
                        </button>
                      )}
                      {item.status === 'COMPLETED' && (
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px',
                            background: '#f59e0b',
                            color: 'white'
                          }}
                          disabled={loadingId === item.id + 'PAY'}
                          onClick={() => onPaymentRequest(item.id)}
                        >
                          {loadingId === item.id + 'PAY' ? 'Đang xử lý...' : 'Gửi yêu cầu thanh toán'}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && (
        <div style={{
          fontSize: 13,
          marginTop: 12,
          padding: '8px 12px',
          borderRadius: 8,
          color: message.ok ? '#065f46' : '#dc2626',
          background: message.ok ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${message.ok ? '#a7f3d0' : '#fecaca'}`
        }}>
          {message.text}
                 </div>
       )}

       {/* Document Viewer Modal */}
       {showDocumentViewer && selectedRequestId && (
         <DocumentViewer
           requestId={selectedRequestId}
           visible={showDocumentViewer}
           onClose={() => {
             setShowDocumentViewer(false);
             setSelectedRequestId(null);
           }}
         />
       )}
     </div>
   );
 }
