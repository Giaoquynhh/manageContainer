import React, { useState } from 'react';
import GateActionButtons from './GateActionButtons';
import DocumentsModal from './DocumentsModal';
import { useTranslation } from '../../../hooks/useTranslation';

interface GateRequest {
  id: string;
  container_no: string;
  type: string;
  status: string;
  eta?: string;
  forwarded_at?: string;
  license_plate?: string; // Biển số xe
  driver_name?: string;   // Tên tài xế
  time_in?: string;       // Thời gian vào
  time_out?: string;      // Thời gian ra
  docs: any[];
  attachments: any[];
}

interface GateRequestTableProps {
  requests: GateRequest[];
  loading: boolean;
  onRefresh: () => void;
}

export default function GateRequestTable({ requests, loading, onRefresh }: GateRequestTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<GateRequest | null>(null);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const { t, currentLanguage } = useTranslation();

  // Helpers: map raw type/status codes to localized labels
  const typeLabel = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return `📥 ${t('pages.gate.typeOptions.import')}`;
      case 'EXPORT':
        return `📤 ${t('pages.gate.typeOptions.export')}`;
      case 'EMPTY':
        return `🗳️ ${t('pages.gate.typeOptions.empty')}`;
      default:
        return type;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return t('pages.gate.statusOptions.scheduled');
      case 'FORWARDED':
        return t('pages.gate.statusOptions.forwarded');
      case 'GATE_IN':
        return `🟢 ${t('pages.gate.statusOptions.gateIn')}`;
      case 'GATE_OUT':
        return `🟣 ${t('pages.gate.statusOptions.gateOut')}`;
      case 'GATE_REJECTED':
        return `⛔ ${t('pages.gate.statusOptions.gateRejected')}`;
      case 'COMPLETED':
        return t('pages.gate.statusOptions.completed');
      default:
        return status;
    }
  };

  const handleViewDocuments = (request: GateRequest) => {
    setSelectedRequest(request);
    setDocumentsModalOpen(true);
  };

  const closeDocumentsModal = () => {
    setDocumentsModalOpen(false);
    setSelectedRequest(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h3>{t('pages.gate.noData')}</h3>
        <p>{t('pages.gate.noRequestsToDisplay')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="gate-table-container">
        <table className="gate-table">
          <thead>
            <tr>
              <th data-column="container">{t('pages.gate.tableHeaders.container')}</th>
              <th data-column="type">{t('pages.gate.tableHeaders.type')}</th>
              <th data-column="status">{t('pages.gate.tableHeaders.status')}</th>
              <th data-column="eta">{t('pages.gate.tableHeaders.eta')}</th>
              <th data-column="driver">{t('pages.gate.tableHeaders.driverName')}</th>
              <th data-column="license-plate">{t('pages.gate.tableHeaders.licensePlate')}</th>
              <th data-column="time-in">Thời gian vào</th>
              <th data-column="time-out">Thời gian ra</th>
              <th data-column="documents">{t('pages.gate.tableHeaders.documents')}</th>
              <th data-column="actions">{t('pages.gate.tableHeaders.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>
                  <strong>{request.container_no}</strong>
                </td>
                <td>
                  <span className={`type-badge type-${request.type.toLowerCase()}`}>
                    {typeLabel(request.type)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${request.status.toLowerCase().replace(/_/g, '-')}`}>
                    {statusLabel(request.status)}
                  </span>
                </td>
                <td>{request.eta ? new Date(request.eta).toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US') : t('common.na')}</td>
                <td>
                  <span className="driver-name">
                    {request.driver_name || t('common.na')}
                  </span>
                </td>
                <td>
                  <span className="license-plate">
                    {request.license_plate || t('common.na')}
                  </span>
                </td>
                <td>
                  <span className="time-in">
                    {request.time_in ? new Date(request.time_in).toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US') : t('common.na')}
                  </span>
                </td>
                <td>
                  <span className="time-out">
                    {request.time_out ? new Date(request.time_out).toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US') : t('common.na')}
                  </span>
                </td>
                <td>
                  <div className="documents-cell">
                    {request.docs && request.docs.length > 0 ? (
                      <>
                        <div className="document-count-badge">
                          <div className="document-count-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14,2 14,8 20,8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10,9 9,9 8,9"></polyline>
                            </svg>
                          </div>
                          <div className="document-count-content">
                            <span className="document-count-number">{request.docs.length}</span>
                            <span className="document-count-label">{t('pages.gate.tableHeaders.documents')}</span>
                          </div>
                        </div>
                        <button
                          className="view-documents-btn"
                          onClick={() => handleViewDocuments(request)}
                          title={t('pages.gate.viewDocuments')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          {t('pages.gate.viewDetail')}
                        </button>
                      </>
                    ) : (
                      <div className="no-documents">
                        <div className="no-documents-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10,9 9,9 8,9"></polyline>
                          </svg>
                        </div>
                        <span className="no-documents-text">{t('pages.gate.noDocuments')}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <GateActionButtons
                    requestId={request.id}
                    requestType={request.type}
                    currentStatus={request.status}
                    onActionSuccess={onRefresh}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Documents Modal */}
      {selectedRequest && (
        <DocumentsModal
          isOpen={documentsModalOpen}
          onClose={closeDocumentsModal}
          requestId={selectedRequest.id}
          containerNo={selectedRequest.container_no}
        />
      )}
    </>
  );
}
