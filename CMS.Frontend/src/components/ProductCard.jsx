import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiPackage, FiBox } from 'react-icons/fi';
import { useCart } from './CartContext';
import { getImageUrl, getProductStock } from '../api';
import toast from 'react-hot-toast';
import '../styles/ProductCard.css';

export default function ProductCard({ product, showStockTooltip = false }) {
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const intervalRef = useRef(null);
  const cardRef = useRef(null);

  // Stock tooltip state
  const [stockInfo, setStockInfo] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipLoading, setTooltipLoading] = useState(false);
  const hoverTimerRef = useRef(null);
  const tooltipFetchedRef = useRef(false);

  // Get all images (from images array or fallback to imageUrl)
  const images = product.images && product.images.length > 0
    ? product.images
    : product.imageUrl ? [product.imageUrl] : [];

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
        }, 300);
      }, 3000);
    };

    startSlideshow();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasMultipleImages, images.length]);

  // Pause on hover + show tooltip
  const handleMouseEnter = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (showStockTooltip) {
      hoverTimerRef.current = setTimeout(() => {
        setShowTooltip(true);
        if (!tooltipFetchedRef.current) {
          setTooltipLoading(true);
          getProductStock(product.id)
            .then(data => {
              setStockInfo(data);
              tooltipFetchedRef.current = true;
            })
            .catch(() => {
              // Fallback to product data if API fails
              setStockInfo({
                stockQuantity: product.stockQuantity,
                status: product.stockQuantity > 5 ? 'Còn nhiều' : product.stockQuantity > 0 ? 'Sắp hết' : 'Hết hàng',
              });
              tooltipFetchedRef.current = true;
            })
            .finally(() => setTooltipLoading(false));
        }
      }, 300); // 300ms debounce
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setShowTooltip(false);

    if (!hasMultipleImages) return;
    intervalRef.current = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
        setIsFading(false);
      }, 300);
    }, 3000);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryName: product.categoryName,
    });
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`, {
      style: {
        borderRadius: '10px',
        background: '#1F2937',
        color: '#fff',
      },
      iconTheme: {
        primary: '#F97316',
        secondary: '#fff',
      },
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const currentImage = images.length > 0 ? getImageUrl(images[currentImageIndex]) : null;

  // Stock tooltip helper
  const getStockStatusClass = () => {
    if (!stockInfo) return '';
    if (stockInfo.stockQuantity <= 0) return 'stock-out';
    if (stockInfo.stockQuantity <= 5) return 'stock-low';
    return 'stock-plenty';
  };

  const getStockIcon = () => {
    if (!stockInfo) return '📦';
    if (stockInfo.stockQuantity <= 0) return '❌';
    if (stockInfo.stockQuantity <= 5) return '⚠️';
    return '✅';
  };

  // Rating stars display
  const renderRatingStars = () => {
    if (!product.rating) return null;
    return (
      <div className="product-card-rating">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`card-star ${i < product.rating ? 'filled' : ''}`}>★</span>
        ))}
      </div>
    );
  };

  // Calculate simulated discount for visual match
  const discountPercent = product.id % 3 === 0 ? 15 : (product.id % 2 === 0 ? 10 : 0);
  const isNew = product.id % 5 === 0 && discountPercent === 0;
  const originalPrice = discountPercent > 0 ? product.price / (1 - discountPercent / 100) : null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="product-card fade-in"
      id={`product-card-${product.id}`}
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="product-card-image">
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.name}
            loading="lazy"
            className={`product-card-img ${isFading ? 'fading' : ''}`}
          />
        ) : (
          <div className="product-card-image-placeholder">
            <FiPackage />
          </div>
        )}
        
        {/* Vans-style badges */}
        {discountPercent > 0 && (
          <span className="product-badge badge-discount">-{discountPercent}%</span>
        )}
        {isNew && (
          <span className="product-badge badge-new">New</span>
        )}

        {hasMultipleImages && (
          <div className="product-card-dots">
            {images.map((_, i) => (
              <span
                key={i}
                className={`product-card-dot ${i === currentImageIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Stock Tooltip */}
        {showStockTooltip && showTooltip && (
          <div className={`stock-tooltip ${getStockStatusClass()}`}>
            <div className="stock-tooltip-arrow" />
            {tooltipLoading ? (
              <div className="stock-tooltip-loading">
                <div className="tooltip-spinner" />
                <span>Đang kiểm tra kho...</span>
              </div>
            ) : stockInfo ? (
              <>
                <div className="stock-tooltip-header">
                  <FiBox />
                  <span>Thông tin tồn kho</span>
                </div>
                <div className="stock-tooltip-body">
                  <div className="stock-tooltip-row">
                    <span className="stock-tooltip-icon">{getStockIcon()}</span>
                    <span className="stock-tooltip-status">{stockInfo.status}</span>
                  </div>
                  <div className="stock-tooltip-qty">
                    <span className="qty-number">{stockInfo.stockQuantity}</span>
                    <span className="qty-label">sản phẩm có sẵn</span>
                  </div>
                  {stockInfo.stockQuantity > 0 && stockInfo.stockQuantity <= 5 && (
                    <div className="stock-tooltip-warning">
                      🔥 Nhanh tay! Sắp hết hàng
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-brand">{product.brand || 'VANS'}</div>
        <div className="product-card-price-container">
          <span className="product-card-price sale-price">{formatPrice(product.price)}</span>
          {originalPrice && (
            <span className="product-card-original-price">{formatPrice(originalPrice)}</span>
          )}
        </div>
        {product.totalSold !== undefined && product.totalSold !== null && (
          <div className="product-card-sold">
            Đã bán: {product.totalSold}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card product-card-skeleton">
      <div className="product-card-image skeleton" />
      <div className="product-card-body">
        <div className="skeleton skeleton-line w-75" />
        <div className="skeleton skeleton-line w-50" />
        <div style={{ marginTop: 'auto' }}>
          <div className="skeleton skeleton-line w-40" />
        </div>
      </div>
    </div>
  );
}
