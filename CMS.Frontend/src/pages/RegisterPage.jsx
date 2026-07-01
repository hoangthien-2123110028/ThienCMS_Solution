import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineBolt } from 'react-icons/hi2';
import { useAuth } from '../components/AuthContext';
import { registerCustomer } from '../api';
import '../styles/Auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerCustomer({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
      });
      login(result.customer);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="register-page">
      <div className="auth-card fade-in" style={{ maxWidth: 500 }}>
        <div className="auth-header">
          <div className="auth-logo">
            <HiOutlineBolt style={{ color: 'var(--primary)' }} />
            Nam<span>Tech</span>
          </div>
          <h1>Tạo tài khoản</h1>
          <p>Đăng ký để bắt đầu mua sắm</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="fullName">Họ và tên *</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email *</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Số điện thoại</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="0123 456 789"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Địa chỉ</label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="123 Đường ABC, Quận 1, TP.HCM"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Mật khẩu *</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
