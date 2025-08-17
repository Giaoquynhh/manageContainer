import React, { useState, useRef } from 'react';
import { api } from '@services/api';

interface UploadSupplementModalProps {
  requestId: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadSupplementModal({ 
  requestId, 
  visible, 
  onClose, 
  onSuccess 
}: UploadSupplementModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Chỉ chấp nhận file PDF hoặc ảnh (JPG, PNG)');
        return;
      }
      
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File quá lớn. Kích thước tối đa là 10MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Vui lòng chọn file để upload');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'SUPPLEMENT');

      await api.post(`/requests/${requestId}/docs`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const event = {
        target: { files: [droppedFile] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Bổ sung thông tin</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
              disabled={loading}
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Upload tài liệu bổ sung (PDF, JPG, PNG, tối đa 10MB)
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <div>
                  <div className="text-green-600 text-2xl mb-2">✓</div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 text-3xl mb-2">📎</div>
                  <p className="text-sm text-gray-600">
                    Kéo thả file vào đây hoặc <span className="text-blue-600">chọn file</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG (tối đa 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                disabled={loading || !file}
              >
                {loading ? 'Đang upload...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
