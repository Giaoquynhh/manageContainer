import React, { useState, useEffect } from 'react';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  documentId: string;
  fileName: string;
  fileType: string;
}

export default function DocumentViewer({ 
  isOpen, 
  onClose, 
  requestId, 
  documentId, 
  fileName, 
  fileType 
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && requestId && documentId) {
      generateFileUrl();
    }
  }, [isOpen, requestId, documentId]);

  const generateFileUrl = () => {
    setLoading(true);
    setError(null);
    
    console.log('🔍 DocumentViewer Debug:', {
      requestId,
      documentId,
      fileName,
      fileType
    });
    
    // Sử dụng URL trực tiếp đến backend như Depot
    // Không cần token vì route này public
    const url = `/backend/requests/documents/${documentId}`;
    console.log('🚀 Generated URL:', url);
    
    setFileUrl(url);
    setLoading(false); // Không cần loading vì URL đã sẵn sàng
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError('Không thể hiển thị hình ảnh');
  };

  const handlePdfLoad = () => {
    setLoading(false);
  };

  const handlePdfError = () => {
    setLoading(false);
    setError('Không thể hiển thị PDF');
  };

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      link.click();
    }
  };

  const isImage = fileType.toLowerCase().includes('image');
  const isPdf = fileType.toLowerCase().includes('pdf');
  const canPreview = isImage || isPdf;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay document-viewer-overlay" onClick={onClose}>
      <div className="modal-content document-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Xem chứng từ: {fileName}</h3>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={handleDownload}>
              📥 Tải xuống
            </button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Đang tải file...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>❌ {error}</p>
              <button onClick={generateFileUrl} className="retry-btn">
                Thử lại
              </button>
            </div>
          ) : fileUrl ? (
            <div className="document-preview">
              {isImage ? (
                <img 
                  src={fileUrl} 
                  alt={fileName}
                  className="image-preview"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              ) : isPdf ? (
                <iframe
                  src={fileUrl}
                  title={fileName}
                  className="pdf-preview"
                  onLoad={handlePdfLoad}
                  onError={handlePdfError}
                />
              ) : (
                <div className="file-info">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <h4>{fileName}</h4>
                    <p>Loại file: {fileType}</p>
                    <p>Không thể xem trước file này</p>
                    <button className="btn btn-primary" onClick={handleDownload}>
                      📥 Tải xuống để xem
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
