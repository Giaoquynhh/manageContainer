import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  version: number;
  uploader_id: string;
  storage_key: string;
  createdAt: string;
}

interface SupplementDocumentsProps {
  requestId: string;
  onDocumentAction?: () => void;
}

export default function SupplementDocuments({ 
  requestId, 
  onDocumentAction 
}: SupplementDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/requests/${requestId}/docs?type=SUPPLEMENT`);
      setDocuments(response.data.data || []);
    } catch (error: any) {
      console.error('Error loading supplement documents:', error);
      setError('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [requestId]);

  const handleDownload = async (document: Document) => {
    try {
      const response = await api.get(`/backend/requests/documents/${document.storage_key}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Không thể tải xuống file');
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center py-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadDocuments}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📁</div>
          <p className="text-gray-600">Chưa có tài liệu bổ sung nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Tài liệu bổ sung từ khách hàng
        </h3>
        <p className="text-sm text-gray-600">
          {documents.length} tài liệu đã được upload
        </p>
      </div>

      {/* Documents List */}
      <div className="divide-y divide-gray-200">
        {documents.map((doc) => (
          <div key={doc.id} className="px-4 py-3 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getFileIcon(doc.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.name}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>Phiên bản {doc.version}</span>
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(doc)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  title="Tải xuống"
                >
                  📥 Tải
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">
            Tổng cộng: {documents.length} tài liệu
          </span>
          <button
            onClick={loadDocuments}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Làm mới
          </button>
        </div>
      </div>
    </div>
  );
}
