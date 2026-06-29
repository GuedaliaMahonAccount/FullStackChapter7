import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Trash2, ShoppingBag, CreditCard, MapPin, CheckCircle, Plus, Minus, ArrowRight, Search } from 'lucide-react';
import { getImageUrl, formatPrice } from '../utils/format';

export const Cart = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { post } = useFetch();
  const navigate = useNavigate();

  const SAVED_CARD_KEY = user?.id ? `c2c_saved_card_${user.id}` : 'c2c_saved_card';
  const SAVED_ADDRESS_KEY = user?.id ? `c2c_saved_address_${user.id}` : 'c2c_saved_address';

  // ---------- Form state ----------
  const [savedCard, setSavedCard]             = useState(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [cardNumber, setCardNumber]           = useState('');
  const [cardExpiry, setCardExpiry]           = useState('');
  const [cardCvv, setCardCvv]                 = useState('');
  const [saveCard, setSaveCard]               = useState(false);
  const [saveAddress, setSaveAddress]         = useState(false);
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [errorMsg, setErrorMsg]               = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  // Photon autocomplete states
  const [addressSuggestions, setAddressSuggestions]   = useState([]);
  const [isAddressLoading, setIsAddressLoading]       = useState(false);

  // Sync form states with saved user details when user changes
  useEffect(() => {
    let card = null;
    try {
      card = JSON.parse(localStorage.getItem(SAVED_CARD_KEY)) || null;
    } catch {
      card = null;
    }
    const addr = localStorage.getItem(SAVED_ADDRESS_KEY) || '';

    setSavedCard(card);
    setShippingAddress(addr);
    setCardExpiry(card?.expiry || '');
    setSaveCard(!!card);
    setSaveAddress(!!addr);
  }, [user, SAVED_CARD_KEY, SAVED_ADDRESS_KEY]);

  // Helper for Photon format
  const formatPhotonAddress = (feature) => {
    const p = feature.properties;
    const parts = [];
    if (p.name && p.name !== p.street) parts.push(p.name);
    if (p.street) {
      let streetStr = p.street;
      if (p.housenumber) streetStr += ` ${p.housenumber}`;
      parts.push(streetStr);
    }
    if (p.city) parts.push(p.city);
    if (p.country) parts.push(p.country);
    return parts.join(', ') || 'Selected Location';
  };

  // Photon autocomplete
  const searchAddress = async (query) => {
    if (!query || query.length < 2) {
      setAddressSuggestions([]);
      return;
    }
    setIsAddressLoading(true);
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lon=34.7818&lat=32.0853`);
      const data = await response.json();
      if (data && data.features) {
        setAddressSuggestions(data.features);
      }
    } catch (err) {
      console.error('Error searching address:', err);
    } finally {
      setIsAddressLoading(false);
    }
  };

  const getCartTotalFormatted = () => {
    if (cart.length === 0) return '$0.00';
    const firstCurrency = cart[0].currency || 'USD';
    const allSame = cart.every(item => (item.currency || 'USD') === firstCurrency);
    const total = getCartTotal();
    if (allSame) {
      return formatPrice(total, firstCurrency);
    } else {
      return formatPrice(total, 'USD') + ' (USD)';
    }
  };

  const handleSubmitCheckout = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (cart.length === 0) { setErrorMsg('Your cart is empty.'); return; }

    // Basic card validation
    const rawCard = cardNumber.replace(/\s/g, '');
    const usingSavedCard = savedCard && !rawCard;

    if (!usingSavedCard) {
      if (rawCard.length < 13 || rawCard.length > 19) {
        setErrorMsg('Please enter a valid card number.');
        return;
      }
    }

    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setErrorMsg('Please enter expiry in MM/YY format.');
      return;
    }
    if (cardCvv.length < 3) {
      setErrorMsg('Please enter a valid CVV (3–4 digits).');
      return;
    }

    // Save address local storage logic
    if (saveAddress) {
      localStorage.setItem(SAVED_ADDRESS_KEY, shippingAddress);
    } else {
      localStorage.removeItem(SAVED_ADDRESS_KEY);
    }

    // ⚠️ PCI-DSS safe save: ONLY last 4 digits + expiry — NEVER store full PAN or CVV
    if (saveCard) {
      if (!usingSavedCard) {
        const last4 = rawCard.slice(-4);
        localStorage.setItem(SAVED_CARD_KEY, JSON.stringify({ last4, expiry: cardExpiry }));
      }
    } else {
      localStorage.removeItem(SAVED_CARD_KEY);
    }

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
                src={getImageUrl(item.imageUrl)}
                alt={item.title}
                style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.97rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </h3>
                  <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '1.05rem', flexShrink: 0 }}>
                    {formatPrice(item.price, item.currency)}
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
            <div className="form-group address-autocomplete-wrapper" style={{ marginBottom: '12px' }}>
              <label className="form-label" htmlFor="checkout-address">Delivery Address</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  id="checkout-address"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Type address, e.g. Dizengoff 100, Tel Aviv..."
                  value={shippingAddress}
                  onChange={(e) => {
                    setShippingAddress(e.target.value);
                    searchAddress(e.target.value);
                  }}
                  required
                  autoComplete="off"
                />
                {isAddressLoading && (
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <span className="spinner spinner-xs" style={{ width: '12px', height: '12px' }} />
                  </div>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {addressSuggestions.length > 0 && (
                <ul className="address-suggestions-list">
                  {addressSuggestions.map((suggestion, idx) => {
                    const formatted = formatPhotonAddress(suggestion);
                    return (
                      <li
                        key={idx}
                        className="address-suggestion-item"
                        onClick={() => {
                          setShippingAddress(formatted);
                          setAddressSuggestions([]);
                        }}
                      >
                        {formatted}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Save address checkbox */}
            <label
              htmlFor="checkout-save-address"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: saveAddress ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${saveAddress ? 'rgba(99,102,241,0.3)' : 'var(--border-soft)'}`,
                transition: 'all 0.2s ease',
                marginBottom: '4px'
              }}
            >
              <input
                id="checkout-save-address"
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                style={{ marginTop: '2px', accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
              />
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                  Remember address for next time
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block', marginTop: '2px' }}>
                  📍 The address will be saved locally in your browser for a faster checkout next time.
                </span>
              </div>
            </label>
          </div>

          <div className="divider" style={{ margin: 0 }} />

          {/* Payment */}
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <CreditCard size={13} /> Payment (Demo)
            </p>

            {/* Saved card banner */}
            {savedCard && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(20,184,166,0.08)',
                border: '1px solid rgba(20,184,166,0.2)',
                marginBottom: '12px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)'
              }}>
                <CreditCard size={15} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                <span>
                  Saved card: <strong style={{ color: 'var(--text-primary)' }}>•••• •••• •••• {savedCard.last4}</strong> — expires <strong style={{ color: 'var(--text-primary)' }}>{savedCard.expiry}</strong>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="checkout-card">Card Number</label>
                <input
                  id="checkout-card"
                  type="text"
                  className="form-input"
                  placeholder={savedCard ? `•••• •••• •••• ${savedCard.last4}` : '4111 2222 3333 4444'}
                  value={cardNumber}
                  onChange={(e) => {
                    // Auto-format with spaces every 4 digits
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                    setCardNumber(formatted);
                  }}
                  maxLength={19}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  required={!savedCard}
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
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
                      setCardExpiry(val);
                    }}
                    maxLength={5}
                    inputMode="numeric"
                    autoComplete="cc-exp"
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
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    required
                  />
                </div>
              </div>

              {/* Save card checkbox */}
              <label
                htmlFor="checkout-save-card"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: saveCard ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${saveCard ? 'rgba(99,102,241,0.3)' : 'var(--border-soft)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  id="checkout-save-card"
                  type="checkbox"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
                />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                    Remember card for next time
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block', marginTop: '2px' }}>
                    🔒 Only the last 4 digits &amp; expiry are stored locally. Your full card number and CVV are <strong>never saved</strong>.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="divider" style={{ margin: 0 }} />

          {/* Total + CTA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Grand Total</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
              {getCartTotalFormatted()}
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
