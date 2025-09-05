import useSWR, { mutate } from 'swr';
import { api } from '@services/api';
import Card from '@components/Card';
import { useTranslation } from '../../hooks/useTranslation';
import Modal from '@components/Modal';
import { useEffect, useState } from 'react';
import { canViewUsersPartners, showInternalForm, showPartnerForm, isCustomerRole, canLockUnlockUsers, canDeleteUsers, canLockSpecificUser } from '@utils/rbac';
import Header from '@components/Header';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function UsersPartners(){
	const [role, setRole] = useState<string>('');
	const [activeTab, setActiveTab] = useState<'users'|'partners'>('users');
	const [showEmpForm, setShowEmpForm] = useState(false);
	const [showPartnerForm, setShowPartnerForm] = useState(false);
	// Create forms state
	const [empFullName, setEmpFullName] = useState('');
	const [empEmail, setEmpEmail] = useState('');
	const [empRole, setEmpRole] = useState('HRManager');


	// Partner form state
	const [partnerFullName, setPartnerFullName] = useState('');
	const [partnerEmail, setPartnerEmail] = useState('');
	const [partnerRole, setPartnerRole] = useState('CustomerUser');
	const [partnerTenantId, setPartnerTenantId] = useState('');
	const [partnerCompanyName, setPartnerCompanyName] = useState('');

	// Store company names for display (since backend doesn't store it)
	const [userCompanyMap, setUserCompanyMap] = useState<{[key: string]: string}>({});

	const [message, setMessage] = useState('');
	const [lastInviteToken, setLastInviteToken] = useState<string>('');

	// Use global translation hook to keep language in sync with Header
	const { currentLanguage } = useTranslation();
	const language = (currentLanguage as 'vi' | 'en');

	// Function to get role display name
	const getRoleDisplayName = (role: string) => {
		const roleMap = {
			vi: {
				SystemAdmin: t.vi.systemAdminLabel,
				BusinessAdmin: t.vi.businessAdminLabel,
				HRManager: t.vi.hrManagerLabel,
				SaleAdmin: t.vi.saleAdminLabel,
				Driver: t.vi.driverLabel,
				CustomerAdmin: t.vi.customerAdminLabel,
				CustomerUser: t.vi.customerUserLabel,
				PartnerAdmin: t.vi.partnerAdminLabel,
			},
			en: {
				SystemAdmin: t.en.systemAdminLabel,
				BusinessAdmin: t.en.businessAdminLabel,
				HRManager: t.en.hrManagerLabel,
				SaleAdmin: t.en.saleAdminLabel,
				Driver: t.en.driverLabel,
				CustomerAdmin: t.en.customerAdminLabel,
				CustomerUser: t.en.customerUserLabel,
				PartnerAdmin: t.en.partnerAdminLabel,
			}
		};
		return roleMap[language][role as keyof typeof roleMap.vi] || role;
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
			// Status badges
			active: 'ACTIVE',
			invited: 'INVITED',
			disabled: 'DISABLED',
			locked: 'LOCKED',
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
			// Status badges
			active: 'ACTIVE',
			invited: 'INVITED',
			disabled: 'DISABLED',
			locked: 'LOCKED',
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
				setRole(userRole);
				console.log('Current user role:', userRole);
			}).catch(()=>{});
		}
	}, []);

	const { data: users } = useSWR(canViewUsersPartners(role) ? ['/users?role=&page=1&limit=50'] : null, ([u]) => fetcher(u));

	// Lọc người dùng theo tab
	const filteredUsers = (users?.data || []).filter((u: any) => {
		if (activeTab === 'users') {
			// Tab Users: Internal staff only
			return !['CustomerAdmin', 'PartnerAdmin', 'CustomerUser'].includes(u.role);
		} else {
			// Tab Partners: CustomerAdmin + PartnerAdmin + CustomerUser
			return ['CustomerAdmin', 'PartnerAdmin', 'CustomerUser'].includes(u.role);
		}
	});

	const createEmployee = async () => {
		setMessage('');
		// Validation trước khi gửi
		if (!empFullName.trim()) {
			setMessage(t[language].pleaseEnterName);
			return;
		}
		if (!empEmail.trim() || !empEmail.includes('@')) {
			setMessage(t[language].pleaseEnterValidEmail);
			return;
		}
		try{
			await api.post('/users', { full_name: empFullName.trim(), email: empEmail.trim().toLowerCase(), role: empRole });
			// Đóng modal ngay lập tức
			setShowEmpForm(false);
			// Reset form
			setEmpFullName(''); setEmpEmail('');
			// Hiển thị thông báo thành công
			setMessage(t[language].employeeCreated);
			// Refresh danh sách
			mutate(['/users?role=&page=1&limit=50']);
		}catch(e:any){ setMessage(e?.response?.data?.message || t[language].createEmployeeError); }
	};


	const createPartner = async () => {
		setMessage('');
		// Validation trước khi gửi
		if (!partnerFullName.trim()) {
			setMessage(t[language].pleaseEnterName);
			return;
		}
		if (!partnerEmail.trim() || !partnerEmail.includes('@')) {
			setMessage(t[language].pleaseEnterValidEmail);
			return;
		}
		// CustomerAdmin không cần nhập tenant_id vì backend sẽ tự động dùng tenant_id của họ
		if (role !== 'CustomerAdmin' && !partnerTenantId.trim()) {
			setMessage(t[language].pleaseEnterTenantId);
			return;
		}
		if (!partnerCompanyName.trim()) {
			setMessage(t[language].pleaseEnterCompanyName);
			return;
		}
		try{
			const payload: any = { 
				full_name: partnerFullName.trim(), 
				email: partnerEmail.trim().toLowerCase(), 
				role: partnerRole
			};
			// Chỉ thêm tenant_id nếu không phải CustomerAdmin
			if (role !== 'CustomerAdmin') {
				payload.tenant_id = partnerTenantId.trim();
			}
			const response = await api.post('/users', payload);
			// Lưu tên công ty vào state để hiển thị
			if (response.data?.id || response.data?._id) {
				const userId = response.data.id || response.data._id;
				setUserCompanyMap(prev => ({
					...prev,
					[userId]: partnerCompanyName.trim()
				}));
			}
			// Đóng modal ngay lập tức
			setShowPartnerForm(false);
			// Reset form
			setPartnerFullName(''); setPartnerEmail(''); setPartnerTenantId(''); setPartnerCompanyName('');
			// Hiển thị thông báo thành công
			setMessage(t[language].partnerCreated);
			// Refresh danh sách
			mutate(['/users?role=&page=1&limit=50']);
		}catch(e:any){ setMessage(e?.response?.data?.message || t[language].createPartnerError); }
	};

	const userAction = async (id: string, action: 'disable'|'enable'|'lock'|'unlock'|'invite'|'delete') => {
		setMessage(''); setLastInviteToken('');
		try{
			if (action === 'invite') {
				const res = await api.post(`/users/${id}/send-invite`);
				setLastInviteToken(res.data?.invite_token || '');
				setMessage(t[language].emailSent);
			} else if (action === 'delete') {
				await api.delete(`/users/${id}`);
				setMessage(t[language].userActionSuccess.replace('{action}', action));
			} else {
				await api.patch(`/users/${id}/${action}`);
				setMessage(t[language].userActionSuccess.replace('{action}', action));
			}
			mutate(['/users?role=&page=1&limit=50']);
		}catch(e:any){ setMessage(e?.response?.data?.message || t[language].userActionError.replace('{action}', action)); }
	};

	if (!canViewUsersPartners(role)) {
		return (
			<>
				<Header />
				<main className="container">
					<Card title={t[language].accessDenied}>
						{t[language].accessDeniedMessage}
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
                    {/* Bảng Users - chiếm 2 cột */}
                    <div style={{gridColumn: 'span 3'}}>
                        <Card title={undefined as any}>
                            {/* Tab Navigation */}
                            <div style={{display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid #e5e7eb'}}>
                                <button 
                                    onClick={() => setActiveTab('users')}
                                    style={{
                                        padding: '12px 24px',
                                        border: 'none',
                                        background: activeTab === 'users' ? '#0b2b6d' : 'transparent',
                                        color: activeTab === 'users' ? 'white' : '#6b7280',
                                        borderBottom: activeTab === 'users' ? '2px solid #0b2b6d' : '2px solid transparent',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        borderRadius: '6px 6px 0 0'
                                    }}
                                >
                                    {t[language].usersTab}
                                </button>
                                <button 
                                    onClick={() => {
                                        console.log('Switching to partners tab, current role:', role);
                                        setActiveTab('partners');
                                    }}
                                    style={{
                                        padding: '12px 24px',
                                        border: 'none',
                                        background: activeTab === 'partners' ? '#0b2b6d' : 'transparent',
                                        color: activeTab === 'partners' ? 'white' : '#6b7280',
                                        borderBottom: activeTab === 'partners' ? '2px solid #0b2b6d' : '2px solid transparent',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        borderRadius: '6px 6px 0 0'
                                    }}
                                >
                                    {t[language].partnersTab}
                                </button>
                            </div>
                            
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                                <h3 style={{margin:0, fontSize:18, fontWeight:700, color:'#0b2b6d'}}>
                                    {activeTab === 'users' ? 'Danh sách người dùng' : 'Danh sách đối tác'}
                                </h3>
                                <div style={{display:'flex', gap:8}}>
                                    {showInternalForm(role) && activeTab === 'users' && (
                                        <div style={{position:'relative'}}>
                                            <button className="btn" onClick={()=>{ setShowEmpForm(v=>!v); setShowPartnerForm(false); }} style={{background:'#059669', color:'#fff'}}>{t[language].createEmployee}</button>
                                            <Modal 
                                                title={t[language].createEmployeeTitle} 
                                                visible={showEmpForm} 
                                                onCancel={()=>setShowEmpForm(false)} 
                                                size="sm"
                                            >
                                                <div className="grid" style={{gap:12}}>
                                                    <input type="text" placeholder={t[language].fullNamePlaceholder} value={empFullName} onChange={e=>setEmpFullName(e.target.value)} />
                                                    <input type="email" placeholder={t[language].emailPlaceholder} value={empEmail} onChange={e=>setEmpEmail(e.target.value)} />
                                                    <select value={empRole} onChange={e=>setEmpRole(e.target.value)}>
                                                        <option value="SystemAdmin">{getRoleDisplayName('SystemAdmin')}</option>
                                                        <option value="BusinessAdmin">{getRoleDisplayName('BusinessAdmin')}</option>
                                                        <option value="HRManager">{getRoleDisplayName('HRManager')}</option>
                                                        <option value="SaleAdmin">{getRoleDisplayName('SaleAdmin')}</option>
                                                        <option value="Driver">{getRoleDisplayName('Driver')}</option>
                                                    </select>
                                                    <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                                                        <button className="btn btn-outline" onClick={()=>setShowEmpForm(false)}>{t[language].close}</button>
                                                        <button className="btn" onClick={createEmployee} style={{background:'#059669', color:'#fff'}}>{t[language].create}</button>
                                                    </div>
                                                </div>
                                            </Modal>
                                        </div>
                                    )}
                                    {/* Button tạo đối tác - chỉ hiển thị ở tab Partners */}
                                    {activeTab === 'partners' && (role === 'SystemAdmin' || role === 'BusinessAdmin' || role === 'admin' || role === 'CustomerAdmin') && (
                                        <div style={{position:'relative'}}>
                                            <button className="btn" onClick={()=>{ setShowPartnerForm(v=>!v); setShowEmpForm(false); }} style={{background:'#7c3aed', color:'#fff'}}>{t[language].createPartner}</button>
                                            <Modal 
                                                title={t[language].createPartnerTitle} 
                                                visible={showPartnerForm} 
                                                onCancel={()=>setShowPartnerForm(false)} 
                                                size="sm"
                                            >
                                                <div className="grid" style={{gap:12}}>
                                                    <input type="text" placeholder={t[language].fullNamePlaceholder} value={partnerFullName} onChange={e=>setPartnerFullName(e.target.value)} />
                                                    <input type="email" placeholder={t[language].emailPlaceholder} value={partnerEmail} onChange={e=>setPartnerEmail(e.target.value)} />
                                                    <input type="text" placeholder={t[language].companyNamePlaceholder} value={partnerCompanyName} onChange={e=>setPartnerCompanyName(e.target.value)} />
                                                    <select value={partnerRole} onChange={e=>setPartnerRole(e.target.value)}>
                                                        <option value="CustomerUser">{getRoleDisplayName('CustomerUser')}</option>
                                                        <option value="CustomerAdmin">{getRoleDisplayName('CustomerAdmin')}</option>
                                                        <option value="PartnerAdmin">{getRoleDisplayName('PartnerAdmin')}</option>
                                                    </select>
                                                    {role !== 'CustomerAdmin' && (
                                                        <>
                                                            <input type="text" placeholder={t[language].tenantIdPlaceholder} value={partnerTenantId} onChange={e=>setPartnerTenantId(e.target.value)} />
                                                            <div className="muted">{t[language].tenantIdInfo}</div>
                                                        </>
                                                    )}
                                                    {role === 'CustomerAdmin' && (
                                                        <div className="muted" style={{
                                                            padding: '8px 12px',
                                                            background: '#f0f9ff',
                                                            border: '1px solid #0ea5e9',
                                                            borderRadius: '6px',
                                                            color: '#0c4a6e',
                                                            fontSize: '14px'
                                                        }}>
                                                            Mã công ty sẽ tự động được gán từ tài khoản của bạn. Tên công ty chỉ để tham khảo.
                                                        </div>
                                                    )}
                                                    <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                                                        <button className="btn btn-outline" onClick={()=>setShowPartnerForm(false)}>{t[language].close}</button>
                                                        <button className="btn" onClick={createPartner} style={{background:'#7c3aed', color:'#fff'}}>{t[language].create}</button>
                                                    </div>
                                                </div>
                                            </Modal>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                                                         <thead style={{background: '#f8fafc'}}>
                                         <tr>
                                             <th>{t[language].email}</th>
                                             <th>{t[language].fullName}</th>
                                             <th>{t[language].role}</th>
                                             <th>{t[language].status}</th>
                                             {activeTab === 'partners' && <th>{t[language].company}</th>}
                                             <th>{t[language].actions}</th>
                                         </tr>
                                     </thead>
									<tbody>
										{filteredUsers.map((u: any)=>{
											// Debug: Log user data to see available fields
											console.log('User data:', u);
											return (
											<tr key={u.id || u._id}>
                                                <td style={{fontWeight: 600, color: '#1e40af'}}>{u.email}</td>
                                                <td>{u.full_name}</td>
                                                <td>
                                                    <span className="badge" style={{
                                                        background: u.role === 'SystemAdmin' ? '#dc2626' : 
                                                                   u.role === 'BusinessAdmin' ? '#7c3aed' :
                                                                   u.role === 'HRManager' ? '#059669' :
                                                                   u.role === 'SaleAdmin' ? '#ea580c' :
                                                                   u.role === 'Driver' ? '#0891b2' :
                                                                   u.role === 'CustomerAdmin' ? '#0891b2' :
                                                                   u.role === 'PartnerAdmin' ? '#7c2d12' : '#6b7280',
                                                        color: 'white',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px'
                                                    }}>
                                                        {getRoleDisplayName(u.role)}
                                                    </span>
                                                </td>
                                                                                                 <td>
                                                     <span className="badge" style={{
                                                         background: u.status === 'ACTIVE' ? '#059669' : 
                                                                    u.status === 'INVITED' ? '#d97706' :
                                                                    u.status === 'DISABLED' ? '#dc2626' :
                                                                    u.status === 'LOCKED' ? '#7c2d12' : '#6b7280',
                                                         color: 'white',
                                                         padding: '4px 8px',
                                                         borderRadius: '4px',
                                                         fontSize: '12px'
                                                     }}>
                                                         {u.status}
                                                     </span>
                                                 </td>
                                                 {activeTab === 'partners' && (
                                                     <td>
                                                         <span style={{
                                                             color: '#374151',
                                                             fontSize: '14px',
                                                             fontWeight: '500'
                                                         }}>
                                                             {userCompanyMap[u.id || u._id] || u.company_name || u.tenant_name || u.company || u.tenant?.name || 'N/A'}
                                                         </span>
                                                     </td>
                                                 )}
                                                <td style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                                                    <button 
                                                        className="btn btn-sm" 
                                                        style={{
                                                            background: u.status === 'DISABLED' ? '#059669' : '#dc2626',
                                                            color: 'white',
                                                            fontSize: '12px',
                                                            padding: '4px 8px'
                                                        }}
                                                        title={u.status === 'DISABLED' ? t[language].enableTooltip : t[language].disableTooltip} 
                                                        onClick={() => userAction(u.id || u._id, u.status === 'DISABLED' ? 'enable' : 'disable')}
                                                    >
                                                        {u.status === 'DISABLED' ? t[language].enable : t[language].disable}
                                                    </button>
                                                    {canLockUnlockUsers(role) && canLockSpecificUser(role, u.role) && (
                                                        <button 
                                                            className="btn btn-sm" 
                                                            style={{
                                                                background: u.status === 'LOCKED' ? '#059669' : '#d97706',
                                                                color: 'white',
                                                                fontSize: '12px',
                                                                padding: '4px 8px'
                                                            }}
                                                            title={u.status === 'LOCKED' ? t[language].unlockTooltip : t[language].lockTooltip} 
                                                            onClick={() => userAction(u.id || u._id, u.status === 'LOCKED' ? 'unlock' : 'lock')}
                                                        >
                                                            {u.status === 'LOCKED' ? t[language].unlock : t[language].lock}
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="btn btn-sm" 
                                                        style={{
                                                            background: '#0891b2',
                                                            color: 'white',
                                                            fontSize: '12px',
                                                            padding: '4px 8px'
                                                        }}
                                                        title={t[language].resendTooltip} 
                                                        onClick={() => userAction(u.id || u._id, 'invite')}
                                                    >
                                                        {t[language].resendInvite}
                                                    </button>
													{u.status === 'DISABLED' && canDeleteUsers(role) && (
                                                        <button 
                                                            className="btn btn-sm" 
                                                            style={{
                                                                background: '#dc2626',
                                                                color: 'white',
                                                                fontSize: '12px',
                                                                padding: '4px 8px'
                                                            }} 
                                                            title={t[language].deleteTooltip} 
                                                            onClick={() => userAction(u.id || u._id, 'delete')}
                                                        >
                                                            {t[language].delete}
                                                        </button>
													)}
											</td>
										</tr>
										);
										})}
								</tbody>
							</table>
                            </div>
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
                                    <strong>{t[language].inviteToken}</strong> <code>{lastInviteToken}</code>
                                    <br />
                                    <a href={`/Register?token=${lastInviteToken}`} style={{color: '#0891b2', textDecoration: 'underline'}}>
                                        {t[language].openRegisterToActivate}
                                    </a>
                                </div>
                            )}
						</Card>
					</div>

				</div>
			</main>
		</>
	);
}
