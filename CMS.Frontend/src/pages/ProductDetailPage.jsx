import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiShoppingCart, FiPackage } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import { useCart } from '../components/CartContext';
import { getProductById, getImageUrl } from '../api';
import toast from 'react-hot-toast';
import '../styles/ProductDetail.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const { addToCart } = useCart();
  const intervalRef = useRef(null);
  const availableColors = data?.product?.colors 
    ? data.product.colors.split(',').map(c => c.trim()).filter(Boolean)
    : ['Đen', 'Trắng', 'Vàng', 'Đỏ'];
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || 'Đen');

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    setCurrentImageIndex(0);
    getProductById(id)
      .then(res => {
        setData(res);
        if (res?.product?.colors) {
          const colors = res.product.colors.split(',').map(c => c.trim()).filter(Boolean);
          if (colors.length > 0) {
            setSelectedColor(colors[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Get images array
  const images = data?.product?.images && data.product.images.length > 0
    ? data.product.images
    : data?.product?.imageUrl ? [data.product.imageUrl] : [];

  const hasMultipleImages = images.length > 1;

  // Auto-slideshow every 3 seconds
  useEffect(() => {
    if (!hasMultipleImages) return;

    const startSlideshow = () => {
      intervalRef.current = setInterval(() => {
        setIsFading(true);
        setTimeout(() => {
          setCurrentImageIndex(prev => (prev + 1) % images.length);
          setIsFading(false);
        }, 400);
      }, 3000);
    };

    startSlideshow();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasMultipleImages, images.length]);

  const handleMouseEnter = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleMouseLeave = () => {
    if (!hasMultipleImages) return;
    intervalRef.current = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
        setIsFading(false);
      }, 400);
    }, 3000);
  };

  const handleThumbnailClick = (index) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsFading(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsFading(false);
    }, 200);
    // Restart auto-slide
    if (hasMultipleImages) {
      intervalRef.current = setInterval(() => {
        setIsFading(true);
        setTimeout(() => {
          setCurrentImageIndex(prev => (prev + 1) % images.length);
          setIsFading(false);
        }, 400);
      }, 3000);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const handleAddToCart = () => {
        if (!data?.product) return;

        const p = data.product;

        // Kiểm tra số lượng tồn kho
        if (quantity > p.stockQuantity) {
            toast.error(
                `Chỉ còn ${p.stockQuantity} sản phẩm trong kho!`,
                {
                    style: {
                        borderRadius: '10px',
                        background: '#DC2626',
                        color: '#fff',
                    },
                }
            );
            return;
        }

        addToCart(
            {
                id: p.id,
                name: p.name,
                price: p.price,
                imageUrl: p.imageUrl,
                categoryName: p.categoryName,
                color: selectedColor,
                stockQuantity: p.stockQuantity
            },
            quantity
        );

        toast.success(
            `Đã thêm ${quantity}x "${p.name}" vào giỏ hàng!`,
            {
                style: {
                    borderRadius: '10px',
                    background: '#1F2937',
                    color: '#fff',
                },
                iconTheme: {
                    primary: '#F97316',
                    secondary: '#fff',
                },
            }
        );
    };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="product-detail-grid">
            <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 'var(--radius-xl)' }} />
            <div>
              <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 32, width: '80%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 36, width: '30%', marginBottom: 24 }} />
              <div className="skeleton" style={{ height: 60, width: '100%', marginBottom: 24 }} />
              <div className="skeleton" style={{ height: 48, width: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.product) {
    return (
      <div className="product-detail-page">
        <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
          <h2>Không tìm thấy sản phẩm</h2>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Quay lại</Link>
        </div>
      </div>
    );
  }

  const { product, relatedProducts } = data;
  const currentImageUrl = images.length > 0 ? getImageUrl(images[currentImageIndex]) : null;

  return (
    <div className="product-detail-page fade-in" id="product-detail-page">
      <div className="container">
        <div className="product-detail-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>›</span>
          <Link to="/products">Sản phẩm</Link>
          <span>›</span>
          <span style={{ color: 'var(--gray-700)' }}>{product.name}</span>
        </div>

        <div className="product-detail-grid">
          <div
            className="product-detail-image"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="product-detail-image-main">
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt={product.name}
                  className={`product-detail-main-img ${isFading ? 'fading' : ''}`}
                />
              ) : (
                <div className="product-detail-image-placeholder"><FiPackage /></div>
              )}
              {hasMultipleImages && (
                <div className="product-detail-dots">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`product-detail-dot ${i === currentImageIndex ? 'active' : ''}`}
                      onClick={() => handleThumbnailClick(i)}
                    />
                  ))}
                </div>
              )}
            </div>

            {hasMultipleImages && (
              <div className="product-detail-thumbnails">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`product-detail-thumb ${i === currentImageIndex ? 'active' : ''}`}
                    onClick={() => handleThumbnailClick(i)}
                  >
                    <img src={getImageUrl(img)} alt={`${product.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail-info">
            {product.categoryName && (
              <span className="badge badge-orange product-detail-category">
                {product.categoryName}
              </span>
            )}
            <h1 className="product-detail-name">{product.name}</h1>
            <div className="product-detail-price">{formatPrice(product.price)}</div>

            <div className={`product-detail-stock ${product.stockQuantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
              <span className="dot" />
              {product.stockQuantity > 0
                ? `Còn hàng (${product.stockQuantity} sản phẩm)`
                : 'Hết hàng'}
            </div>

            {product.description && (
              <div className="product-detail-desc">{product.description}</div>
            )}

            {product.stockQuantity > 0 && (
              <>
                <div className="color-selector">
                  <span className="color-selector-label">Màu sắc:</span>
                  <div className="color-swatches">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-swatch-btn ${selectedColor === color ? 'active' : ''}`}
                        onClick={() => setSelectedColor(color)}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quantity-selector">
                  <label>Số lượng:</label>
                  <div className="quantity-controls">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><FiMinus /></button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, Math.min(product.stockQuantity, parseInt(e.target.value) || 1)))}
                      min="1"
                      max={product.stockQuantity}
                    />
                    <button onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}><FiPlus /></button>
                  </div>
                </div>

                <div className="product-detail-actions">
                  <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
                    <FiShoppingCart /> Thêm vào giỏ hàng
                  </button>
                  <Link to="/cart" className="btn btn-secondary btn-lg" onClick={handleAddToCart}>
                    Mua ngay
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {relatedProducts && relatedProducts.length > 0 && (
          <div className="related-products">
            <h2>Sản phẩm liên quan</h2>
            <div className="related-grid">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
