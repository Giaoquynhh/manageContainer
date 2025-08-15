import { useState, useRef } from 'react';
import { api } from '@services/api';

interface DocumentUploadProps {
  requestId: string;
  onUploadSuccess: () => void;
  onUploadError: (error: string) => void;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

export default function DocumentUpload({ requestId, onUploadSuccess, onUploadError }: DocumentUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList) => {
    Array.from(files).forEach(file => {
      uploadFile(file);
    });
  };

  const uploadFile = async (file: File) => {
    // Kiểm tra file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError('Chỉ hỗ trợ file JPG, PNG, PDF');
      return;
    }

    // Kiểm tra kích thước (10MB)
    if (file.size > 10 * 1024 * 1024) {
      onUploadError('File không được lớn hơn 10MB');
      return;
    }

    const fileId = Date.now().toString();
    const uploadingFile: UploadingFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading'
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('request_id', requestId);
      formData.append('type', 'DOCUMENT');

      const response = await api.post('/requests/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, progress, status: progress === 100 ? 'success' : 'uploading' }
                : f
            )
          );
        },
      });

      if (response.status === 201) {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'success' }
              : f
          )
        );
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error' }
            : f
        )
      );
      
      const errorMessage = error?.response?.data?.message || 'Lỗi upload file';
      onUploadError(errorMessage);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeUploadingFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div style={{ marginTop: 20 }}>
      <label style={{
        display: 'block',
        fontSize: 14,
        fontWeight: 600,
        color: '#374151',
        marginBottom: 8
      }}>
        Chứng từ (JPG, PNG, PDF - tối đa 10MB)
      </label>

      {/* Drag & Drop Zone */}
      <div
        style={{
          border: `2px dashed ${isDragOver ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: 8,
          padding: 20,
          textAlign: 'center',
          background: isDragOver ? '#eff6ff' : '#f9fafb',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{ fontSize: 16, color: '#6b7280', marginBottom: 8 }}>
          📎 Kéo thả file vào đây hoặc click để chọn
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          Hỗ trợ: JPG, PNG, PDF (tối đa 10MB)
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.pdf"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
      />

      {/* Uploading files list */}
      {uploadingFiles.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            Đang upload ({uploadingFiles.length})
          </h4>
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                marginBottom: 8,
                background: 'white'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {formatFileSize(file.size)}
                </div>
                {file.status === 'uploading' && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{
                      width: '100%',
                      height: 4,
                      background: '#e5e7eb',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${file.progress}%`,
                        height: '100%',
                        background: '#3b82f6',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      {file.progress}%
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {file.status === 'success' && (
                  <span style={{ color: '#10b981', fontSize: 16 }}>✅</span>
                )}
                {file.status === 'error' && (
                  <span style={{ color: '#ef4444', fontSize: 16 }}>❌</span>
                )}
                <button
                  type="button"
                  onClick={() => removeUploadingFile(file.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: 4
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

