import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import AuthLayout from '@components/layout/AuthLayout';
import Button from '@components/Button';
import Link from 'next/link';
import { authApi } from '@services/auth';
import { homeFor } from '@utils/rbac';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(username.trim(), password);
      const accessToken = data?.access_token;
      const refreshToken = data?.refresh_token;
      const userId = (data as any)?.user?.id ?? (data as any)?.user?.user_id ?? (data as any)?.user?._id ?? '';

      const store = remember ? localStorage : sessionStorage;
      store.setItem('token', accessToken);
      if (refreshToken) store.setItem('refresh_token', refreshToken);
      if (userId) store.setItem('user_id', String(userId));

      // Dọn nơi còn lại để tránh lưu sai chỗ
      try {
        const other = remember ? sessionStorage : localStorage;
        other.removeItem('token');
        other.removeItem('refresh_token');
        other.removeItem('user_id');
      } catch {}

      const role = (data as any)?.user?.role ?? (data as any)?.user?.roles?.[0];
      router.replace(role ? homeFor(role as any) : '/');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) setError('Sai tài khoản hoặc mật khẩu.');
      else setError('Không thể đăng nhập. Vui lòng thử lại.');
      if (status === 401 && passRef.current) passRef.current.focus();
      else if (userRef.current) userRef.current.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="card auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Đăng nhập</h2>
          <p className="auth-subtitle">Vui lòng nhập thông tin để tiếp tục</p>
        </div>
        <form className="auth-form" onSubmit={onSubmit} noValidate aria-busy={loading}>
          <div className="auth-form-group">
            <label htmlFor="username">Tài khoản</label>
            <input
              id="username"
              name="username"
              ref={userRef}
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="auth-form-group password-input-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              name="password"
              ref={passRef}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="remember-row">
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Ghi nhớ đăng nhập
            </label>
            <Link href="/Forgot" className="link">Quên mật khẩu?</Link>
          </div>

          {error && (
            <div className="auth-error" role="alert" aria-live="assertive">{error}</div>
          )}

          <Button type="submit" variant="primary" size="md" fullWidth loading={loading} disabled={!username || !password}>
            Đăng nhập
          </Button>

          <div className="support-links" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span></span>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
