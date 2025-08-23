interface RepairPageHeaderProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  onCreateRepair: () => void;
}

export default function RepairPageHeader({ 
  filter, 
  onFilterChange, 
  onCreateRepair 
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
          <option value="GATE_IN">Chờ kiểm tra</option>
          <option value="CHECKING">Đang kiểm tra</option>
          <option value="CHECKED">Đã kiểm tra</option>
          <option value="CHECKING_CONFIRM">Đang chờ xác nhận</option>
          <option value="REPAIRING">Đang sửa chữa</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Đã bị từ chối</option>
        </select>
      </div>
      
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Bỏ nút "Danh sách container đang chờ" - container sẽ hiển thị trực tiếp trong bảng */}
        
        <button 
          onClick={onCreateRepair}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            background: '#1e40af',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>+</span>
          Tạo phiếu mới
        </button>
      </div>
    </div>
  );
}
