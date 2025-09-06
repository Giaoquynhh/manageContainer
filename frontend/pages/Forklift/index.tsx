import { useState, useEffect } from 'react';
import Header from '@components/Header';
import { api } from '@services/api';
import { isSaleAdmin, isYardManager, isSystemAdmin } from '@utils/rbac';
import AssignDriverModal from '@components/Forklift/AssignDriverModal';
import { useTranslation } from '@hooks/useTranslation';
import { useToast } from '@hooks/useToastHook';

interface ForkliftTask {
  id: string;
  container_no: string;
  from_slot_id?: string;
  to_slot_id?: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED' | 'CANCELLED';
  assigned_driver_id?: string;
  created_by: string;
  cancel_reason?: string;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    full_name: string;
    email: string;
  };
  container_info?: {
    driver_name?: string;
    license_plate?: string;
    status?: string;
    type?: string;
  };
  actual_location?: {
    id: string;
    tier: number;
    status: string;
    slot: {
      id: string;
      code: string;
      block: {
        code: string;
        yard: {
          name: string;
        };
      };
    };
  } | null;
  from_slot?: {
    id: string;
    code: string;
    row_label?: string;
    row_index?: number;
    col_index?: number;
    tier_capacity?: number;
    block: {
      code: string;
      yard: {
        name: string;
      };
    };
    placements?: Array<{
      id: string;
      tier: number;
      container_no?: string;
      status: string;
    }>;
  };
  to_slot?: {
    id: string;
    code: string;
    row_label?: string;
    row_index?: number;
    col_index?: number;
    tier_capacity?: number;
    block: {
      code: string;
      yard: {
        name: string;
      };
    };
    placements?: Array<{
      id: string;
      tier: number;
      container_no?: string;
      status: string;
    }>;
  };
}

