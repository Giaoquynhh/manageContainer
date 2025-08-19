interface RepairTableProps {
  repairs: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function RepairTable({ repairs, onApprove, onReject }: RepairTableProps) {
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
                             r.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                  color: r.status === 'PENDING_APPROVAL' ? '#92400e' : 
                         r.status === 'APPROVED' ? '#065f46' : '#991b1b'
                }}>
                  {r.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' :
                   r.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
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
