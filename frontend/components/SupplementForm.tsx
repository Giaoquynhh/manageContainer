import React, { useState, useRef } from 'react';
import { api } from '@services/api';

interface SupplementFormProps {
  requestId: string;
}

export default function SupplementForm({ requestId }: SupplementFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Chỉ chấp nhận file PDF, JPG, PNG!');
        return;
      }

      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File quá lớn! Tối đa 10MB.');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(droppedFile.type)) {
        alert('Chỉ chấp nhận file PDF, JPG, PNG!');
        return;
      }

      // Validate file size (10MB)
      if (droppedFile.size > 10 * 1024 * 1024) {
        alert('File quá lớn! Tối đa 10MB.');
        return;
      }

      setFile(droppedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      alert('Vui lòng chọn file!');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'SUPPLEMENT');

      await api.post(`/requests/${requestId}/docs`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Upload tài liệu bổ sung thành công!');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
         } catch (error: any) {
       console.error('Upload error:', error);
       console.error('Error response:', error.response);
       console.error('Error message:', error.response?.data?.message);
       alert(error.response?.data?.message || 'Upload thất bại!');
     } finally {
      setIsUploading(false);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="supplement-form">
      <div className="supplement-form-content">
        <form onSubmit={handleSubmit}>
          <div className="supplement-upload-area">
            <div className="supplement-instructions">
              <p>Upload tài liệu bổ sung (PDF, JPG, PNG, tối đa 10MB)</p>
            </div>

            <div
              className={`supplement-drop-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleChooseFile}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              
              {file ? (
                <div className="file-info">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <div className="drop-zone-icon">📁</div>
                  <div className="drop-zone-text">
                    Kéo thả file vào đây hoặc chọn file
                  </div>
                  <div className="drop-zone-hint">
                    PDF, JPG, PNG (tối đa 10MB)
                  </div>
                </div>
              )}
            </div>

            <div className="supplement-actions">
              <button
                type="submit"
                className="supplement-upload-btn"
                disabled={!file || isUploading}
              >
                {isUploading ? '⏳ Đang upload...' : '📤 Upload'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
