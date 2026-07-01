import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineBolt } from 'react-icons/hi2';
import { FiMail, FiShield, FiLock, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { forgotPassword, verifyResetCode, resetPassword } from '../api';
import '../styles/Auth.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Bước 1: Gửi mã OTP
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      setSuccess(result.message);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác thực mã OTP
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyResetCode(email, code);
      setSuccess('Mã xác thực hợp lệ!');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Mã xác thực không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  // Bước 3: Đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email, code, newPassword);
      setSuccess(result.message);
      setStep(4); // Done
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator
  const renderProgress = () => (
    <div className="forgot-progress">
      {[1, 2, 3].map((s) => (
        <div key={s} className={`forgot-progress-step ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
          <div className="forgot-progress-circle">
            {step > s ? <FiCheck /> : s}
          </div>
          <span className="forgot-progress-label">
            {s === 1 ? 'Email' : s === 2 ? 'Xác thực' : 'Mật khẩu'}
          </span>
        </div>
      ))}
    </div>
  );

  // Bước hoàn tất
  if (step === 4) {
    return (
      <div className="auth-page" id="forgot-password-page">
        <div className="auth-card fade-in">
          <div className="auth-header">
            <div className="forgot-success-icon">
              <FiCheck />
            </div>
            <h1>Thành công!</h1>
            <p>{success}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: 'var(--space-4)' }}
              onClick={() => navigate('/login')}
            >
              Đăng nhập ngay
            </button>
            <Link to="/" style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 'var(--font-sm)' }}>
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" id="forgot-password-page">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <HiOutlineBolt style={{ color: 'var(--primary)' }} />
            Nam<span>Tech</span>
          </div>
          <h1>Quên mật khẩu</h1>
          <p>
            {step === 1 && 'Nhập email để nhận mã xác thực'}
            {step === 2 && 'Nhập mã OTP đã gửi đến email của bạn'}
            {step === 3 && 'Tạo mật khẩu mới cho tài khoản'}
          </p>
        </div>

        {renderProgress()}

        {/* Bước 1: Nhập Email */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendCode}>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="forgot-email">
                <FiMail style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
            </button>
          </form>
        )}

        {/* Bước 2: Nhập mã OTP */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyCode}>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <div className="form-group">
              <label htmlFor="forgot-code">
                <FiShield style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Mã xác thực (6 số)
              </label>
              <input
                id="forgot-code"
                type="text"
                placeholder="Nhập mã 6 số"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                }}
                maxLength={6}
                required
                autoFocus
                style={{ 
                  textAlign: 'center', 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  letterSpacing: '8px',
                  fontFamily: 'monospace'
                }}
              />
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-500)', textAlign: 'center' }}>
                Mã đã được gửi đến <strong>{email}</strong>
              </span>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || code.length < 6}>
              {loading ? 'Đang xác thực...' : 'Xác thực mã'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => { setStep(1); setError(''); setSuccess(''); setCode(''); }}
            >
              <FiArrowLeft style={{ marginRight: 6 }} />
              Gửi lại mã
            </button>
          </form>
        )}

        {/* Bước 3: Đặt mật khẩu mới */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <div className="form-group">
              <label htmlFor="new-password">
                <FiLock style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Mật khẩu mới
              </label>
              <input
                id="new-password"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">
                <FiLock style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Xác nhận mật khẩu
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login">
            <FiArrowLeft style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
