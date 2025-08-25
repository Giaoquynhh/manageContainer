interface PendingContainersModalHeaderProps {
  onClose: () => void;
  title?: string;
}

export default function PendingContainersModalHeader({ onClose, title }: PendingContainersModalHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
        {title || 'Danh sách container đang chờ'}
      </h3>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: '#666'
        }}
      >
        ×
      </button>
    </div>
  );
}
