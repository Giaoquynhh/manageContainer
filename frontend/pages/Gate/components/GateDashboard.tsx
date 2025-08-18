import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import GateRequestTable from './GateRequestTable';
import GateSearchBar from './GateSearchBar';

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
      
      // Debug: Kiểm tra authentication
      const token = localStorage.getItem('token');
      const user_id = localStorage.getItem('user_id');
      console.log('🔐 Debug Auth:', { 
        hasToken: !!token, 
        hasUserId: !!user_id,
        tokenLength: token?.length || 0 
      });
      
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await api.get(`/gate/requests/search?${params.toString()}`);
      setRequests(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách requests:', error);
      // Debug: Log chi tiết lỗi
      if (error.response) {
        console.error('Response error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Kiểm tra authentication trước
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Không có token, cần đăng nhập trước');
      // Redirect to login hoặc hiển thị thông báo
      return;
    }
    
    fetchRequests();
  }, [searchParams]);

  const handleSearch = (newParams: Partial<typeof searchParams>) => {
    setSearchParams(prev => ({ ...prev, ...newParams, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleStatusChange = (status: string) => {
    setSearchParams(prev => ({ ...prev, status, page: 1 }));
  };

  const handleContainerSearch = (container_no: string) => {
    setSearchParams(prev => ({ ...prev, container_no, page: 1 }));
  };

  const handleTypeChange = (type: string) => {
    setSearchParams(prev => ({ ...prev, type, page: 1 }));
  };

  const handleLicensePlateSearch = (license_plate: string) => {
    setSearchParams(prev => ({ ...prev, license_plate, page: 1 }));
  };

  return (
    <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
      
      <div className="dashboard-header">
        <h1>Gate Dashboard</h1>
        <p>Quản lý xe ra/vào cổng</p>
      </div>

      <GateSearchBar
        searchParams={searchParams}
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onContainerSearch={handleContainerSearch}
        onTypeChange={handleTypeChange}
        onLicensePlateSearch={handleLicensePlateSearch}
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
            ← Trước
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
            Sau →
          </button>
        </div>
      )}
    </main>
  );
}
