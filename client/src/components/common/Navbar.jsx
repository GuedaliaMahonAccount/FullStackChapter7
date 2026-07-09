import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  ShoppingCart, LogOut, Shield,
  Compass, ShoppingBag, Menu, X, LayoutDashboard, Bell
} from 'lucide-react';

export const Navbar = ({ onToggleCart }) => {
  const { user, logout, token, API_URL } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Mark single as read and navigate
  const handleNotificationClick = async (notification) => {
    if (!token) return;
    setNotificationsOpen(false);
    
    if (!notification.is_read) {
      try {
        const response = await fetch(`${API_URL}/notifications/${notification._id}/read`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, is_read: true } : n));
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (notification.type === 'new_review' || notification.title?.includes('New Order')) {
      navigate('/dashboard');
    } else if (notification.type === 'order_status') {
      navigate('/orders');
    }
  };

  // Poll notifications every 5 minutes (300,000 ms)
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user, token]);

  // Click outside listener to close dropdown
  useEffect(() => {
    if (!notificationsOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.nav-notifications-container')) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [notificationsOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const cartCount = getCartCount();
  const unreadCount = notifications.filter(n => !n.is_read).length;

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
            {user && (
              <Link
                to="/"
                className={`nav-link${isActive('/') ? ' active' : ''}`}
              >
                <Compass size={16} />
                Explore
              </Link>
            )}

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

            {/* Notification Bell */}
            {user && (
              <div className="nav-notifications-container">
                <button
                  id="navbar-notifications-btn"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className={`btn btn-secondary btn-sm nav-notifications-btn ${notificationsOpen ? 'active' : ''}`}
                  title="Notifications"
                >
                  <Bell size={16} className="nav-notifications-icon" />
                  {unreadCount > 0 && (
                    <span className="nav-notifications-badge">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="notifications-dropdown glass-panel-static">
                    <div className="notifications-dropdown-header">
                      <h3>Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} className="btn btn-ghost btn-sm mark-all-read-btn">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="notifications-dropdown-body">
                      {notifications.length === 0 ? (
                        <div className="notifications-empty">No notifications</div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                          >
                            <div className="notification-item-dot" />
                            <div className="notification-item-content">
                              <p className="notification-title">{notification.title}</p>
                              <p className="notification-message">{notification.message}</p>
                              <span className="notification-time">
                                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
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
        {user && (
          <Link to="/" className={`nav-link${isActive('/') ? ' active' : ''}`}>
            <Compass size={18} /> Explore
          </Link>
        )}

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

        {user && (
          <button
            onClick={() => { setNotificationsOpen(!notificationsOpen); setMobileOpen(false); }}
            className="nav-link mobile-nav-notifications-btn"
          >
            <Bell size={18} />
            Notifications {unreadCount > 0 && `(${unreadCount})`}
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
