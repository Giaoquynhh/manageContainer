import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import { useTranslation } from '../../../hooks/useTranslation';
import { useToast } from '../../../hooks/useToastHook';

interface GateHistoryItem {
  id: string;
  container_no: string;
  type: string;
  driver_name?: string;
  license_plate?: string;
  time_in?: string;
  time_out?: string;
  status: string;
  createdAt: string;
}

interface GateHistoryProps {
  onBack: () => void;
}

export default function GateHistory({ onBack }: GateHistoryProps) {
  const [history, setHistory] = useState<GateHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    container_no: '',
    driver_name: '',
    license_plate: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const { t, currentLanguage } = useTranslation();
  const { showError } = useToast();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchParams.container_no) params.append('container_no', searchParams.container_no);
      if (searchParams.driver_name) params.append('driver_name', searchParams.driver_name);
      if (searchParams.license_plate) params.append('license_plate', searchParams.license_plate);
      params.append('page', searchParams.page.toString());
      params.append('limit', searchParams.limit.toString());
      // Không ép status=GATE_OUT nữa; trang lịch sử cần tất cả xe đã có time_in

      console.log('🔍 Frontend: Calling API with params:', params.toString());
      const response = await api.get(`/gate/history?${params.toString()}`);
      console.log('📊 Frontend: API response:', response.data);
      
      setHistory(response.data.data || []);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error: any) {
      console.error('❌ Frontend: API error:', error);
      showError(
        'Lỗi khi tải lịch sử',
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 Frontend: useEffect triggered, searchParams:', searchParams);
    fetchHistory();
  }, [searchParams.page, searchParams.container_no, searchParams.driver_name, searchParams.license_plate]);

  const handleSearch = () => {
    console.log('🔍 Frontend: handleSearch called');
    setSearchParams(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    console.log('🔄 Frontend: handlePageChange called with page:', newPage);
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return `📥 ${t('pages.gate.typeOptions.import')}`;
      case 'EXPORT':
        return `📤 ${t('pages.gate.typeOptions.export')}`;
      case 'EMPTY':
        return `🗳️ ${t('pages.gate.typeOptions.empty')}`;
      default:
        return type;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return t('common.na');
    return new Date(dateString).toLocaleString(
      currentLanguage === 'vi' ? 'vi-VN' : 'en-US'
    );
  };

  // Debug: Log current state
  console.log('🔍 Frontend: Current state - history:', history.length, 'loading:', loading, 'pagination:', pagination);

  return (
    <div className="gate-history-container">
      {/* Header */}
      <div className="page-header modern-header">
        <div className="header-content">
          <div className="header-left">
            <button
              onClick={onBack}
              className="back-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--color-gray-100)',
                color: 'var(--color-gray-700)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                marginRight: 'var(--space-4)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
              Quay lại
            </button>
            <h1 className="page-title gradient gradient-ultimate">Lịch sử ra vào cổng</h1>
          </div>
        </div>
      </div>

      {/* Search Filters */}
      <div className="search-filters" style={{
        backgroundColor: 'white',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-4)'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-gray-700)',
              marginBottom: 'var(--space-2)'
            }}>
              Tìm kiếm theo mã container
            </label>
            <input
              type="text"
              value={searchParams.container_no}
              onChange={(e) => setSearchParams(prev => ({ ...prev, container_no: e.target.value }))}
              placeholder="Nhập mã container..."
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '2px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-gray-700)',
              marginBottom: 'var(--space-2)'
            }}>
              Tìm kiếm theo tên tài xế
            </label>
            <input
              type="text"
              value={searchParams.driver_name}
              onChange={(e) => setSearchParams(prev => ({ ...prev, driver_name: e.target.value }))}
              placeholder="Nhập tên tài xế..."
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '2px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-gray-700)',
              marginBottom: 'var(--space-2)'
            }}>
              Tìm kiếm theo biển số xe
            </label>
            <input
              type="text"
              value={searchParams.license_plate}
              onChange={(e) => setSearchParams(prev => ({ ...prev, license_plate: e.target.value }))}
              placeholder="Nhập biển số xe..."
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '2px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            onClick={handleSearch}
            className="action-btn action-btn-primary"
            style={{
              padding: 'var(--space-3) var(--space-6)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            🔍 Tìm kiếm
          </button>
          <button
            onClick={() => {
              setSearchParams({
                container_no: '',
                driver_name: '',
                license_plate: '',
                page: 1,
                limit: 20
              });
              fetchHistory();
            }}
            className="action-btn action-btn-secondary"
            style={{
              padding: 'var(--space-3) var(--space-6)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            🗑️ Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="history-table-container" style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div className="loading-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'var(--space-12)',
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-gray-500)'
          }}>
            <div className="loading-spinner"></div>
            <span style={{ marginLeft: 'var(--space-3)' }}>Đang tải dữ liệu...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'var(--space-12)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: 'var(--space-4)',
              opacity: 0.5
            }}>
              📋
            </div>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-gray-700)',
              marginBottom: 'var(--space-2)'
            }}>
              Không có dữ liệu
            </h3>
            <p style={{
              color: 'var(--color-gray-500)',
              fontSize: 'var(--font-size-sm)'
            }}>
              Không tìm thấy lịch sử xe ra vào cổng nào
            </p>
          </div>
        ) : (
          <>
            <div className="table-header" style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-gray-50)',
              borderBottom: '1px solid var(--color-gray-200)'
            }}>
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-gray-800)',
                margin: 0
              }}>
                Danh sách xe đã ra khỏi cổng ({pagination.total} xe)
              </h3>
            </div>
            <div className="table-responsive" style={{
              maxHeight: '60vh',
              overflowY: 'auto',
              overflowX: 'auto'
            }}>
              <table className="history-table" style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-gray-50)' }}>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Mã Container
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Loại yêu cầu
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Tên tài xế
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Biển số xe
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Thời gian vào
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Thời gian ra
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} style={{
                      borderBottom: '1px solid var(--color-gray-100)',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-gray-50)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-blue-600)'
                      }}>
                        {item.container_no}
                      </td>
                      <td style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: 'var(--space-1) var(--space-3)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          backgroundColor: item.type === 'IMPORT' ? 'var(--color-blue-100)' : 'var(--color-green-100)',
                          color: item.type === 'IMPORT' ? 'var(--color-blue-800)' : 'var(--color-green-800)'
                        }}>
                          {typeLabel(item.type)}
                        </span>
                      </td>
                      <td style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-gray-700)'
                      }}>
                        {item.driver_name || t('common.na')}
                      </td>
                      <td style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-gray-700)',
                        fontFamily: 'var(--font-family-mono)'
                      }}>
                        {item.license_plate || t('common.na')}
                      </td>
                      <td style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)',
                        color: item.time_in ? 'var(--color-green-600)' : 'var(--color-gray-500)'
                      }}>
                        {formatDateTime(item.time_in)}
                      </td>
                      <td style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)',
                        color: item.time_out ? 'var(--color-red-600)' : 'var(--color-gray-500)'
                      }}>
                        {formatDateTime(item.time_out)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-6)'
        }}>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="pagination-btn"
            style={{
              padding: 'var(--space-2) var(--space-4)',
              border: '1px solid var(--color-gray-300)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: pagination.page <= 1 ? 'var(--color-gray-100)' : 'white',
              color: pagination.page <= 1 ? 'var(--color-gray-400)' : 'var(--color-gray-700)',
              cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            ← Trước
          </button>
          
          <span style={{
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--color-blue-600)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {pagination.page} / {pagination.pages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="pagination-btn"
            style={{
              padding: 'var(--space-2) var(--space-4)',
              border: '1px solid var(--color-gray-300)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: pagination.page >= pagination.pages ? 'var(--color-gray-100)' : 'white',
              color: pagination.page >= pagination.pages ? 'var(--color-gray-400)' : 'var(--color-gray-700)',
              cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
