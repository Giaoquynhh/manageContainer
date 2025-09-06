import { useState, useEffect } from 'react';
import { api } from '@services/api';
import { useTranslation } from '../hooks/useTranslation';

interface RequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RequestForm({ onSuccess, onCancel }: RequestFormProps) {
  const { t } = useTranslation();
  
  // Hàm tạo thời gian mặc định
  const getDefaultDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    return { date, time };
  };

  const [form, setForm] = useState({ 
    type: 'IMPORT', 
    container_no: '', 
    etaDate: '', 
    etaTime: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Thiết lập thời gian mặc định khi component mount
  useEffect(() => {
    const { date, time } = getDefaultDateTime();
    setForm(prev => ({
      ...prev,
      etaDate: date,
      etaTime: time
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation dựa trên loại yêu cầu
    if (form.type === 'IMPORT') {
      if (!form.container_no.trim()) {
        setMessage(t('pages.requests.form.validation.containerIdRequired'));
        setLoading(false);
        return;
      }
      if (selectedFiles.length === 0) {
        setMessage(t('pages.requests.form.validation.documentRequired'));
        setLoading(false);
        return;
      }
    }
    
    // Validation cho EXPORT - chứng từ là bắt buộc
    if (form.type === 'EXPORT') {
      if (selectedFiles.length === 0) {
        setMessage('Chứng từ là bắt buộc cho yêu cầu xuất khẩu');
        setLoading(false);
        return;
      }
    }
    
    if (!form.etaDate || !form.etaTime) {
      setMessage(t('pages.requests.form.validation.etaRequired'));
      setLoading(false);
      return;
    }

    try {
      // Tạo FormData để upload file
      const formData = new FormData();
      formData.append('type', form.type);
      
      // Gửi container_no cho loại IMPORT
      if (form.type === 'IMPORT') {
        formData.append('container_no', form.container_no);
      }
      
      // Gửi documents cho cả IMPORT và EXPORT
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file, index) => {
          formData.append(`documents`, file);
        });
      }
      
      // ETA luôn được gửi cho cả 2 loại
      if (form.etaDate && form.etaTime) {
        const etaDateTime = `${form.etaDate}T${form.etaTime}`;
        formData.append('eta', etaDateTime);
      }

      await api.post('/requests', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setMessage(t('pages.requests.form.success'));
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
      
      const validFiles: File[] = [];
      
      for (const file of files) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const hasValidMimeType = allowedMimeTypes.includes(file.type);
        const hasValidExtension = fileExtension && allowedExtensions.includes(`.${fileExtension}`);
        
        if (!hasValidMimeType && !hasValidExtension) {
          setMessage(`${t('pages.requests.form.validation.invalidFileType')}: ${file.name}`);
          return;
        }
        
        // Kiểm tra kích thước file (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setMessage(`${t('pages.requests.form.validation.fileTooLarge')}: ${file.name}`);
          return;
        }
        
        validFiles.push(file);
      }
      
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setMessage('');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setMessage('');
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="request-form">
      <div className="form-group">
        <label htmlFor="type">{t('pages.requests.form.requestType')}</label>
        <select 
          id="type"
          value={form.type} 
          onChange={e => setForm({...form, type: e.target.value})}
          required
        >
          <option value="IMPORT">{t('pages.requests.filterOptions.import')}</option>
          <option value="EXPORT">{t('pages.requests.filterOptions.export')}</option>
        </select>
      </div>

      {/* Luồng Nhập - hiển thị khi type = IMPORT */}
      {form.type === 'IMPORT' && (
        <>
          <div className="form-group">
            <label htmlFor="container_no">{t('pages.requests.form.containerId')} <span className="required">*</span></label>
            <input 
              id="container_no"
              type="text"
              placeholder={t('pages.requests.form.containerIdPlaceholder')} 
              value={form.container_no} 
              onChange={e => setForm({...form, container_no: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label htmlFor="documents">{t('pages.requests.form.documents')} <span className="required">*</span></label>
            <div className="file-upload-container">
              <input
                id="documents"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="file-input"
                multiple
              />
              <label htmlFor="documents" className="file-upload-label">
                <span className="file-upload-icon">📎</span>
                <span className="file-upload-text">
                  {selectedFiles.length > 0 
                    ? `${selectedFiles.length} file(s) đã chọn` 
                    : t('pages.requests.form.selectDocumentFile')
                  }
                </span>
              </label>
            </div>
            
            {/* Hiển thị danh sách files đã chọn */}
            {selectedFiles.length > 0 && (
              <div className="files-list">
                <div className="files-header">
                  <span>Files đã chọn ({selectedFiles.length}):</span>
                  <button 
                    type="button" 
                    onClick={clearAllFiles}
                    className="clear-all-btn"
                  >
                    Xóa tất cả
                  </button>
                </div>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-preview">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button 
                      type="button" 
                      onClick={() => removeFile(index)}
                      className="file-remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <small className="file-hint">
              {t('pages.requests.form.fileFormat')} - Có thể chọn nhiều file cùng lúc
            </small>
          </div>
        </>
      )}

      {/* ETA - hiển thị cho cả 2 loại */}
      <div className="form-group">
        <label htmlFor="eta">{t('pages.requests.form.eta')} <span className="required">*</span></label>
        <div className="eta-inputs">
          <div className="eta-date">
            <input 
              id="etaDate"
              type="date" 
              value={form.etaDate} 
              onChange={e => setForm({...form, etaDate: e.target.value})}
              required
            />
          </div>
          <div className="eta-time">
            <input 
              id="etaTime"
              type="time" 
              value={form.etaTime} 
              onChange={e => setForm({...form, etaTime: e.target.value})}
              required
            />
          </div>
        </div>
      </div>

      {/* Luồng Xuất - hiển thị khi type = EXPORT */}
      {form.type === 'EXPORT' && (
        <div className="form-group">
          <label htmlFor="export-documents">Chứng từ <span className="required">*</span></label>
          <div className="file-upload-container">
            <input
              id="export-documents"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="file-input"
              multiple
            />
            <label htmlFor="export-documents" className="file-upload-label">
              <span className="file-upload-icon">📎</span>
              <span className="file-upload-text">
                {selectedFiles.length > 0 
                  ? `${selectedFiles.length} file(s) đã chọn` 
                  : 'Chọn chứng từ (PDF, JPG, PNG)'
                }
              </span>
            </label>
          </div>
          
          {/* Hiển thị danh sách files đã chọn */}
          {selectedFiles.length > 0 && (
            <div className="files-list">
              <div className="files-header">
                <span>Files đã chọn ({selectedFiles.length}):</span>
                <button 
                  type="button" 
                  onClick={clearAllFiles}
                  className="clear-all-btn"
                >
                  Xóa tất cả
                </button>
              </div>
              {selectedFiles.map((file, index) => (
                <div key={index} className="file-preview">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button 
                    type="button" 
                    onClick={() => removeFile(index)}
                    className="file-remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <small className="file-hint">
            Định dạng hỗ trợ: PDF, JPG, PNG - Có thể chọn nhiều file cùng lúc
          </small>
        </div>
      )}

      {message && (
        <div className={`form-message ${message.includes(t('pages.requests.form.success')) ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="form-actions">
        <button 
          type="button" 
          className="btn btn-outline" 
          onClick={onCancel}
          disabled={loading}
        >
          {t('pages.requests.form.cancel')}
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? t('pages.requests.form.creating') : t('pages.requests.form.createRequest')}
        </button>
      </div>
    </form>
  );
}
