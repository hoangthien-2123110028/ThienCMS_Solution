import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getBanners, getImageUrl } from '../api';
import '../styles/Hero.css';

// Fallback banner images when no banners from API
const FALLBACK_BANNERS = [
  {
    id: 'fb-1',
    title: 'Bộ sưu tập\nmùa hè 2026',
    description: 'Ưu đãi lên đến 50%',
    linkUrl: '/products',
    imageUrl: null,
    fallbackGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  },
  {
    id: 'fb-2',
    title: 'Gaming Gear\nchất lượng cao',
    description: 'Sản phẩm chính hãng',
    linkUrl: '/products',
    imageUrl: null,
    fallbackGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  {
    id: 'fb-3',
    title: 'Phụ kiện\ncông nghệ',
    description: 'Miễn phí vận chuyển',
    linkUrl: '/products',
    imageUrl: null,
    fallbackGradient: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #2d1b69 100%)',
  },
];

export default function Hero() {
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    async function loadBanners() {
      try {
        const data = await getBanners('HomeHero');
        if (data && data.length > 0) {
          setBanners(data);
        } else {
          setBanners(FALLBACK_BANNERS);
        }
      } catch (err) {
        console.error('Error loading banners:', err);
        setBanners(FALLBACK_BANNERS);
      } finally {
        setLoading(false);
      }
    }
    loadBanners();
  }, []);

  const goToSlide = useCallback((index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    if (banners.length <= 1) return;
    goToSlide((currentSlide + 1) % banners.length);
  }, [banners.length, currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    if (banners.length <= 1) return;
    goToSlide((currentSlide - 1 + banners.length) % banners.length);
  }, [banners.length, currentSlide, goToSlide]);

  // Auto-play every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  // Reset auto-play timer on manual navigation
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
  }, [banners.length]);

  const handlePrev = () => {
    prevSlide();
    resetTimer();
  };

  const handleNext = () => {
    nextSlide();
    resetTimer();
  };

  const handleDotClick = (index) => {
    goToSlide(index);
    resetTimer();
  };

  // Touch / swipe support
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (loading) {
    return (
      <section className="hero-fullscreen hero-loading">
        <div className="hero-loading-content">
          <div className="hero-spinner"></div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="hero-fullscreen"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Banner slideshow"
    >
      {/* Slides */}
      {banners.map((banner, index) => {
        const isActive = index === currentSlide;
        const bgImage = banner.imageUrl ? getImageUrl(banner.imageUrl) : null;

        return (
          <div
            key={banner.id}
            className={`hero-fs-slide ${isActive ? 'active' : ''}`}
            style={{
              backgroundImage: bgImage
                ? `url(${bgImage})`
                : banner.fallbackGradient || 'var(--primary-gradient)',
              backgroundColor: '#0a0a0a',
            }}
            aria-hidden={!isActive}
          >
            {/* Dark overlay for text readability */}
            <div className="hero-fs-overlay"></div>

            {/* Slide content */}
            <div className="hero-fs-content">
              {banner.description && (
                <span className={`hero-fs-badge ${isActive ? 'animate' : ''}`}>
                  {banner.description}
                </span>
              )}
              <h1 className={`hero-fs-title ${isActive ? 'animate' : ''}`}>
                {banner.title}
              </h1>
              <div className={`hero-fs-actions ${isActive ? 'animate' : ''}`}>
                <Link
                  to={banner.linkUrl || '/products'}
                  className="hero-fs-btn-primary"
                >
                  Khám phá ngay <FiArrowRight />
                </Link>
                <Link to="/products" className="hero-fs-btn-outline">
                  Tất cả sản phẩm
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Arrow navigation */}
      {banners.length > 1 && (
        <>
          <button
            className="hero-fs-arrow hero-fs-arrow-left"
            onClick={handlePrev}
            aria-label="Slide trước"
          >
            <FiChevronLeft />
          </button>
          <button
            className="hero-fs-arrow hero-fs-arrow-right"
            onClick={handleNext}
            aria-label="Slide tiếp"
          >
            <FiChevronRight />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="hero-fs-dots">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`hero-fs-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Chuyển đến slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {banners.length > 1 && (
        <div className="hero-fs-progress">
          <div
            className="hero-fs-progress-bar"
            key={currentSlide}
          ></div>
        </div>
      )}
    </section>
  );
}
