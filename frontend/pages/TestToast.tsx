import React, { useEffect } from 'react';
import { useToast } from '../hooks/useToastHook';

export default function TestToast() {
  const { showSuccess, showError, showWarning, showInfo, ToastContainer } = useToast();

  useEffect(() => {
    // Test toast ngay khi component mount
    setTimeout(() => {
      showSuccess('✅ Test Success', 'Toast notifications đang hoạt động!');
    }, 1000);
  }, [showSuccess]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Toast Notifications</h1>
      <p>Nếu bạn thấy toast ở góc phải màn hình thì hệ thống đang hoạt động.</p>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          onClick={() => showSuccess('✅ Success', 'Thành công!')}
          style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px' }}
        >
          Test Success
        </button>
        
        <button 
          onClick={() => showError('❌ Error', 'Có lỗi xảy ra!')}
          style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px' }}
        >
          Test Error
        </button>
        
        <button 
          onClick={() => showWarning('⚠️ Warning', 'Cảnh báo!')}
          style={{ padding: '10px 20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px' }}
        >
          Test Warning
        </button>
        
        <button 
          onClick={() => showInfo('ℹ️ Info', 'Thông tin!')}
          style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px' }}
        >
          Test Info
        </button>
      </div>

      <ToastContainer />
    </div>
  );
}


