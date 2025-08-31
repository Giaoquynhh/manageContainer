import useSWR, { mutate } from 'swr';
import Header from '@components/Header';
import Card from '@components/Card';
import Modal from '@components/Modal';
import { useEffect, useState } from 'react';
import { api } from '@services/api';
import { canViewUsersPartners, showInternalForm, showCustomerForm, isCustomerRole } from '@utils/rbac';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function UsersPartners(){
	const [role, setRole] = useState<string>('');
	const [showEmpForm, setShowEmpForm] = useState(false);
	const [showCusForm, setShowCusForm] = useState(false);
	const [filterType, setFilterType] = useState<'all'|'internal'|'customer'>('all');
	// Create forms state
	const [empFullName, setEmpFullName] = useState('');
	const [empEmail, setEmpEmail] = useState('');
	const [empRole, setEmpRole] = useState('HRManager');

	const [cusFullName, setCusFullName] = useState('');
	const [cusEmail, setCusEmail] = useState('');
	const [cusRole, setCusRole] = useState('CustomerUser');
	const [tenantId, setTenantId] = useState('');

	const [message, setMessage] = useState('');
	const [lastInviteToken, setLastInviteToken] = useState<string>('');
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
			title: 'Danh sách tài khoản đang quản lý',
			accessDenied: 'Quyền truy cập',
			accessDeniedMessage: 'Bạn không có quyền truy cập trang này. Hãy dùng menu để vào trang phù hợp.',
			filterAll: 'Tất cả',
			filterInternal: 'Nhân sự nội bộ',
			filterCustomer: 'User khách hàng',
			filterTitle: 'Lọc theo loại nhân sự',
			createEmployee: 'Tạo nhân sự',
			createCustomerUser: 'Tạo user khách',
			// Table headers
			email: 'Email',
			fullName: 'Họ tên',
			role: 'Vai trò',
			status: 'Trạng thái',
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
			createCustomerTitle: 'Tạo user khách',
			// Form placeholders
			fullNamePlaceholder: 'Họ tên',
			emailPlaceholder: 'Email',
			tenantIdPlaceholder: 'tenant_id (ID khách hàng)',
			// Form labels
			driverLabel: 'Driver (Tài xế)',
			// Form buttons
			close: 'Đóng',
			create: 'Tạo',
			// Messages
			pleaseEnterName: 'Vui lòng nhập họ tên',
			pleaseEnterValidEmail: 'Vui lòng nhập email hợp lệ',
			pleaseEnterTenantId: 'Vui lòng nhập tenant_id',
			employeeCreated: 'Tạo nhân sự nội bộ thành công',
			customerCreated: 'Tạo user khách hàng thành công',
			userActionSuccess: 'Đã {action} user',
			createEmployeeError: 'Lỗi tạo nhân sự',
			createCustomerError: 'Lỗi tạo user khách',
			userActionError: 'Lỗi {action}',
			// Info text
			tenantIdInfo: 'Lấy tenant_id từ danh sách Customers hoặc tạo khách mới bên module Customers.',
			// Token section
			inviteToken: 'Token mời:',
			openRegisterToActivate: 'Mở /Register để kích hoạt'
		},
		en: {
			title: 'List of Managed Accounts',
			accessDenied: 'Access Denied',
			accessDeniedMessage: 'You do not have permission to access this page. Please use the menu to go to the appropriate page.',
			filterAll: 'All',
			filterInternal: 'Internal Staff',
			filterCustomer: 'Customer Users',
			filterTitle: 'Filter by staff type',
			createEmployee: 'Create Staff',
			createCustomerUser: 'Create Customer User',
			// Table headers
			email: 'Email',
			fullName: 'Full Name',
			role: 'Role',
			status: 'Status',
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
			createCustomerTitle: 'Create Customer User',
			// Form placeholders
			fullNamePlaceholder: 'Full Name',
			emailPlaceholder: 'Email',
			tenantIdPlaceholder: 'tenant_id (Customer ID)',
			// Form labels
			driverLabel: 'Driver',
			// Form buttons
			close: 'Close',
			create: 'Create',
			// Messages
			pleaseEnterName: 'Please enter full name',
			pleaseEnterValidEmail: 'Please enter a valid email',
			pleaseEnterTenantId: 'Please enter tenant_id',
			employeeCreated: 'Internal staff created successfully',
			customerCreated: 'Customer user created successfully',
			userActionSuccess: 'User {action} successfully',
			createEmployeeError: 'Error creating staff',
			createCustomerError: 'Error creating customer user',
			userActionError: 'Error {action}',
			// Info text
			tenantIdInfo: 'Get tenant_id from Customers list or create new customer in Customers module.',
			// Token section
			inviteToken: 'Invite Token:',
			openRegisterToActivate: 'Open /Register to activate'
		}
	};

	useEffect(()=>{
		if (typeof window !== 'undefined'){
			api.get('/auth/me').then(r=>setRole(r.data?.role || r.data?.roles?.[0] || '')).catch(()=>{});
		}
	}, []);

	const { data: users } = useSWR(canViewUsersPartners(role) ? ['/users?role=&page=1&limit=50'] : null, ([u]) => fetcher(u));

	// Lọc người dùng theo loại (FE filter theo role)
	const filteredUsers = (users?.data || []).filter((u: any) => {
		if (filterType === 'all') return true;
		if (filterType === 'customer') return isCustomerRole(u.role);
		return !isCustomerRole(u.role);
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
			setMessage(t[language].employeeCreated);
			setEmpFullName(''); setEmpEmail('');
			setShowEmpForm(false);
			mutate(['/users?role=&page=1&limit=50']);
		}catch(e:any){ setMessage(e?.response?.data?.message || t[language].createEmployeeError); }
	};

	const createCustomerUser = async () => {
		setMessage('');
		// Validation trước khi gửi
		if (!cusFullName.trim()) {
			setMessage(t[language].pleaseEnterName);
			return;
		}
		if (!cusEmail.trim() || !cusEmail.includes('@')) {
			setMessage(t[language].pleaseEnterValidEmail);
			return;
		}
		if (!tenantId.trim()) {
			setMessage(t[language].pleaseEnterTenantId);
			return;
		}
		try{
			await api.post('/users', { full_name: cusFullName.trim(), email: cusEmail.trim().toLowerCase(), role: cusRole, tenant_id: tenantId.trim() });
			setMessage(t[language].customerCreated);
			setCusFullName(''); setCusEmail(''); setTenantId('');
			setShowCusForm(false);
			mutate(['/users?role=&page=1&limit=50']);
		}catch(e:any){ setMessage(e?.response?.data?.message || t[language].createCustomerError); }
	};

	const userAction = async (id: string, action: 'disable'|'enable'|'lock'|'unlock'|'invite'|'delete') => {
		setMessage(''); setLastInviteToken('');
		try{
			if (action === 'invite') {
				const res = await api.post(`/users/${id}/send-invite`);
				setLastInviteToken(res.data?.invite_token || '');
			} else if (action === 'delete') {
				await api.delete(`/users/${id}`);
			} else {
				await api.patch(`/users/${id}/${action}`);
			}
			mutate(['/users?role=&page=1&limit=50']);
			setMessage(t[language].userActionSuccess.replace('{action}', action));
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
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                                <h3 style={{margin:0, fontSize:18, fontWeight:700, color:'#0b2b6d'}}>{t[language].title}</h3>
                                <div style={{display:'flex', gap:8}}>
                                    {/* Bộ lọc loại nhân sự */}
                                    <div style={{display:'flex', alignItems:'center', gap:8, marginRight:8}}>
                                        <select 
                                            value={filterType}
                                            onChange={e=>setFilterType(e.target.value as 'all'|'internal'|'customer')}
                                            title={t[language].filterTitle}
                                            style={{
                                                padding: '8px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: 6,
                                                background: 'white'
                                            }}
                                        >
                                            <option value="all">{t[language].filterAll}</option>
                                            <option value="internal">{t[language].filterInternal}</option>
                                            <option value="customer">{t[language].filterCustomer}</option>
                                        </select>
                                    </div>
                                    {showInternalForm(role) && (
                                        <div style={{position:'relative'}}>
                                            <button className="btn" onClick={()=>{ setShowEmpForm(v=>!v); setShowCusForm(false); }} style={{background:'#059669', color:'#fff'}}>{t[language].createEmployee}</button>
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
                                                        <option value="SystemAdmin">SystemAdmin</option>
                                                        <option value="BusinessAdmin">BusinessAdmin</option>
                                                        <option value="HRManager">HRManager</option>
                                                        <option value="SaleAdmin">SaleAdmin</option>
                                                        <option value="Driver">{t[language].driverLabel}</option>
                                                    </select>
                                                    <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                                                        <button className="btn btn-outline" onClick={()=>setShowEmpForm(false)}>{t[language].close}</button>
                                                        <button className="btn" onClick={createEmployee} style={{background:'#059669', color:'#fff'}}>{t[language].create}</button>
                                                    </div>
                                                </div>
                                            </Modal>
                                        </div>
                                    )}
                                    {showCustomerForm(role) && (
                                        <div style={{position:'relative'}}>
                                            <button className="btn" onClick={()=>{ setShowCusForm(v=>!v); setShowEmpForm(false); }} style={{background:'#0891b2', color:'#fff'}}>{t[language].createCustomerUser}</button>
                                            <Modal 
                                                title={t[language].createCustomerTitle} 
                                                visible={showCusForm} 
                                                onCancel={()=>setShowCusForm(false)} 
                                                size="sm"
                                            >
                                                <div className="grid" style={{gap:12}}>
                                                    <input type="text" placeholder={t[language].fullNamePlaceholder} value={cusFullName} onChange={e=>setCusFullName(e.target.value)} />
                                                    <input type="email" placeholder={t[language].emailPlaceholder} value={cusEmail} onChange={e=>setCusEmail(e.target.value)} />
                                                    <select value={cusRole} onChange={e=>setCusRole(e.target.value)}>
                                                        <option value="CustomerAdmin">CustomerAdmin</option>
                                                        <option value="CustomerUser">CustomerUser</option>
                                                    </select>
                                                    <input type="text" placeholder={t[language].tenantIdPlaceholder} value={tenantId} onChange={e=>setTenantId(e.target.value)} />
                                                    <div className="muted">{t[language].tenantIdInfo}</div>
                                                    <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                                                        <button className="btn btn-outline" onClick={()=>setShowCusForm(false)}>{t[language].close}</button>
                                                        <button className="btn" onClick={createCustomerUser} style={{background:'#0891b2', color:'#fff'}}>{t[language].create}</button>
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
                                            <th>{t[language].actions}</th>
                                        </tr>
                                    </thead>
									<tbody>
										{filteredUsers.map((u: any)=>(
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
                                                                   u.role === 'CustomerAdmin' ? '#0891b2' : '#6b7280',
                                                        color: 'white',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px'
                                                    }}>
                                                        {u.role}
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
													{u.status === 'DISABLED' && (
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
									))}
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

                    {/* Cột bên phải - Form tạo user */}
                    <div style={{display: 'none', gap: 16}}>
						{showInternalForm(role) && (
                            <Card title={t[language].createEmployeeTitle}>
                                <div className="grid" style={{gap: 12}}>
                                    <input 
                                        type="text" 
                                        placeholder={t[language].fullNamePlaceholder} 
                                        value={empFullName} 
                                        onChange={e => setEmpFullName(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <input 
                                        type="email" 
                                        placeholder={t[language].emailPlaceholder} 
                                        value={empEmail} 
                                        onChange={e => setEmpEmail(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <select 
                                        value={empRole} 
                                        onChange={e => setEmpRole(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            background: 'white'
                                        }}
                                    >
										<option value="SystemAdmin">SystemAdmin</option>
										<option value="BusinessAdmin">BusinessAdmin</option>
										<option value="HRManager">HRManager</option>
										<option value="SaleAdmin">SaleAdmin</option>
										<option value="Driver">{t[language].driverLabel}</option>
									</select>
                                    <button 
                                        className="btn" 
                                        onClick={createEmployee}
                                        style={{
                                            background: '#059669',
                                            color: 'white',
                                            padding: '10px 16px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {t[language].createEmployee}
                                    </button>
								</div>
							</Card>
						)}

						{showCustomerForm(role) && (
                            <Card title={t[language].createCustomerTitle}>
                                <div className="grid" style={{gap: 12}}>
                                    <input 
                                        type="text" 
                                        placeholder={t[language].fullNamePlaceholder} 
                                        value={cusFullName} 
                                        onChange={e => setCusFullName(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <input 
                                        type="email" 
                                        placeholder={t[language].emailPlaceholder} 
                                        value={cusEmail} 
                                        onChange={e => setCusEmail(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <select 
                                        value={cusRole} 
                                        onChange={e => setCusRole(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            background: 'white'
                                        }}
                                    >
										<option value="CustomerAdmin">CustomerAdmin</option>
										<option value="CustomerUser">CustomerUser</option>
									</select>
                                    <input 
                                        type="text" 
                                        placeholder={t[language].tenantIdPlaceholder} 
                                        value={tenantId} 
                                        onChange={e => setTenantId(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        background: '#f9fafb',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        {t[language].tenantIdInfo}
                                    </div>
                                    <button 
                                        className="btn" 
                                        onClick={createCustomerUser}
                                        style={{
                                            background: '#0891b2',
                                            color: 'white',
                                            padding: '10px 16px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {t[language].createCustomerUser}
                                    </button>
								</div>
							</Card>
						)}
					</div>
				</div>
			</main>
		</>
	);
}
