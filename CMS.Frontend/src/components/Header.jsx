import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiPackage, FiLogOut } from 'react-icons/fi';
import { HiOutlineBolt } from 'react-icons/hi2';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import '../styles/Header.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { customer, isLoggedIn, logout } = useAuth();
  const dropdownRef = useRef();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-inner">
                  <Link to="/" className="header-logo">
                      <div className="header-logo-icon">
                          <HiOutlineBolt />
                      </div>

                      Pet<span>Shop</span>
                  </Link>

          <nav className="header-nav">
            <Link to="/" className={isActive('/')}>Trang chủ</Link>
            <Link to="/products" className={isActive('/products')}>Sản phẩm</Link>
            <Link to="/blog" className={isActive('/blog')}>Tin tức</Link>
          </nav>

          <form className="header-search" onSubmit={handleSearch}>
            <FiSearch className="header-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="header-actions">
            <Link to="/cart" className="header-cart-btn" title="Giỏ hàng">
              <FiShoppingCart />
              {totalItems > 0 && (
                <span className="header-cart-badge">{totalItems > 9 ? '9+' : totalItems}</span>
              )}
            </Link>

            {isLoggedIn ? (
              <div className="user-dropdown-wrapper" ref={dropdownRef}>
                <button
                  className="header-user-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <FiUser className="user-icon" />
                  <span>{customer.fullName?.split(' ').pop()}</span>
                </button>
                <div className={`user-dropdown ${dropdownOpen ? 'open' : ''}`}>
                  <div className="user-dropdown-header">
                    <p>{customer.fullName}</p>
                    <p>{customer.email}</p>
                  </div>
                  <Link to="/profile"><FiUser /> Tài khoản</Link>
                  <Link to="/orders"><FiPackage /> Đơn hàng</Link>
                  <button className="logout-btn" onClick={logout}>
                    <FiLogOut /> Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">
                Đăng nhập
              </Link>
            )}

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <form className="mobile-search" onSubmit={handleSearch}>
          <FiSearch />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <Link to="/" className={isActive('/')}>Trang chủ</Link>
        <Link to="/products" className={isActive('/products')}>Sản phẩm</Link>
        <Link to="/blog" className={isActive('/blog')}>Tin tức</Link>
        <Link to="/cart">Giỏ hàng ({totalItems})</Link>
        {isLoggedIn ? (
          <>
            <Link to="/profile">Tài khoản</Link>
            <Link to="/orders">Đơn hàng</Link>
            <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); }}>Đăng xuất</a>
          </>
        ) : (
          <>
            <Link to="/login">Đăng nhập</Link>
            <Link to="/register">Đăng ký</Link>
          </>
        )}
      </div>
    </>
  );
}
