interface MessageDisplayProps {
  message: string;
}

export default function MessageDisplay({ message }: MessageDisplayProps) {
  if (!message) return null;

  return (
    <div style={{
      padding: '8px 12px',
      marginBottom: '16px',
      borderRadius: '4px',
      background: '#dbeafe',
      color: '#1e3a8a',
      fontSize: '14px'
    }}>
      {message}
    </div>
  );
}
