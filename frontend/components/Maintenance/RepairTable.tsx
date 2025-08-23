interface RepairTableProps {
  repairs: any[];
  onApprove: (id: string) => void;
  onReject: (id: string, action?: string) => void;
  showChoiceButtons: string | null;
  onChoiceSelect: (id: string, action?: string) => void;
}

export default function RepairTable({ repairs, onApprove, onReject, showChoiceButtons, onChoiceSelect }: RepairTableProps) {
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
                             <td style={{ padding: '12px 8px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <span>{r.code}</span>
                   {r.code.startsWith('AUTO-') && (
                     <span style={{
                       padding: '2px 6px',
                       borderRadius: '8px',
                       fontSize: '10px',
                       fontWeight: '500',
                       background: '#fef3c7',
                       color: '#92400e'
                     }}>
                       Tự động
                     </span>
                   )}
                   {r.isContainer && (
                     <span style={{
                       padding: '2px 6px',
                       borderRadius: '8px',
                       fontSize: '10px',
                       fontWeight: '500',
                       background: '#dbeafe',
                       color: '#1e40af'
                     }}>
                       Chờ xử lý
                     </span>
                   )}
                 </div>
               </td>
              <td style={{ padding: '12px 8px' }}>{r.container_no || r.equipment?.code || '-'}</td>
              <td style={{ padding: '12px 8px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                                     background: r.status === 'GATE_IN' ? '#fef3c7' : 
                              r.status === 'CHECKING' ? '#dbeafe' :
                              r.status === 'CHECKED' ? '#fef3c7' :
                              r.status === 'CHECKING_CONFIRM' ? '#d1fae5' :
                              r.status === 'REPAIRING' ? '#fef3c7' :
                              r.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                   color: r.status === 'GATE_IN' ? '#92400e' : 
                          r.status === 'CHECKING' ? '#1e40af' :
                          r.status === 'CHECKED' ? '#92400e' :
                          r.status === 'CHECKING_CONFIRM' ? '#065f46' :
                          r.status === 'REPAIRING' ? '#92400e' :
                          r.status === 'APPROVED' ? '#065f46' : '#991b1b'
                }}>
                                     {r.status === 'GATE_IN' ? 'Chờ kiểm tra' :
                    r.status === 'CHECKING' ? 'Đang kiểm tra' :
                    r.status === 'CHECKED' ? 'Đã kiểm tra' :
                    r.status === 'CHECKING_CONFIRM' ? 'Đang chờ xác nhận' :
                    r.status === 'REPAIRING' ? 'Đang sửa chữa' :
                    r.status === 'APPROVED' ? 'Đã duyệt' : 'Đã bị từ chối'}
                </span>
              </td>
                             <td style={{ padding: '12px 8px', maxWidth: '200px' }} title={r.problem_description}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                   <span>{r.problem_description || '-'}</span>
                   {r.manager_comment && r.manager_comment.includes('Tự động tạo') && (
                     <span style={{
                       fontSize: '11px',
                       color: '#6b7280',
                       fontStyle: 'italic'
                     }}>
                       💡 {r.manager_comment}
                     </span>
                   )}
                   {r.isContainer && r.driver_name && (
                     <span style={{
                       fontSize: '11px',
                       color: '#1e40af',
                       fontWeight: '500'
                     }}>
                       🚛 Tài xế: {r.driver_name}
                     </span>
                   )}
                   {r.isContainer && r.license_plate && (
                     <span style={{
                       fontSize: '11px',
                       color: '#1e40af',
                       fontWeight: '500'
                     }}>
                       🚗 Biển số: {r.license_plate}
                     </span>
                   )}
                 </div>
               </td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>{fmt(r.estimated_cost)}</td>
              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                 {r.status === 'GATE_IN' && (
                   <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                     {r.isContainer ? (
                       // Container đang chờ - chỉ hiển thị nút bắt đầu kiểm tra
                       <div style={{ display: 'flex', justifyContent: 'center' }}>
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
                           Bắt đầu kiểm tra
                         </button>
                       </div>
                     ) : (
                       // Phiếu sửa chữa thật - hiển thị nút duyệt
                       <>
                         <button 
                           onClick={() => onApprove(r.id)}
                           style={{
                             padding: '4px 8px',
                             border: 'none',
                             borderRadius: '4px',
                             background: r.code.startsWith('AUTO-') ? '#1e40af' : '#059669',
                             color: 'white',
                             cursor: 'pointer',
                             fontSize: '12px'
                           }}
                         >
                           {r.code.startsWith('AUTO-') ? 'Bắt đầu kiểm tra' : 'Duyệt'}
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
                       </>
                     )}
                   </div>
                 )}
                                 {r.status === 'CHECKING_CONFIRM' && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button 
                      onClick={() => onApprove(r.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#1e40af',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Xác nhận
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
                                 {r.status === 'CHECKING' && (
                   <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                     {showChoiceButtons === r.id ? (
                       // Khi đang hiển thị 2 button lựa chọn, chỉ hiển thị 2 button đó
                       <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                         <button 
                           onClick={() => onChoiceSelect(r.id, 'can_repair')}
                           style={{
                             padding: '4px 8px',
                             border: 'none',
                             borderRadius: '4px',
                             background: '#059669',
                             color: 'white',
                             cursor: 'pointer',
                             fontSize: '11px',
                             whiteSpace: 'nowrap'
                           }}
                         >
                           Có thể sửa chữa
                         </button>
                         <button 
                           onClick={() => onChoiceSelect(r.id, 'cannot_repair')}
                           style={{
                             padding: '4px 8px',
                             border: 'none',
                             borderRadius: '4px',
                             background: '#dc2626',
                             color: 'white',
                             cursor: 'pointer',
                             fontSize: '11px',
                             whiteSpace: 'nowrap'
                           }}
                         >
                           Không thể sửa chữa
                         </button>
                       </div>
                     ) : (
                       // Khi chưa chọn, hiển thị cả 2 button gốc
                       <>
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
                           Đạt chuẩn
                         </button>
                         <button 
                           onClick={() => onReject(r.id, 'show_options')}
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
                           Không đạt chuẩn
                         </button>
                       </>
                     )}
                   </div>
                 )}
                                 {r.status === 'CHECKED' && (
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