export default function Forklift() {
  const { t } = useTranslation();
  const { showSuccess, showError, ToastContainer } = useToast();
  const [tasks, setTasks] = useState<ForkliftTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ForkliftTask | null>(null);


  useEffect(() => {
    // Lấy thông tin user role
    api.get('/auth/me')
      .then(response => {
        const role = response.data?.role || response.data?.roles?.[0];
        setUserRole(role);
        
        // Kiểm tra quyền truy cập
        if (!isSaleAdmin(role) && !isYardManager(role) && !isSystemAdmin(role)) {
          setError(t('pages.forklift.accessDenied'));
          return;
        }
        
        // Load danh sách công việc xe nâng
        loadForkliftTasks();
      })
      .catch(err => {
        setError(t('pages.forklift.authError'));
        console.error('Auth error:', err);
      });
  }, []);

  const loadForkliftTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/forklift/jobs');
      console.log('🔍 Forklift jobs data:', response.data);
      setTasks(response.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('pages.forklift.loadError'));
      console.error('Load tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = (task: ForkliftTask) => {
    setSelectedTask(task);
    setAssignModalOpen(true);
  };

  const handleDriverAssigned = (driverId: string, driverName: string) => {
    // Update the task in the list with the new driver
    if (selectedTask) {
      setTasks(prev => prev.map(task => 
        task.id === selectedTask.id 
          ? { ...task, assigned_driver_id: driverId }
          : task
      ));
      
      // Hiển thị thông báo thành công
      showSuccess(
        t('pages.forklift.modal.assignSuccess'),
        t('pages.forklift.modal.assignSuccessMessage').replace('{driverName}', driverName).replace('{containerNo}', selectedTask.container_no)
      );
    }
    loadForkliftTasks(); // Refresh the list
  };
  const handleUpdateCost = async (taskId: string, cost: number) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/cost`, { cost });
      loadForkliftTasks(); // Refresh the list
      setCostModalOpen(false);
      setSelectedTask(null);
      
      // Hiển thị thông báo thành công
      showSuccess(
        t('pages.forklift.messages.updateCostSuccess'),
        t('pages.forklift.messages.updateCostSuccessMessage').replace('{cost}', cost.toLocaleString('vi-VN'))
      );
    } catch (err: any) {
      showError(t('pages.forklift.messages.updateCostError'), err?.response?.data?.message || t('pages.forklift.messages.updateCostError'));
    }
  };

  const handleStartJob = async (taskId: string) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/start`);
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || t('pages.forklift.messages.startJobError'));
    }
  };

  const handleBeginWork = async (taskId: string) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/begin-work`);
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || t('pages.forklift.messages.beginWorkError'));
    }
  };

  const handleCompleteJob = async (taskId: string) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/complete`);
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || t('pages.forklift.messages.completeJobError'));
    }
  };

  const handleApproveJob = async (taskId: string) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/approve`);
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || t('pages.forklift.messages.approveJobError'));
    }
  };

  const handleCancelJob = async (taskId: string) => {
    const reason = prompt(t('pages.forklift.messages.cancelJobPrompt'));
    if (!reason) return;

    try {
      await api.patch(`/forklift/jobs/${taskId}/cancel`, { reason });
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || t('pages.forklift.messages.cancelJobError'));
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return t('pages.forklift.status.pending');
      case 'ASSIGNED': return t('pages.forklift.status.assigned');
      case 'IN_PROGRESS': return t('pages.forklift.status.inProgress');
      case 'PENDING_APPROVAL': return t('pages.forklift.status.pendingApproval');
      case 'COMPLETED': return t('pages.forklift.status.completed');
      case 'CANCELLED': return t('pages.forklift.status.cancelled');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'badge-yellow';
      case 'ASSIGNED': return 'badge-orange';
      case 'IN_PROGRESS': return 'badge-blue';
      case 'PENDING_APPROVAL': return 'badge-orange';
      case 'COMPLETED': return 'badge-green';
      case 'CANCELLED': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  if (error) {
    return (
      <>
        <Header />
        <main className="container">
          <div className="card card-padding-lg">
            <div className="text-center">
              <h2 className="text-red-600">{t('common.error')}</h2>
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
      <main className="container depot-requests">
        {/* Page Header */}
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">{t('pages.forklift.title')}</h1>
            </div>

            <div className="header-actions">
            </div>
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
                {t('common.close')}
              </button>
            </div>
          </div>
        )}

        <div className="card card-padding-lg">
          <div className="card-header">
            <h2 className="card-title">{t('pages.forklift.jobList')}</h2>
            <div className="card-actions">
              <span className="badge badge-primary">
                {t('pages.forklift.totalJobs').replace('{count}', tasks.length.toString())}
              </span>
            </div>
          </div>

          <div className="card-content">
            {loading ? (
              <div className="text-center py-8">
                <div className="loading-spinner spinner-lg spinner-primary"></div>
                <p className="mt-4">{t('pages.forklift.loadingJobs')}</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('pages.forklift.noJobs')}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table-modern">
                  <thead>
                                           <tr style={{
                        backgroundColor: '#ffffff',
                        borderBottom: '2px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                                                                     <th style={{
                          padding: '16px 12px',
                          textAlign: 'center' as const,
                          fontWeight: '700',
                          color: '#374151',
                          fontSize: '12px'
                        }}>
{t('pages.forklift.tableHeaders.containerNo')}
                        </th>
                                                                     <th style={{
                          padding: '16px 12px',
                          textAlign: 'center' as const,
                          fontWeight: '700',
                          color: '#374151',
                          fontSize: '12px'
                        }}>
{t('pages.forklift.tableHeaders.pickupLocation')}
                        </th>
                                                                     <th style={{
                          padding: '16px 12px',
                          textAlign: 'center' as const,
                          fontWeight: '700',
                          color: '#374151',
                          fontSize: '12px'
                        }}>
{t('pages.forklift.tableHeaders.dropoffLocation')}
                        </th>
                                                                     <th style={{
                          padding: '16px 12px',
                          textAlign: 'center' as const,
                          fontWeight: '700',
                          color: '#374151',
                          fontSize: '12px'
                        }}>
{t('pages.forklift.tableHeaders.status')}
                        </th>
                                                                     <th style={{
                          padding: '16px 12px',
                          textAlign: 'center' as const,
                          fontWeight: '700',
                          color: '#374151',
                          fontSize: '12px'
                        }}>
{t('pages.forklift.tableHeaders.forklift')}
                        </th>
                                                                     <th style={{
                          padding: '16px 12px',
                          textAlign: 'center' as const,
                          fontWeight: '700',
                          color: '#374151',
                          fontSize: '12px'
                        }}>
{t('pages.forklift.tableHeaders.createdAt')}
                        </th>
                                                                     <th style={{
                          padding: '16px 12px',
                          textAlign: 'center' as const,
                          fontWeight: '700',
                          color: '#374151',
                          fontSize: '12px'
                        }}>
{t('pages.forklift.tableHeaders.actions')}
                        </th>
                    </tr>
                  </thead>
                  <tbody>
                                         {tasks.map((task, index) => (
                       <tr key={task.id} style={{
                         borderBottom: '1px solid #e5e7eb',
                         backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                         transition: 'all 0.2s ease-in-out',
                         cursor: 'default'
                       }}
                       onMouseEnter={(e) => {
                         e.currentTarget.style.backgroundColor = '#f0f9ff';
                         e.currentTarget.style.transform = 'scale(1.01)';
                         e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                       }}
                       onMouseLeave={(e) => {
                         e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafbfc';
                         e.currentTarget.style.transform = 'scale(1)';
                         e.currentTarget.style.boxShadow = 'none';
                       }}
                       >
                                                 <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                           <div style={{
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center'
                           }}>
                             <span style={{ 
                               color: '#1e293b', 
                               fontWeight: '800',
                               fontSize: '16px',
                               fontFamily: 'monospace',
                               backgroundColor: '#f1f5f9',
                               padding: '8px 12px',
                               borderRadius: '6px',
                               border: '2px solid #475569',
                               letterSpacing: '1px'
                             }}>
                               {task.container_no}
                             </span>
                           </div>
                        </td>
                                                 <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                           <div style={{
                             display: 'flex',
                             flexDirection: 'column',
                             gap: '6px',
                             padding: '8px',
                             backgroundColor: '#f8fafc',
                             borderRadius: '6px',
                             border: '1px solid #e2e8f0'
                           }}>
                             {/* Thông tin tài xế */}
                             {task.container_info?.driver_name && task.container_info?.license_plate ? (
                               <>
                                 <div style={{
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: '8px',
                                   fontSize: '13px'
                                 }}>
                                   <span style={{ 
                                     color: '#64748b', 
                                     fontWeight: '600',
                                     minWidth: '60px'
                                   }}>{t('pages.forklift.driver.driverName')}</span>
                                   <span style={{ 
                                     color: '#1e293b', 
                                     fontWeight: '500',
                                     backgroundColor: '#dbeafe',
                                     padding: '2px 8px',
                                     borderRadius: '4px'
                                   }}>
                                     {task.container_info.driver_name}
                                   </span>
                                 </div>
                                 <div style={{
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: '8px',
                                   fontSize: '13px'
                                 }}>
                                   <span style={{ 
                                     color: '#64748b', 
                                     fontWeight: '600',
                                     minWidth: '60px'
                                   }}>{t('pages.forklift.driver.licensePlate')}</span>
                                   <span style={{ 
                                     color: '#1e293b', 
                                     fontWeight: '500',
                                     backgroundColor: '#fef3c7',
                                     padding: '2px 8px',
                                     borderRadius: '4px',
                                     fontFamily: 'monospace',
                                     fontSize: '12px'
                                   }}>
                                     {task.container_info.license_plate}
                                   </span>
                                 </div>
                               </>
                             ) : (
                               <div style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 padding: '8px',
                                 color: '#94a3b8',
                                 fontSize: '12px',
                                 fontStyle: 'italic'
                               }}>
{t('pages.forklift.driver.noInfo')}
                               </div>
                             )}
                           </div>
                        </td>
                                                 <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                           <div style={{
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center'
                           }}>
                             {task.actual_location ? (
                               <span style={{
                                 color: '#1f2937',
                                 fontWeight: '600',
                                 fontSize: '14px',
                                 fontFamily: 'monospace',
                                 backgroundColor: '#f3f4f6',
                                 padding: '8px 12px',
                                 borderRadius: '6px',
                                 border: '1px solid #d1d5db'
                               }}>
                                 {`${task.actual_location.slot.block.yard.name} / ${task.actual_location.slot.block.code} / ${task.actual_location.slot.code}`}
                               </span>
                             ) : (
                               <span style={{ 
                                 color: '#64748b', 
                                 fontWeight: '600',
                                 fontSize: '14px',
                                 fontStyle: 'italic'
                               }}>
{task.to_slot?.code || t('pages.forklift.location.outside')}
                               </span>
                             )}
                           </div>
                        </td>
                                                 <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                           <div style={{
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center'
                           }}>
                             <span style={{
                               padding: '8px 16px',
                               borderRadius: '20px',
                               fontSize: '12px',
                               fontWeight: '700',
                               textTransform: 'uppercase' as const,
                               letterSpacing: '0.5px',
                               boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                               border: '2px solid',
                                                            ...(task.status === 'PENDING' && {
                               backgroundColor: '#fef3c7',
                               color: '#92400e',
                               borderColor: '#f59e0b'
                             }),
                             ...(task.status === 'ASSIGNED' && {
                               backgroundColor: '#fed7aa',
                               color: '#ea580c',
                               borderColor: '#f97316'
                             }),
                             ...(task.status === 'IN_PROGRESS' && {
                               backgroundColor: '#dbeafe',
                               color: '#1e40af',
                               borderColor: '#3b82f6'
                             }),
                             ...(task.status === 'PENDING_APPROVAL' && {
                               backgroundColor: '#fed7aa',
                               color: '#ea580c',
                               borderColor: '#f97316'
                             }),
                             ...(task.status === 'COMPLETED' && {
                               backgroundColor: '#d1fae5',
                               color: '#065f46',
                               borderColor: '#10b981'
                             }),
                             ...(task.status === 'CANCELLED' && {
                               backgroundColor: '#fee2e2',
                               color: '#991b1b',
                               borderColor: '#ef4444'
                             })
                             }}>
                            {getStatusText(task.status)}
                          </span>
                           </div>
                        </td>
                                                 <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                           <div style={{
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center'
                           }}>
                          {task.driver ? (
                               <div style={{
                                 display: 'flex',
                                 flexDirection: 'column',
                                 alignItems: 'center',
                                 gap: '4px',
                                 padding: '8px',
                                 backgroundColor: '#f0fdf4',
                                 borderRadius: '6px',
                                 border: '1px solid #bbf7d0'
                               }}>
                                 <span style={{ 
                                   color: '#059669', 
                                   fontWeight: '700',
                                   fontSize: '14px'
                                 }}>
                                   {task.driver.full_name}
                                 </span>
                                 <span style={{
                                   fontSize: '10px',
                                   color: '#16a34a',
                                   backgroundColor: '#dcfce7',
                                   padding: '2px 6px',
                                   borderRadius: '3px',
                                   fontWeight: '600'
                                 }}>
{t('pages.forklift.driver.assigned')}
                                 </span>
                               </div>
                             ) : (
                               <div style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 padding: '8px',
                                 backgroundColor: '#f8fafc',
                                 borderRadius: '6px',
                                 border: '1px solid #e2e8f0'
                               }}>
                                 <span style={{ 
                                   color: '#94a3b8', 
                                   fontSize: '13px',
                                   fontStyle: 'italic',
                                   fontWeight: '500'
                                 }}>
{t('pages.forklift.driver.notAssigned')}
                                 </span>
                               </div>
                             )}
                           </div>
                         </td>

                                                 <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                           <div style={{
                             display: 'flex',
                             flexDirection: 'column',
                             alignItems: 'center',
                             gap: '4px',
                             padding: '8px',
                             backgroundColor: '#f8fafc',
                             borderRadius: '6px',
                             border: '1px solid #e2e8f0'
                           }}>
                             <span style={{ 
                               color: '#475569', 
                               fontSize: '14px',
                               fontFamily: 'monospace',
                               fontWeight: '600'
                             }}>
                               {formatDate(task.createdAt).split(',')[0]}
                             </span>
                             <span style={{ 
                               color: '#64748b', 
                               fontSize: '12px',
                               fontFamily: 'monospace',
                               fontWeight: '500'
                             }}>
                               {formatDate(task.createdAt).split(',')[1]}
                          </span>
                           </div>
                        </td>
                                                 <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                           <div style={{
                             display: 'flex',
                             flexDirection: 'column',
                             gap: '6px',
                             padding: '8px',
                             backgroundColor: '#f8fafc',
                             borderRadius: '6px',
                             border: '1px solid #e2e8f0'
                           }}>
                                                         {task.status === 'PENDING' && !task.assigned_driver_id && (
                               <button
                                 className="btn btn-sm btn-outline"
                                 style={{
                                   width: '100%',
                                   margin: '0',
                                   padding: '6px 8px',
                                   fontSize: '11px',
                                   fontWeight: '600'
                                 }}
                                 onClick={() => handleCancelJob(task.id)}
                               >
{t('pages.forklift.actions.cancel')}
                               </button>
                             )}
                                                         {task.status === 'ASSIGNED' && (
                               <div style={{ 
                                 color: '#6b7280', 
                                 fontSize: '11px',
                                 textAlign: 'center',
                                 padding: '8px',
                                 backgroundColor: '#f3f4f6',
                                 borderRadius: '4px',
                                 border: '1px solid #d1d5db'
                               }}>
{t('pages.forklift.actions.driverAssigned')}
                               </div>
                             )}
                                                         {/* Không hiển thị gì khi đã gán tài xế - chỉ để trống */}
                                                         {task.status === 'ASSIGNED' && (
                               <button
                                 className="btn btn-sm btn-primary"
                                 style={{
                                   width: '100%',
                                   margin: '0',
                                   padding: '6px 8px',
                                   fontSize: '11px',
                                   fontWeight: '600'
                                 }}
                                 onClick={() => handleBeginWork(task.id)}
                               >
{t('pages.forklift.actions.startWork')}
                               </button>
                             )}
                                                         {task.status === 'IN_PROGRESS' && (
                               <button
                                 className="btn btn-sm btn-success"
                                 style={{
                                   width: '100%',
                                   margin: '0',
                                   padding: '6px 8px',
                                   fontSize: '11px',
                                   fontWeight: '600'
                                 }}
                                 onClick={() => handleCompleteJob(task.id)}
                               >
{t('pages.forklift.actions.complete')}
                               </button>
                             )}
                             
                                                           {task.status === 'PENDING_APPROVAL' && (
                                <button
                                  className="btn btn-sm btn-success"
                                  style={{
                                    width: '100%',
                                    margin: '0',
                                    padding: '6px 8px',
                                    fontSize: '11px',
                                    fontWeight: '600'
                                  }}
                                  onClick={() => handleApproveJob(task.id)}
                                  title={t('pages.forklift.actions.approveTitle')}
                                >
{t('pages.forklift.actions.approve')}
                                </button>
                              )}
                            {/* Gán tài xế lần đầu */}
                            {task.status === 'PENDING' && !task.assigned_driver_id && (
                              <button
                                className="btn btn-sm btn-info"
                                 style={{
                                   width: '100%',
                                   margin: '0',
                                   padding: '6px 8px',
                                   fontSize: '11px',
                                   fontWeight: '600'
                                 }}
                                onClick={() => handleAssignDriver(task)}
                              >
{t('pages.forklift.actions.assignDriver')}
                               </button>
                            )}
                            
                            {/* Gán lại tài xế khác */}
                            {task.status === 'PENDING' && task.assigned_driver_id && (
                              <button
                                className="btn btn-sm btn-warning"
                                 style={{
                                   width: '100%',
                                   margin: '0',
                                   padding: '6px 8px',
                                   fontSize: '11px',
                                   fontWeight: '600'
                                 }}
                                onClick={() => handleAssignDriver(task)}
                              >
{t('pages.forklift.actions.reassignDriver')}
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

      {/* Assign Driver Modal */}
      {selectedTask && (
        <AssignDriverModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedTask(null);
          }}
          onAssign={handleDriverAssigned}
          jobData={{
            id: selectedTask.id,
            container_no: selectedTask.container_no,
            source_location: selectedTask.from_slot?.code || t('pages.forklift.location.sourceLocation'),
            destination_location: selectedTask.actual_location ? 
              `${selectedTask.actual_location.slot.code} (Tier ${selectedTask.actual_location.tier})` : 
              (selectedTask.to_slot?.code || t('pages.forklift.location.destinationLocation')),
            status: selectedTask.status
          }}
          currentDriverId={selectedTask.assigned_driver_id}
        />
      )}
      {/* Update Cost Modal */}
      {selectedTask && (
        <div style={modalStyles.modal}>
          <div style={modalStyles.modalContent}>
            <div style={modalStyles.modalHeader}>
              <h3 style={modalStyles.modalTitle}>{t('pages.forklift.modal.editCost')}</h3>
              <button
                style={modalStyles.modalClose}
                onClick={() => {
                  setCostModalOpen(false);
                  setSelectedTask(null);
                }}
              >
                ×
              </button>
            </div>
            <div style={modalStyles.modalBody}>
              <div style={modalStyles.formGroup}>
                <label htmlFor="cost" style={modalStyles.formLabel}>{t('pages.forklift.modal.costLabel')}</label>
                <input
                  type="number"
                  id="cost"
                  style={modalStyles.formInput}
                  placeholder={t('pages.forklift.modal.costPlaceholder')}
                  defaultValue={selectedTask.cost || 0}
                  min="0"
                  step="1"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    const formattedValue = value.toLocaleString('vi-VN');
                    
                    // Hiển thị số đã format
                    const displayElement = document.getElementById('cost-formatted-display');
                    if (displayElement) {
                      if (value > 0) {
                        displayElement.textContent = `Số đã nhập: ${formattedValue} VNĐ`;
                        displayElement.style.display = 'block';
                      } else {
                        displayElement.style.display = 'none';
                      }
                    }
                  }}
                />
                {/* Gợi ý chi phí */}
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef',
                  fontSize: '12px',
                  color: '#6c757d'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>💡 Gợi ý chi phí:</div>
                  <div style={{ marginBottom: '2px' }}>• <strong>Dịch vụ cơ bản:</strong> 50,000 - 200,000 VNĐ</div>
                  <div style={{ marginBottom: '2px' }}>• <strong>Dịch vụ phức tạp:</strong> 200,000 - 500,000 VNĐ</div>
                  <div style={{ marginBottom: '2px' }}>• <strong>Dịch vụ đặc biệt:</strong> 500,000 - 1,000,000 VNĐ</div>
                  <div style={{ color: '#dc3545', fontWeight: '500' }}>• <strong>Giới hạn tối đa:</strong> 1,000,000,000 VNĐ (1 tỷ)</div>
                </div>
                {/* Hiển thị số đã format */}
                <div id="cost-formatted-display" style={{
                  marginTop: '4px',
                  fontSize: '11px',
                  color: '#28a745',
                  fontWeight: '500',
                  fontFamily: 'monospace'
                }}></div>
              </div>
            </div>
            <div style={modalStyles.modalFooter}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setCostModalOpen(false);
                  setSelectedTask(null);
                }}
              >
{t('pages.forklift.modal.cancel')}
              </button>
                             <button
                 className="btn btn-primary"
                 onClick={() => {
                   const costInput = document.getElementById('cost') as HTMLInputElement;
                   const costValue = costInput.value.trim();
                   
                   // Kiểm tra có nhập gì không
                   if (!costValue) {
                     showError(t('pages.forklift.messages.pleaseEnterCost'));
                     return;
                   }
                   
                   // Kiểm tra có phải là số không
                   if (isNaN(Number(costValue))) {
                     showError(t('pages.forklift.messages.costMustBeNumber'));
                     return;
                   }
                   
                   const cost = parseInt(costValue);
                   
                   // Kiểm tra có phải là số nguyên không
                   if (!Number.isInteger(cost)) {
                     showError(t('pages.forklift.messages.costMustBeInteger'));
                     return;
                   }
                   
                   // Kiểm tra có phải là số không âm không
                   if (cost < 0) {
                     showError(t('pages.forklift.messages.costCannotBeNegative'));
                     return;
                   }
                   
                   // Kiểm tra giới hạn chi phí (1 tỷ VNĐ)
                   if (cost > 1000000000) {
                     showError(t('pages.forklift.messages.costTooHigh'));
                     return;
                   }
                   
                   handleUpdateCost(selectedTask.id, cost);
                 }}
               >
{t('pages.forklift.modal.update')}
               </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  );
}
