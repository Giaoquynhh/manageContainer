import { useState, useEffect } from 'react';
import Header from '@components/Header';
import { api } from '@services/api';
import { isSaleAdmin, isYardManager, isSystemAdmin } from '@utils/rbac';

interface ForkliftTask {
  id: string;
  container_no: string;
  task_type: 'LOAD' | 'UNLOAD' | 'MOVE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assigned_forklift?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
  updated_at: string;
  notes?: string;
}

export default function Forklift() {
  const [tasks, setTasks] = useState<ForkliftTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Lấy thông tin user role
    api.get('/auth/me')
      .then(response => {
        const role = response.data?.role || response.data?.roles?.[0];
        setUserRole(role);
        
        // Kiểm tra quyền truy cập
        if (!isSaleAdmin(role) && !isYardManager(role) && !isSystemAdmin(role)) {
          setError('Bạn không có quyền truy cập trang này');
          return;
        }
        
        // Load danh sách công việc xe nâng
        loadForkliftTasks();
      })
      .catch(err => {
        setError('Không thể xác thực người dùng');
        console.error('Auth error:', err);
      });
  }, []);

  const loadForkliftTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/forklift/tasks');
      setTasks(response.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách công việc xe nâng');
      console.error('Load tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.patch(`/forklift/task/${taskId}/status`, { status: newStatus });
      // Reload danh sách sau khi cập nhật
      loadForkliftTasks();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể cập nhật trạng thái');
      console.error('Update status error:', err);
    }
  };

  const assignForklift = async (taskId: string, forkliftId: string) => {
    try {
      await api.patch(`/forklift/assign`, { task_id: taskId, forklift_id: forkliftId });
      loadForkliftTasks();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể gán xe nâng');
      console.error('Assign forklift error:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'LOAD': return 'Xếp hàng';
      case 'UNLOAD': return 'Dỡ hàng';
      case 'MOVE': return 'Di chuyển';
      default: return type;
    }
  };

  if (error && !userRole) {
    return (
      <>
        <Header />
        <main className="container">
          <div className="card card-padding-lg">
            <div className="text-center">
              <h2 className="text-red-600">Lỗi truy cập</h2>
              <p>{error}</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container">
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Quản lý Xe nâng</h1>
            <p className="page-subtitle">Theo dõi và quản lý công việc xe nâng</p>
          </div>
          <div className="page-actions">
            <button 
              className="btn btn-primary"
              onClick={loadForkliftTasks}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>

        {error && (
          <div className="card card-padding-md">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <button 
                className="btn btn-outline mt-2"
                onClick={() => setError(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        <div className="card card-padding-lg">
          <div className="card-header">
            <h2 className="card-title">Danh sách công việc xe nâng</h2>
            <div className="card-actions">
              <span className="badge badge-primary">
                Tổng: {tasks.length} công việc
              </span>
            </div>
          </div>

          <div className="card-content">
            {loading ? (
              <div className="text-center py-8">
                <div className="loading-spinner spinner-lg spinner-primary"></div>
                <p className="mt-4">Đang tải danh sách công việc...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có công việc xe nâng nào</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Container</th>
                      <th>Loại công việc</th>
                      <th>Trạng thái</th>
                      <th>Độ ưu tiên</th>
                      <th>Xe nâng được gán</th>
                      <th>Thời gian tạo</th>
                      <th>Ghi chú</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="table-row">
                        <td>
                          <span className="container-id">{task.container_no}</span>
                        </td>
                        <td>
                          <span className="type-label">
                            {getTaskTypeLabel(task.task_type)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-md ${getStatusColor(task.status)}`}>
                            {task.status === 'PENDING' && 'Chờ xử lý'}
                            {task.status === 'IN_PROGRESS' && 'Đang thực hiện'}
                            {task.status === 'COMPLETED' && 'Hoàn thành'}
                            {task.status === 'CANCELLED' && 'Đã hủy'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-md ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'HIGH' && 'Cao'}
                            {task.priority === 'MEDIUM' && 'Trung bình'}
                            {task.priority === 'LOW' && 'Thấp'}
                          </span>
                        </td>
                        <td>
                          {task.assigned_forklift ? (
                            <span className="badge badge-info">
                              {task.assigned_forklift}
                            </span>
                          ) : (
                            <span className="text-gray-400">Chưa gán</span>
                          )}
                        </td>
                        <td>
                          <span className="eta-date">
                            {new Date(task.created_at).toLocaleString('vi-VN')}
                          </span>
                        </td>
                        <td>
                          {task.notes ? (
                            <span className="text-sm">{task.notes}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            {task.status === 'PENDING' && (
                              <>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                >
                                  Bắt đầu
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => updateTaskStatus(task.id, 'CANCELLED')}
                                >
                                  Hủy
                                </button>
                              </>
                            )}
                            {task.status === 'IN_PROGRESS' && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                              >
                                Hoàn thành
                              </button>
                            )}
                            {!task.assigned_forklift && (
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => assignForklift(task.id, 'FL001')} // Tạm thời hardcode
                              >
                                Gán xe
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
