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
			setMessage('Vui lòng nhập họ tên');
			return;
		}
		if (!empEmail.trim() || !empEmail.includes('@')) {
			setMessage('Vui lòng nhập email hợp lệ');
			return;
		}
		try{
			await api.post('/users', { full_name: empFullName.trim(), email: empEmail.trim().toLowerCase(), role: empRole });
			setMessage('Tạo nhân sự nội bộ thành công');
			setEmpFullName(''); setEmpEmail('');
			setShowEmpForm(false);
			mutate(['/users?role=&page=1&limit=50']);
		}catch(e:any){ setMessage(e?.response?.data?.message || 'Lỗi tạo nhân sự'); }
	};

	const createCustomerUser = async () => {
		setMessage('');
		// Validation trước khi gửi
		if (!cusFullName.trim()) {
			setMessage('Vui lòng nhập họ tên');
			return;
		}
		if (!cusEmail.trim() || !cusEmail.includes('@')) {
			setMessage('Vui lòng nhập email hợp lệ');
			return;
		}
		if (!tenantId.trim()) {
			setMessage('Vui lòng nhập tenant_id');
			return;
		}
		try{
			await api.post('/users', { full_name: cusFullName.trim(), email: cusEmail.trim().toLowerCase(), role: cusRole, tenant_id: tenantId.trim() });
			setMessage('Tạo user khách hàng thành công');
			setCusFullName(''); setCusEmail(''); setTenantId('');
			setShowCusForm(false);
			mutate(['/users?role=&page=1&limit=50']);
		}catch(e:any){ setMessage(e?.response?.data?.message || 'Lỗi tạo user khách'); }
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
			setMessage(`Đã ${action} user`);
		}catch(e:any){ setMessage(e?.response?.data?.message || `Lỗi ${action}`); }
	};

	if (!canViewUsersPartners(role)) {
		return (
			<>
				<Header />
				<main className="container">
					<Card title="Quyền truy cập">
						Bạn không có quyền truy cập trang này. Hãy dùng menu để vào trang phù hợp.
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
                                <h3 style={{margin:0, fontSize:18, fontWeight:700, color:'#0b2b6d'}}>Danh sách tài khoản đang quản lý</h3>
                                <div style={{display:'flex', gap:8}}>
                                    {/* Bộ lọc loại nhân sự */}
                                    <div style={{display:'flex', alignItems:'center', gap:8, marginRight:8}}>
                                        <select 
                                            value={filterType}
                                            onChange={e=>setFilterType(e.target.value as 'all'|'internal'|'customer')}
                                            title="Lọc theo loại nhân sự"
                                            style={{
                                                padding: '8px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: 6,
                                                background: 'white'
                                            }}
                                        >
                                            <option value="all">Tất cả</option>
                                            <option value="internal">Nhân sự nội bộ</option>
                                            <option value="customer">User khách hàng</option>
                                        </select>
                                    </div>
                                    {showInternalForm(role) && (
                                        <div style={{position:'relative'}}>
                                            <button className="btn" onClick={()=>{ setShowEmpForm(v=>!v); setShowCusForm(false); }} style={{background:'#059669', color:'#fff'}}>Tạo nhân sự</button>
                                            <Modal 
                                                title="Tạo nhân sự nội bộ" 
                                                visible={showEmpForm} 
                                                onCancel={()=>setShowEmpForm(false)} 
                                                size="sm"
                                            >
                                                <div className="grid" style={{gap:12}}>
                                                    <input type="text" placeholder="Họ tên" value={empFullName} onChange={e=>setEmpFullName(e.target.value)} />
                                                    <input type="email" placeholder="Email" value={empEmail} onChange={e=>setEmpEmail(e.target.value)} />
                                                    <select value={empRole} onChange={e=>setEmpRole(e.target.value)}>
                                                        <option value="SystemAdmin">SystemAdmin</option>
                                                        <option value="BusinessAdmin">BusinessAdmin</option>
                                                        <option value="HRManager">HRManager</option>
                                                        <option value="SaleAdmin">SaleAdmin</option>
                                                    </select>
                                                    <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                                                        <button className="btn btn-outline" onClick={()=>setShowEmpForm(false)}>Đóng</button>
                                                        <button className="btn" onClick={createEmployee} style={{background:'#059669', color:'#fff'}}>Tạo nhân sự</button>
                                                    </div>
                                                </div>
                                            </Modal>
                                        </div>
                                    )}
                                    {showCustomerForm(role) && (
                                        <div style={{position:'relative'}}>
                                            <button className="btn" onClick={()=>{ setShowCusForm(v=>!v); setShowEmpForm(false); }} style={{background:'#0891b2', color:'#fff'}}>Tạo user khách</button>
                                            <Modal 
                                                title="Tạo user khách" 
                                                visible={showCusForm} 
                                                onCancel={()=>setShowCusForm(false)} 
                                                size="sm"
                                            >
                                                <div className="grid" style={{gap:12}}>
                                                    <input type="text" placeholder="Họ tên" value={cusFullName} onChange={e=>setCusFullName(e.target.value)} />
                                                    <input type="email" placeholder="Email" value={cusEmail} onChange={e=>setCusEmail(e.target.value)} />
                                                    <select value={cusRole} onChange={e=>setCusRole(e.target.value)}>
                                                        <option value="CustomerAdmin">CustomerAdmin</option>
                                                        <option value="CustomerUser">CustomerUser</option>
                                                    </select>
                                                    <input type="text" placeholder="tenant_id (ID khách hàng)" value={tenantId} onChange={e=>setTenantId(e.target.value)} />
                                                    <div className="muted">Lấy tenant_id từ danh sách Customers hoặc tạo khách mới bên module Customers.</div>
                                                    <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                                                        <button className="btn btn-outline" onClick={()=>setShowCusForm(false)}>Đóng</button>
                                                        <button className="btn" onClick={createCustomerUser} style={{background:'#0891b2', color:'#fff'}}>Tạo user khách</button>
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
                                            <th>Email</th>
                                            <th>Họ tên</th>
                                            <th>Vai trò</th>
                                            <th>Trạng thái</th>
                                            <th>Hành động</th>
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
                                                        title={u.status === 'DISABLED' ? 'Mở lại quyền đăng nhập' : 'Chặn không cho đăng nhập'} 
                                                        onClick={() => userAction(u.id || u._id, u.status === 'DISABLED' ? 'enable' : 'disable')}
                                                    >
                                                        {u.status === 'DISABLED' ? 'Bật lại' : 'Vô hiệu hóa'}
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm" 
                                                        style={{
                                                            background: u.status === 'LOCKED' ? '#059669' : '#d97706',
                                                            color: 'white',
                                                            fontSize: '12px',
                                                            padding: '4px 8px'
                                                        }}
                                                        title={u.status === 'LOCKED' ? 'Cho phép đăng nhập trở lại' : 'Khóa tạm thời'} 
                                                        onClick={() => userAction(u.id || u._id, u.status === 'LOCKED' ? 'unlock' : 'lock')}
                                                    >
                                                        {u.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm" 
                                                        style={{
                                                            background: '#0891b2',
                                                            color: 'white',
                                                            fontSize: '12px',
                                                            padding: '4px 8px'
                                                        }}
                                                        title="Gửi lại thư mời kích hoạt (tạo token mới)" 
                                                        onClick={() => userAction(u.id || u._id, 'invite')}
                                                    >
                                                        Gửi lại lời mời
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
                                                            title="Xóa vĩnh viễn tài khoản đã vô hiệu hóa" 
                                                            onClick={() => userAction(u.id || u._id, 'delete')}
                                                        >
                                                            Xóa
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
                                    <strong>Token mời:</strong> <code>{lastInviteToken}</code>
                                    <br />
                                    <a href={`/Register?token=${lastInviteToken}`} style={{color: '#0891b2', textDecoration: 'underline'}}>
                                        Mở /Register để kích hoạt
                                    </a>
                                </div>
                            )}
						</Card>
					</div>

                    {/* Cột bên phải - Form tạo user */}
                    <div style={{display: 'none', gap: 16}}>
						{showInternalForm(role) && (
                            <Card title="Tạo nhân sự nội bộ">
                                <div className="grid" style={{gap: 12}}>
                                    <input 
                                        type="text" 
                                        placeholder="Họ tên" 
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
                                        placeholder="Email" 
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
                                        Tạo nhân sự
                                    </button>
								</div>
							</Card>
						)}

						{showCustomerForm(role) && (
                            <Card title="Tạo user khách">
                                <div className="grid" style={{gap: 12}}>
                                    <input 
                                        type="text" 
                                        placeholder="Họ tên" 
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
                                        placeholder="Email" 
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
                                        placeholder="tenant_id (ID khách hàng)" 
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
                                        Lấy tenant_id từ danh sách Customers hoặc tạo khách mới bên module Customers.
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
                                        Tạo user khách
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
