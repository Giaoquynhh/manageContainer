import React from 'react';
import { maintenanceApi } from '@services/maintenance';

interface RepairTableProps {
  repairs: any[];
  onPassStandard: (id: string) => void;
  onFailStandard: (id: string) => void;
  onRepairable: (id: string) => void;
  onUnrepairable: (id: string) => void;
  onEditInvoice: (id: string) => void;
  onRequestConfirmation: (id: string) => void;
}

export default function RepairTable({ repairs, onPassStandard, onFailStandard, onRepairable, onUnrepairable, onEditInvoice, onRequestConfirmation }: RepairTableProps) {
  const fmt = (n: any) => {
    const num = Number(n || 0);
    return num.toLocaleString('vi-VN');
  };

  const handleViewPDF = async (repairId: string) => {
    try {
      // Gọi API với authentication để lấy PDF
      const response = await maintenanceApi.downloadRepairInvoicePDF(repairId);
      
      // Tạo blob từ response data
      const blob = new Blob([response], { type: 'application/pdf' });
      
      // Tạo URL cho blob
      const url = window.URL.createObjectURL(blob);
      
      // Mở PDF trong tab mới
      window.open(url, '_blank');
      
      // Cleanup URL sau khi sử dụng
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      console.error('Lỗi khi tải PDF:', error);
      alert('Lỗi khi tải PDF: ' + (error.message || 'Không thể tải file'));
    }
  };

  return (
    <div style={{ overflow: 'auto' }}>
      <table className="table" style={{ width: '100%', minWidth: '900px' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Mã</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Container No</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Trạng thái</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Mô tả</th>
            <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Chi phí (đ)</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Hóa đơn</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {(repairs || []).map((r: any) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px 8px' }}>{r.code}</td>
              <td style={{ padding: '12px 8px' }}>{r.container_no || r.equipment?.code || '-'}</td>
              <td style={{ padding: '12px 8px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                                     background: r.status === 'CHECKING' ? '#fbbf24' :
                              r.status === 'PENDING_ACCEPT' ? '#f59e0b' :
                              r.status === 'REPAIRING' ? '#3b82f6' :
                              r.status === 'CHECKED' ? '#10b981' :
                              r.status === 'REJECTED' ? '#ef4444' : '#fee2e2',
                  color: r.status === 'CHECKING' ? '#78350f' :
                         r.status === 'PENDING_ACCEPT' ? '#92400e' :
                         r.status === 'REPAIRING' ? '#1e40af' :
                         r.status === 'CHECKED' ? '#065f46' : 
                         r.status === 'REJECTED' ? '#991b1b' : '#991b1b'
                }}>
                                     {r.status === 'CHECKING' ? 'Đang kiểm tra' :
                    r.status === 'PENDING_ACCEPT' ? 'Chờ chấp nhận' :
                    r.status === 'REPAIRING' ? 'Đang sửa chữa' :
                    r.status === 'CHECKED' ? 'Đã kiểm tra' :
                    r.status === 'REJECTED' ? 'Đã từ chối' : 'Không xác định'}
                </span>
              </td>
              <td style={{ padding: '12px 8px', maxWidth: '200px' }} title={r.problem_description}>
                {r.problem_description || '-'}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>{fmt(r.estimated_cost)}</td>
              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                {r.hasInvoice ? (
                  <button 
                    onClick={() => handleViewPDF(r.id)}
                    style={{
                      padding: '4px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      background: '#3b82f6',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    title="Xem hóa đơn PDF"
                  >
                    📄 Xem chi tiết
                  </button>
                ) : (
                  <span style={{ 
                    color: '#6b7280', 
                    fontSize: '12px',
                    fontStyle: 'italic'
                  }}>
                    Chưa có hóa đơn
                  </span>
                )}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'center' }}>

                {r.status === 'PENDING_ACCEPT' && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => onEditInvoice(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#3b82f6',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Sửa hóa đơn sửa chữa"
                    >
                      ✏️ Sửa hóa đơn
                    </button>
                    <button 
                      onClick={() => onRequestConfirmation(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#f59e0b',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Gửi yêu cầu xác nhận từ khách hàng"
                    >
                      📧 Gửi yêu cầu xác nhận
                    </button>
                  </div>
                )}
                {r.status === 'CHECKING' && !r.manager_comment?.includes('không đạt chuẩn') && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button 
                      onClick={() => onPassStandard(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#10b981',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Đạt chuẩn
                    </button>
                    <button 
                      onClick={() => onFailStandard(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#f59e0b',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Không đạt chuẩn
                    </button>
                  </div>
                )}
                {r.status === 'CHECKING' && r.manager_comment?.includes('không đạt chuẩn') && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button 
                      onClick={() => onRepairable(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#3b82f6',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Có thể sửa chữa
                    </button>
                    <button 
                      onClick={() => onUnrepairable(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Không thể sửa chữa
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {(!repairs || repairs.length === 0) && (
            <tr>
              <td colSpan={7} style={{
                padding: '40px 8px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Không có phiếu sửa chữa nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
