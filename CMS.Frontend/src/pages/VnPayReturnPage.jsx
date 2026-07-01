import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FiCheck, FiX, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { verifyVnPayReturn } from '../api';
import '../styles/Checkout.css';

export default function VnPayReturnPage() {
  const location = useLocation();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error', 'signature_failed'
  const [orderId, setOrderId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Strip the leading '?' from query string
        const queryString = location.search.substring(1);
        const result = await verifyVnPayReturn(queryString);
        
        if (result.success) {
          setStatus('success');
          setOrderId(result.orderId);
        } else {
          setStatus('error');
          setOrderId(result.orderId);
          setMessage(result.message || 'Thanh toán thất bại.');
        }
      } catch (err) {
        console.error('Error verifying VNPay return:', err);
        setStatus('signature_failed');
        setMessage(err.message || 'Không thể xác thực thông tin giao dịch.');
      }
    };

    verifyPayment();
  }, [location]);

  return (
    <div className="checkout-page" id="vnpay-return-page">
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {status === 'loading' && (
          <div className="checkout-success fade-in" style={{ padding: '60px 20px' }}>
            <div className="checkout-success-icon" style={{ background: 'var(--orange-50)', color: 'var(--primary)' }}>
              <FiLoader className="spin" style={{ animation: 'spin 2s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Đang xử lý giao dịch</h2>
            <p style={{ color: 'var(--gray-500)', marginTop: '8px' }}>
              Vui lòng không đóng trình duyệt hoặc tải lại trang trong khi chúng tôi xác nhận giao dịch từ VNPay...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="checkout-success fade-in" style={{ padding: '60px 20px', background: '#F0FDF4', borderRadius: 'var(--radius-lg)', border: '1px solid #BBF7D0', marginTop: '40px' }}>
            <div className="checkout-success-icon" style={{ background: '#DCFCE7', color: '#16A34A', boxShadow: '0 0 0 8px #F0FDF4' }}>
              <FiCheck />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#14532D' }}>Thanh toán thành công!</h2>
            <p style={{ color: '#1B4332', marginTop: '8px' }}>
              Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được thanh toán trực tuyến thành công.
            </p>
            {orderId && (
              <p className="order-id" style={{ color: 'var(--primary)', fontWeight: 700, margin: '20px 0', fontSize: '1.2rem' }}>
                Mã đơn hàng: #{orderId}
              </p>
            )}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: '24px' }}>
              <Link to="/orders" className="btn btn-primary" style={{ padding: '12px 24px', fontWeight: 600 }}>Xem đơn hàng</Link>
              <Link to="/products" className="btn btn-secondary" style={{ padding: '12px 24px', fontWeight: 600 }}>Tiếp tục mua sắm</Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="checkout-success fade-in" style={{ padding: '60px 20px', background: '#FEF2F2', borderRadius: 'var(--radius-lg)', border: '1px solid #FEE2E2', marginTop: '40px' }}>
            <div className="checkout-success-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <FiX />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7F1D1D' }}>Thanh toán thất bại</h2>
            <p style={{ color: '#991B1B', marginTop: '8px' }}>
              Giao dịch của bạn đã bị hủy hoặc không thành công từ phía ngân hàng/VNPay.
            </p>
            {message && <p style={{ fontSize: '0.9rem', color: '#B91C1C', marginTop: '8px', background: '#FFF5F5', padding: '8px', borderRadius: 'var(--radius)' }}>Chi tiết: {message}</p>}
            {orderId && (
              <p className="order-id" style={{ color: '#DC2626', fontWeight: 700, margin: '20px 0', fontSize: '1.2rem' }}>
                Đơn hàng: #{orderId} (Chưa thanh toán)
              </p>
            )}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: '24px' }}>
              <Link to="/cart" className="btn btn-primary" style={{ padding: '12px 24px', fontWeight: 600 }}>Quay lại giỏ hàng</Link>
              <Link to="/orders" className="btn btn-secondary" style={{ padding: '12px 24px', fontWeight: 600 }}>Xem đơn hàng</Link>
            </div>
          </div>
        )}

        {status === 'signature_failed' && (
          <div className="checkout-success fade-in" style={{ padding: '60px 20px', background: '#FFFBEB', borderRadius: 'var(--radius-lg)', border: '1px solid #FEF3C7', marginTop: '40px' }}>
            <div className="checkout-success-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <FiAlertTriangle />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#78350F' }}>Xác thực không hợp lệ</h2>
            <p style={{ color: '#92400E', marginTop: '8px' }}>
              Không thể xác thực thông tin giao dịch hoặc chữ ký từ VNPay bị sai lệch.
            </p>
            {message && <p style={{ fontSize: '0.9rem', color: '#B45309', marginTop: '8px' }}>Chi tiết: {message}</p>}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: '24px' }}>
              <Link to="/products" className="btn btn-primary" style={{ padding: '12px 24px', fontWeight: 600 }}>Tiếp tục mua sắm</Link>
              <Link to="/orders" className="btn btn-secondary" style={{ padding: '12px 24px', fontWeight: 600 }}>Xem đơn hàng của tôi</Link>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
