import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { api } from '@services/api';
import { useTranslation } from '../hooks/useTranslation';

interface SupplementFormProps {
  requestId: string;
  onSuccess?: () => void;
}

export default function SupplementForm({ requestId, onSuccess }: SupplementFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error(t('pages.requests.supplementFileTypeError'));
        return;
      }

      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error(t('pages.requests.supplementFileSizeError'));
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
        toast.error(t('pages.requests.supplementFileTypeError'));
        return;
      }

      // Validate file size (10MB)
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error(t('pages.requests.supplementFileSizeError'));
        return;
      }

      setFile(droppedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.warning(t('pages.requests.supplementNoFileWarning'));
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'SUPPLEMENT');

      const response = await api.post(`/requests/${requestId}/docs`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Hiển thị thông báo thành công với thông tin về việc tự động chuyển tiếp
      toast.success(t('pages.requests.supplementUploadSuccess'), {
        description: t('pages.requests.supplementUploadSuccessDescription'),
        duration: 5000,
      });
      
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Gọi callback onSuccess nếu có
      if (onSuccess) {
        onSuccess();
      }
         } catch (error: any) {
       console.error('Upload error:', error);
       console.error('Error response:', error.response);
       console.error('Error message:', error.response?.data?.message);
       toast.error(error.response?.data?.message || t('pages.requests.supplementUploadError'));
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
              <p>{t('pages.requests.supplementUploadInstructions')}</p>
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
                    {t('pages.requests.supplementDragDropText')}
                  </div>
                  <div className="drop-zone-hint">
                    {t('pages.requests.supplementFileFormatHint')}
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
                {isUploading ? `⏳ ${t('pages.requests.supplementUploading')}` : `📤 ${t('pages.requests.supplementUploadButton')}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
