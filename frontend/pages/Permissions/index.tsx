import useSWR, { mutate } from 'swr';
import { useEffect, useMemo, useState } from 'react';
import Header from '@components/Header';
import Card from '@components/Card';
import { api } from '@services/api';
import { AppRole, isBusinessAdmin, isSystemAdmin } from '@utils/rbac';
import { PERMISSION_CATALOG, PermissionKey } from '@utils/permissionsCatalog';

const fetcher = (url: string) => api.get(url).then(r => r.data);

// CSS styles cho scrollbar
const scrollbarStyles = `
  .permissions-scrollbar::-webkit-scrollbar {
    width: 12px;
  }
  .permissions-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 6px;
  }
  .permissions-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }
  .permissions-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  /* Scrollbar cho main content */
  .permissions-page::-webkit-scrollbar {
    width: 12px;
  }
  .permissions-page::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 6px;
  }
  .permissions-page::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 6px;
  }
  .permissions-page::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

export default function PermissionsPage(){
  const [myRole, setMyRole] = useState<string>('');
  const [myEmail, setMyEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [loadingRow, setLoadingRow] = useState<string>('');
  const [selected, setSelected] = useState<Record<string, AppRole>>({});
  const [permSelections, setPermSelections] = useState<Record<string, string[]>>({});
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [notification, setNotification] = useState<{type: 'success' | 'info' | 'warning', message: string} | null>(null);

  // Language detection from localStorage or browser - default to Vietnamese
  useEffect(() => {
    const savedLang = localStorage.getItem('preferred-language') || 'vi';
    if (savedLang === 'vi' || savedLang === 'en') {
      setLanguage(savedLang);
    } else {
      setLanguage('vi');
    }
  }, []);

  // Listen for language changes from header
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      if (event.detail && event.detail.language && (event.detail.language === 'vi' || event.detail.language === 'en')) {
        setLanguage(event.detail.language);
        localStorage.setItem('preferred-language', event.detail.language);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  // Translations
  const t = {
    vi: {
      title: 'Phân quyền vai trò',
      subtitle: 'Chỉ SystemAdmin và BusinessAdmin được phép thay đổi vai trò và chức năng của người dùng',
      searchPlaceholder: '🔍 Tìm theo email, họ tên, vai trò...',
      email: 'Email',
      fullName: 'Họ tên',
      currentRole: 'Vai trò hiện tại',
      changeRole: 'Đổi vai trò',
      functions: 'Các chức năng',
      actions: 'Thao tác',
      selectAll: '✅ Chọn tất cả',
      deselectAll: '❌ Bỏ chọn',
      applyByRole: '🔧 Áp dụng theo vai trò',
      saveChanges: '💾 Lưu thay đổi',
      cancel: '❌ Hủy',
      saving: '⏳ Đang lưu...',
      cannotChangeSelf: '⚠️ Không thể đổi vai trò của chính mình',
      accessDenied: 'Quyền truy cập',
      accessDeniedSubtitle: 'Chỉ Admin được phép truy cập trang này',
      accessDeniedMessage: 'Bạn không có quyền truy cập trang này.',
      changeRoleLabel: '🔄 Đổi vai trò:',
      functionsLabel: '⚙️ Các chức năng:',
      system: 'Hệ thống',
      request: 'Yêu cầu',
      usersPartners: 'Người dùng/Đối tác',
      permissions: 'Phân quyền',
      account: 'Tài khoản',
      requestDepot: 'Yêu cầu (Depot)',
      requestCustomer: 'Yêu cầu (Khách hàng)',
      yard: 'Bãi xe',
      containers: 'Quản lý container',
      forklift: 'Xe nâng',
      maintenance: 'Bảo trì',
      finance: 'Tài chính',
      gate: 'Cổng',
      inventory: 'Kho',
      invoices: 'Hóa đơn',
      repairs: 'Sửa chữa',
      // Permission labels
      usersPartnersView: 'Người dùng/Đối tác',
      permissionsManage: 'Phân quyền',
      accountView: 'Tài khoản',
      requestsDepot: 'Yêu cầu (Depot)',
      requestsCustomer: 'Yêu cầu (Khách hàng)',
      gateUse: 'Cổng (Gate)',
      yardView: 'Bãi (Yard)',
      containersManage: 'Quản lý container',
      forkliftView: 'Xe nâng',
      maintenanceRepairs: 'Bảo trì - Phiếu sửa chữa',
      maintenanceInventory: 'Bảo trì - Tồn kho',
      financeInvoices: 'Tài chính - Hóa đơn',
      driverDashboard: 'Bảng điều khiển tài xế',
      
    },
    en: {
      title: 'Role Permissions',
      subtitle: 'Only SystemAdmin and BusinessAdmin are allowed to change user roles and functions',
      searchPlaceholder: '🔍 Search by email, full name, role...',
      email: 'Email',
      fullName: 'Full Name',
      currentRole: 'Current Role',
      changeRole: 'Change Role',
      functions: 'Functions',
      actions: 'Actions',
      selectAll: '✅ Select All',
      deselectAll: '❌ Deselect All',
      applyByRole: '🔧 Apply by Role',
      saveChanges: '💾 Save Changes',
      cancel: '❌ Cancel',
      saving: '⏳ Saving...',
      cannotChangeSelf: '⚠️ Cannot change your own role',
      accessDenied: 'Access Denied',
      accessDeniedSubtitle: 'Only Admin can access this page',
      accessDeniedMessage: 'You do not have permission to access this page.',
      changeRoleLabel: '🔄 Change Role:',
      functionsLabel: '⚙️ Functions:',
      system: 'System',
      request: 'Request',
      usersPartners: 'Users/Partners',
      permissions: 'Permissions',
      account: 'Account',
      requestDepot: 'Request (Depot)',
      requestCustomer: 'Request (Customer)',
      yard: 'Yard',
      containers: 'Container Management',
      forklift: 'Forklift',
      maintenance: 'Maintenance',
      finance: 'Finance',
      gate: 'Gate',
      inventory: 'Inventory',
      invoices: 'Invoices',
      repairs: 'Repairs',
      // Permission labels
      usersPartnersView: 'Users/Partners',
      permissionsManage: 'Permissions',
      accountView: 'Account',
      requestsDepot: 'Request (Depot)',
      requestsCustomer: 'Request (Customer)',
      gateUse: 'Gate',
      yardView: 'Yard',
      containersManage: 'Container Management',
      forkliftView: 'Forklift',
      maintenanceRepairs: 'Maintenance - Repair Tickets',
      maintenanceInventory: 'Maintenance - Inventory',
      financeInvoices: 'Finance - Invoices',
      driverDashboard: 'Driver Dashboard',
      
    }
  };
  

  useEffect(()=>{
    if (typeof window !== 'undefined'){
      api.get('/auth/me')
        .then(r=>{ setMyRole(r.data?.role || r.data?.roles?.[0] || ''); setMyEmail(r.data?.email || ''); })
        .catch(()=>{});
    }
  },[]);

  const isAllowed = isSystemAdmin(myRole) || isBusinessAdmin(myRole);
  const { data: users } = useSWR(isAllowed ? ['/users?role=&page=1&limit=100'] : null, ([u]) => fetcher(u));

  const roleOptions: AppRole[] = useMemo(()=>[
    'SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin','CustomerUser','PartnerAdmin','Security','YardManager','MaintenanceManager','Accountant','Driver'
  ], []);

  // Group catalog by group for rendering
  const catalogByGroup = useMemo(()=>{
    const groups = new Map<string, Array<{ key: PermissionKey; label: string }>>();
    for (const it of PERMISSION_CATALOG) {
      const arr = groups.get(it.group) || [];
      arr.push({ key: it.key, label: it.label });
      groups.set(it.group, arr);
    }
    return Array.from(groups.entries());
  }, []);

  // Function to translate group names
  const translateGroup = (groupName: string) => {
    const groupTranslations: Record<string, Record<'vi' | 'en', string>> = {
      'Hệ thống': { vi: 'Hệ thống', en: 'System' },
      'Yêu cầu': { vi: 'Yêu cầu', en: 'Request' },
      'Vận hành': { vi: 'Vận hành', en: 'Operations' },
      'Bảo trì': { vi: 'Bảo trì', en: 'Maintenance' },
      'Tài chính': { vi: 'Tài chính', en: 'Finance' },
      'Cổng': { vi: 'Cổng', en: 'Gate' },
      'Kho': { vi: 'Kho', en: 'Inventory' },
      'Hóa đơn': { vi: 'Hóa đơn', en: 'Invoices' },
      'Sửa chữa': { vi: 'Sửa chữa', en: 'Repairs' }
    };
    
    return groupTranslations[groupName]?.[language] || groupName;
  };

  // Function to translate permission labels
  const translatePermissionLabel = (key: string) => {
    const permissionTranslations: Record<string, Record<'vi' | 'en', string>> = {
      'users_partners.view': { vi: 'Người dùng/Đối tác', en: 'Users/Partners' },
      'permissions.manage': { vi: 'Phân quyền', en: 'Permissions' },
      'account.view': { vi: 'Tài khoản', en: 'Account' },
      'requests.depot': { vi: 'Yêu cầu (Depot)', en: 'Request (Depot)' },
      'requests.customer': { vi: 'Yêu cầu (Khách hàng)', en: 'Request (Customer)' },
      'gate.use': { vi: 'Cổng (Gate)', en: 'Gate' },
      'yard.view': { vi: 'Bãi (Yard)', en: 'Yard' },
      'containers.manage': { vi: 'Quản lý container', en: 'Container Management' },
      'forklift.view': { vi: 'Xe nâng', en: 'Forklift' },
      'maintenance.repairs': { vi: 'Bảo trì - Phiếu sửa chữa', en: 'Maintenance - Repair Tickets' },
      'maintenance.inventory': { vi: 'Bảo trì - Tồn kho', en: 'Maintenance - Inventory' },
      'finance.invoices': { vi: 'Tài chính - Hóa đơn', en: 'Finance - Invoices' },
      'driver.dashboard': { vi: 'Bảng điều khiển tài xế', en: 'Driver Dashboard' }
    };
    
    return permissionTranslations[key]?.[language] || key;
  };

  // Presets theo vai trò (dùng để hiển thị mặc định dấu ✓ theo role khi user chưa có permissions riêng)
  const rolePresets: Partial<Record<AppRole, PermissionKey[]>> = useMemo(()=>{
    const all = PERMISSION_CATALOG.map(i=>i.key) as PermissionKey[];
    return {
      SystemAdmin: all,
      BusinessAdmin: [
        'users_partners.view',
        'permissions.manage',
        'requests.depot',
        'account.view',
      ],
      HRManager: [
        'account.view',
      ],
      SaleAdmin: [
        'requests.depot',
        'yard.view',
        'containers.manage',
        'forklift.view',
        'maintenance.repairs',
        'maintenance.inventory',
        'finance.invoices',
        'account.view',
      ],
      CustomerAdmin: [
        'users_partners.view', // nếu muốn cho CustomerAdmin xem người dùng/đối tác, có thể gỡ nếu không cần
        'requests.customer',
        'account.view',
      ],
      CustomerUser: [
        'requests.customer',
        'account.view',
      ],
      PartnerAdmin: [
        'account.view',
      ],
      Security: [
        'gate.use',
        'account.view',
      ],
      YardManager: [
        'yard.view',
        'containers.manage',
        'forklift.view',
        'account.view',
      ],
      MaintenanceManager: [
        'maintenance.repairs',
        'maintenance.inventory',
        'account.view',
      ],
      Accountant: [
        'requests.depot',
        'finance.invoices',
        'account.view',
      ],
      Driver: [
        'driver.dashboard',
        'account.view',
      ],
    };
  }, []);

  const list = (users?.data || []) as Array<any>;

  const filtered = useMemo(()=>{
    const kw = keyword.trim().toLowerCase();
    if (!kw) return list;
    return list.filter((u)=>
      String(u.email || '').toLowerCase().includes(kw) ||
      String(u.full_name || '').toLowerCase().includes(kw) ||
      String(u.role || '').toLowerCase().includes(kw)
    );
  }, [list, keyword]);

  const sameStringSet = (a: string[] = [], b: string[] = []): boolean => {
    if (a.length !== b.length) return false;
    const sa = new Set(a);
    for (const x of b) if (!sa.has(x)) return false;
    return true;
  };

  // Function to show notification
  const showNotification = (type: 'success' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };


  const saveRole = async (user: any) => {
    const id = user.id || user._id;
    const newRole = selected[id] || user.role;
    if (!id) return;
    if (newRole === user.role) return;
         if (String(user.email || '') === myEmail) { 
           showNotification('warning', language === 'vi' ? 'Không thể tự đổi vai trò của chính mình.' : 'Cannot change your own role.');
           return; 
         }
    setMessage('');
    setLoadingRow(id);
    showNotification('info', language === 'vi' ? `Đang cập nhật vai trò cho ${user.email}...` : `Updating role for ${user.email}...`);
    try{
      await api.patch(`/users/${id}`, { role: newRole });
      showNotification('success', language === 'vi' ? `✅ Đã cập nhật vai trò cho ${user.email} thành ${newRole}` : `✅ Updated role for ${user.email} to ${newRole}`);
      setSelected((s)=>({ ...s, [id]: newRole }));
      mutate(['/users?role=&page=1&limit=100']);
    }catch(e:any){
      showNotification('warning', e?.response?.data?.message || (language === 'vi' ? '❌ Lỗi cập nhật vai trò' : '❌ Error updating role'));
    }finally{
      setLoadingRow('');
    }
  };

  const savePermissions = async (user: any) => {
    const id = user.id || user._id;
    if (!id) return;
         if (String(user.email || '') === myEmail) { 
           showNotification('warning', language === 'vi' ? 'Không thể tự đổi chức năng của chính mình.' : 'Cannot change your own functions.');
           return; 
         }
    const currentPerms: string[] = Array.isArray(user.permissions) ? user.permissions : [];
    const selRole = selected[id] || user.role;
    const roleDefault = rolePresets[selRole]?.slice(0,50) || [];
    const newPerms = (permSelections[id] ?? (currentPerms.length ? currentPerms : roleDefault)).slice(0, 50);
    if (sameStringSet(newPerms, currentPerms)) return; // no changes
    setMessage('');
    setLoadingRow(id);
    showNotification('info', language === 'vi' ? `Đang cập nhật chức năng cho ${user.email}...` : `Updating functions for ${user.email}...`);
    try {
      await api.patch(`/users/${id}`, { permissions: newPerms });
      showNotification('success', language === 'vi' ? `✅ Đã cập nhật chức năng cho ${user.email}` : `✅ Updated functions for ${user.email}`);
      mutate(['/users?role=&page=1&limit=100']);
    } catch (e:any) {
      showNotification('warning', e?.response?.data?.message || (language === 'vi' ? '❌ Lỗi cập nhật chức năng' : '❌ Error updating functions'));
    } finally {
      setLoadingRow('');
    }
  };


  if (!isAllowed) {
    return (
      <>
        <Header />
        <main className="container">
          <Card title={t[language].accessDenied} subtitle={t[language].accessDeniedSubtitle}>
            {t[language].accessDeniedMessage}
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{`
        body, html {
          overflow: hidden !important;
          height: 100vh !important;
        }
        .permissions-page {
          overflow: hidden !important;
          height: 100vh !important;
        }

                 .permissions-content {
           overflow: auto;
           height: calc(100vh - 120px);
           padding-bottom: 20px;
         }
        .permissions-content::-webkit-scrollbar {
          width: 12px;
        }
        .permissions-content::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
        }
        .permissions-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 6px;
        }
        .permissions-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        

         
         /* Custom search input styling for permissions page */
         .search-input {
           padding: 14px 24px;
           border: 2px solid rgba(255,255,255,0.3);
           border-radius: 28px;
           font-size: 15px;
           background: rgba(255,255,255,0.9);
           backdrop-filter: blur(10px);
           min-width: 360px;
           box-shadow: 0 2px 8px rgba(0,0,0,0.1);
           transition: all 0.3s ease;
         }
         
         .search-input:focus {
           outline: none;
           border-color: rgba(255,255,255,0.8);
           background: rgba(255,255,255,0.95);
           box-shadow: 0 4px 16px rgba(0,0,0,0.15);
           transform: translateY(-1px);
         }
         
         .search-input::placeholder {
           color: #64748b;
           font-weight: 500;
         }
        
        /* Enhanced Table Styles */
                 .enhanced-table {
           width: 100%;
           min-width: 1400px;
           border-collapse: separate;
           border-spacing: 0;
           background: white;
           border-radius: 8px;
           overflow: hidden;
           box-shadow: 0 1px 3px rgba(0,0,0,0.1);
         }
                 .enhanced-table th {
           background: #f8fafc;
           color: #334155;
           font-weight: 600;
           padding: 20px 16px;
           text-align: left;
           border-bottom: 2px solid #e2e8f0;
           font-size: 15px;
           white-space: nowrap;
         }
                 .enhanced-table td {
           padding: 20px 16px;
           border-bottom: 1px solid #f1f5f9;
           vertical-align: top;
         }
        .enhanced-table tr:nth-child(even) {
          background: #fafafa;
        }
        .enhanced-table tr:hover {
          background: #f1f5f9;
          transition: background 0.2s;
        }
        
        /* Enhanced Role Badges */
                 .role-badge {
           padding: 8px 16px;
           border-radius: 20px;
           font-size: 13px;
           font-weight: 600;
           color: white;
           display: inline-flex;
           align-items: center;
           gap: 6px;
           min-width: 120px;
           justify-content: center;
         }
        .role-badge.system-admin { background: #dc2626; }
        .role-badge.business-admin { background: #7c3aed; }
        .role-badge.hr-manager { background: #059669; }
        .role-badge.sale-admin { background: #ea580c; }
        .role-badge.customer-admin { background: #0891b2; }
        .role-badge.driver { background: #6b7280; }
        .role-badge.default { background: #6b7280; }
        
        /* Enhanced Function Groups */
        .function-group {
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .function-group-header {
          background: #f8fafc;
          padding: 12px 16px;
          font-weight: 600;
          color: #374151;
          font-size: 13px;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .function-group-content {
          padding: 16px;
          max-height: 200px;
          overflow-y: auto;
        }
                 .function-item {
           display: flex;
           align-items: center;
           gap: 8px;
           padding: 8px 0;
           font-size: 13px;
         }
                 .function-item input[type="checkbox"] {
           width: 18px;
           height: 18px;
         }
        
        /* Enhanced Action Buttons */
                         .btn-save {
          background: #059669;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
          justify-content: flex-start;
        }
        .btn-save:hover {
          background: #047857;
        }
        .btn-save:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
                         .btn-cancel {
          background: #6b7280;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
          justify-content: flex-start;
        }
        .btn-cancel:hover {
          background: #4b5563;
        }
        
        /* Function Control Buttons */
        .function-controls {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
                 .btn-control {
           background: #f3f4f6;
           color: #374151;
           border: 1px solid #d1d5db;
           padding: 6px 12px;
           border-radius: 4px;
           font-size: 12px;
           cursor: pointer;
           transition: all 0.2s;
         }
        .btn-control:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .enhanced-table {
            display: none;
          }
          .mobile-cards {
            display: block;
          }
        }
        .mobile-cards {
          display: none;
        }
        .user-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .user-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .user-info {
          flex: 1;
        }
        .user-email {
          font-weight: 600;
          color: #1e40af;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .user-name {
          color: #374151;
          font-size: 13px;
        }
        
        /* Notification Animation */
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <Header />
      <main className="container depot-requests" style={{ 
        overflow: 'hidden', 
        height: '100vh',
        paddingTop: '20px',
        paddingBottom: '20px'
      }}>
         <div className="page-header modern-header">
           <div className="header-content">
             <div className="header-left">
               <h1 className="page-title gradient gradient-ultimate">{t[language].title}</h1>
               <div className="page-subtitle">
                 <span className="info-icon">ℹ️</span>
                 <span>{t[language].subtitle}</span>
               </div>
             </div>
             <div className="header-actions">
               <input 
                 type="text" 
                 className="search-input"
                 placeholder={t[language].searchPlaceholder}
                 value={keyword}
                 onChange={e=>setKeyword(e.target.value)}
               />
             </div>
           </div>
         </div>
                        <div className="permissions-content">
                     {/* Desktop Table View */}
           <div className="enhanced-table-container" style={{ padding: '10px' }}>
            <table className="enhanced-table">
                             <thead>
                 <tr>
                   <th>👤 {t[language].email}</th>
                   <th>📝 {t[language].fullName}</th>
                   <th>🏷️ {t[language].currentRole}</th>
                   <th>🔄 {t[language].changeRole}</th>
                   <th>⚙️ {t[language].functions}</th>
                   <th>🎯 {t[language].actions}</th>
                 </tr>
               </thead>
              <tbody>
                {filtered.map((u:any)=>{
                  const id = u.id || u._id;
                  const current = u.role as AppRole;
                  const sel = selected[id] || current;
                  const isSelf = String(u.email || '') === myEmail;
                  const currPerms: string[] = Array.isArray(u.permissions) ? u.permissions : [];
                  const roleDefault: string[] = rolePresets[sel]?.slice(0,50) || [];
                  const checkedPerms: string[] = permSelections[id] ?? (currPerms.length ? currPerms : roleDefault);
                  
                  const getRoleBadgeClass = (role: string) => {
                    switch(role) {
                      case 'SystemAdmin': return 'role-badge system-admin';
                      case 'BusinessAdmin': return 'role-badge business-admin';
                      case 'HRManager': return 'role-badge hr-manager';
                      case 'SaleAdmin': return 'role-badge sale-admin';
                      case 'CustomerAdmin': return 'role-badge customer-admin';
                      case 'Driver': return 'role-badge driver';
                      default: return 'role-badge default';
                    }
                  };
                  
                  return (
                    <tr key={id}>
                      <td>
                        <div style={{fontWeight:600, color:'#1e40af', fontSize:'14px'}}>{u.email}</div>
                      </td>
                      <td>
                        <div style={{fontSize:'14px', color:'#374151'}}>{u.full_name}</div>
                      </td>
                      <td>
                        <span className={getRoleBadgeClass(current)} title={language === 'vi' ? `Vai trò hiện tại: ${current}` : `Current Role: ${current}`}>
                          {current === 'SystemAdmin' && '👑'}
                          {current === 'BusinessAdmin' && '💼'}
                          {current === 'SaleAdmin' && '💰'}
                          {current === 'Driver' && '🚗'}
                          {current}
                        </span>
                      </td>
                      <td>
                        <select 
                          value={sel}
                          onChange={(e)=>{
                            const newRole = e.target.value as AppRole;
                            setSelected((s)=>({ ...s, [id]: newRole }));
                            const preset = (rolePresets[newRole] || []).slice(0,50) as string[];
                            setPermSelections(prev=>({ ...prev, [id]: preset }));
                          }}
                          disabled={isSelf || loadingRow === id}
                          style={{ 
                            padding:'8px 12px', 
                            border:'1px solid #d1d5db', 
                            borderRadius:6, 
                            background:'white',
                            fontSize:'13px',
                            minWidth:'140px'
                          }}
                                                     title={language === 'vi' ? "Chọn vai trò mới" : "Select new role"}
                        >
                          {roleOptions.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                                                 {isSelf && (
                           <div style={{fontSize:11, color:'#ef4444', marginTop:'4px'}}>{t[language].cannotChangeSelf}</div>
                         )}
                      </td>
                                             <td style={{minWidth:'500px'}}>
                        {/* Function Control Buttons */}
                                                 <div className="function-controls">
                           <button
                             className="btn-control"
                             disabled={isSelf || loadingRow === id}
                             onClick={()=> {
                               setPermSelections(prev=>({ ...prev, [id]: (PERMISSION_CATALOG.map(i=>i.key) as string[]).slice(0,50) }));
                               showNotification('info', 
                                 language === 'vi' ? 
                                   `Đã chọn tất cả chức năng cho ${u.email}` :
                                   `Selected all functions for ${u.email}`
                               );
                             }}
                             title={language === 'vi' ? "Chọn tất cả chức năng" : "Select all functions"}
                           >
                             {t[language].selectAll}
                           </button>
                           <button
                             className="btn-control"
                             disabled={isSelf || loadingRow === id}
                             onClick={()=> {
                               setPermSelections(prev=>({ ...prev, [id]: [] }));
                               showNotification('warning', 
                                 language === 'vi' ? 
                                   `Đã bỏ chọn tất cả chức năng cho ${u.email}` :
                                   `Deselected all functions for ${u.email}`
                               );
                             }}
                             title={language === 'vi' ? "Bỏ chọn tất cả" : "Deselect all"}
                           >
                             {t[language].deselectAll}
                           </button>
                           {rolePresets[sel] && (
                             <button
                               className="btn-control"
                               disabled={isSelf || loadingRow === id}
                               onClick={()=> {
                                 setPermSelections(prev=>({ ...prev, [id]: (rolePresets[sel] || []).slice(0,50) }));
                                 showNotification('info', 
                                   language === 'vi' ? 
                                     `Đã áp dụng chức năng mặc định của vai trò ${sel} cho ${u.email}` :
                                     `Applied default functions for role ${sel} to ${u.email}`
                                 );
                               }}
                               title={language === 'vi' ? `Áp dụng chức năng mặc định của vai trò ${sel}` : `Apply default functions for role ${sel}`}
                             >
                               {t[language].applyByRole}
                             </button>
                           )}
                         </div>
                        
                        {/* Function Groups */}
                                                 <div style={{maxHeight: 300, overflowY: 'auto', border:'1px solid #e5e7eb', padding:16, borderRadius:8, background:'#fafafa'}}>
                                                     {catalogByGroup.map(([group, items]) => (
                             <div key={group} style={{marginBottom:12}}>
                               <div style={{fontSize:13, fontWeight:600, color:'#374151', marginBottom:8, padding:'8px 12px', background:'#f1f5f9', borderRadius:6}}>
                                 📁 {translateGroup(group)}
                               </div>
                                                             {items.map(({key, label}) => (
                                 <label key={key} className="function-item" title={translatePermissionLabel(key)}>
                                   <input
                                     type="checkbox"
                                     checked={checkedPerms.includes(key)}
                                     disabled={isSelf || loadingRow === id}
                                     onChange={(e)=>{
                                       setPermSelections(prev=>{
                                         const base = prev[id] ?? (currPerms.length ? currPerms : roleDefault);
                                         const has = base.includes(key);
                                         let next = base;
                                         if (e.target.checked) next = has ? base : [...base, key];
                                         else next = base.filter(k=>k!==key);
                                         if (next.length > 50) next = next.slice(0, 50);
                                         
                                         // Show notification when permission is changed
                                         const action = e.target.checked ? 
                                           (language === 'vi' ? 'đã bật' : 'enabled') : 
                                           (language === 'vi' ? 'đã tắt' : 'disabled');
                                         const permissionName = translatePermissionLabel(key);
                                         showNotification('info', 
                                           language === 'vi' ? 
                                             `Chức năng "${permissionName}" ${action} cho ${u.email}` :
                                             `Function "${permissionName}" ${action} for ${u.email}`
                                         );
                                         
                                         return { ...prev, [id]: next };
                                       });
                                     }}
                                   />
                                   <span style={{color:'#4b5563'}}>{translatePermissionLabel(key)}</span>
                                 </label>
                               ))}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                                                       <button 
                              className="btn-save"
                              disabled={isSelf || (sel === current && sameStringSet(checkedPerms, currPerms)) || loadingRow === id}
                              onClick={async ()=>{
                                showNotification('info', language === 'vi' ? `🔄 Đang lưu thay đổi cho ${u.email}...` : `🔄 Saving changes for ${u.email}...`);
                                if (sel !== current) await saveRole(u);
                                if (!sameStringSet(checkedPerms, currPerms)) await savePermissions(u);
                                if (sel === current && sameStringSet(checkedPerms, currPerms)) {
                                  showNotification('info', language === 'vi' ? `ℹ️ Không có thay đổi nào để lưu cho ${u.email}` : `ℹ️ No changes to save for ${u.email}`);
                                }
                              }}
                              title={language === 'vi' ? "Lưu tất cả thay đổi" : "Save all changes"}
                            >
                              {loadingRow === id ? t[language].saving : t[language].saveChanges}
                            </button>
                                                       <button
                              className="btn-cancel"
                              disabled={isSelf || loadingRow === id}
                              onClick={()=> {
                                setSelected(prev => {
                                  const newState = { ...prev };
                                  delete newState[id];
                                  return newState;
                                });
                                setPermSelections(prev => {
                                  const newState = { ...prev };
                                  delete newState[id];
                                  return newState;
                                });
                                showNotification('info', language === 'vi' ? `🔄 Đã hủy thay đổi cho ${u.email}` : `🔄 Cancelled changes for ${u.email}`);
                              }}
                              title={language === 'vi' ? "Hủy thay đổi" : "Cancel changes"}
                              style={{marginTop: '8px'}}
                            >
                              {t[language].cancel}
                            </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
                     {/* Mobile Card View */}
           <div className="mobile-cards" style={{ padding: '10px' }}>
            {filtered.map((u:any)=>{
              const id = u.id || u._id;
              const current = u.role as AppRole;
              const sel = selected[id] || current;
              const isSelf = String(u.email || '') === myEmail;
              const currPerms: string[] = Array.isArray(u.permissions) ? u.permissions : [];
              const roleDefault: string[] = rolePresets[sel]?.slice(0,50) || [];
              const checkedPerms: string[] = permSelections[id] ?? (currPerms.length ? currPerms : roleDefault);
              
              const getRoleBadgeClass = (role: string) => {
                switch(role) {
                  case 'SystemAdmin': return 'role-badge system-admin';
                  case 'BusinessAdmin': return 'role-badge business-admin';
                  case 'HRManager': return 'role-badge hr-manager';
                  case 'SaleAdmin': return 'role-badge sale-admin';
                  case 'CustomerAdmin': return 'role-badge customer-admin';
                  case 'Driver': return 'role-badge driver';
                  default: return 'role-badge default';
                }
              };
              
              return (
                <div key={id} className="user-card">
                  <div className="user-card-header">
                    <div className="user-info">
                      <div className="user-email">{u.email}</div>
                      <div className="user-name">{u.full_name}</div>
                    </div>
                    <span className={getRoleBadgeClass(current)} title={language === 'vi' ? `Vai trò hiện tại: ${current}` : `Current Role: ${current}`}>
                      {current === 'SystemAdmin' && '👑'}
                      {current === 'BusinessAdmin' && '💼'}
                      {current === 'SaleAdmin' && '💰'}
                      {current === 'Driver' && '🚗'}
                      {current}
                    </span>
                  </div>
                  
                  <div style={{marginBottom: '16px'}}>
                                         <label style={{fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'8px', display:'block'}}>
                       {t[language].changeRoleLabel}
                     </label>
                    <select 
                      value={sel}
                      onChange={(e)=>{
                        const newRole = e.target.value as AppRole;
                        setSelected((s)=>({ ...s, [id]: newRole }));
                        const preset = (rolePresets[newRole] || []).slice(0,50) as string[];
                        setPermSelections(prev=>({ ...prev, [id]: preset }));
                      }}
                      disabled={isSelf || loadingRow === id}
                      style={{ 
                        padding:'8px 12px', 
                        border:'1px solid #d1d5db', 
                        borderRadius:6, 
                        background:'white',
                        fontSize:'13px',
                        width:'100%'
                      }}
                    >
                      {roleOptions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                                         {isSelf && (
                       <div style={{fontSize:11, color:'#ef4444', marginTop:'4px'}}>{t[language].cannotChangeSelf}</div>
                     )}
                  </div>
                  
                  <div style={{marginBottom: '16px'}}>
                                         <label style={{fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'8px', display:'block'}}>
                       {t[language].functionsLabel}
                     </label>
                    
                    {/* Function Control Buttons */}
                                         <div className="function-controls" style={{marginBottom:'12px'}}>
                       <button
                         className="btn-control"
                         disabled={isSelf || loadingRow === id}
                         onClick={()=> {
                           setPermSelections(prev=>({ ...prev, [id]: (PERMISSION_CATALOG.map(i=>i.key) as string[]).slice(0,50) }));
                           showNotification('info', 
                             language === 'vi' ? 
                               `Đã chọn tất cả chức năng cho ${u.email}` :
                               `Selected all functions for ${u.email}`
                           );
                         }}
                       >
                         {t[language].selectAll}
                       </button>
                       <button
                         className="btn-control"
                         disabled={isSelf || loadingRow === id}
                         onClick={()=> {
                           setPermSelections(prev=>({ ...prev, [id]: [] }));
                           showNotification('warning', 
                             language === 'vi' ? 
                               `Đã bỏ chọn tất cả chức năng cho ${u.email}` :
                               `Deselected all functions for ${u.email}`
                           );
                         }}
                       >
                         {t[language].deselectAll}
                       </button>
                       {rolePresets[sel] && (
                         <button
                           className="btn-control"
                           disabled={isSelf || loadingRow === id}
                           onClick={()=> {
                             setPermSelections(prev=>({ ...prev, [id]: (rolePresets[sel] || []).slice(0,50) }));
                             showNotification('info', 
                               language === 'vi' ? 
                                 `Đã áp dụng chức năng mặc định của vai trò ${sel} cho ${u.email}` :
                                 `Applied default functions for role ${sel} to ${u.email}`
                             );
                           }}
                         >
                           {t[language].applyByRole}
                         </button>
                       )}
                     </div>
                    
                    {/* Function Groups */}
                                             <div style={{maxHeight: 250, overflowY: 'auto', border:'1px solid #e5e7eb', padding:16, borderRadius:8, background:'#fafafa'}}>
                                             {catalogByGroup.map(([group, items]) => (
                         <div key={group} style={{marginBottom:12}}>
                           <div style={{fontSize:12, fontWeight:600, color:'#374151', marginBottom:8, padding:'6px 10px', background:'#f1f5f9', borderRadius:6}}>
                             📁 {translateGroup(group)}
                           </div>
                                                     {items.map(({key, label}) => (
                             <label key={key} className="function-item" title={translatePermissionLabel(key)}>
                               <input
                                 type="checkbox"
                                 checked={checkedPerms.includes(key)}
                                 disabled={isSelf || loadingRow === id}
                                 onChange={(e)=>{
                                   setPermSelections(prev=>{
                                     const base = prev[id] ?? (currPerms.length ? currPerms : roleDefault);
                                     const has = base.includes(key);
                                     let next = base;
                                     if (e.target.checked) next = has ? base : [...base, key];
                                     else next = base.filter(k=>k!==key);
                                     if (next.length > 50) next = next.slice(0, 50);
                                     
                                     // Show notification when permission is changed
                                     const action = e.target.checked ? 
                                       (language === 'vi' ? 'đã bật' : 'enabled') : 
                                       (language === 'vi' ? 'đã tắt' : 'disabled');
                                     const permissionName = translatePermissionLabel(key);
                                     showNotification('info', 
                                       language === 'vi' ? 
                                         `Chức năng "${permissionName}" ${action} cho ${u.email}` :
                                         `Function "${permissionName}" ${action} for ${u.email}`
                                     );
                                     
                                     return { ...prev, [id]: next };
                                   });
                                 }}
                               />
                               <span style={{color:'#4b5563', fontSize:'11px'}}>{translatePermissionLabel(key)}</span>
                             </label>
                           ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                                         <button 
                       className="btn-save"
                       disabled={isSelf || (sel === current && sameStringSet(checkedPerms, currPerms)) || loadingRow === id}
                       onClick={async ()=>{
                         if (sel !== current) await saveRole(u);
                         if (!sameStringSet(checkedPerms, currPerms)) await savePermissions(u);
                       }}
                       style={{flex:1}}
                     >
                       {loadingRow === id ? t[language].saving : t[language].saveChanges}
                     </button>
                     <button
                       className="btn-cancel"
                       disabled={isSelf || loadingRow === id}
                       onClick={()=> {
                         setSelected(prev => {
                           const newState = { ...prev };
                           delete newState[id];
                           return newState;
                         });
                         setPermSelections(prev => {
                           const newState = { ...prev };
                           delete newState[id];
                           return newState;
                         });
                       }}
                       style={{marginTop: '8px'}}
                     >
                       {t[language].cancel}
                     </button>
                </div>
              );
            })}
          </div>
          {message && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#ecfdf5',
              color: '#065f46',
              borderRadius: 8,
              border: '1px solid #a7f3d0',
              fontSize: 14
            }}>
                           {message}
           </div>
         )}
         
         {/* Notification Toast */}
         {notification && (
           <div style={{
             position: 'fixed',
             top: '20px',
             right: '20px',
             zIndex: 9999,
             padding: '16px 20px',
             borderRadius: '8px',
             color: 'white',
             fontSize: '14px',
             fontWeight: '500',
             maxWidth: '400px',
             boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
             animation: 'slideInRight 0.3s ease-out',
             background: notification.type === 'success' ? '#10b981' : 
                        notification.type === 'warning' ? '#f59e0b' : '#3b82f6'
           }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span>
                 {notification.type === 'success' ? '✅' : 
                  notification.type === 'warning' ? '⚠️' : 'ℹ️'}
               </span>
               <span>{notification.message}</span>
             </div>
           </div>
         )}
         </div>
       </main>
     </>
   );
}
