import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { getImageUrl, formatPrice } from '../../utils/format';

export const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckoutClick = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <div className="cart-overlay">
      {/* Backdrop */}
      <div className="cart-backdrop" onClick={onClose} />

      {/* Drawer */}
      <aside className="cart-drawer">

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={20} style={{ color: 'var(--primary-light)' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Your Basket</h2>
            {cart.length > 0 && (
              <span style={{
                background: 'var(--primary-glow)',
                border: '1px solid var(--primary-border)',
                color: 'var(--primary-light)',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}>
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <button
            id="cart-drawer-close"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cart.length === 0 ? (
            <div className="empty-state" style={{ height: '100%' }}>
              <ShoppingBag size={52} className="empty-state-icon" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
                Your cart is empty
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Add items from the marketplace to get started
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* Thumbnail */}
                <img
                  src={getImageUrl(item.imageUrl)}
                  alt={item.title}
                  style={{ width: '68px', height: '68px', objectFit: 'cover', borderRadius: 'var(--radius-xs)', flexShrink: 0 }}
                />

                {/* Details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '6px', minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </h4>
                  <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '0.9rem' }}>
                    {formatPrice(item.price, item.currency)}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Qty */}
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="btn btn-ghost btn-icon"
                      title="Remove item"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Subtotal</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
                {(() => {
                  if (cart.length === 0) return '$0.00';
                  const firstCurrency = cart[0].currency || 'USD';
                  const allSame = cart.every(item => (item.currency || 'USD') === firstCurrency);
                  const total = getCartTotal();
                  if (allSame) {
                    return formatPrice(total, firstCurrency);
                  } else {
                    return formatPrice(total, 'USD') + ' (USD)';
                  }
                })()}
              </span>
            </div>
            <button
              id="cart-checkout-btn"
              onClick={handleCheckoutClick}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;
