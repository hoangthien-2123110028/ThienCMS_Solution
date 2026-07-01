import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { getProducts, getCategories, getBrands } from '../api';
import { FiSearch, FiX, FiSliders, FiChevronDown, FiChevronUp, FiLoader } from 'react-icons/fi';
import '../styles/ProductList.css';

const PRICE_RANGES = [
  { label: 'Tất cả', min: null, max: null },
  { label: 'Dưới 500K', min: 0, max: 500000 },
  { label: '500K – 2 triệu', min: 500000, max: 2000000 },
  { label: '2 – 5 triệu', min: 2000000, max: 5000000 },
  { label: '5 – 10 triệu', min: 5000000, max: 10000000 },
  { label: '10 – 20 triệu', min: 10000000, max: 20000000 },
  { label: 'Trên 20 triệu', min: 20000000, max: null },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
  { value: 'name_asc', label: 'Tên: A → Z' },
];

// Deterministic pseudo-rating based on product id
function getProductRating(productId) {
  const hash = ((productId * 2654435761) >>> 0) % 100;
  if (hash < 5) return 2;
  if (hash < 15) return 3;
  if (hash < 50) return 4;
  return 5;
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter states
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const catId = searchParams.get('categoryId');
    return catId ? [parseInt(catId)] : [];
  });
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('newest');

  // Collapsible sections
  const [sectionsOpen, setSectionsOpen] = useState({
    category: true,
    price: true,
    brand: true,
    rating: true,
  });

  const sentinelRef = useRef(null);
  const searchTimerRef = useRef(null);
  const PAGE_SIZE = 12;

  // Load categories and brands once
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getBrands().then(setBrands).catch(console.error);
  }, []);

  // Build query params from filters
  const buildParams = useCallback((pageNum) => {
    const params = { page: pageNum, pageSize: PAGE_SIZE };
    if (searchInput.trim()) params.search = searchInput.trim();
    if (selectedCategories.length === 1) params.categoryId = selectedCategories[0];
    if (selectedBrand) params.brand = selectedBrand;
    const range = PRICE_RANGES[selectedPriceRange];
    if (range.min !== null) params.minPrice = range.min;
    if (range.max !== null) params.maxPrice = range.max;
    if (sortBy) params.sortBy = sortBy;
    return params;
  }, [searchInput, selectedCategories, selectedBrand, selectedPriceRange, sortBy]);

  // Fetch products (initial load or filter change)
  const fetchProducts = useCallback(async (isNewSearch = true) => {
    const pageNum = isNewSearch ? 1 : page;
    if (isNewSearch) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = buildParams(pageNum);
      const res = await getProducts(params);
      let newProducts = res.data || [];

      // Client-side rating filter
      if (selectedRating > 0) {
        newProducts = newProducts.filter(p => getProductRating(p.id) >= selectedRating);
      }

      if (isNewSearch) {
        setProducts(newProducts);
        setTotalCount(res.totalCount || 0);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      setHasMore(pageNum < (res.totalPages || 1));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams, page, selectedRating]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedBrand, selectedPriceRange, selectedRating, sortBy]);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchProducts(true);
    }, 400);
    return () => clearTimeout(searchTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          setPage(prev => prev + 1);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  // Load more when page increments
  useEffect(() => {
    if (page > 1) {
      fetchProducts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Toggle category selection
  const toggleCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Toggle section
  const toggleSection = (section) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchInput('');
    setSelectedCategories([]);
    setSelectedBrand('');
    setSelectedPriceRange(0);
    setSelectedRating(0);
    setSortBy('newest');
    setSearchParams({});
  };

  const hasActiveFilters = searchInput || selectedCategories.length > 0 || selectedBrand || selectedPriceRange > 0 || selectedRating > 0 || sortBy !== 'newest';

  // Star rating component
  const StarRating = ({ interactive = false, onSelect }) => (
    <div className={`star-rating ${interactive ? 'interactive' : ''}`}>
      {[5, 4, 3, 2, 1].map(star => (
        <button
          key={star}
          className={`star-rating-btn ${selectedRating === star ? 'active' : ''}`}
          onClick={() => interactive && onSelect(star === selectedRating ? 0 : star)}
          type="button"
        >
          <span className="stars">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`star ${i < star ? 'filled' : ''}`}>★</span>
            ))}
          </span>
          <span className="star-label">từ {star} sao</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="product-list-page" id="product-list-page">
      <div className="container">
        {/* Page Header */}
        <div className="product-list-header">
          <div className="product-list-header-info">
            <h1>Tất cả sản phẩm</h1>
            <p className="product-count-text">
              {loading ? 'Đang tải...' : `${totalCount} sản phẩm được tìm thấy`}
            </p>
          </div>
          <div className="product-list-header-actions">
            <div className="sort-dropdown">
              <label htmlFor="sort-select">Sắp xếp:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              className="mobile-filter-toggle btn btn-secondary"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            >
              <FiSliders />
              Bộ lọc
            </button>
          </div>
        </div>

        <div className="product-list-layout">
          {/* Sidebar Filters */}
          <aside className={`product-sidebar ${mobileFiltersOpen ? 'open' : ''}`}>
            <div className="sidebar-overlay" onClick={() => setMobileFiltersOpen(false)} />
            <div className="sidebar-content">
              <div className="sidebar-header">
                <h2><FiSliders /> Bộ lọc</h2>
                {hasActiveFilters && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    <FiX /> Xóa tất cả
                  </button>
                )}
                <button className="sidebar-close" onClick={() => setMobileFiltersOpen(false)}>
                  <FiX />
                </button>
              </div>

              {/* Search Box */}
              <div className="sidebar-section">
                <div className="search-box">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    id="product-search-input"
                  />
                  {searchInput && (
                    <button className="search-clear" onClick={() => setSearchInput('')}>
                      <FiX />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div className="sidebar-section">
                <button className="section-toggle" onClick={() => toggleSection('category')}>
                  <h3>Danh mục</h3>
                  {sectionsOpen.category ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {sectionsOpen.category && (
                  <div className="filter-list brand-filter-list">
                    {categories.map(cat => (
                      <label key={cat.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                        />
                        <span className="checkbox-custom" />
                        <span className="checkbox-label">{cat.name}</span>
                        <span className="checkbox-count">{cat.productCount || 0}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Brand Filter */}
              <div className="sidebar-section">
                <button className="section-toggle" onClick={() => toggleSection('brand')}>
                  <h3>Thương hiệu</h3>
                  {sectionsOpen.brand ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {sectionsOpen.brand && (
                  <div className="filter-list brand-filter-list">
                    {brands.length > 0 ? (
                      brands.map(b => (
                        <label key={b.name} className="checkbox-item">
                          <input
                            type="radio"
                            name="brand-filter"
                            checked={selectedBrand === b.name}
                            onChange={() => setSelectedBrand(selectedBrand === b.name ? '' : b.name)}
                          />
                          <span className="checkbox-custom radio" />
                          <span className="checkbox-label">{b.name}</span>
                          <span className="checkbox-count">{b.productCount || 0}</span>
                        </label>
                      ))
                    ) : (
                      <p className="filter-empty-text">Chưa có thương hiệu nào</p>
                    )}
                  </div>
                )}
              </div>

              {/* Price Filter */}
              <div className="sidebar-section">
                <button className="section-toggle" onClick={() => toggleSection('price')}>
                  <h3>Khoảng giá</h3>
                  {sectionsOpen.price ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {sectionsOpen.price && (
                  <div className="filter-list price-filter-list">
                    {PRICE_RANGES.map((range, idx) => (
                      <button
                        key={idx}
                        className={`filter-chip ${selectedPriceRange === idx ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(idx === selectedPriceRange ? 0 : idx)}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Rating Filter */}
              <div className="sidebar-section">
                <button className="section-toggle" onClick={() => toggleSection('rating')}>
                  <h3>Đánh giá</h3>
                  {sectionsOpen.rating ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {sectionsOpen.rating && (
                  <StarRating interactive onSelect={setSelectedRating} />
                )}
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="product-main">
            {/* Active filter tags */}
            {hasActiveFilters && (
              <div className="active-filters">
                {searchInput && (
                  <span className="filter-tag">
                    🔍 "{searchInput}"
                    <button onClick={() => setSearchInput('')}><FiX /></button>
                  </span>
                )}
                {selectedCategories.map(catId => {
                  const cat = categories.find(c => c.id === catId);
                  return cat ? (
                    <span key={catId} className="filter-tag">
                      {cat.name}
                      <button onClick={() => toggleCategory(catId)}><FiX /></button>
                    </span>
                  ) : null;
                })}
                {selectedBrand && (
                  <span className="filter-tag">
                    {selectedBrand}
                    <button onClick={() => setSelectedBrand('')}><FiX /></button>
                  </span>
                )}
                {selectedPriceRange > 0 && (
                  <span className="filter-tag">
                    {PRICE_RANGES[selectedPriceRange].label}
                    <button onClick={() => setSelectedPriceRange(0)}><FiX /></button>
                  </span>
                )}
                {selectedRating > 0 && (
                  <span className="filter-tag">
                    ⭐ Từ {selectedRating} sao
                    <button onClick={() => setSelectedRating(0)}><FiX /></button>
                  </span>
                )}
                {sortBy !== 'newest' && (
                  <span className="filter-tag">
                    {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                    <button onClick={() => setSortBy('newest')}><FiX /></button>
                  </span>
                )}
              </div>
            )}

            {/* Product Grid */}
            <div className="product-grid">
              {loading ? (
                Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : products.length > 0 ? (
                products.map((p, index) => (
                  <div key={p.id} className="product-grid-item" style={{ animationDelay: `${(index % PAGE_SIZE) * 0.05}s` }}>
                    <ProductCard product={{ ...p, rating: getProductRating(p.id) }} showStockTooltip />
                  </div>
                ))
              ) : (
                <div className="product-grid-empty">
                  <div className="empty-icon">🔍</div>
                  <h3>Không tìm thấy sản phẩm</h3>
                  <p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  {hasActiveFilters && (
                    <button className="btn btn-primary" onClick={clearFilters}>
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Infinite Scroll Sentinel */}
            {!loading && hasMore && (
              <div ref={sentinelRef} className="infinite-scroll-sentinel">
                {loadingMore && (
                  <div className="loading-more">
                    <div className="loading-spinner">
                      <FiLoader className="spin-icon" />
                    </div>
                    <span>Đang tải thêm sản phẩm...</span>
                  </div>
                )}
              </div>
            )}

            {/* End of results */}
            {!loading && !hasMore && products.length > 0 && (
              <div className="end-of-results">
                <div className="end-line" />
                <span>Đã hiển thị tất cả {products.length} sản phẩm</span>
                <div className="end-line" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
