interface RepairPageHeaderProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  onOpenPendingContainers: () => void;
}

export default function RepairPageHeader({ 
  filter, 
  onFilterChange, 
  onOpenPendingContainers
}: RepairPageHeaderProps) {
  return (
    <div style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 16
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 14, color: '#475569' }}>Lọc theo trạng thái:</label>
        <select 
          value={filter} 
          onChange={e => onFilterChange(e.target.value)}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="">Tất cả</option>
          <option value="CHECKING">Đang kiểm tra</option>
          <option value="PENDING_ACCEPT">Chờ chấp nhận</option>
          <option value="REPAIRING">Đang sửa chữa</option>
          <option value="CHECKED">Đã kiểm tra</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>
      </div>
      
      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          onClick={onOpenPendingContainers}
          style={{
            padding: '8px 16px',
            border: '1px solid #1e40af',
            borderRadius: '4px',
            background: 'white',
            color: '#1e40af',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📋</span>
          Danh sách container đang chờ
        </button>
      </div>
    </div>
  );
}
