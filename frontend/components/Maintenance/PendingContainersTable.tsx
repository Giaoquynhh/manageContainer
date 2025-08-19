interface PendingContainersTableProps {
  requests: any[];
  checkResults: {[key: string]: 'PASS' | 'FAIL' | 'FAIL_WITH_OPTIONS' | 'UNREPAIRABLE' | 'REPAIRABLE' | null};
  onCheckContainer: (requestId: string) => void;
  onCheckResult: (requestId: string, result: 'PASS' | 'FAIL') => void;
  onFailOption: (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => void;
}

export default function PendingContainersTable({ 
  requests, 
  checkResults, 
  onCheckContainer, 
  onCheckResult, 
  onFailOption 
}: PendingContainersTableProps) {
  return (
    <div style={{ overflow: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
      }}>
        <thead>
          <tr style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Container No</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Loại</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Trạng thái</th>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Biển số xe</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {requests.length > 0 ? (
            requests.map((request: any) => (
              <tr key={request.id} style={{
                borderBottom: '1px solid #f1f5f9'
              }}>
                <td style={{ padding: '12px 8px' }}>{request.container_no || '-'}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: request.type === 'IMPORT' ? '#dbeafe' : 
                               request.type === 'EXPORT' ? '#fef3c7' : '#e0e7ff',
                    color: request.type === 'IMPORT' ? '#1e40af' : 
                           request.type === 'EXPORT' ? '#92400e' : '#3730a3'
                  }}>
                    {request.type === 'IMPORT' ? 'Import' :
                     request.type === 'EXPORT' ? 'Export' : request.type}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: request.status === 'GATE_IN' ? '#dbeafe' : 
                               request.status === 'CHECKING' ? '#fef3c7' : 
                               request.status === 'COMPLETED' ? '#d1fae5' :
                               request.status === 'REJECTED' ? '#fee2e2' : '#e0e7ff',
                    color: request.status === 'GATE_IN' ? '#1e40af' : 
                           request.status === 'CHECKING' ? '#92400e' :
                           request.status === 'COMPLETED' ? '#065f46' :
                           request.status === 'REJECTED' ? '#991b1b' : '#3730a3'
                  }}>
                    {request.status}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>{request.license_plate || '-'}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {request.status === 'GATE_IN' && (
                    <button 
                      onClick={() => onCheckContainer(request.id)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#059669',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      Bắt đầu kiểm tra
                    </button>
                  )}
                  
                  {request.status === 'CHECKING' && checkResults[request.id] !== 'FAIL_WITH_OPTIONS' && (
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      justifyContent: 'center'
                    }}>
                      <button 
                        onClick={() => onCheckResult(request.id, 'PASS')}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          background: '#059669',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        Đạt chuẩn
                      </button>
                      <button 
                        onClick={() => onCheckResult(request.id, 'FAIL')}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          background: '#dc2626',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        Không đạt chuẩn
                      </button>
                    </div>
                  )}
                  
                  {request.status === 'CHECKING' && checkResults[request.id] === 'FAIL_WITH_OPTIONS' && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '10px',
                        color: '#dc2626',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        Chọn loại hỏng hóc:
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        justifyContent: 'center'
                      }}>
                        <button 
                          onClick={() => onFailOption(request.id, 'UNREPAIRABLE')}
                          style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            background: '#dc2626',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}
                        >
                          Không thể sửa
                        </button>
                        <button 
                          onClick={() => onFailOption(request.id, 'REPAIRABLE')}
                          style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            background: '#f59e0b',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}
                        >
                          Có thể sửa
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {request.status === 'COMPLETED' && (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: '#d1fae5',
                      color: '#065f46'
                    }}>
                      Đạt chuẩn
                    </span>
                  )}
                  
                  {request.status === 'CHECKING' && checkResults[request.id] === 'REPAIRABLE' && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: '#fef3c7',
                        color: '#92400e'
                      }}>
                        Đang sửa chữa
                      </span>
                      <span style={{
                        fontSize: '10px',
                        color: '#92400e',
                        textAlign: 'center'
                      }}>
                        Đã tạo phiếu sửa chữa
                      </span>
                    </div>
                  )}
                  
                  {request.status === 'REJECTED' && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: '#fee2e2',
                        color: '#991b1b'
                      }}>
                        Bị từ chối
                      </span>
                      <span style={{
                        fontSize: '10px',
                        color: '#dc2626',
                        textAlign: 'center'
                      }}>
                        {request.rejected_reason || 'Container không đạt chuẩn'}
                      </span>
                    </div>
                  )}
                  
                  {request.status !== 'GATE_IN' && request.status !== 'CHECKING' && request.status !== 'COMPLETED' && request.status !== 'REJECTED' && (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: '#e0e7ff',
                      color: '#3730a3'
                    }}>
                      {request.status}
                    </span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{
                padding: '40px 8px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                <div style={{ marginBottom: '8px' }}>📭</div>
                Không có container nào đang chờ
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
