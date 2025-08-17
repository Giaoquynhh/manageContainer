import React from 'react';
import { api } from '@services/api';
import ChatWindowStandalone from './chat/ChatWindowStandalone';

interface Request {
  id: string;
  type: string;
  container_no: string;
  eta: string;
  status: string;
  rejected_reason?: string;
  latest_payment?: any;
  documents?: any[];
}

interface RequestTableProps {
  data?: (Request & {
    actions?: {
      softDeleteRequest?: (id: string, scope: 'depot' | 'customer') => void;
      restoreRequest?: (id: string, scope: 'depot' | 'customer') => void;
      loadingId?: string;
      changeStatus?: (id: string, status: string) => void;
      sendPayment?: (id: string) => void;
      		handleOpenSupplementPopup?: (id: string) => void;
      actLabel?: Record<string, string>;
    };
  })[];
  loading?: boolean;
  userRole?: string;
}

export default function RequestTable({ data, loading, userRole }: RequestTableProps) {
  const [selectedDocument, setSelectedDocument] = React.useState<any>(null);
  const [showImageModal, setShowImageModal] = React.useState(false);
  const [activeChatRequests, setActiveChatRequests] = React.useState<Set<string>>(new Set());

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Chờ xử lý', className: 'status-pending' },
      RECEIVED: { label: 'Đã nhận', className: 'status-received' },
      COMPLETED: { label: 'Hoàn thành', className: 'status-completed' },
      EXPORTED: { label: 'Đã xuất', className: 'status-exported' },
      REJECTED: { label: 'Từ chối', className: 'status-rejected' },
      IN_YARD: { label: 'Trong kho', className: 'status-in-yard' },
      LEFT_YARD: { label: 'Đã rời kho', className: 'status-left-yard' }
    };

    const config = statusConfig[status] || { label: status, className: 'status-default' };
    return (
      <span className={`status-badge ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      IMPORT: 'Nhập',
      EXPORT: 'Xuất',
      CONVERT: 'Chuyển đổi'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const hasDocuments = (request: Request) => {
    return request.documents && request.documents.length > 0;
  };

  const handleDocumentClick = (document: any) => {
    setSelectedDocument(document);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedDocument(null);
  };

  const toggleChat = (requestId: string) => {
    setActiveChatRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const getFileUrl = (filename: string) => {
    return `/backend/requests/documents/${filename}`;
  };

  const isImageFile = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '');
  };

  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <div className="empty-icon">📋</div>
        <p>Chưa có yêu cầu nào</p>
        <small>Tạo yêu cầu đầu tiên để bắt đầu</small>
      </div>
    );
  }

  return (
    <>
      <div className="table-container">
        <table className="table table-modern">
          <thead>
            <tr>
              <th>Loại</th>
              <th>Container</th>
              <th>ETA</th>
              <th>Trạng thái</th>
              <th>Chứng từ</th>
              <th>Thanh toán</th>
              <th>Chat</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="table-row">
                <td>
                  <span className="type-label">
                    {getTypeLabel(item.type)}
                  </span>
                </td>
                <td>
                  <span className="container-id">
                    {item.container_no}
                  </span>
                </td>
                <td>
                  {item.eta ? (
                    <span className="eta-date">
                      {new Date(item.eta).toLocaleString('vi-VN')}
                    </span>
                  ) : (
                    <span className="eta-empty">-</span>
                  )}
                </td>
                <td>
                  {getStatusBadge(item.status)}
                </td>
                <td>
                  {hasDocuments(item) ? (
                    <div className="document-badges">
                      {item.documents?.map((doc: any, index: number) => (
                        <button
                          key={doc.id}
                          className="document-badge clickable"
                          onClick={() => handleDocumentClick(doc)}
                          title={`Xem ${doc.name}`}
                        >
                          📎 {doc.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="no-document">-</span>
                  )}
                </td>
                <td>
                  {item.latest_payment && (
                    <span className="payment-badge">
                      Đã gửi yêu cầu thanh toán
                    </span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => toggleChat(item.id)}
                    className={`btn btn-sm ${activeChatRequests.has(item.id) ? 'btn-primary' : 'btn-outline'}`}
                    title={activeChatRequests.has(item.id) ? 'Đóng chat' : 'Mở chat'}
                  >
                    💬 {activeChatRequests.has(item.id) ? 'Đóng Chat' : 'Chat'}
                  </button>
                </td>
                <td>
                  {item.actions && (
                    <div className="action-buttons">
                      {/* Accept button for PENDING requests (Depot only) */}
                      {item.status === 'PENDING' && userRole && ['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(userRole) && item.actions.changeStatus && (
                        <button
                          className="btn btn-sm btn-primary"
                          disabled={item.actions.loadingId === item.id + 'RECEIVED'}
                          onClick={() => item.actions!.changeStatus!(item.id, 'RECEIVED')}
                          title="Tiếp nhận yêu cầu"
                        >
                          {item.actions.loadingId === item.id + 'RECEIVED' ? '⏳' : '✅'} Tiếp nhận
                        </button>
                      )}

                      {/* Send Details button for RECEIVED requests (Customer only) */}
                      {item.status === 'RECEIVED' && userRole && ['CustomerAdmin', 'CustomerUser'].includes(userRole) && (
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => {
                            // TODO: Open upload modal
                            alert('Tính năng upload đang được phát triển!');
                          }}
                          title="Gửi thông tin chi tiết"
                        >
                          📎 Gửi thông tin
                        </button>
                      )}

                      {/* Bổ sung thông tin button for SCHEDULED requests (Customer only) */}
                      {item.status === 'SCHEDULED' && userRole && ['CustomerAdmin', 'CustomerUser'].includes(userRole) && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            							if (item.actions?.handleOpenSupplementPopup) {
								item.actions.handleOpenSupplementPopup(item.id);
							} else {
								alert('Tính năng bổ sung thông tin đang được phát triển!');
							}
                          }}
                          title="Bổ sung thông tin"
                        >
                          📋 Bổ sung thông tin
                        </button>
                      )}

                      {/* Status change buttons for Depot */}
                      {userRole && ['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(userRole) && item.actions.changeStatus && (
                        <>
                          {item.status === 'RECEIVED' && (
                            <button
                              className="btn btn-sm btn-success"
                              disabled={item.actions.loadingId === item.id + 'COMPLETED'}
                              onClick={() => item.actions!.changeStatus!(item.id, 'COMPLETED')}
                              title="Hoàn tất"
                            >
                              {item.actions.loadingId === item.id + 'COMPLETED' ? '⏳' : '✅'} Hoàn tất
                            </button>
                          )}
                          {item.status === 'COMPLETED' && (
                            <button
                              className="btn btn-sm btn-warning"
                              disabled={item.actions.loadingId === item.id + 'EXPORTED'}
                              onClick={() => item.actions!.changeStatus!(item.id, 'EXPORTED')}
                              title="Xuất kho"
                            >
                              {item.actions.loadingId === item.id + 'EXPORTED' ? '⏳' : '📦'} Xuất kho
                            </button>
                          )}
                          {(item.status === 'PENDING' || item.status === 'RECEIVED') && (
                            <button
                              className="btn btn-sm btn-danger"
                              disabled={item.actions.loadingId === item.id + 'REJECTED'}
                              onClick={() => item.actions!.changeStatus!(item.id, 'REJECTED')}
                              title="Từ chối"
                            >
                              {item.actions.loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} Từ chối
                            </button>
                          )}
                        </>
                      )}

                      {/* Payment button */}
                      {item.status === 'COMPLETED' && userRole && ['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(userRole) && item.actions.sendPayment && (
                        <button
                          className="btn btn-sm btn-info"
                          disabled={item.actions.loadingId === item.id + 'PAY'}
                          onClick={() => item.actions!.sendPayment!(item.id)}
                          title="Gửi yêu cầu thanh toán"
                        >
                          {item.actions.loadingId === item.id + 'PAY' ? '⏳' : '💰'} Thanh toán
                        </button>
                      )}

                      {/* Soft delete for REJECTED requests */}
                      {item.status === 'REJECTED' && item.actions.softDeleteRequest && (
                        <button
                          className="btn btn-sm btn-outline"
                          disabled={item.actions.loadingId === item.id + 'DELETE'}
                          onClick={() => {
                            if (window.confirm('Xóa khỏi danh sách của bạn?\nRequest vẫn hiển thị trạng thái Từ chối bên Kho.')) {
                              item.actions!.softDeleteRequest!(item.id, 'customer');
                            }
                          }}
                          title="Xóa khỏi danh sách"
                        >
                          {item.actions.loadingId === item.id + 'DELETE' ? '⏳' : '🗑️'} Xóa
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Image Viewer Modal */}
      {showImageModal && selectedDocument && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>{selectedDocument.name}</h3>
              <button className="image-modal-close" onClick={closeImageModal}>
                ✕
              </button>
            </div>
            <div className="image-modal-body">
              {isImageFile(selectedDocument.storage_key) ? (
                <img
                  src={getFileUrl(selectedDocument.storage_key)}
                  alt={selectedDocument.name}
                  className="document-image"
                />
              ) : (
                <div className="document-preview">
                  <div className="document-icon">📄</div>
                  <p>File: {selectedDocument.name}</p>
                  <p>Kích thước: {(selectedDocument.size / 1024).toFixed(1)} KB</p>
                  <a
                    href={getFileUrl(selectedDocument.storage_key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    Tải xuống file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Windows - Render for each active chat */}
      {Array.from(activeChatRequests).map((requestId, index) => {
        const request = data?.find((r: any) => r.id === requestId);
        if (!request) return null;
        

        
        return (
          <ChatWindowStandalone
            key={requestId}
            requestId={requestId}
            requestStatus={request.status}
            rejectedReason={request.rejected_reason}
            requestType={request.type}
            containerNo={request.container_no}
            appointmentTime={request.appointment_time}
            appointmentLocation={request.appointment_location_type && request.appointment_location_id ? 
              `${request.appointment_location_type} ${request.appointment_location_id}` : undefined}
            appointmentNote={request.appointment_note}
            position={{ 
              x: typeof window !== 'undefined' ? window.innerWidth - 420 - (index * 420) : 20 + (index * 420),
              y: typeof window !== 'undefined' ? window.innerHeight - 520 : 20
            }}
            onClose={() => toggleChat(requestId)}
            onStatusChange={(newStatus) => {
              console.log(`Request ${requestId} status changed to: ${newStatus}`);
            }}
          />
        );
      })}
    </>
  );
}
