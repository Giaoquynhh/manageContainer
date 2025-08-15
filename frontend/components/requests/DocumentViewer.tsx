import { useState, useEffect } from 'react';
import { api } from '@services/api';

interface Document {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

interface DocumentViewerProps {
  requestId: string;
  visible: boolean;
  onClose: () => void;
}

export default function DocumentViewer({ requestId, visible, onClose }: DocumentViewerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && requestId) {
      loadDocuments();
    }
  }, [visible, requestId]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/requests/${requestId}/documents`);
      setDocuments(response.data.data || []);
    } catch (error: any) {
      console.error('Load documents error:', error);
      setError('Không thể tải danh sách chứng từ');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDoc(doc);
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await api.get(
        `/requests/${requestId}/documents/${doc.id}/download`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      alert('Không thể tải xuống file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    return '📎';
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        width: '100%',
        maxWidth: 800,
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: '#111827'
          }}>
            Chứng từ ({documents.length})
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#6b7280',
              padding: 4,
              borderRadius: 4
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          maxHeight: 'calc(90vh - 120px)',
          overflow: 'auto'
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '16px', color: '#6b7280' }}>
                Đang tải chứng từ...
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: 14,
              color: '#dc2626',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          {!loading && documents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '16px', color: '#6b7280' }}>
                Chưa có chứng từ nào
              </div>
            </div>
          )}

          {!loading && documents.length > 0 && (
            <div style={{ display: 'grid', gap: 12 }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: 'white',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{getFileIcon(doc.mimeType)}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                        {doc.originalName}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {formatFileSize(doc.sizeBytes)} • {formatDate(doc.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleViewDocument(doc)}
                      style={{
                        padding: '8px 16px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                      }}
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(doc)}
                      style={{
                        padding: '8px 16px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#10b981';
                      }}
                    >
                      Tải xuống
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Preview Modal */}
        {selectedDoc && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: 12,
              width: '100%',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  {selectedDoc.originalName}
                </h3>
                <button
                  onClick={() => setSelectedDoc(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 20,
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{
                padding: '20px',
                maxHeight: 'calc(90vh - 100px)',
                overflow: 'auto',
                textAlign: 'center'
              }}>
                {selectedDoc.mimeType.startsWith('image/') ? (
                  <img
                    src={`/api/requests/${requestId}/documents/${selectedDoc.id}/view`}
                    alt={selectedDoc.originalName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain'
                    }}
                  />
                ) : selectedDoc.mimeType === 'application/pdf' ? (
                  <iframe
                    src={`/api/requests/${requestId}/documents/${selectedDoc.id}/view`}
                    style={{
                      width: '100%',
                      height: '70vh',
                      border: 'none'
                    }}
                    title={selectedDoc.originalName}
                  />
                ) : (
                  <div style={{ padding: '40px', color: '#6b7280' }}>
                    Không thể xem trước file này
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

