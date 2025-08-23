import { useState, useRef } from 'react';
import AuthLayout from '@components/layout/AuthLayout';
import Button from '@components/Button';
import { api } from '@services/api';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/auth/request-reset', { email });
      // Không tiết lộ sự tồn tại của email để chống enumeration
      setMessage('Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404 || status === 501) {
        setError('Tính năng đặt lại mật khẩu hiện chưa được kích hoạt. Vui lòng liên hệ quản trị viên.');
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
      if (emailRef.current) emailRef.current.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="card auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Quên mật khẩu</h2>
          <p className="auth-subtitle">Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>
        </div>
        <form className="auth-form" onSubmit={onSubmit} noValidate aria-busy={loading}>
          <div className="auth-form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              ref={emailRef}
              type="email"
              placeholder="email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'forgot-error' : undefined}
              required
            />
          </div>
          {error && (
            <div id="forgot-error" className="auth-error" role="alert" aria-live="assertive">{error}</div>
          )}
          {message && (
            <div className="auth-success" role="status" aria-live="polite">{message}</div>
          )}
          <Button type="submit" variant="primary" size="md" fullWidth loading={loading} disabled={!email}>
            Gửi hướng dẫn
          </Button>
          <div className="support-links" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link href="/Login" className="link">Quay lại đăng nhập</Link>
            <span></span>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
