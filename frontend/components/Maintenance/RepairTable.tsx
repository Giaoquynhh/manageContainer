interface RepairTableProps {
  repairs: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPassStandard: (id: string) => void;
  onFailStandard: (id: string) => void;
  onRepairable: (id: string) => void;
  onUnrepairable: (id: string) => void;
}

export default function RepairTable({ repairs, onApprove, onReject, onPassStandard, onFailStandard, onRepairable, onUnrepairable }: RepairTableProps) {
  const fmt = (n: any) => {
    const num = Number(n || 0);
    return num.toLocaleString('vi-VN');
  };

  return (
    <div style={{ overflow: 'auto' }}>
      <table className="table" style={{ width: '100%', minWidth: '800px' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Mã</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Container No</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Trạng thái</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Mô tả</th>
            <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Chi phí (đ)</th>
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
                  background: r.status === 'PENDING_APPROVAL' ? '#fef3c7' : 
                             r.status === 'CHECKING' ? '#fbbf24' :
                             r.status === 'PENDING_ACCEPT' ? '#f59e0b' :
                             r.status === 'REPAIRING' ? '#3b82f6' :
                             r.status === 'CHECKED' ? '#10b981' :
                             r.status === 'REJECTED' ? '#ef4444' : '#fee2e2',
                  color: r.status === 'PENDING_APPROVAL' ? '#92400e' : 
                         r.status === 'CHECKING' ? '#78350f' :
                         r.status === 'PENDING_ACCEPT' ? '#92400e' :
                         r.status === 'REPAIRING' ? '#1e40af' :
                         r.status === 'CHECKED' ? '#065f46' : 
                         r.status === 'REJECTED' ? '#991b1b' : '#991b1b'
                }}>
                  {r.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' :
                   r.status === 'CHECKING' ? 'Đang kiểm tra' :
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
                {r.status === 'PENDING_APPROVAL' && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button 
                      onClick={() => onApprove(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#059669',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Duyệt
                    </button>
                    <button 
                      onClick={() => onReject(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#dc2626',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Từ chối
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
              <td colSpan={6} style={{
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
