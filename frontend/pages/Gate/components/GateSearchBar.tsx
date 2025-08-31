import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';

type GateSearchParams = {
  status: string;
  container_no: string;
  type: string;
  license_plate: string; // Thêm trường biển số xe
  page: number;
  limit: number;
};

interface GateSearchBarProps {
  searchParams: GateSearchParams;
  onSearch: (params: Partial<GateSearchParams>) => void;
  onContainerSearch: (container_no: string) => void;
  onLicensePlateChange: (license_plate: string) => void; // Thêm handler
}

export default function GateSearchBar({
  searchParams,
  onSearch,
  onContainerSearch,
  onLicensePlateChange
}: GateSearchBarProps) {
  const { t } = useTranslation();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  const handleClearFilters = () => {
    onSearch({
      status: '',
      container_no: '',
      type: '',
      license_plate: '', // Thêm clear license_plate
      page: 1,
      limit: 20
    });
  };

  return (
    <div className="gate-search-section">
      <form onSubmit={handleSubmit}>
        <div className="search-row">
          {/* Container Search */}
          <div className="search-section">
            <input
              type="text"
              className="search-input"
              placeholder={t('pages.gate.searchByContainer')}
              value={searchParams.container_no}
              onChange={(e) => onContainerSearch(e.target.value)}
            />
          </div>

          {/* License Plate Search */}
          <div className="search-section">
            <input
              type="text"
              className="search-input"
              placeholder={t('pages.gate.searchByLicensePlate')}
              value={searchParams.license_plate}
              onChange={(e) => onLicensePlateChange(e.target.value)}
            />
          </div>

          {/* Search Button */}
          <button type="submit" className="search-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            Tìm kiếm
          </button>

          {/* Status Filter */}
          <div className="filter-group">
            <label className="filter-label">Trạng thái:</label>
            <select
              className="filter-select"
              value={searchParams.status}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="FORWARDED">FORWARDED</option>
              <option value="GATE_IN">GATE_IN</option>
              <option value="IN_YARD">IN_YARD (Import - Đã ở bãi)</option>
              <option value="IN_CAR">IN_CAR (Export - Đã lên xe)</option>
              <option value="GATE_REJECTED">GATE_REJECTED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="filter-group">
            <label className="filter-label">Loại:</label>
            <select
              className="filter-select"
              value={searchParams.type}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              <option value="">Tất cả loại</option>
              <option value="IMPORT">IMPORT</option>
              <option value="EXPORT">EXPORT</option>
              <option value="EMPTY">EMPTY</option>
            </select>
          </div>
          

          {/* Clear Filters */}
          <button
            type="button"
            className="clear-filters-btn"
            onClick={handleClearFilters}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            {t('pages.gate.clearFilters')}
          </button>
        </div>
      </form>
    </div>
  );
}
