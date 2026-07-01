import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineBolt } from 'react-icons/hi2';
import { useAuth } from '../components/AuthContext';
import { loginCustomer } from '../api';
import '../styles/Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginCustomer({ email, password });
      login(result.customer);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="login-page">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <HiOutlineBolt style={{ color: 'var(--primary)' }} />
            Pet<span>Shop</span>
          </div>
          <h1>Đăng nhập</h1>
          <p>Chào mừng quay trở lại!</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Link to="/forgot-password" style={{ fontSize: 'var(--font-sm)', color: 'var(--primary)', textAlign: 'right', marginTop: '4px' }}>
              Quên mật khẩu?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}
