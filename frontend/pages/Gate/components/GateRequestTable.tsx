import React, { useState } from 'react';
import GateActionButtons from './GateActionButtons';
import DocumentsModal from './DocumentsModal';

interface GateRequest {
  id: string;
  container_no: string;
  type: string;
  status: string;
  eta?: string;
  forwarded_at?: string;
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
        <h3>Không có dữ liệu</h3>
        <p>Không có yêu cầu nào để hiển thị</p>
      </div>
    );
  }

  return (
    <>
      <div className="gate-table-container">
        <div className="gate-table-header">
          <h2>Danh sách yêu cầu ({requests.length})</h2>
        </div>
        
        <table className="gate-table">
          <thead>
            <tr>
              <th>Container</th>
              <th>Loại</th>
              <th>Trạng thái</th>
              <th>ETA</th>
              <th>Chứng từ</th>
              <th>Hành động</th>
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
                    {request.type}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${request.status.toLowerCase()}`}>
                    {request.status}
                  </span>
                </td>
                <td>{request.eta ? new Date(request.eta).toLocaleString('vi-VN') : 'N/A'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ 
                      background: 'var(--color-blue-100)', 
                      color: 'var(--color-blue-800)',
                      padding: 'var(--space-1) var(--space-2)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      {request.docs?.length || 0} chứng từ
                    </span>
                    {request.docs && request.docs.length > 0 && (
                      <button
                        className="action-btn action-btn-secondary"
                        onClick={() => handleViewDocuments(request)}
                        title="Xem danh sách chứng từ"
                      >
                        👁️ Xem
                      </button>
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
