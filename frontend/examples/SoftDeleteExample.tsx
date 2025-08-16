import React, { useState } from 'react';
import axios from 'axios';

/**
 * Example component demonstrating soft-delete functionality
 */
export default function SoftDeleteExample() {
  const [requests, setRequests] = useState([
    {
      id: 'req-1',
      type: 'IMPORT',
      container_no: 'ABCD1234567',
      status: 'PENDING',
      rejected_reason: null,
      tenant_id: 'tenant-1'
    },
    {
      id: 'req-2',
      type: 'EXPORT',
      container_no: 'EFGH7890123',
      status: 'REJECTED',
      rejected_reason: 'Thiếu chứng từ vận đơn',
      tenant_id: 'tenant-1'
    },
    {
      id: 'req-3',
      type: 'IMPORT',
      container_no: 'IJKL4567890',
      status: 'COMPLETED',
      rejected_reason: null,
      tenant_id: 'tenant-1'
    }
  ]);

  const [userRole, setUserRole] = useState('SaleAdmin'); // Demo user role
  const [currentView, setCurrentView] = useState('depot'); // 'depot' or 'customer'

  // Simulate API calls
  const handleReject = async (requestId: string) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason) return;

    try {
      // Simulate API call
      console.log(`Rejecting request ${requestId} with reason: ${reason}`);
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'REJECTED', rejected_reason: reason }
          : req
      ));
      
      alert('Đã từ chối đơn hàng thành công!');
    } catch (error) {
      alert('Lỗi khi từ chối đơn hàng');
    }
  };

  const handleDelete = async (requestId: string, scope: 'depot' | 'customer') => {
    const confirmMessage = scope === 'depot' 
      ? 'Xóa khỏi danh sách Kho? (Đơn hàng vẫn hiển thị bên Khách hàng)'
      : 'Xóa khỏi danh sách của bạn?';
      
    if (!confirm(confirmMessage)) return;

    try {
      // Simulate API call
      console.log(`Soft-deleting request ${requestId} with scope: ${scope}`);
      
      // In real implementation, this would be handled by backend filtering
      // For demo, we'll just show a success message
      alert(`Đã xóa khỏi danh sách ${scope === 'depot' ? 'Kho' : 'của bạn'}`);
    } catch (error) {
      alert('Lỗi khi xóa đơn hàng');
    }
  };

  const handleRestore = async (requestId: string, scope: 'depot' | 'customer') => {
    try {
      // Simulate API call
      console.log(`Restoring request ${requestId} with scope: ${scope}`);
      
      alert(`Đã khôi phục đơn hàng trong phạm vi ${scope === 'depot' ? 'Kho' : 'Khách hàng'}`);
    } catch (error) {
      alert('Lỗi khi khôi phục đơn hàng');
    }
  };

  const getActionButtons = (request: any) => {
    const buttons = [];
    
    // Nút Reject (chỉ cho Kho)
    if (['SaleAdmin', 'Accountant', 'SystemAdmin'].includes(userRole)) {
      if (['PENDING', 'APPROVED', 'IN_PROGRESS'].includes(request.status)) {
        buttons.push(
          <button
            key="reject"
            onClick={() => handleReject(request.id)}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 mr-2"
          >
            ❌ Từ chối
          </button>
        );
      }
    }
    
    // Nút Delete theo scope
    if (['SaleAdmin', 'Accountant', 'SystemAdmin'].includes(userRole)) {
      // Kho có thể xóa REJECTED, CANCELLED, COMPLETED
      if (['REJECTED', 'CANCELLED', 'COMPLETED'].includes(request.status)) {
        buttons.push(
          <button
            key="delete-depot"
            onClick={() => handleDelete(request.id, 'depot')}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 mr-2"
          >
            🗑️ Xóa khỏi Kho
          </button>
        );
      }
    }
    
    if (['CustomerAdmin', 'CustomerUser'].includes(userRole)) {
      // Khách hàng có thể xóa REJECTED, CANCELLED
      if (['REJECTED', 'CANCELLED'].includes(request.status)) {
        buttons.push(
          <button
            key="delete-customer"
            onClick={() => handleDelete(request.id, 'customer')}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 mr-2"
          >
            🗑️ Xóa khỏi danh sách
          </button>
        );
      }
    }
    
    return buttons;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Đã chấp nhận', className: 'bg-green-100 text-green-800' },
      IN_PROGRESS: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800' },
      REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-800' },
      CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-800' },
      COMPLETED: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' }
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Soft-Delete Functionality Example</h1>
      
      {/* Demo Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Demo Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">User Role:</label>
            <select 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="SaleAdmin">SaleAdmin (Kho)</option>
              <option value="Accountant">Accountant (Kho)</option>
              <option value="CustomerAdmin">CustomerAdmin (Khách hàng)</option>
              <option value="CustomerUser">CustomerUser (Khách hàng)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Current View:</label>
            <select 
              value={currentView} 
              onChange={(e) => setCurrentView(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="depot">Depot View (Kho)</option>
              <option value="customer">Customer View (Khách hàng)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Business Rules Table */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Business Rules</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Trạng thái Request</th>
                <th className="border border-gray-300 p-2">Kho có thể xóa?</th>
                <th className="border border-gray-300 p-2">Khách hàng có thể xóa?</th>
                <th className="border border-gray-300 p-2">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">PENDING / APPROVED / IN_PROGRESS</td>
                <td className="border border-gray-300 p-2 text-center">❌</td>
                <td className="border border-gray-300 p-2 text-center">❌</td>
                <td className="border border-gray-300 p-2">Không cho xóa để tránh mất việc đang xử lý</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">REJECTED</td>
                <td className="border border-gray-300 p-2 text-center">✅</td>
                <td className="border border-gray-300 p-2 text-center">✅</td>
                <td className="border border-gray-300 p-2">Ẩn khỏi danh sách tương ứng</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">CANCELLED</td>
                <td className="border border-gray-300 p-2 text-center">✅</td>
                <td className="border border-gray-300 p-2 text-center">✅</td>
                <td className="border border-gray-300 p-2">Tương tự REJECTED</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">COMPLETED</td>
                <td className="border border-gray-300 p-2 text-center">✅</td>
                <td className="border border-gray-300 p-2 text-center">❌</td>
                <td className="border border-gray-300 p-2">Kho có thể dọn danh sách; Khách giữ lịch sử</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Requests List */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Requests List</h2>
        <div className="grid gap-4">
          {requests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-medium">Request #{request.id}</h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {request.type} - Container {request.container_no}
                  </p>
                  {request.rejected_reason && (
                    <p className="text-sm text-red-600 mt-1">
                      Lý do từ chối: {request.rejected_reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getActionButtons(request)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Examples */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">API Examples</h2>
        
        <div className="grid gap-4">
          {/* Reject Request */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Reject Request</h3>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <div>PATCH /api/requests/{'{id}'}/reject</div>
              <div>Body: {"{ \"reason\": \"Thiếu chứng từ vận đơn\" }"}</div>
            </div>
          </div>

          {/* Soft Delete */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Soft Delete</h3>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <div>DELETE /api/requests/{'{id}'}?scope=depot|customer</div>
            </div>
          </div>

          {/* Restore */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Restore</h3>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <div>POST /api/requests/{'{id}'}/restore?scope=depot|customer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Implementation Notes</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Soft-delete:</strong> Không xóa cứng khỏi database, chỉ set timestamp vào cột tương ứng</li>
            <li><strong>Scope-based:</strong> Mỗi scope (depot/customer) có cột deleted_at riêng</li>
            <li><strong>Audit trail:</strong> Tất cả actions đều được log để tracking</li>
            <li><strong>RBAC:</strong> Kiểm tra quyền hạn trước khi cho phép thao tác</li>
            <li><strong>Status validation:</strong> Chỉ cho phép xóa ở các trạng thái nhất định</li>
            <li><strong>Chat integration:</strong> Tự động gửi system message khi reject</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Example of how to implement soft-delete in a real component
 */
export function SoftDeleteImplementation() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch requests with scope filtering
  const fetchRequests = async (scope: 'depot' | 'customer') => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/requests?scope=${scope}`);
      setRequests(response.data.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reject request
  const rejectRequest = async (requestId: string) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason) return;

    try {
      await axios.patch(`/api/requests/${requestId}/reject`, { reason });
      // Refresh data
      fetchRequests('depot');
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  // Soft delete request
  const softDeleteRequest = async (requestId: string, scope: 'depot' | 'customer') => {
    const confirmMessage = scope === 'depot' 
      ? 'Xóa khỏi danh sách Kho? (Đơn hàng vẫn hiển thị bên Khách hàng)'
      : 'Xóa khỏi danh sách của bạn?';
      
    if (!confirm(confirmMessage)) return;

    try {
      await axios.delete(`/api/requests/${requestId}?scope=${scope}`);
      // Refresh data
      fetchRequests(scope);
    } catch (error) {
      console.error('Error soft-deleting request:', error);
    }
  };

  // Restore request
  const restoreRequest = async (requestId: string, scope: 'depot' | 'customer') => {
    try {
      await axios.post(`/api/requests/${requestId}/restore?scope=${scope}`);
      // Refresh data
      fetchRequests(scope);
    } catch (error) {
      console.error('Error restoring request:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Real Implementation Example</h2>
      
      <div className="mb-4">
        <button 
          onClick={() => fetchRequests('depot')}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Load Depot Requests
        </button>
        <button 
          onClick={() => fetchRequests('customer')}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Load Customer Requests
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Request #{request.id}</h3>
                  <p className="text-sm text-gray-600">
                    {request.type} - {request.container_no} - {request.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {request.status === 'PENDING' && (
                    <button
                      onClick={() => rejectRequest(request.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  )}
                  {['REJECTED', 'CANCELLED', 'COMPLETED'].includes(request.status) && (
                    <button
                      onClick={() => softDeleteRequest(request.id, 'depot')}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


