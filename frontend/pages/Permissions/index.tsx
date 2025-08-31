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

  // Language detection from localStorage or browser
  useEffect(() => {
    const savedLang = localStorage.getItem('preferred-language') || navigator.language.startsWith('en') ? 'en' : 'vi';
    setLanguage(savedLang);
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
      reports: 'Báo cáo',
      gate: 'Cổng',
      inventory: 'Kho',
      invoices: 'Hóa đơn',
      createInvoice: 'Tạo hóa đơn',
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
      financeCreateInvoice: 'Tài chính - Tạo hóa đơn',
      reportsView: 'Báo cáo',
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
      reports: 'Reports',
      gate: 'Gate',
      inventory: 'Inventory',
      invoices: 'Invoices',
      createInvoice: 'Create Invoice',
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
      financeCreateInvoice: 'Finance - Create Invoice',
      reportsView: 'Reports',
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
    'SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin','CustomerUser','PartnerAdmin','Security','YardManager','MaintenanceManager','Accountant'
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
      'Báo cáo': { vi: 'Báo cáo', en: 'Reports' },
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
      'finance.create_invoice': { vi: 'Tài chính - Tạo hóa đơn', en: 'Finance - Create Invoice' },
      'reports.view': { vi: 'Báo cáo', en: 'Reports' },
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
        'reports.view',
        'account.view',
      ],
      HRManager: [
        'reports.view',
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
        'finance.create_invoice',
        'reports.view',
        'account.view',
      ],
      CustomerAdmin: [
        'users_partners.view', // nếu muốn cho CustomerAdmin xem người dùng/đối tác, có thể gỡ nếu không cần
        'requests.customer',
        'reports.view',
        'account.view',
      ],
      CustomerUser: [
        'requests.customer',
        'reports.view',
        'account.view',
      ],
      PartnerAdmin: [
        'reports.view',
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
        'reports.view',
        'account.view',
      ],
      MaintenanceManager: [
        'maintenance.repairs',
        'maintenance.inventory',
        'reports.view',
        'account.view',
      ],
      Accountant: [
        'requests.depot',
        'finance.invoices',
        'finance.create_invoice',
        'reports.view',
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


  const saveRole = async (user: any) => {
    const id = user.id || user._id;
    const newRole = selected[id] || user.role;
    if (!id) return;
    if (newRole === user.role) return;
         if (String(user.email || '') === myEmail) { setMessage(language === 'vi' ? 'Không thể tự đổi vai trò của chính mình.' : 'Cannot change your own role.'); return; }
    setMessage('');
    setLoadingRow(id);
    try{
      await api.patch(`/users/${id}`, { role: newRole });
             setMessage(language === 'vi' ? `Đã cập nhật vai trò cho ${user.email} -> ${newRole}` : `Updated role for ${user.email} -> ${newRole}`);
      setSelected((s)=>({ ...s, [id]: newRole }));
      mutate(['/users?role=&page=1&limit=100']);
    }catch(e:any){
             setMessage(e?.response?.data?.message || (language === 'vi' ? 'Lỗi cập nhật vai trò' : 'Error updating role'));
    }finally{
      setLoadingRow('');
    }
  };

  const savePermissions = async (user: any) => {
    const id = user.id || user._id;
    if (!id) return;
         if (String(user.email || '') === myEmail) { setMessage(language === 'vi' ? 'Không thể tự đổi chức năng của chính mình.' : 'Cannot change your own functions.'); return; }
    const currentPerms: string[] = Array.isArray(user.permissions) ? user.permissions : [];
    const selRole = selected[id] || user.role;
    const roleDefault = rolePresets[selRole]?.slice(0,50) || [];
    const newPerms = (permSelections[id] ?? (currentPerms.length ? currentPerms : roleDefault)).slice(0, 50);
    if (sameStringSet(newPerms, currentPerms)) return; // no changes
    setMessage('');
    setLoadingRow(id);
    try {
      await api.patch(`/users/${id}`, { permissions: newPerms });
             setMessage(language === 'vi' ? `Đã cập nhật chức năng cho ${user.email}` : `Updated functions for ${user.email}`);
      mutate(['/users?role=&page=1&limit=100']);
    } catch (e:any) {
             setMessage(e?.response?.data?.message || (language === 'vi' ? 'Lỗi cập nhật chức năng' : 'Error updating functions'));
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
                 .permissions-header {
           position: sticky;
           top: 0;
           background: white;
           z-index: 100;
           padding: 20px 10px;
           border-bottom: 1px solid #e5e7eb;
           margin-bottom: 20px;
           min-width: 1400px;
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
        
        /* Enhanced UI Styles */
                 .page-title {
           font-size: 32px;
           font-weight: 700;
           color: #1e293b;
           margin-bottom: 12px;
           text-shadow: 0 1px 2px rgba(0,0,0,0.1);
           display: inline-block;
           margin-right: 40px;
         }
                 .page-subtitle {
           display: inline-flex;
           align-items: center;
           gap: 8px;
           color: #64748b;
           font-size: 16px;
           line-height: 1.5;
           margin-right: 40px;
         }
                 .info-icon {
           color: #3b82f6;
           font-size: 18px;
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
        .action-buttons {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
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
      `}</style>
      <Header />
      <main className="container permissions-page" style={{ 
        overflow: 'hidden', 
        height: '100vh',
        paddingTop: '20px',
        paddingBottom: '20px'
      }}>
                 <div className="permissions-header">
           <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
             <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
               <h1 className="page-title">{t[language].title}</h1>
               <div className="page-subtitle">
                 <span className="info-icon">ℹ️</span>
                 <span>{t[language].subtitle}</span>
               </div>
             </div>
                           <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <input 
                  type="text" 
                  placeholder={t[language].searchPlaceholder}
                  value={keyword}
                  onChange={e=>setKeyword(e.target.value)}
                  style={{ 
                    padding:'12px 16px', 
                    border:'1px solid #d1d5db', 
                    borderRadius:8, 
                    fontSize: '14px',
                    minWidth: '300px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
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
                             onClick={()=> setPermSelections(prev=>({ ...prev, [id]: (PERMISSION_CATALOG.map(i=>i.key) as string[]).slice(0,50) }))}
                             title={language === 'vi' ? "Chọn tất cả chức năng" : "Select all functions"}
                           >
                             {t[language].selectAll}
                           </button>
                           <button
                             className="btn-control"
                             disabled={isSelf || loadingRow === id}
                             onClick={()=> setPermSelections(prev=>({ ...prev, [id]: [] }))}
                             title={language === 'vi' ? "Bỏ chọn tất cả" : "Deselect all"}
                           >
                             {t[language].deselectAll}
                           </button>
                           {rolePresets[sel] && (
                             <button
                               className="btn-control"
                               disabled={isSelf || loadingRow === id}
                               onClick={()=> setPermSelections(prev=>({ ...prev, [id]: (rolePresets[sel] || []).slice(0,50) }))}
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
                                                 <div className="action-buttons">
                           <button 
                             className="btn-save"
                             disabled={isSelf || (sel === current && sameStringSet(checkedPerms, currPerms)) || loadingRow === id}
                             onClick={async ()=>{
                               if (sel !== current) await saveRole(u);
                               if (!sameStringSet(checkedPerms, currPerms)) await savePermissions(u);
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
                             }}
                             title={language === 'vi' ? "Hủy thay đổi" : "Cancel changes"}
                           >
                             {t[language].cancel}
                           </button>
                         </div>
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
                         onClick={()=> setPermSelections(prev=>({ ...prev, [id]: (PERMISSION_CATALOG.map(i=>i.key) as string[]).slice(0,50) }))}
                       >
                         {t[language].selectAll}
                       </button>
                       <button
                         className="btn-control"
                         disabled={isSelf || loadingRow === id}
                         onClick={()=> setPermSelections(prev=>({ ...prev, [id]: [] }))}
                       >
                         {t[language].deselectAll}
                       </button>
                       {rolePresets[sel] && (
                         <button
                           className="btn-control"
                           disabled={isSelf || loadingRow === id}
                           onClick={()=> setPermSelections(prev=>({ ...prev, [id]: (rolePresets[sel] || []).slice(0,50) }))}
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
                  
                  <div className="action-buttons">
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
                     >
                       {t[language].cancel}
                     </button>
                  </div>
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
         </div>
       </main>
     </>
   );
}
