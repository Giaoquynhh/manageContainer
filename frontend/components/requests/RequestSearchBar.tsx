import { useState } from 'react';

interface RequestSearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
  loading?: boolean;
}

export default function RequestSearchBar({ onSearch, onFilterChange, loading = false }: RequestSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    onFilterChange(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginBottom: 24,
      flexWrap: 'wrap'
    }}>
      {/* Search Input */}
      <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo mã container..."
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px 12px 40px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            background: loading ? '#f9fafb' : 'white'
          }}
          onFocus={(e) => {
            if (!loading) {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }
          }}
          onBlur={(e) => {
            if (!loading) {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }
          }}
        />
        <div style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#9ca3af',
          fontSize: 16
        }}>
          🔍
        </div>
        {searchQuery && (
          <button
            onClick={clearSearch}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              fontSize: 16
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#6b7280';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Status Filter */}
      <select
        value={filter}
        onChange={(e) => handleFilterChange(e.target.value)}
        disabled={loading}
        style={{
          padding: '12px 16px',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          fontSize: 14,
          background: loading ? '#f9fafb' : 'white',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          minWidth: 140
        }}
        onFocus={(e) => {
          if (!loading) {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }
        }}
        onBlur={(e) => {
          if (!loading) {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        <option value="all">Tất cả trạng thái</option>
        <option value="PENDING">Chờ xử lý</option>
        <option value="RECEIVED">Đã tiếp nhận</option>
        <option value="REJECTED">Từ chối</option>
        <option value="COMPLETED">Hoàn tất</option>
        <option value="EXPORTED">Đã xuất kho</option>
        <option value="IN_YARD">Trong bãi</option>
        <option value="LEFT_YARD">Đã rời bãi</option>
      </select>

      {/* Type Filter */}
      <select
        onChange={(e) => handleFilterChange(e.target.value)}
        disabled={loading}
        style={{
          padding: '12px 16px',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          fontSize: 14,
          background: loading ? '#f9fafb' : 'white',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          minWidth: 140
        }}
        onFocus={(e) => {
          if (!loading) {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }
        }}
        onBlur={(e) => {
          if (!loading) {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        <option value="all">Tất cả loại</option>
        <option value="IMPORT">Nhập</option>
        <option value="EXPORT">Xuất</option>
        <option value="CONVERT">Chuyển đổi</option>
      </select>

      {/* Loading Indicator */}
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#6b7280',
          fontSize: 14
        }}>
          <div style={{
            width: 16,
            height: 16,
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Đang tải...
        </div>
      )}
    </div>
  );
}
