import useSWR, { mutate } from 'swr';
import Header from '@components/Header';
import Card from '@components/Card';
import { useEffect, useState } from 'react';
import { api } from '@services/api';
import { canViewUsersPartners, showInternalForm, showCustomerForm } from '@utils/rbac';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function UsersPartners(){
	const [token, setToken] = useState('');
	const [role, setRole] = useState<string>('');
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
	const [tableView, setTableView] = useState<'users'|'customers'|'partners'>('users');

	useEffect(()=>{
		if (typeof window !== 'undefined'){
			const t = localStorage.getItem('token') || '';
			setToken(t);
			api.get('/auth/me').then(r=>setRole(r.data?.role || r.data?.roles?.[0] || '')).catch(()=>{});
		}
	}, []);

	const { data: users } = useSWR(token && canViewUsersPartners(role) ? ['/users?role=&page=1&limit=10'] : null, ([u]) => fetcher(u));
	const { data: customers } = useSWR(token && canViewUsersPartners(role) ? ['/customers?page=1&limit=10'] : null, ([u]) => fetcher(u));
	const { data: partners } = useSWR(token && canViewUsersPartners(role) ? ['/partners?page=1&limit=10'] : null, ([u]) => fetcher(u));

	const saveToken = () => { if (typeof window !== 'undefined'){ localStorage.setItem('token', token); setMessage('Đã lưu token'); setTimeout(()=>setMessage(''), 1200);} };

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
			mutate(['/users?role=&page=1&limit=10']);
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
			mutate(['/users?role=&page=1&limit=10']);
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
			mutate(['/users?role=&page=1&limit=10']);
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
                <div className="grid grid-cols-3" style={{gap:16}}>
                    <div style={{gridColumn:'span 2'}}>
                        <Card title="Thiết lập Token (JWT)">
                            <div className="searchbar">
                                <input type="text" placeholder="Dán JWT token ở đây để gọi API" value={token} onChange={(e)=>setToken(e.target.value)} />
                                <button className="btn" onClick={saveToken}>Lưu token</button>
                            </div>
                            <div className="muted" style={{marginTop:8}}>
                                {token ? '✅ Token đã được thiết lập' : '❌ Chưa có token sẽ không gọi được API (401). Dùng endpoint /auth/login để lấy token.'}
                            </div>
                            {message && <div style={{marginTop:8,color:'#065f46',fontSize:13,transition:'opacity .2s ease'}}>{message}</div>}
                            {lastInviteToken && (
                                <div style={{marginTop:8,fontSize:13}}>
                                    Token mời: <code>{lastInviteToken}</code> (mở <a href={`/Register?token=${lastInviteToken}`}>/Register</a> để kích hoạt)
                                </div>
                            )}
                        </Card>
                    </div>
                    <Card title="Bộ lọc bảng hiển thị">
                        <div className="searchbar">
                            <select value={tableView} onChange={(e)=>setTableView(e.target.value as any)}>
                                <option value="users">Users</option>
                                <option value="customers">Customers</option>
                                <option value="partners">Partners</option>
                            </select>
                            <div className="muted">Chọn bảng cần xem. Form tạo user ở cột phải.</div>
                        </div>
                    </Card>
                </div>

				<div className="grid grid-cols-2" style={{gap:16, marginTop:16}}>
					<div>
						{tableView==='users' && (
							<Card title="Users">
                                <table className="table">
                                    <thead style={{background:'#f7f9ff'}}><tr><th>Email</th><th>Role</th><th>Status</th><th>Hành động</th></tr></thead>
									<tbody>
										{users?.data?.map((u: any)=>(
											<tr key={u.id || u._id}>
                                                <td style={{fontWeight:700}}>{u.email}</td><td>{u.role}</td><td>{u.status}</td>
                                                <td style={{display:'flex',gap:8}}>
													<button className="btn" title={u.status==='DISABLED'?'Mở lại quyền đăng nhập':'Chặn không cho đăng nhập'} onClick={()=>userAction(u.id||u._id, u.status==='DISABLED'?'enable':'disable')}>{u.status==='DISABLED'?'Bật lại':'Vô hiệu hóa'}</button>
													<button className="btn" title={u.status==='LOCKED'?'Cho phép đăng nhập trở lại':'Khóa tạm thời'} onClick={()=>userAction(u.id||u._id, u.status==='LOCKED'?'unlock':'lock')}>{u.status==='LOCKED'?'Mở khóa':'Khóa'}</button>
													<button className="btn" title="Gửi lại thư mời kích hoạt (tạo token mới)" onClick={()=>userAction(u.id||u._id, 'invite')}>Gửi lại lời mời</button>
													{u.status === 'DISABLED' && (
														<button className="btn" style={{background:'#dc2626',color:'white'}} title="Xóa vĩnh viễn tài khoản đã vô hiệu hóa" onClick={()=>userAction(u.id||u._id, 'delete')}>Xóa</button>
													)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</Card>
						)}
						{tableView==='customers' && (
							<Card title="Customers">
                                <table className="table">
                                    <thead style={{background:'#f7f9ff'}}><tr><th>Tên</th><th>MST</th><th>Trạng thái</th></tr></thead>
									<tbody>
										{customers?.data?.map((c: any)=>(<tr key={c.id || c._id}><td>{c.name}</td><td>{c.tax_code}</td><td>{c.status}</td></tr>))}
									</tbody>
								</table>
						</Card>
						)}
						{tableView==='partners' && (
							<Card title="Partners">
                                <table className="table">
                                    <thead style={{background:'#f7f9ff'}}><tr><th>Tên</th><th>Loại</th><th>Trạng thái</th></tr></thead>
									<tbody>
										{partners?.data?.map((p: any)=>(<tr key={p.id || p._id}><td>{p.name}</td><td>{p.type}</td><td>{p.status}</td></tr>))}
									</tbody>
								</table>
						</Card>
						)}
					</div>

					<div style={{display:'grid', gap:16}}>
						{showInternalForm(role) && (
                            <Card title="Tạo nhân sự nội bộ (HRManager/SystemAdmin)">
                                <div className="grid" style={{gap:12}}>
									<input type="text" placeholder="Họ tên" value={empFullName} onChange={e=>setEmpFullName(e.target.value)} />
									<input type="email" placeholder="Email" value={empEmail} onChange={e=>setEmpEmail(e.target.value)} />
									<select value={empRole} onChange={e=>setEmpRole(e.target.value)}>
										<option value="SystemAdmin">SystemAdmin</option>
										<option value="BusinessAdmin">BusinessAdmin</option>
										<option value="HRManager">HRManager</option>
										<option value="SaleAdmin">SaleAdmin</option>
									</select>
									<button className="btn" onClick={createEmployee}>Tạo nhân sự</button>
								</div>
							</Card>
						)}

						{showCustomerForm(role) && (
                            <Card title="Tạo user khách (SaleAdmin/CustomerAdmin)">
                                <div className="grid" style={{gap:12}}>
									<input type="text" placeholder="Họ tên" value={cusFullName} onChange={e=>setCusFullName(e.target.value)} />
									<input type="email" placeholder="Email" value={cusEmail} onChange={e=>setCusEmail(e.target.value)} />
									<select value={cusRole} onChange={e=>setCusRole(e.target.value)}>
										<option value="CustomerAdmin">CustomerAdmin</option>
										<option value="CustomerUser">CustomerUser</option>
									</select>
									<input type="text" placeholder="tenant_id (ID khách hàng)" value={tenantId} onChange={e=>setTenantId(e.target.value)} />
                                    <div className="muted">Lấy tenant_id từ danh sách Customers hoặc tạo khách mới bên module Customers.</div>
									<button className="btn" onClick={createCustomerUser}>Tạo user khách</button>
								</div>
							</Card>
						)}
					</div>
				</div>
			</main>
		</>
	);
}
