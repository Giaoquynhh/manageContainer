import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import GateRequestTable from './GateRequestTable';
import GateSearchBar from './GateSearchBar';
import { useTranslation } from '../../../hooks/useTranslation';


interface GateRequest {
  id: string;
  container_no: string;
  type: string;
  status: string;
  eta?: string;
  forwarded_at?: string;
  license_plate?: string; // Thêm trường biển số xe
  docs: any[];
  attachments: any[];
}

export default function GateDashboard() {
  const [requests, setRequests] = useState<GateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true); // Thêm state cho sidebar
  const { t } = useTranslation();


  const [searchParams, setSearchParams] = useState({
    status: '',
    container_no: '',
    type: '',
    license_plate: '', // Thêm trường biển số xe
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });





  // Theo dõi trạng thái sidebar
  useEffect(() => {
    const checkSidebarState = () => {
      // Kiểm tra sidebar có visible không bằng cách kiểm tra CSS hoặc DOM
      const sidebar = document.querySelector('.sidebar');
      console.log('🔍 Checking sidebar state:', sidebar);
      
      if (sidebar) {
        // Sidebar đang sử dụng class 'closed' khi bị thu gọn (không phải 'hidden')
        const isVisible = !sidebar.classList.contains('closed');
        console.log('📱 Sidebar visible:', isVisible);
        setSidebarVisible(isVisible);
      } else {
        console.log('❌ Sidebar not found');
        // Fallback: dùng body class 'with-sidebar' nếu có
        const bodyHasWithSidebar = document.body.classList.contains('with-sidebar');
        setSidebarVisible(bodyHasWithSidebar);
      }
    };

    // Kiểm tra ban đầu
    checkSidebarState();

    // Theo dõi thay đổi sidebar
    const observer = new MutationObserver((mutations) => {
      console.log('🔄 Sidebar mutations detected:', mutations);
      checkSidebarState();
    });
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['class']
      });
      console.log('👀 Observer attached to sidebar');
    } else {
      console.log('⚠️ Sidebar not found, trying main-content');
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        observer.observe(mainContent, {
          attributes: true,
          attributeFilter: ['style']
        });
        console.log('👀 Observer attached to main-content');
      }
    }

    // Luôn theo dõi thay đổi class của body (with-sidebar)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up observer');
      observer.disconnect();
    };
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      


      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      // Thêm filter để lấy requests có trạng thái IN_YARD và IN_CAR
      if (!searchParams.status || searchParams.status === '') {
        params.append('statuses', 'IN_YARD,IN_CAR');
      }
      console.log('🔍 Calling API:', `/gate/requests/search?${params.toString()}`);
      console.log('🔍 API base URL:', process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1000');
      console.log('🔍 Full URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1000'}/gate/requests/search?${params.toString()}`);
   
      const response = await api.get(`/gate/requests/search?${params.toString()}`);
      console.log('✅ API response:', response.data);
      
      setRequests(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách requests:', error);
      
      // Xử lý các loại lỗi cụ thể
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          // Redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/Login';
        }
        
        console.error('Response error:', {
          status,
          data,
          headers: error.response.headers
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Gọi API ngay khi component mount
    fetchRequests();
  }, [searchParams]);

  const handleSearch = (newParams: Partial<typeof searchParams>) => {
    setSearchParams(prev => ({ ...prev, ...newParams, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleContainerSearch = (container_no: string) => {
    setSearchParams(prev => ({ ...prev, container_no, page: 1 }));
  };


  const handleLicensePlateChange = (license_plate: string) => {
    setSearchParams(prev => ({ ...prev, license_plate, page: 1 }));
  };

  const handleExportReport = () => {
    try {
      const headers = ['ID', 'Container No', 'Type', 'Status', 'ETA', 'Forwarded At', 'License Plate', 'Docs Count', 'Attachments Count'];
      const rows = requests.map(r => [
        r.id,
        r.container_no,
        r.type,
        r.status,
        r.eta || '',
        r.forwarded_at || '',
        r.license_plate || '',
        Array.isArray(r.docs) ? r.docs.length : 0,
        Array.isArray(r.attachments) ? r.attachments.length : 0
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map((cell) => {
          const val = String(cell ?? '');
          const escaped = val.replace(/\"/g, '""');
          return `"${escaped}"`;
        }).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.href = url;
      a.download = `gate-requests-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi xuất báo cáo:', err);
      alert(t('pages.gate.messages.exportError'));
    }
  };

  return (
    <main className={`main-content gate-layout ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
      <div className="container gate-page">
        <div className="dashboard-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient-ultimate">{t('pages.gate.title')}</h1>
            </div>
            <div className="header-actions">
              <button
                type="button"
                className="btn btn-export"
                onClick={handleExportReport}
                aria-label={t('common.export')}
              >
                <span className="dot" aria-hidden="true"></span>
                {t('common.export')}
              </button>
            </div>
          </div>
        </div>



        <GateSearchBar
          searchParams={searchParams}
          onSearch={handleSearch}
          onContainerSearch={handleContainerSearch}
          onLicensePlateChange={handleLicensePlateChange}
        />

        <GateRequestTable
          requests={requests}
          loading={loading}
          onRefresh={fetchRequests}
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="pagination-btn"
            >
              ← {t('common.previous')}
            </button>
            
            <button
              className="pagination-btn active"
              disabled
            >
              {pagination.page} / {pagination.pages}
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="pagination-btn"
            >
              {t('common.next')} →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
