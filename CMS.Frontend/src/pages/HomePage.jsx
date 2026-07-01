import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiGrid, FiTruck, FiShield, FiHeadphones, FiChevronLeft, FiChevronRight, FiTrendingUp } from 'react-icons/fi';
import Hero from '../components/Hero';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { getProducts, getCategories, getPosts, getBestSellers, getImageUrl } from '../api';
import '../styles/ProductList.css';

const PRODUCTS_PER_PAGE = 8;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch categories & posts once on mount
  useEffect(() => {
    async function fetchStaticData() {
      try {
        const [catRes, postRes, bestRes] = await Promise.all([
          getCategories(),
          getPosts({ pageSize: 3 }),
          getBestSellers(8),
        ]);
        setCategories(catRes || []);
        setPosts(postRes.data || []);
        setBestSellers(bestRes || []);
      } catch (err) {
        console.error('Error loading homepage:', err);
      }
    }
    fetchStaticData();
  }, []);

  // Fetch products whenever currentPage changes
  const fetchProducts = useCallback(async (page) => {
    setProductsLoading(true);
    try {
      const prodRes = await getProducts({ page, pageSize: PRODUCTS_PER_PAGE });
      setProducts(prodRes.data || []);
      setTotalPages(prodRes.totalPages || 1);
      setTotalCount(prodRes.totalCount || 0);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setProductsLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, fetchProducts]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to the products section
    const section = document.getElementById('featured-products');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Build page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id="home-page">
      <Hero />

      {/* Features */}
      <section style={{ padding: 'var(--space-12) 0', background: 'var(--white)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-6)'
          }}>
            {[
              { icon: <FiTruck />, title: 'Miễn phí vận chuyển', desc: 'Đơn hàng từ 500K' },
              { icon: <FiShield />, title: 'Bảo hành chính hãng', desc: '12 tháng toàn quốc' },
              { icon: <FiHeadphones />, title: 'Hỗ trợ 24/7', desc: 'Tư vấn mọi lúc' },
              { icon: <FiGrid />, title: 'Sản phẩm đa dạng', desc: '500+ sản phẩm' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-100)', transition: 'all 0.2s',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', flexShrink: 0
                }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--gray-800)' }}>{f.title}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-500)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section style={{ padding: 'var(--space-16) 0', background: 'var(--white)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--gray-900)',
                margin: 0
              }}>
                DANH MỤC SẢN PHẨM
              </h2>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-6)'
            }}>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/products?categoryId=${cat.id}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '0px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#f7f7f7' }}>
                    {cat.imageUrl ? (
                      <img src={getImageUrl(cat.imageUrl)} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--gray-300)' }}>
                        <FiGrid />
                      </div>
                    )}
                  </div>
                  <div style={{
                    background: '#ffff',
                    color: 'black',
                    textAlign: 'center',
                    padding: '14px 0',
                    fontWeight: '700',
                    fontSize: '16px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    {cat.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section id="best-sellers" style={{ padding: 'var(--space-16) 0', background: 'var(--white)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--gray-900)',
                margin: 0
              }}>
                SẢN PHẨM BÁN CHẠY!
              </h2>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-16)'
            }}>
              {bestSellers.map((p) => (
                <div key={p.id} style={{ position: 'relative' }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section id="featured-products" style={{ padding: 'var(--space-16) 0', background: 'var(--gray-50)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--gray-900)',
              margin: '0 0 var(--space-2) 0'
            }}>
              SẢN PHẨM NỔI BẬT!
            </h2>
            <p style={{ color: 'var(--gray-500)', margin: 0 }}>
              {totalCount > 0
                ? `Hiển thị ${(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–${Math.min(currentPage * PRODUCTS_PER_PAGE, totalCount)} / ${totalCount} sản phẩm`
                : 'Sản phẩm được yêu thích nhất'}
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 'var(--space-6)',
            minHeight: 320,
            opacity: productsLoading ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
          }}>
            {loading
              ? Array(PRODUCTS_PER_PAGE).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.map(p => <ProductCard key={p.id} product={p} />)
            }
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" id="home-pagination">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                aria-label="Trang trước"
              >
                <FiChevronLeft />
              </button>
              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 40, height: 40, color: 'var(--gray-400)',
                    fontSize: 'var(--font-sm)', userSelect: 'none',
                  }}>
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={p === currentPage ? 'active' : ''}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                aria-label="Trang sau"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Blog Preview */}
      <section id="featured-products" style={{ padding: 'var(--space-16) 0', background: 'var(--gray-50)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--gray-900)',
              margin: '0 0 var(--space-2) 0'
            }}>
              TIN TỨC MỚI NHẤT!
            </h2>
            <Link to="/blog" className="btn btn-secondary btn-sm">
              Xem tất cả <FiArrowRight />
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-6)'
          }}>
            {posts.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                style={{
                  background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden', border: '1px solid var(--gray-100)',
                  transition: 'all 0.3s', textDecoration: 'none',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {post.imageUrl && (
                  <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                    <img
                      src={getImageUrl(post.imageUrl)}
                      alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ padding: 'var(--space-5)' }}>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-500)', marginBottom: 'var(--space-2)' }}>
                    {formatDate(post.createdDate)} {post.categoryName && `• ${post.categoryName}`}
                  </p>
                  <h3 style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 'var(--space-2)', lineHeight: 1.4 }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--gray-500)', lineHeight: 1.6 }}>
                    {post.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
