interface PendingContainersModalFooterProps {
  onClose: () => void;
}

export default function PendingContainersModalFooter({ onClose }: PendingContainersModalFooterProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: '20px'
    }}>
      <button 
        onClick={onClose}
        style={{
          padding: '8px 16px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Đóng
      </button>
    </div>
  );
}
