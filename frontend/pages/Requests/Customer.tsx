import Header from '@components/Header';
import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '@services/api';
import RequestTable from '@components/requests/RequestTable';
import RequestForm from '@components/requests/RequestForm';
import Modal from '@components/ui/Modal';
import RequestSearchBar from '@components/requests/RequestSearchBar';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function CustomerRequests() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [userRole, setUserRole] = useState<string>('');

  const { data, error, isLoading } = useSWR('/requests?page=1&limit=20', fetcher);

  useEffect(() => {
    // Get user role from localStorage or API
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        api.get('/auth/me')
          .then(response => {
            setUserRole(response.data?.role || response.data?.roles?.[0] || '');
          })
          .catch(() => {
            setUserRole('');
          });
      }
    }
  }, []);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    mutate('/requests?page=1&limit=20');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real implementation, you would filter the data or make a new API call
  };

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    // In a real implementation, you would filter the data or make a new API call
  };

  // Filter data based on search and filters
  const filteredData = data?.data?.filter((item: any) => {
    const matchesSearch = !searchQuery || 
      item.container_no.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  return (
    <>
      <Header />
      <main className="container">
        {/* Header with Title and Create Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: '#0a2558'
            }}>
              Yêu cầu dịch vụ của tôi
            </h1>
            <p style={{
              margin: '8px 0 0',
              color: '#6b7280',
              fontSize: 14
            }}>
              Theo dõi và quản lý các yêu cầu dịch vụ container của bạn
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: 16 }}>+</span>
            Tạo yêu cầu
          </button>
        </div>

        {/* Search and Filter Bar */}
        <RequestSearchBar
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          loading={isLoading}
        />

        {/* Data Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <RequestTable
            data={filteredData}
            loading={isLoading}
            onStatusChange={() => {}} // Customers can't change status
            onPaymentRequest={() => {}} // Customers can't send payment requests
            loadingId=""
            userRole={userRole}
          />
        </div>

        {/* Create Request Modal */}
        <Modal
          title="Tạo yêu cầu mới"
          visible={showCreateModal}
          onCancel={() => setShowCreateModal(false)}
          width={600}
        >
          <RequestForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      </main>
    </>
  );
}
