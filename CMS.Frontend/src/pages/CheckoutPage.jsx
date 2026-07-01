import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiPackage } from 'react-icons/fi';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/AuthContext';
import { createOrder, getImageUrl, getCustomerAddresses } from '../api';
import '../styles/Checkout.css';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { customer, isLoggedIn } = useAuth();
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    const fetchAddrs = async () => {
      try {
        const data = await getCustomerAddresses(customer.id);
        setAddresses(data);
        const def = data.find(a => a.isDefault);
        if (def) {
          setSelectedAddress(def);
        } else if (data.length > 0) {
          setSelectedAddress(data[0]);
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    if (isLoggedIn && customer) {
      fetchAddrs();
    }
  }, [isLoggedIn, customer]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  if (!isLoggedIn) {
    return (
      <div className="checkout-page" id="checkout-page">
        <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
          <h2 style={{ marginBottom: 16 }}>Vui lòng đăng nhập để thanh toán</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
            Bạn cần đăng nhập hoặc đăng ký tài khoản trước khi đặt hàng.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg">Đăng nhập</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !success) {
    return (
      <div className="checkout-page" id="checkout-page">
        <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
          <h2 style={{ marginBottom: 16 }}>Giỏ hàng trống</h2>
          <Link to="/products" className="btn btn-primary btn-lg">Mua sắm ngay</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="checkout-page" id="checkout-page">
        <div className="container">
          <div className="checkout-success fade-in">
            <div className="checkout-success-icon"><FiCheck /></div>
            <h2>Đặt hàng thành công!</h2>
            <p>Cảm ơn bạn đã mua sắm tạiPetShop</p>
            <p className="order-id">Mã đơn hàng: #{success}</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link to="/orders" className="btn btn-primary btn-lg">Xem đơn hàng</Link>
              <Link to="/products" className="btn btn-secondary btn-lg">Tiếp tục mua sắm</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAddress) {
      setError('Vui lòng chọn hoặc thêm địa chỉ giao hàng trước khi đặt hàng.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        customerId: customer.id,
        notes,
        shippingAddress: selectedAddress.addressLine,
        shippingPhone: selectedAddress.receiverPhone,
        shippingName: selectedAddress.receiverName,
        paymentMethod,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      const result = await createOrder(orderData);
      clearCart();
      if (result.vnpayUrl) {
        window.location.href = result.vnpayUrl;
      } else {
        setSuccess(result.orderId);
      }
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi đặt hàng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page fade-in" id="checkout-page">
      <div className="container">
        <h1>Thanh toán</h1>

        <form className="checkout-layout" onSubmit={handleSubmit}>
          <div className="checkout-form-section">
            <h2>Thông tin giao hàng</h2>

            <div className="checkout-form">
              {loadingAddresses ? (
                <div>Đang tải danh sách địa chỉ nhận hàng...</div>
              ) : addresses.length === 0 ? (
                <div style={{ padding: '20px', border: '1px dashed var(--danger)', borderRadius: 'var(--radius)', background: '#FEF2F2', color: '#991B1B' }}>
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>Bạn chưa có địa chỉ giao hàng nào.</p>
                  <p style={{ fontSize: '0.875rem', marginBottom: 16 }}>Vui lòng thêm địa chỉ nhận hàng trong trang cá nhân của bạn để tiếp tục thanh toán.</p>
                  <Link to="/profile" className="btn btn-primary btn-sm">Thêm địa chỉ ngay</Link>
                </div>
              ) : (
                <div className="form-group">
                  <label>Chọn địa chỉ giao hàng</label>
                  <div className="checkout-addresses-list">
                    {addresses.map(addr => (
                      <label key={addr.id} className={`checkout-address-option ${selectedAddress?.id === addr.id ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="shippingAddress"
                          checked={selectedAddress?.id === addr.id}
                          onChange={() => setSelectedAddress(addr)}
                        />
                        <div className="address-option-details">
                          <div className="address-option-header">
                            <span className="address-option-name">{addr.receiverName}</span>
                            <span className="address-option-phone">{addr.receiverPhone}</span>
                            {addr.isDefault && <span className="badge badge-orange badge-sm">Mặc định</span>}
                          </div>
                          <div className="address-option-line">{addr.addressLine}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Link to="/profile" className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>
                      + Thêm/Quản lý địa chỉ khác
                    </Link>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '12px', display: 'block' }}>Phương thức thanh toán</label>
                <div className="payment-methods-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label className={`checkout-address-option ${paymentMethod === 'COD' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      style={{ marginTop: '4px' }}
                    />
                    <div className="address-option-details">
                      <span className="address-option-name" style={{ fontSize: '0.95rem', fontWeight: 700 }}>Thanh toán khi nhận hàng (COD)</span>
                      <span className="address-option-line" style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Thanh toán bằng tiền mặt khi nhận hàng tận nơi.</span>
                    </div>
                  </label>

                  <label className={`checkout-address-option ${paymentMethod === 'VNPay' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPay"
                      checked={paymentMethod === 'VNPay'}
                      onChange={() => setPaymentMethod('VNPay')}
                      style={{ marginTop: '4px' }}
                    />
                    <div className="address-option-details">
                      <span className="address-option-name" style={{ fontSize: '0.95rem', fontWeight: 700 }}>Thanh toán trực tuyến qua VNPay (NCB Test Card)</span>
                      <span className="address-option-line" style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Hỗ trợ thẻ ATM nội địa, thẻ quốc tế Visa/Mastercard hoặc quét mã QR.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Ghi chú đơn hàng</label>
                <textarea
                  rows="3"
                  placeholder="Ghi chú thêm cho đơn hàng (không bắt buộc)..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {error && <div className="auth-error">{error}</div>}
            </div>
          </div>

          <div className="checkout-summary">
            <h3>Đơn hàng ({items.length} SP)</h3>
            <div className="checkout-items">
              {items.map(item => {
                const imgUrl = getImageUrl(item.imageUrl);
                return (
                  <div key={item.id} className="checkout-item">
                    <div className="checkout-item-image">
                      {imgUrl ? (
                        <img src={imgUrl} alt={item.name} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-300)' }}>
                          <FiPackage />
                        </div>
                      )}
                    </div>
                    <div className="checkout-item-info">
                      <div className="checkout-item-name">{item.name}</div>
                      <div className="checkout-item-qty">x{item.quantity}</div>
                    </div>
                    <div className="checkout-item-price">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-summary-row">
              <span>Tạm tính</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Phí vận chuyển</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Miễn phí</span>
            </div>
            <div className="cart-summary-total">
              <span>Tổng cộng</span>
              <span className="total-price">{formatPrice(totalPrice)}</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || addresses.length === 0 || !selectedAddress}
              style={{ width: '100%', marginTop: 24, padding: '16px' }}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
