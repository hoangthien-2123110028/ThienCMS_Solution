import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiPackage } from 'react-icons/fi';
import { useCart } from '../components/CartContext';
import { getImageUrl } from '../api';
import '../styles/Cart.css';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalItems, totalPrice } = useCart();

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  if (items.length === 0) {
    return (
      <div className="cart-page" id="cart-page">
        <div className="container">
          <div className="cart-empty">
            <div className="cart-empty-icon"><FiShoppingBag /></div>
            <h2>Giỏ hàng trống</h2>
            <p>Hãy thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm</p>
            <Link to="/products" className="btn btn-primary btn-lg">
              Khám phá sản phẩm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page fade-in" id="cart-page">
      <div className="container">
        <h1>Giỏ hàng ({totalItems} sản phẩm)</h1>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map(item => {
              const imgUrl = getImageUrl(item.imageUrl);
              const uniqueKey = `${item.id}-${item.color || ''}`;
              return (
                <div key={uniqueKey} className="cart-item">
                  <div className="cart-item-image">
                    {imgUrl ? (
                      <img src={imgUrl} alt={item.name} />
                    ) : (
                      <div className="cart-item-image-placeholder"><FiPackage /></div>
                    )}
                  </div>
                  <div className="cart-item-info">
                    <Link to={`/products/${item.id}`} className="cart-item-name">{item.name}</Link>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: 'var(--font-xs)', color: 'var(--gray-500)', marginTop: '4px' }}>
                      {item.categoryName && <span className="cart-item-category" style={{ margin: 0 }}>{item.categoryName}</span>}
                      {item.color && <span className="cart-item-color" style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>Màu: {item.color}</span>}
                    </div>
                    <div className="cart-item-price" style={{ marginTop: '8px' }}>{formatPrice(item.price)}</div>
                  </div>
                  <div className="cart-item-quantity">
                    <button onClick={() => updateQuantity(item.id, item.color, item.quantity - 1)}><FiMinus /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.color, item.quantity + 1)}><FiPlus /></button>
                  </div>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.id, item.color)}
                    title="Xóa"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <h3>Tóm tắt đơn hàng</h3>
            <div className="cart-summary-row">
              <span>Tạm tính ({totalItems} SP)</span>
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
            <Link to="/checkout" className="btn btn-primary">
              Tiến hành thanh toán
            </Link>
            <Link to="/products" className="continue-link">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
