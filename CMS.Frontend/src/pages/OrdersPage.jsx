import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage } from 'react-icons/fi';
import { useAuth } from '../components/AuthContext';
import { getCustomerOrders, getImageUrl } from '../api';
import '../styles/Orders.css';

export default function OrdersPage() {
  const { customer, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    getCustomerOrders(customer.id)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [customer, isLoggedIn]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('vi-VN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  if (!isLoggedIn) {
    return (
      <div className="orders-page" id="orders-page">
        <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
          <h2>Vui lòng đăng nhập</h2>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>Đăng nhập</Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (statusText) => {
    const classes = {
      'Chờ duyệt': 'badge-yellow',
      'Đang giao': 'badge-blue',
      'Đã xong': 'badge-green',
    };
    return `badge ${classes[statusText] || 'badge-orange'}`;
  };

  return (
    <div className="orders-page fade-in" id="orders-page">
      <div className="container">
        <h1>Đơn hàng của tôi</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray-500)' }}>
            Đang tải...
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty-icon"><FiPackage /></div>
            <h2>Chưa có đơn hàng</h2>
            <p>Hãy bắt đầu mua sắm ngay!</p>
            <Link to="/products" className="btn btn-primary">Mua sắm</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <h3>Đơn hàng #{order.id}</h3>
                    <span className="order-date">{formatDate(order.orderDate)}</span>
                  </div>
                  <span className={getStatusBadge(order.statusText)}>
                    {order.statusText}
                  </span>
                </div>
                <div className="order-card-body">
                  <div className="order-items">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <div className="order-item-image">
                          {item.productImage ? (
                            <img src={getImageUrl(item.productImage)} alt={item.productName} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-300)' }}>
                              <FiPackage />
                            </div>
                          )}
                        </div>
                        <div className="order-item-info">
                          <div className="order-item-name">{item.productName}</div>
                          <div className="order-item-qty">x{item.quantity}</div>
                        </div>
                        <div className="order-item-price">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="order-card-footer">
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--gray-500)' }}>
                      {order.notes && `Ghi chú: ${order.notes}`}
                    </span>
                    <span className="order-total">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
