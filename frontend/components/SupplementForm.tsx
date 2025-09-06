import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { api } from '@services/api';
import { useTranslation } from '../hooks/useTranslation';

interface SupplementFormProps {
  requestId: string;
  onSuccess?: () => void;
}

export default function SupplementForm({ requestId, onSuccess }: SupplementFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const validFiles: File[] = [];
      
      for (const file of selectedFiles) {
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          toast.error(`File ${file.name}: ${t('pages.requests.supplementFileTypeError')}`);
          continue;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name}: ${t('pages.requests.supplementFileSizeError')}`);
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
      }
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

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const validFiles: File[] = [];
      
      for (const file of droppedFiles) {
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          toast.error(`File ${file.name}: ${t('pages.requests.supplementFileTypeError')}`);
          continue;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name}: ${t('pages.requests.supplementFileSizeError')}`);
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.warning(t('pages.requests.supplementNoFileWarning'));
      return;
    }

    setIsUploading(true);
    try {
      // Upload tất cả file cùng lúc
      console.log('Uploading files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('type', 'SUPPLEMENT');

      console.log('FormData contents:', {
        files: formData.getAll('files'),
        type: formData.get('type'),
        requestId
      });

      const response = await api.post(`/requests/${requestId}/docs/multiple`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response.data);

      // Thông báo sẽ được hiển thị qua callback onSuccess
      
      setFiles([]);
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
              className={`supplement-drop-zone ${dragActive ? 'drag-active' : ''} ${files.length > 0 ? 'has-file' : ''}`}
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
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              
              {files.length > 0 ? (
                <div className="files-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-info">
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
                          setFiles(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
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
                disabled={files.length === 0 || isUploading}
              >
                {isUploading ? `⏳ ${t('pages.requests.supplementUploading')}` : `📤 ${t('pages.requests.supplementUploadButton')} (${files.length} file${files.length !== 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
