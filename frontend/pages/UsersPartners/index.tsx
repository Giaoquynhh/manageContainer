import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import Card from '@components/Card';
import { useTranslation } from '../../hooks/useTranslation';
import Header from '@components/Header';
import { canViewUsersPartners, showInternalForm } from '@utils/rbac';

// Import components
import { TabNavigation } from './components/TabNavigation';
import { UserTable } from './components/UserTable';
import { PartnersTable } from './components/PartnersTable';
import { CreateEmployeeModal } from './components/CreateEmployeeModal';
import { CreatePartnerModal } from './components/CreatePartnerModal';
import { CompanyUsersModal } from './components/CompanyUsersModal';

// Import hooks and utilities
import { useUsersPartners } from './hooks/useUsersPartners';
import { getRoleDisplayName } from './utils/roleUtils';
import { translations } from './translations';
import { ActiveTab, Language } from './types';

export default function UsersPartners() {
	const [role, setRole] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');

	// Use global translation hook to keep language in sync with Header
	const { currentLanguage } = useTranslation();
  const language = (currentLanguage as Language);

  // Use custom hook for all UsersPartners logic
  const {
    // State
    showEmpForm,
    setShowEmpForm,
    showPartnerForm,
    setShowPartnerForm,
    showCompanyUsersModal,
    setShowCompanyUsersModal,
    selectedCompany,
    setSelectedCompany,
    companyUsers,
    setCompanyUsers,
    modalInviteToken,
    setModalInviteToken,
    showCompanySearch,
    setShowCompanySearch,
    availableCompanies,
    message,
    lastInviteToken,
    // Form states
    empFullName,
    setEmpFullName,
    empEmail,
    setEmpEmail,
    empRole,
    setEmpRole,
    partnerFullName,
    setPartnerFullName,
    partnerEmail,
    setPartnerEmail,
    partnerRole,
    setPartnerRole,
    partnerTenantId,
    setPartnerTenantId,
    partnerCompanyName,
    setPartnerCompanyName,
    // Data
    users,
    partners,
    filteredUsers,
    // Functions
    loadAvailableCompanies,
    selectCompany,
    showCompanyUsers,
    modalUserAction,
    userAction,
    createEmployee,
    createPartner
  } = useUsersPartners(role, currentUser);
	// Function to get status display name
	const getStatusDisplayName = (status: string) => {
		const statusMap = {
			vi: {
				ACTIVE: 'Hoạt động',
				INVITED: 'Đã mời',
				DISABLED: 'Vô hiệu hóa',
				LOCKED: 'Đã khóa',
			},
			en: {
				ACTIVE: 'Active',
				INVITED: 'Invited',
				DISABLED: 'Disabled',
				LOCKED: 'Locked',
			}
		};
		return statusMap[language][status as keyof typeof statusMap.vi] || status;
	};

	// Translations
	const t = {
		vi: {
			title: 'Quản lý Người dùng & Đối tác',
			usersTab: 'Người dùng',
			partnersTab: 'Đối tác',
			accessDenied: 'Quyền truy cập',
			accessDeniedMessage: 'Bạn không có quyền truy cập trang này. Hãy dùng menu để vào trang phù hợp.',
			createEmployee: 'Tạo nhân sự',
			createPartner: 'Tạo đối tác',
			// Table headers
			email: 'Email',
			fullName: 'Họ tên',
			role: 'Vai trò',
			status: 'Trạng thái',
			company: 'Công ty',
			actions: 'Hành động',
			// Status badges (now handled by getStatusDisplayName function)
			active: 'Hoạt động',
			invited: 'Đã mời',
			disabled: 'Vô hiệu hóa',
			locked: 'Đã khóa',
			// Action buttons
			disable: 'Vô hiệu hóa',
			enable: 'Bật lại',
			lock: 'Khóa',
			unlock: 'Mở khóa',
			resendInvite: 'Gửi lại lời mời',
			emailSent: 'Email mời đã được gửi!',
			delete: 'Xóa',
			// Button tooltips
			disableTooltip: 'Chặn không cho đăng nhập',
			enableTooltip: 'Mở lại quyền đăng nhập',
			lockTooltip: 'Khóa tạm thời',
			unlockTooltip: 'Cho phép đăng nhập trở lại',
			resendTooltip: 'Gửi lại thư mời kích hoạt (tạo token mới)',
			deleteTooltip: 'Xóa vĩnh viễn tài khoản đã vô hiệu hóa',
			// Modal titles
			createEmployeeTitle: 'Tạo nhân sự nội bộ',
			createPartnerTitle: 'Tạo đối tác',
			// Form placeholders
			fullNamePlaceholder: 'Họ tên',
			emailPlaceholder: 'Email',
			tenantIdPlaceholder: 'Mã công ty (ID khách hàng)',
			companyNamePlaceholder: 'Tên công ty',
			// Form labels
			driverLabel: 'Tài xế',
			// Role labels
			systemAdminLabel: 'Quản trị hệ thống',
			businessAdminLabel: 'Quản trị kinh doanh',
			hrManagerLabel: 'Quản lý nhân sự',
			saleAdminLabel: 'Quản lý bán hàng',
			customerAdminLabel: 'Quản lý khách hàng',
			customerUserLabel: 'Người dùng khách hàng',
			partnerAdminLabel: 'Quản lý đối tác',
			// Form buttons
			close: 'Đóng',
			create: 'Tạo',
			// Messages
			pleaseEnterName: 'Vui lòng nhập họ tên',
			pleaseEnterValidEmail: 'Vui lòng nhập email hợp lệ',
			pleaseEnterTenantId: 'Vui lòng nhập mã công ty',
			pleaseEnterCompanyName: 'Vui lòng nhập tên công ty',
			employeeCreated: 'Tạo nhân sự nội bộ thành công. Email mời đã được gửi!',
			partnerCreated: 'Tạo đối tác thành công. Email mời đã được gửi!',
			userActionSuccess: 'Đã {action} user',
			createEmployeeError: 'Lỗi tạo nhân sự',
			createPartnerError: 'Lỗi tạo đối tác',
			userActionError: 'Lỗi {action}',
			// Info text
			tenantIdInfo: 'Lấy mã công ty từ danh sách Customers hoặc tạo khách mới bên module Customers.',
			// Token section
			inviteToken: 'Token mời:',
			openRegisterToActivate: 'Mở /Register để kích hoạt'
		},
		en: {
			title: 'Users & Partners Management',
			usersTab: 'Users',
			partnersTab: 'Partners',
			accessDenied: 'Access Denied',
			accessDeniedMessage: 'You do not have permission to access this page. Please use the menu to go to the appropriate page.',
			createEmployee: 'Create Staff',
			createPartner: 'Create Partner',
			// Table headers
			email: 'Email',
			fullName: 'Full Name',
			role: 'Role',
			status: 'Status',
			company: 'Company',
			actions: 'Actions',
			// Status badges (now handled by getStatusDisplayName function)
			active: 'Active',
			invited: 'Invited',
			disabled: 'Disabled',
			locked: 'Locked',
			// Action buttons
			disable: 'Disable',
			enable: 'Enable',
			lock: 'Lock',
			unlock: 'Unlock',
			resendInvite: 'Resend Invitation',
			emailSent: 'Invitation email sent!',
			delete: 'Delete',
			// Button tooltips
			disableTooltip: 'Block login access',
			enableTooltip: 'Restore login access',
			lockTooltip: 'Temporarily lock',
			unlockTooltip: 'Allow login again',
			resendTooltip: 'Resend activation invitation (create new token)',
			deleteTooltip: 'Permanently delete disabled account',
			// Modal titles
			createEmployeeTitle: 'Create Internal Staff',
			createPartnerTitle: 'Create Partner',
			// Form placeholders
			fullNamePlaceholder: 'Full Name',
			emailPlaceholder: 'Email',
			tenantIdPlaceholder: 'Company Code (Customer ID)',
			companyNamePlaceholder: 'Company Name',
			// Form labels
			driverLabel: 'Driver',
			// Role labels
			systemAdminLabel: 'System Administrator',
			businessAdminLabel: 'Business Administrator',
			hrManagerLabel: 'HR Manager',
			saleAdminLabel: 'Sales Administrator',
			customerAdminLabel: 'Customer Administrator',
			customerUserLabel: 'Customer User',
			partnerAdminLabel: 'Partner Administrator',
			// Form buttons
			close: 'Close',
			create: 'Create',
			// Messages
			pleaseEnterName: 'Please enter full name',
			pleaseEnterValidEmail: 'Please enter a valid email',
			pleaseEnterTenantId: 'Please enter company code',
			pleaseEnterCompanyName: 'Please enter company name',
			employeeCreated: 'Internal staff created successfully. Invitation email sent!',
			partnerCreated: 'Partner created successfully. Invitation email sent!',
			userActionSuccess: 'User {action} successfully',
			createEmployeeError: 'Error creating staff',
			createPartnerError: 'Error creating partner',
			userActionError: 'Error {action}',
			// Info text
			tenantIdInfo: 'Get mã công ty from Customers list or create new customer in Customers module.',
			// Token section
			inviteToken: 'Invite Token:',
			openRegisterToActivate: 'Open /Register to activate'
		}
	};

	useEffect(()=>{
		if (typeof window !== 'undefined'){
			api.get('/auth/me').then(r=>{
				const userRole = r.data?.role || r.data?.roles?.[0] || '';
        const userData = r.data;
				setRole(userRole);
        setCurrentUser(userData);
				console.log('Current user role:', userRole);
        console.log('Current user data:', userData);
      }).catch(() => {});
		}
	}, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCompanySearch) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-company-search]')) {
          setShowCompanySearch(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCompanySearch]);

	if (!canViewUsersPartners(role)) {
		return (
			<>
				<Header />
				<main className="container">
          <Card title={translations[language].accessDenied}>
            {translations[language].accessDeniedMessage}
					</Card>
				</main>
			</>
		);
	}

	return (
		<>
			<Header />
            <main className="container">
                <div className="grid grid-cols-3" style={{gap: 20}}>
                    <div style={{gridColumn: 'span 3'}}>
                        <Card title={undefined as any}>
                            {/* Tab Navigation */}
              <TabNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                role={role}
                language={language}
                translations={translations}
              />
                            
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                                <h3 style={{margin:0, fontSize:18, fontWeight:700, color:'#0b2b6d'}}>
                  {role === 'CustomerAdmin' 
                    ? 'Danh sách người dùng công ty' 
                    : (['SystemAdmin', 'BusinessAdmin', 'admin'].includes(role) 
                        ? (activeTab === 'users' ? 'Danh sách người dùng' : 'Danh sách đối tác')
                        : 'Danh sách người dùng')
                  }
                                </h3>
                                <div style={{display:'flex', gap:8}}>
                  {/* Nút tạo user cho CustomerAdmin */}
                  {role === 'CustomerAdmin' && (
                                        <div style={{position:'relative'}}>
                      <button 
                        className="btn" 
                        onClick={() => { 
                          setShowPartnerForm(v => !v); 
                          setShowEmpForm(false); 
                        }} 
                        style={{background:'#7c3aed', color:'#fff'}}
                      >
                        Tạo người dùng
                      </button>
                      <CreatePartnerModal
                        visible={showPartnerForm}
                        onCancel={() => setShowPartnerForm(false)}
                        language={language}
                        translations={translations}
                        partnerFullName={partnerFullName}
                        setPartnerFullName={setPartnerFullName}
                        partnerEmail={partnerEmail}
                        setPartnerEmail={setPartnerEmail}
                        partnerRole={partnerRole}
                        setPartnerRole={setPartnerRole}
                        partnerTenantId={partnerTenantId}
                        setPartnerTenantId={setPartnerTenantId}
                        partnerCompanyName={partnerCompanyName}
                        setPartnerCompanyName={setPartnerCompanyName}
                        showCompanySearch={showCompanySearch}
                        setShowCompanySearch={setShowCompanySearch}
                        availableCompanies={availableCompanies}
                        onLoadAvailableCompanies={loadAvailableCompanies}
                        onSelectCompany={selectCompany}
                        onCreatePartner={createPartner}
                        getRoleDisplayName={(role) => getRoleDisplayName(role, language)}
                        role={role}
                      />
                                        </div>
                                    )}
                  
                  {/* Button tạo nhân sự nội bộ */}
                  {showInternalForm(role) && activeTab === 'users' && (
                                        <div style={{position:'relative'}}>
                      <button 
                        className="btn" 
                        onClick={() => { 
                          setShowEmpForm(v => !v); 
                          setShowPartnerForm(false); 
                        }} 
                        style={{background:'#059669', color:'#fff'}}
                      >
                        {translations[language].createEmployee}
                      </button>
                      <CreateEmployeeModal
                        visible={showEmpForm}
                        onCancel={() => setShowEmpForm(false)}
                        language={language}
                        translations={translations}
                        empFullName={empFullName}
                        setEmpFullName={setEmpFullName}
                        empEmail={empEmail}
                        setEmpEmail={setEmpEmail}
                        empRole={empRole}
                        setEmpRole={setEmpRole}
                        onCreateEmployee={createEmployee}
                        getRoleDisplayName={(role) => getRoleDisplayName(role, language)}
                      />
                                                        </div>
                                                    )}
                  
                  {/* Button tạo đối tác */}
                  {activeTab === 'partners' && role !== 'CustomerAdmin' && (role === 'SystemAdmin' || role === 'BusinessAdmin' || role === 'admin') && (
                    <div style={{position:'relative'}}>
                      <button 
                        className="btn" 
                        onClick={() => { 
                          setShowPartnerForm(v => !v); 
                          setShowEmpForm(false); 
                        }} 
                        style={{background:'#7c3aed', color:'#fff'}}
                      >
                        {translations[language].createPartner}
                      </button>
                      <CreatePartnerModal
                        visible={showPartnerForm}
                        onCancel={() => setShowPartnerForm(false)}
                        language={language}
                        translations={translations}
                        partnerFullName={partnerFullName}
                        setPartnerFullName={setPartnerFullName}
                        partnerEmail={partnerEmail}
                        setPartnerEmail={setPartnerEmail}
                        partnerRole={partnerRole}
                        setPartnerRole={setPartnerRole}
                        partnerTenantId={partnerTenantId}
                        setPartnerTenantId={setPartnerTenantId}
                        partnerCompanyName={partnerCompanyName}
                        setPartnerCompanyName={setPartnerCompanyName}
                        showCompanySearch={showCompanySearch}
                        setShowCompanySearch={setShowCompanySearch}
                        availableCompanies={availableCompanies}
                        onLoadAvailableCompanies={loadAvailableCompanies}
                        onSelectCompany={selectCompany}
                        onCreatePartner={createPartner}
                        getRoleDisplayName={(role) => getRoleDisplayName(role, language)}
                        role={role}
                      />
                                        </div>
                                    )}
                                </div>
                            </div>
              
              {/* Table */}
                            <div className="table-container">
                                <table className="table">
                                                                         <thead style={{background: '#f8fafc'}}>
                                         <tr>
                      {(role === 'CustomerAdmin' || !['SystemAdmin', 'BusinessAdmin', 'admin'].includes(role) || activeTab === 'users') ? (
                        <>
                          <th>{translations[language].email}</th>
                          <th>{translations[language].fullName}</th>
                          <th>{translations[language].role}</th>
                          <th>{translations[language].status}</th>
                          <th>{translations[language].actions}</th>
                        </>
                      ) : (
                        <>
                          <th>{translations[language].companyName}</th>
                          <th>{translations[language].companyCode}</th>
                          <th>{translations[language].accountCount}</th>
                        </>
                      )}
                                         </tr>
                                     </thead>
                  
                  {(role === 'CustomerAdmin' || !['SystemAdmin', 'BusinessAdmin', 'admin'].includes(role) || activeTab === 'users') ? (
                    <UserTable
                      users={filteredUsers}
                      role={role}
                      language={language}
                      translations={translations}
                      onUserAction={userAction}
                      getRoleDisplayName={(role) => getRoleDisplayName(role, language)}
                    />
                  ) : (
                    <PartnersTable
                      partners={partners?.data || []}
                      language={language}
                      translations={translations}
                      onCompanyClick={showCompanyUsers}
                    />
                  )}
							</table>
                            </div>
              
              {/* Messages */}
                            {message && (
                                <div style={{
                                    marginTop: 16,
                                    padding: '12px 16px',
                                    background: '#ecfdf5',
                                    color: '#065f46',
                                    borderRadius: '8px',
                                    border: '1px solid #a7f3d0',
                                    fontSize: '14px'
                                }}>
                                    {message}
                                </div>
                            )}
              
                            {lastInviteToken && (
                                <div style={{
                                    marginTop: 12,
                                    padding: '12px 16px',
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    borderRadius: '8px',
                                    border: '1px solid #fde68a',
                                    fontSize: '14px'
                                }}>
                  <strong>{translations[language].inviteToken}</strong> <code>{lastInviteToken}</code>
                                    <br />
                                    <a href={`/Register?token=${lastInviteToken}`} style={{color: '#0891b2', textDecoration: 'underline'}}>
                    {translations[language].openRegisterToActivate}
                                    </a>
                                </div>
                            )}
              
              {/* Company Users Modal */}
              <CompanyUsersModal
                visible={showCompanyUsersModal}
                onCancel={() => {
                  setShowCompanyUsersModal(false);
                  setSelectedCompany(null);
                  setCompanyUsers([]);
                  setModalInviteToken('');
                }}
                selectedCompany={selectedCompany}
                companyUsers={companyUsers}
                modalInviteToken={modalInviteToken}
                role={role}
                language={language}
                translations={translations}
                onModalUserAction={modalUserAction}
                getRoleDisplayName={(role) => getRoleDisplayName(role, language)}
              />
						</Card>
					</div>
				</div>
			</main>
		</>
	);
}
