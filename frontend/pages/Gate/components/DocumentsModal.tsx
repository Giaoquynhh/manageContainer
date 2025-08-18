import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import DocumentViewer from './DocumentViewer';

interface Document {
  id: string;
  type: string;
  name: string;
  size: number;
  version: number;
  created_at: string;
  storage_key: string;
}

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  containerNo: string;
}

export default function DocumentsModal({ isOpen, onClose, requestId, containerNo }: DocumentsModalProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchDocuments();
    }
  }, [isOpen, requestId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Không có token xác thực');
        return;
      }
      
      const response = await api.get(`/gate/requests/${requestId}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setDocuments(response.data.data.documents);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách chứng từ:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách chứng từ');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedDocument(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeIcon = (type: string): string => {
    switch (type.toUpperCase()) {
      case 'EIR':
        return '📋';
      case 'LOLO':
        return '📄';
      case 'INVOICE':
        return '🧾';
      case 'SUPPLEMENT':
        return '📎';
      default:
        return '📄';
    }
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'document';
    if (['xls', 'xlsx'].includes(ext)) return 'spreadsheet';
    return 'file';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content documents-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Chứng từ - Container {containerNo}</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Đang tải danh sách chứng từ...</p>
              </div>
            ) : error ? (
              <div className="error-message">
                <p>❌ {error}</p>
                <button onClick={fetchDocuments} className="retry-btn">
                  Thử lại
                </button>
              </div>
            ) : documents.length === 0 ? (
              <div className="no-documents">
                <p>📭 Không có chứng từ nào cho request này</p>
              </div>
            ) : (
              <div className="documents-list">
                {documents.map((doc) => (
                  <div key={doc.id} className="document-item">
                    <div className="document-info">
                      <div className="document-icon">
                        {getDocumentTypeIcon(doc.type)}
                      </div>
                      <div className="document-details">
                        <div className="document-name">{doc.name}</div>
                        <div className="document-meta">
                          <span className="document-type">{doc.type}</span>
                          <span className="document-size">{formatFileSize(doc.size)}</span>
                          <span className="document-version">v{doc.version}</span>
                          <span className="document-date">
                            {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="document-actions">
                      <button
                        className="view-btn"
                        onClick={() => handleViewDocument(doc)}
                        title="Xem file"
                      >
                        👁️ Xem
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={closeViewer}
          requestId={requestId}
          documentId={selectedDocument.storage_key}
          fileName={selectedDocument.name}
          fileType={getFileType(selectedDocument.name)}
        />
      )}
    </>
  );
}
