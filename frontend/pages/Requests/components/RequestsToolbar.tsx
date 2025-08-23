import React, { useEffect, useMemo, useState } from 'react';

interface RequestsToolbarProps {
  searchQuery: string;
  onSearchDebounced: (q: string) => void;
  filterType: string;
  onChangeType: (t: string) => void;
  filterStatus: string;
  onChangeStatus: (s: string) => void;
  onClear: () => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'RECEIVED', label: 'Đã nhận' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'EXPORTED', label: 'Đã xuất' },
  { value: 'REJECTED', label: 'Từ chối' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'IMPORT', label: 'Nhập' },
  { value: 'EXPORT', label: 'Xuất' },
  { value: 'CONVERT', label: 'Chuyển đổi' },
];

export default function RequestsToolbar(props: RequestsToolbarProps) {
  const { searchQuery, onSearchDebounced, filterType, onChangeType, filterStatus, onChangeStatus, onClear } = props;

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce 350ms
  useEffect(() => {
    const h = setTimeout(() => {
      if (localSearch !== searchQuery) onSearchDebounced(localSearch);
    }, 350);
    return () => clearTimeout(h);
  }, [localSearch]);

  const chips = useMemo(() => STATUS_OPTIONS.filter(s => s.value !== 'all'), []);

  return (
    <section
      role="region"
      aria-label="Thanh công cụ lọc yêu cầu"
      style={{
        position: 'sticky',
        top: 60,
        zIndex: 9,
        background: 'white',
        padding: '8px 12px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div className="search-input-group" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 320px', minWidth: 240 }}>
        <span aria-hidden>🔎</span>
        <input
          type="search"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Tìm theo mã container…"
          aria-label="Tìm theo mã container"
          style={{
            flex: 1,
            padding: '8px 10px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            outline: 'none',
          }}
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="sr-only">Lọc theo loại</span>
        <select
          value={filterType}
          onChange={(e) => onChangeType(e.target.value)}
          aria-label="Lọc theo loại"
          style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8 }}
        >
          {TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="sr-only">Lọc theo trạng thái</span>
        <select
          value={filterStatus}
          onChange={(e) => onChangeStatus(e.target.value)}
          aria-label="Lọc theo trạng thái"
          style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8 }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>

      <div aria-label="Trạng thái nhanh" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {chips.map(chip => {
          const active = chip.value === filterStatus;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onChangeStatus(active ? 'all' : chip.value)}
              aria-pressed={active}
              title={chip.label}
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                border: `1px solid ${active ? '#2563eb' : '#d1d5db'}`,
                background: active ? '#dbeafe' : 'white',
                color: active ? '#1d4ed8' : '#111827',
                cursor: 'pointer',
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <button type="button" onClick={onClear} aria-label="Xóa tất cả bộ lọc" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>
        Xóa lọc
      </button>
    </section>
  );
}
