import React from 'react';

interface TestContainerEmptyProps {
  onTest: () => void;
}

export default function TestContainerEmpty({ onTest }: TestContainerEmptyProps) {
  return (
    <div style={{
      padding: '16px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      background: '#f9fafb',
      marginBottom: '16px'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>🧪 Test Chức Năng</h4>
             <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
         Để test chức năng "Container rỗng có trong bãi":
       </p>
       <ol style={{ margin: '0 0 12px 0', paddingLeft: '20px', fontSize: '14px', color: '#6b7280' }}>
         <li>Đăng nhập với tài khoản SystemAdmin</li>
         <li>Vào trang Yard (/Yard)</li>
         <li>Click vào một slot và bấm "HOLD tier kế tiếp"</li>
         <li>Nhập container number tùy ý và bấm "Confirm"</li>
         <li>Vào trang ContainersPage và chọn filter "Container rỗng có trong bãi"</li>
         <li>Container sẽ hiển thị với trạng thái "Container rỗng có trong bãi"</li>
       </ol>
               <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: '6px', 
          padding: '8px', 
          marginTop: '8px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <strong>Trạng thái EMPTY_IN_YARD:</strong> Container được SystemAdmin nhập trực tiếp vào bãi 
          (không có trạng thái trên hệ thống) sẽ có derived_status = 'EMPTY_IN_YARD'
        </div>
        <div style={{ 
          background: '#10b981', 
          border: '1px solid #059669', 
          borderRadius: '6px', 
          padding: '8px', 
          marginTop: '8px',
          fontSize: '12px',
          color: '#064e3b'
        }}>
          <strong>✅ Chức năng đã hoạt động:</strong> Container được SystemAdmin nhập sẽ hiển thị với trạng thái "Container rỗng có trong bãi"
        </div>
              <button 
          onClick={onTest}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '12px'
          }}
        >
          🔄 Refresh Data
        </button>
    </div>
  );
}
