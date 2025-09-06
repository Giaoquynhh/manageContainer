import React, { useState } from 'react';
import { api } from '@services/api';
import ChatWindowStandalone from './chat/ChatWindowStandalone';
import InvoiceViewer from './InvoiceViewer';
import { useTranslation } from '../hooks/useTranslation';

interface Request {
  id: string;
  type: string;
  container_no: string;
  eta: string;
  status: string;
  rejected_reason?: string;
  latest_payment?: any;
  documents?: any[];
  has_invoice?: boolean;
  is_paid?: boolean;
  appointment_time?: string;
  appointment_location_type?: string;
  appointment_location_id?: string;
  appointment_note?: string;
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
      handleViewInvoice?: (id: string) => void;
      handleAccept?: (id: string) => void;
      handleAcceptScheduled?: (id: string) => void;
      handleRejectByCustomer?: (id: string, reason: string) => void;
      handleRejectWithModal?: (id: string) => void;
      onDeleteWithModal?: (id: string) => void;
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
  const [showInvoiceViewer, setShowInvoiceViewer] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const { t, currentLanguage } = useTranslation();
  const dateLocale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';

  // Format ETA giống như Depot
  const formatETA = (eta?: string) => {
    if (!eta) return '-';
    const d = new Date(eta);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: t('pages.requests.filterOptions.pending'), className: 'status-pending' },
      PICK_CONTAINER: { label: t('pages.requests.filterOptions.pickContainer'), className: 'status-pick-container' },
      RECEIVED: { label: t('pages.requests.filterOptions.received'), className: 'status-received' },
      COMPLETED: { label: t('pages.requests.filterOptions.completed'), className: 'status-completed' },
      EXPORTED: { label: t('pages.requests.filterOptions.exported'), className: 'status-exported' },
      REJECTED: { label: t('pages.requests.filterOptions.rejected'), className: 'status-rejected' },
      SCHEDULED: { label: t('pages.requests.filterOptions.scheduled'), className: 'status-scheduled' },
      FORWARDED: { label: t('pages.gate.statusOptions.forwarded'), className: 'status-forwarded' },
      POSITIONED: { label: t('pages.requests.filterOptions.positioned'), className: 'status-positioned' },
      FORKLIFTING: { label: t('pages.requests.filterOptions.forklifting'), className: 'status-forklifting' },
      IN_YARD: { label: t('pages.requests.filterOptions.inYard'), className: 'status-in-yard' },
      IN_CAR: { label: t('pages.requests.filterOptions.inCar'), className: 'status-in-car' },
      LEFT_YARD: { label: t('pages.requests.filterOptions.leftYard'), className: 'status-left-yard' },
      PENDING_ACCEPT: { label: t('pages.requests.filterOptions.pendingAccept'), className: 'status-pending-accept' },
      ACCEPT: { label: t('pages.requests.filterOptions.approved'), className: 'status-accept' },
      GATE_IN: { label: t('pages.gate.statusOptions.gateIn'), className: 'status-gate-in' },
      GATE_OUT: { label: t('pages.gate.statusOptions.gateOut'), className: 'status-gate-out' },
      GATE_REJECTED: { label: t('pages.gate.statusOptions.gateRejected'), className: 'status-gate-rejected' },
      CHECKING: { label: t('pages.requests.filterOptions.checking'), className: 'status-checking' },
      CHECKED: { label: t('pages.requests.filterOptions.checked'), className: 'status-checked' }
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
      IMPORT: t('pages.requests.filterOptions.import'),
      EXPORT: t('pages.requests.filterOptions.export'),
      CONVERT: t('pages.requests.filterOptions.convert')
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

  // Function để xem hóa đơn
  const handleViewInvoice = (requestId: string) => {
    setSelectedRequestId(requestId);
    setShowInvoiceViewer(true);
  };

