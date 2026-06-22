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
            <Compass size={24} style={{ color: 'var(--secondary)' }} />
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
                className={`nav-link${isActive('/admin') ? ' active' : ''}`}
                style={{ color: 'var(--accent)' }}
              >
                <Shield size={16} />
                Admin
              </Link>
            )}

            {/* Cart Button */}
            <button
              id="navbar-cart-btn"
              onClick={onToggleCart}
              className="btn btn-secondary btn-sm"
              style={{ position: 'relative', gap: '7px', padding: '8px 14px' }}
            >
              <ShoppingCart size={16} style={{ color: 'var(--primary-light)' }} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  lineHeight: 1,
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth Area */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '10px', borderLeft: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user.fullName}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '10px', borderLeft: '1px solid var(--border)' }}>
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
          <Link to="/admin" className="nav-link" style={{ color: 'var(--accent)' }}>
            <Shield size={18} /> Admin Dashboard
          </Link>
        )}

        <button
          onClick={() => { onToggleCart(); setMobileOpen(false); }}
          className="nav-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}
        >
          <ShoppingCart size={18} />
          Cart {cartCount > 0 && `(${cartCount})`}
        </button>

        {/* Mobile Auth */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '12px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.fullName}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{user.role}</p>
              </div>
              <button onClick={handleLogout} className="btn btn-danger btn-sm" style={{ gap: '6px' }}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', padding: '0 4px' }}>
              <Link to="/login" className="btn btn-secondary" style={{ flex: 1 }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ flex: 1 }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
