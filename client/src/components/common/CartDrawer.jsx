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
        <div className="cart-drawer-style-021">
          <div className="cart-drawer-style-020">
            <ShoppingBag size={20} className="cart-drawer-style-019" />
            <h2 className="cart-drawer-style-018">Your Basket</h2>
            {cart.length > 0 && (
              <span className="cart-drawer-style-017">
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
        <div className="cart-drawer-style-016">
          {cart.length === 0 ? (
            <div className="empty-state cart-drawer-style-015" >
              <ShoppingBag size={52} className="empty-state-icon" />
              <p className="cart-drawer-style-014">
                Your cart is empty
              </p>
              <p className="cart-drawer-style-013">
                Add items from the marketplace to get started
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="cart-drawer-style-012"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* Thumbnail */}
                <img
                  src={getImageUrl(item.imageUrl)}
                  alt={item.title}
                  className="cart-drawer-style-011"
                />

                {/* Details */}
                <div className="cart-drawer-style-010">
                  <h4 className="cart-drawer-style-009">
                    {item.title}
                  </h4>
                  <span className="cart-drawer-style-008">
                    {formatPrice(item.price, item.currency)}
                  </span>

                  <div className="cart-drawer-style-007">
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
                      className="btn btn-ghost btn-icon cart-drawer-style-006"
                      title="Remove item"
                      
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
          <div className="cart-drawer-style-005">
            <div className="cart-drawer-style-004">
              <span className="cart-drawer-style-003">Subtotal</span>
              <span className="cart-drawer-style-002">
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
              className="btn btn-primary btn-lg cart-drawer-style-001"
              
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