  // Function để thanh toán hóa đơn
  const handlePayment = async (requestId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn thanh toán hóa đơn này?')) {
      try {
        // Cập nhật trạng thái thanh toán
        const response = await fetch(`http://localhost:5002/requests/${requestId}/payment-status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ is_paid: true }),
        });
        
        if (response.ok) {
          alert('✅ Thanh toán thành công! Hóa đơn đã được cập nhật trạng thái.');
          // Refresh trang để cập nhật dữ liệu
          window.location.reload();
        } else {
          alert('❌ Lỗi khi cập nhật trạng thái thanh toán');
        }
      } catch (error) {
        console.error('Lỗi thanh toán:', error);
        alert('❌ Lỗi khi thực hiện thanh toán');
      }
    }
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

  const isPdfFile = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    return ext === 'pdf';
  };


  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <div className="empty-icon">📋</div>
        <p>{t('pages.requests.noRequests')}</p>
        <small>{t('pages.requests.noRequestsSubtitle')}</small>
      </div>
    );
  }

  return (
    <>
      <div className="table-container">
        <table className="table table-modern">
          <thead>
            <tr>
              <th data-column="type">{t('pages.requests.typeLabel')}</th>
              <th data-column="container">{t('pages.requests.tableHeaders.container')}</th>
              <th data-column="eta">{t('pages.requests.tableHeaders.eta')}</th>
              <th data-column="status">{t('pages.requests.tableHeaders.status')}</th>
              <th data-column="documents">{t('pages.requests.tableHeaders.documents')}</th>
              <th data-column="payment">{t('pages.requests.actions.payment')}</th>
              <th data-column="chat">{t('pages.requests.tableHeaders.chat')}</th>
              <th data-column="actions">{t('pages.requests.tableHeaders.actions')}</th>
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
                    <div className="eta-date">
                      {formatETA(item.eta)}
                    </div>
                  ) : (
                    <div className="eta-empty">-</div>
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
                  <div className="payment-status-info">
                    {/* Hiển thị trạng thái thanh toán chính */}
                    <div className="payment-status">
                      <span className={`status-indicator ${item.is_paid ? 'paid' : 'unpaid'}`}>
                        {item.is_paid ? '💰' : '⏳'} 
                        {item.is_paid ? t('pages.requests.payment.paid') : t('pages.requests.payment.unpaid')}
                      </span>
                    </div>
                    {/* Hiển thị thông tin payment request nếu có */}
                    {item.latest_payment && !item.is_paid && (
                      <div className="payment-request-info">
                        <span className="payment-request-badge">
                          📤 {t('pages.requests.messages.paymentRequestSent')}
                        </span>
                      </div>
                    )}
                    {/* Hiển thị trạng thái hóa đơn (phụ) */}
                    {item.has_invoice && (
                      <div className="invoice-status">
                        <span className="status-indicator has-invoice">
                          📄 {t('pages.requests.invoice.has')}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => toggleChat(item.id)}
                    className={`btn btn-sm ${activeChatRequests.has(item.id) ? 'btn-primary' : 'btn-outline'}`}
                    title={activeChatRequests.has(item.id) ? t('pages.requests.chat.close') : t('pages.requests.chat.open')}
                  >
                    💬 {activeChatRequests.has(item.id) ? t('pages.requests.chat.close') : t('pages.requests.tableHeaders.chat')}
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
                          title={t('pages.requests.actions.acceptRequest')}
                        >
                          {item.actions.loadingId === item.id + 'RECEIVED' ? '⏳' : '✅'} {t('pages.requests.actions.accept')}
                        </button>
                      )}

                      {/* Send Details button for RECEIVED requests (Customer only) */}
                      {item.status === 'RECEIVED' && userRole && ['CustomerAdmin', 'CustomerUser'].includes(userRole) && (
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => {
                            // TODO: Open upload modal
                            alert(t('pages.requests.messages.uploadFeatureInDevelopment'));
                          }}
                          title={t('pages.requests.actions.sendDetails')}
                        >
                          📎 {t('pages.requests.actions.sendDetails')}
                        </button>
                      )}

                      {/* Bổ sung thông tin button for SCHEDULED requests (Customer only) */}
                      {item.status === 'SCHEDULED' && userRole && ['CustomerAdmin', 'CustomerUser'].includes(userRole) && (
                        <>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              							if (item.actions?.handleOpenSupplementPopup) {
									item.actions.handleOpenSupplementPopup(item.id);
								} else {
									alert(t('pages.requests.messages.supplementFeatureInDevelopment'));
								}
                            }}
                            title={t('pages.requests.actions.supplementInfo')}
                          >
                            📋 {t('pages.requests.actions.supplementInfo')}
                          </button>
                          <button
                            className="btn btn-sm btn-success"
                            disabled={item.actions.loadingId === item.id + 'ACCEPT_SCHEDULED'}
                            onClick={() => {
                              if (item.actions?.handleAcceptScheduled) {
                                item.actions.handleAcceptScheduled(item.id);
                              } else {
                                alert(t('pages.requests.messages.acceptScheduledFeatureInDevelopment'));
                              }
                            }}
                            title={t('pages.requests.actions.acceptScheduled')}
                          >
                            {item.actions.loadingId === item.id + 'ACCEPT_SCHEDULED' ? '⏳' : '✅'} {t('pages.requests.actions.accept')}
                          </button>
                        </>
                      )}

                      {/* Status change buttons for Depot */}
                      {userRole && ['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(userRole) && item.actions.changeStatus && (
                        <>
                          {item.status === 'RECEIVED' && (
                            <button
                              className="btn btn-sm btn-success"
                              disabled={item.actions.loadingId === item.id + 'COMPLETED'}
                              onClick={() => item.actions!.changeStatus!(item.id, 'COMPLETED')}
                              title={t('pages.requests.actions.complete')}
                            >
                              {item.actions.loadingId === item.id + 'COMPLETED' ? '⏳' : '✅'} {t('pages.requests.actions.complete')}
                            </button>
                          )}
                          {item.status === 'COMPLETED' && (
                            <button
                              className="btn btn-sm btn-warning"
                              disabled={item.actions.loadingId === item.id + 'EXPORTED'}
                              onClick={() => item.actions!.changeStatus!(item.id, 'EXPORTED')}
                              title={t('pages.requests.actions.export')}
                            >
                              {item.actions.loadingId === item.id + 'EXPORTED' ? '⏳' : '📦'} {t('pages.requests.actions.export')}
                            </button>
                          )}
                          {(item.status === 'PENDING' || item.status === 'RECEIVED') && (
                            <button
                              className="btn btn-sm btn-danger"
                              disabled={item.actions.loadingId === item.id + 'REJECTED'}
                              onClick={() => item.actions!.changeStatus!(item.id, 'REJECTED')}
                              title={t('pages.requests.actions.reject')}
                            >
                              {item.actions.loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} {t('pages.requests.actions.reject')}
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
                          title={t('pages.requests.actions.sendPaymentTitle')}
                        >
                          {item.actions.loadingId === item.id + 'PAY' ? '⏳' : '💰'} {t('pages.requests.actions.payment')}
                        </button>
                      )}

                      {/* Actions for PENDING_ACCEPT requests (Customer only) */}
                      {item.status === 'PENDING_ACCEPT' && userRole && ['CustomerAdmin', 'CustomerUser'].includes(userRole) && (
                        <>
                                                     <button
                             className="btn btn-sm btn-info"
                             disabled={item.actions.loadingId === item.id + 'VIEW_INVOICE'}
                             onClick={() => {
                               if (item.actions?.handleViewInvoice) {
                                 item.actions.handleViewInvoice(item.id);
                               } else {
                                 alert(t('pages.requests.messages.viewInvoiceFeatureInDevelopment'));
                               }
                             }}
                             title={t('pages.requests.actions.viewRepairInvoiceTitle')}
                           >
                             {item.actions.loadingId === item.id + 'VIEW_INVOICE' ? '⏳' : '📄'} {t('pages.requests.actions.viewRepairInvoice')}
                           </button>
                          <button
                            className="btn btn-sm btn-success"
                            disabled={item.actions.loadingId === item.id + 'ACCEPT'}
                            onClick={() => {
                              if (item.actions?.handleAcceptWithModal) {
                                item.actions.handleAcceptWithModal(item.id);
                              } else if (item.actions?.handleAccept) {
                                if (window.confirm(t('pages.requests.messages.confirmAcceptRepairInvoice'))) {
                                  item.actions.handleAccept(item.id);
                                }
                              } else {
                                alert(t('pages.requests.messages.acceptFeatureInDevelopment'));
                              }
                            }}
                            title={t('pages.requests.actions.acceptRepairInvoice')}
                          >
                            {item.actions.loadingId === item.id + 'ACCEPT' ? '⏳' : '✅'} {t('pages.requests.actions.accept')}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={item.actions.loadingId === item.id + 'REJECT'}
                            onClick={() => {
                              if (item.actions?.handleRejectWithModal) {
                                item.actions.handleRejectWithModal(item.id);
                              } else if (item.actions?.handleRejectByCustomer) {
                                const reason = window.prompt(t('pages.requests.prompts.enterRejectionReason'));
                                if (reason) {
                                  item.actions.handleRejectByCustomer(item.id, reason);
                                }
                              } else {
                                alert(t('pages.requests.messages.rejectFeatureInDevelopment'));
                              }
                            }}
                            title={t('pages.requests.actions.rejectRepairInvoice')}
                          >
                            {item.actions.loadingId === item.id + 'REJECT' ? '⏳' : '❌'} {t('pages.requests.actions.reject')}
                          </button>
                        </>
                      )}

                      {/* Soft delete for REJECTED requests */}
                      {item.status === 'REJECTED' && (item.actions.softDeleteRequest || item.actions.onDeleteWithModal) && (
                        <button
                          className="btn btn-sm btn-outline"
                          disabled={item.actions.loadingId === item.id + 'DELETE'}
                          onClick={() => {
                            if (item.actions.onDeleteWithModal) {
                              item.actions.onDeleteWithModal(item.id);
                            } else if (item.actions.softDeleteRequest) {
                              if (window.confirm(t('pages.requests.messages.confirmSoftDeleteCustomer'))) {
                                item.actions.softDeleteRequest(item.id, 'customer');
                              }
                            }
                          }}
                          title={t('pages.requests.actions.removeFromList')}
                        >
                          {item.actions.loadingId === item.id + 'DELETE' ? '⏳' : '🗑️'} {t('common.remove')}
                        </button>
                      )}

                      {/* Invoice and Payment actions for requests with invoices */}
                      {item.has_invoice && userRole && ['CustomerAdmin', 'CustomerUser'].includes(userRole) && (
                        <>
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => handleViewInvoice(item.id)}
                            title={t('pages.requests.actions.viewInvoice')}
                          >
                            📄 {t('pages.requests.actions.viewInvoice')}
                          </button>
                          {!item.is_paid && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handlePayment(item.id)}
                              title={t('pages.requests.actions.payInvoice')}
                            >
                              💰 {t('pages.requests.actions.payment')}
                            </button>
                          )}
                        </>
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
              ) : isPdfFile(selectedDocument.storage_key) ? (
                <div className="pdf-viewer">
                  <iframe
                    src={getFileUrl(selectedDocument.storage_key)}
                    title={selectedDocument.name}
                    className="pdf-iframe"
                    style={{
                      width: '100%',
                      height: '500px',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  />
                  <div className="pdf-info" style={{ marginTop: '10px', textAlign: 'center' }}>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                      File: {selectedDocument.name}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#999' }}>
                      Kích thước: {(selectedDocument.size / 1024).toFixed(1)} KB
                    </p>
                    <a
                      href={getFileUrl(selectedDocument.storage_key)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="download-link"
                      style={{
                        display: 'inline-block',
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      📥 Tải xuống PDF
                    </a>
                  </div>
                </div>
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
            onClose={() => toggleChat(requestId)}
            onStatusChange={(newStatus) => {
              console.log(`Request ${requestId} status changed to: ${newStatus}`);
            }}
            positionIndex={index}
          />
        );
      })}

      {/* Invoice Viewer */}
      <InvoiceViewer
        requestId={selectedRequestId}
        visible={showInvoiceViewer}
        onClose={() => {
          setShowInvoiceViewer(false);
          setSelectedRequestId('');
        }}
      />
    </>
  );
}
