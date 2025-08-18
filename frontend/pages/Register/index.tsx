import { useEffect, useState } from 'react';
import Header from '@components/Header';
import { api } from '@services/api';
import { useRouter } from 'next/router';

export default function Register(){
	const router = useRouter();
	const [token, setToken] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [msg, setMsg] = useState('');

	useEffect(()=>{
		if (router && router.query?.token) setToken(String(router.query.token));
	}, [router]);

	const onSubmit = async () => {
		setMsg('');
		try{
			await api.post('/auth/accept-invite', { token, password, confirm });
			setMsg('Kích hoạt tài khoản thành công. Bạn có thể đăng nhập.');
			setTimeout(()=>{ 
				// Chuyển về trang trước đó thay vì về Login
				if (window.history.length > 1) {
					router.back();
				} else {
					router.push('/Login');
				}
			}, 1500);
		}catch(e:any){ setMsg(e?.response?.data?.message || 'Không thể kích hoạt'); }
	};

	return (
		<>
			<Header />
			<main className="container">
				<div className="card" style={{maxWidth:480,margin:'40px auto'}}>
					<h3 style={{marginTop:0}}>Kích hoạt tài khoản (Accept Invite)</h3>
					<div style={{fontSize:12,color:'#6b7280',marginBottom:8}}>Bạn cần token mời do quản trị cấp. Một số vai trò (SystemAdmin/BusinessAdmin/HRManager/SaleAdmin) chỉ được tạo bởi hệ thống, không thể tự đăng ký nếu không có lời mời.</div>
					<div className="grid register-form">
						<input type="text" placeholder="Token mời" value={token} onChange={e=>setToken(e.target.value)} />
						<input type="password" placeholder="Mật khẩu mới" value={password} onChange={e=>setPassword(e.target.value)} />
						<input type="password" placeholder="Xác nhận mật khẩu" value={confirm} onChange={e=>setConfirm(e.target.value)} />
						<button className="btn" onClick={onSubmit}>Kích hoạt</button>
						{msg && <div style={{color:'#065f46',fontSize:13}}>{msg}</div>}
					</div>
				</div>
			</main>
		</>
	);
}
