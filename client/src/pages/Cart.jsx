import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFetch } from '../hooks/useFetch';
import { Trash2, ShoppingBag, CreditCard, MapPin, CheckCircle, Plus, Minus, ArrowRight } from 'lucide-react';

export const Cart = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { post }     = useFetch();
  const navigate     = useNavigate();

  const [shippingAddress, setShippingAddress] = useState('');
  const [cardNumber, setCardNumber]           = useState('');
  const [cardExpiry, setCardExpiry]           = useState('');
  const [cardCvv, setCardCvv]                 = useState('');
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [errorMsg, setErrorMsg]               = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  const handleSubmitCheckout = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (cart.length === 0) { setErrorMsg('Your cart is empty.'); return; }

    setIsSubmitting(true);
    try {
      const itemsPayload = cart.map((item) => ({ productId: item.id, quantity: item.quantity }));
      const res = await post('/orders', { shippingAddress, items: itemsPayload });
      if (res.success) {
        clearCart();
        setPurchaseSuccess(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Checkout failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── SUCCESS STATE ── */
  if (purchaseSuccess) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '24px' }}>
        <div
          className="glass-panel-static"
          style={{ width: '100%', maxWidth: '480px', padding: '48px 40px', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid rgba(20,184,166,0.25)', boxShadow: '0 0 60px rgba(20,184,166,0.08)', animation: 'slideUp 0.4s ease' }}
        >
          <div style={{ display: 'inline-flex', background: 'rgba(20,184,166,0.12)', color: 'var(--secondary)', padding: '18px', borderRadius: '50%', marginBottom: '22px' }}>
            <CheckCircle size={52} />
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, marginBottom: '10px' }}>Purchase Successful!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '28px' }}>
            Your payment was processed. Order <strong style={{ color: 'var(--text-primary)' }}>#{purchaseSuccess.orderId}</strong> is now registered.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => navigate('/orders')} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Track My Order <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ width: '100%' }}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── EMPTY CART ── */
  if (cart.length === 0) {
    return (
      <div className="page-container">
        <div className="glass-panel-static empty-state" style={{ padding: '80px 40px' }}>
          <ShoppingBag size={56} className="empty-state-icon" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Browse the marketplace to find items near you.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 900 }}>
          Shopping <span className="text-gradient">Basket</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Review your items and complete checkout
        </p>
      </div>

      {errorMsg && (
        <div className="alert alert-error">
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="split-layout" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'start' }}>

        {/* Left: Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={16} />
            Items ({cart.length})
          </h2>

          {cart.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.imageUrl}`}
                alt={item.title}
                style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.97rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </h3>
                  <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '1.05rem', flexShrink: 0 }}>
                    ${parseFloat(item.price).toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus size={13} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus size={13} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="btn btn-ghost btn-icon"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Checkout Form */}
        <form onSubmit={handleSubmitCheckout} className="glass-panel-static" style={{ padding: '28px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Checkout Summary</h2>

          {/* Shipping */}
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <MapPin size={13} /> Shipping
            </p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="checkout-address">Delivery Address</label>
              <textarea
                id="checkout-address"
                className="form-input"
                rows={2}
                placeholder="123 Main St, Suite 4B, New York, NY 10001"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="divider" style={{ margin: 0 }} />

          {/* Payment */}
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <CreditCard size={13} /> Payment (Demo)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="checkout-card">Card Number</label>
                <input
                  id="checkout-card"
                  type="text"
                  className="form-input"
                  placeholder="4111 2222 3333 4444"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={16}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="checkout-expiry">Expiry</label>
                  <input
                    id="checkout-expiry"
                    type="text"
                    className="form-input"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    maxLength={5}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="checkout-cvv">CVV</label>
                  <input
                    id="checkout-cvv"
                    type="password"
                    className="form-input"
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    maxLength={3}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="divider" style={{ margin: 0 }} />

          {/* Total + CTA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Grand Total</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
              ${getCartTotal().toFixed(2)}
            </span>
          </div>

          <button
            id="checkout-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><span className="spinner spinner-sm" /> Processing…</>
            ) : (
              <>Pay & Place Order <ArrowRight size={16} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Cart;
