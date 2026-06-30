import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  ShoppingCart, LogOut, Shield,
  Compass, ShoppingBag, Menu, X, LayoutDashboard
} from 'lucide-react';

export const Navbar = ({ onToggleCart }) => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const cartCount = getCartCount();

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">

          {/* Brand */}
          <Link to="/" className="nav-brand">
            <Compass size={24} className="nav-brand-logo" />
            <span className="nav-brand-text text-gradient">GeoMarket</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-links">
            <Link
              to="/"
              className={`nav-link${isActive('/') ? ' active' : ''}`}
            >
              <Compass size={16} />
              Explore
            </Link>

            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`nav-link${isActive('/dashboard') ? ' active' : ''}`}
                >
                  <LayoutDashboard size={16} />
                  My Shop
                </Link>
                <Link
                  to="/orders"
                  className={`nav-link${isActive('/orders') ? ' active' : ''}`}
                >
                  <ShoppingBag size={16} />
                  My Orders
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`nav-link${isActive('/admin') ? ' active' : ''} nav-admin-link`}
              >
                <Shield size={16} />
                Admin
              </Link>
            )}

            {/* Cart Button */}
            {user && (
              <button
                id="navbar-cart-btn"
                onClick={onToggleCart}
                className="btn btn-secondary btn-sm nav-cart-btn"
              >
                <ShoppingCart size={16} className="nav-cart-icon" />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="nav-cart-badge">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth Area */}
            {user ? (
              <div className="nav-auth-area">
                <div className="nav-user-info">
                  <span className="nav-user-name">
                    {user.fullName}
                  </span>
                  <span className="nav-user-role">
                    {user.role}
                  </span>
                </div>
                <button
                  id="navbar-logout-btn"
                  onClick={handleLogout}
                  className="btn btn-danger btn-icon"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="nav-auth-unauthenticated">
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            id="navbar-hamburger"
            className="hamburger-btn"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Drawer */}
      <div className={`mobile-nav${mobileOpen ? ' open' : ''}`}>
        <Link to="/" className={`nav-link${isActive('/') ? ' active' : ''}`}>
          <Compass size={18} /> Explore
        </Link>

        {user && (
          <>
            <Link to="/dashboard" className={`nav-link${isActive('/dashboard') ? ' active' : ''}`}>
              <LayoutDashboard size={18} /> My Shop
            </Link>
            <Link to="/orders" className={`nav-link${isActive('/orders') ? ' active' : ''}`}>
              <ShoppingBag size={18} /> My Orders
            </Link>
          </>
        )}

        {user?.role === 'admin' && (
          <Link to="/admin" className="nav-link nav-admin-link">
            <Shield size={18} /> Admin Dashboard
          </Link>
        )}

        {user && (
          <button
            onClick={() => { onToggleCart(); setMobileOpen(false); }}
            className="nav-link mobile-nav-cart-btn"
          >
            <ShoppingCart size={18} />
            Cart {cartCount > 0 && `(${cartCount})`}
          </button>
        )}

        {/* Mobile Auth */}
        <div className="mobile-nav-auth-divider">
          {user ? (
            <div className="mobile-nav-user-profile">
              <div>
                <p className="mobile-nav-user-title">{user.fullName}</p>
                <p className="mobile-nav-user-subtitle">{user.role}</p>
              </div>
              <button onClick={handleLogout} className="btn btn-danger btn-sm mobile-nav-logout-btn">
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <div className="mobile-nav-unauth-grid">
              <Link to="/login" className="btn btn-secondary mobile-nav-unauth-btn">Login</Link>
              <Link to="/register" className="btn btn-primary mobile-nav-unauth-btn">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
