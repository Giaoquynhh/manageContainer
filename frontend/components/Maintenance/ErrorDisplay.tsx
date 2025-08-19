interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
  onClose: () => void;
}

export default function ErrorDisplay({ error, onRetry, onClose }: ErrorDisplayProps) {
  return (
    <div style={{
      padding: '16px',
      marginBottom: '16px',
      borderRadius: '6px',
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
      }}>
        <span>⚠️</span>
        <strong>Lỗi khi tải dữ liệu</strong>
      </div>
      <div style={{ fontSize: '14px', marginBottom: '12px' }}>
        {error}
      </div>
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        <button 
          onClick={onRetry}
          style={{
            padding: '6px 12px',
            border: '1px solid #dc2626',
            borderRadius: '4px',
            background: 'white',
            color: '#dc2626',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Thử lại
        </button>
        <button 
          onClick={onClose}
          style={{
            padding: '6px 12px',
            border: '1px solid #6b7280',
            borderRadius: '4px',
            background: 'white',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
