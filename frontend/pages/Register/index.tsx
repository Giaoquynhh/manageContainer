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
	const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	useEffect(()=>{
		if (router && router.query?.token) setToken(String(router.query.token));
	}, [router]);

	useEffect(() => {
		if (confirm && password) {
			setPasswordMatch(password === confirm);
		} else {
			setPasswordMatch(null);
		}
	}, [password, confirm]);

	const onSubmit = async () => {
		setMsg('');
		if (password !== confirm) {
			setMsg('Mật khẩu xác nhận không khớp');
			return;
		}
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
			<main className="register-page">
				<div className="register-container">
					<div className="register-card">
						<div className="register-header">
							<div className="register-title">
								<span className="register-icon">🔑</span>
								<h1>Kích hoạt tài khoản</h1>
							</div>
							<p className="register-description">
								Bạn cần token mời do quản trị cấp. Một số vai trò (SystemAdmin/BusinessAdmin/HRManager/SaleAdmin) chỉ được tạo bởi hệ thống, không thể tự đăng ký nếu không có lời mời.
							</p>
						</div>
						
						<div className="register-form">
							<div className="input-group">
								<input 
									type="text" 
									placeholder="Token mời" 
									value={token} 
									onChange={e=>setToken(e.target.value)}
									className="register-input"
									readOnly
								/>
							</div>
							
							<div className="input-group">
								<input 
									type={showPassword ? "text" : "password"} 
									placeholder="Mật khẩu mới" 
									value={password} 
									onChange={e=>setPassword(e.target.value)}
									className="register-input"
								/>
								<button 
									type="button"
									className="password-toggle"
									onClick={() => setShowPassword(!showPassword)}
									tabIndex={-1}
								>
									{showPassword ? '🙈' : '👁️'}
								</button>
							</div>
							
							<div className="input-group">
								<input 
									type={showConfirmPassword ? "text" : "password"} 
									placeholder="Xác nhận mật khẩu" 
									value={confirm} 
									onChange={e=>setConfirm(e.target.value)}
									className={`register-input ${passwordMatch === true ? 'input-success' : passwordMatch === false ? 'input-error' : ''}`}
								/>
								<button 
									type="button"
									className="password-toggle"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									tabIndex={-1}
								>
									{showConfirmPassword ? '🙈' : '👁️'}
								</button>
								{passwordMatch === true && <span className="validation-icon success">✅</span>}
								{passwordMatch === false && <span className="validation-icon error">✖</span>}
							</div>
							
							<button className="register-button" onClick={onSubmit}>
								<span>Kích hoạt</span>
							</button>
							
							{msg && (
								<div className={`register-message ${msg.includes('thành công') ? 'success' : 'error'}`}>
									{msg}
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
