import React from 'react';
import { useToast } from '../hooks/useToastHook';

export default function ToastDemo() {
  const { showSuccess, showError, showWarning, showInfo, ToastContainer } = useToast();

  const handleSuccess = () => {
    showSuccess(
      '✅ Thành công!',
      'Đã chuyển trạng thái: GATE_IN - Xe vào kho.\nTên tài xế: Nguyễn Văn A\nBiển số xe: 51A-12345',
      6000
    );
  };

  const handleError = () => {
    showError(
      '❌ Lỗi xảy ra',
      'Không thể kết nối đến server. Vui lòng thử lại sau.',
      5000
    );
  };

  const handleWarning = () => {
    showWarning(
      '⚠️ Cảnh báo',
      'Biển số xe không đúng định dạng. Vui lòng kiểm tra lại.',
      4000
    );
  };

  const handleInfo = () => {
    showInfo(
      'ℹ️ Thông tin',
      'Hệ thống đang xử lý yêu cầu của bạn. Vui lòng đợi...',
      3000
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Toast Notification Demo</h1>
      <p>Click các nút bên dưới để xem các loại thông báo khác nhau:</p>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button 
          onClick={handleSuccess}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Success Toast
        </button>
        
        <button 
          onClick={handleError}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Error Toast
        </button>
        
        <button 
          onClick={handleWarning}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Warning Toast
        </button>
        
        <button 
          onClick={handleInfo}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Info Toast
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f3f4f6', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Tính năng Toast Notification:</h3>
        <ul>
          <li>✅ Hiển thị ở góc phải màn hình</li>
          <li>✅ Animation slide-in mượt mà</li>
          <li>✅ Tự động đóng sau thời gian nhất định</li>
          <li>✅ Có thể đóng thủ công bằng nút X</li>
          <li>✅ Responsive design cho mobile</li>
          <li>✅ 4 loại: Success, Error, Warning, Info</li>
          <li>✅ Hiển thị icon và màu sắc phù hợp</li>
          <li>✅ Hỗ trợ title và message</li>
        </ul>
      </div>

      <ToastContainer />
    </div>
  );
}
