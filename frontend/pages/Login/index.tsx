import { useState } from 'react';
import Header from '@components/Header';
import { api } from '@services/api';
import Link from 'next/link';
import { homeFor } from '@utils/rbac';

export default function Login(){
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	const onLogin = async () => {
		setError('');
		try{
			const res = await api.post('/auth/login', { username, password });
			if (typeof window !== 'undefined'){
				localStorage.setItem('token', res.data.access_token);
				localStorage.setItem('refresh_token', res.data.refresh_token);
				localStorage.setItem('user_id', res.data.user._id || res.data.user.id);
				const dest = homeFor(res.data.user.role || res.data.user.roles?.[0]);
				window.location.href = dest;
			}
		}catch(e: any){
			const code = e?.response?.status;
			if (code === 423) setError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
			else setError('Tên đăng nhập hoặc mật khẩu không chính xác');
		}
	};

	return (
		<>
			<Header />
			<main className="container" style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'calc(100vh - 120px)'}}>
				<div className="card" style={{maxWidth:460, width:'100%', padding:'32px 28px'}}>
					<div style={{marginBottom:16, textAlign:'center'}}>
						<h2 style={{margin:0}}>Đăng nhập</h2>
						<p className="muted" style={{margin:'8px 0 0'}}>Nhập thông tin để truy cập hệ thống</p>
					</div>
					<div style={{display:'grid', gap:14}}>
						<div>
							<label style={{display:'block', fontSize:12, color:'#475569', marginBottom:6}}>Email / Tên đăng nhập</label>
							<input style={{height:44}} type="text" placeholder="email@company.com" value={username} onChange={e=>setUsername(e.target.value)} />
						</div>
						<div>
							<label style={{display:'block', fontSize:12, color:'#475569', marginBottom:6}}>Mật khẩu</label>
							<input style={{height:44}} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
						</div>
						{error && <div style={{color:'#dc2626', fontSize:13, padding:'8px 10px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8}}>{error}</div>}
						<button className="btn" style={{height:44}} onClick={onLogin}>Đăng nhập</button>
						<div style={{fontSize:13,color:'#6b7280',textAlign:'center', marginTop:4}}>
							Chưa có mật khẩu? <Link href="/Register">Kích hoạt tài khoản (Accept Invite)</Link>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
