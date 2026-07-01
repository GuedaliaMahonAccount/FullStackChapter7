import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Trash2, ShoppingBag, CreditCard, MapPin, CheckCircle, Plus, Minus, ArrowRight, Search } from 'lucide-react';
import { getImageUrl, formatPrice } from '../utils/format';

export const Cart = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { user, updateUserBilling } = useAuth();
  const { post, patch } = useFetch();
  const navigate = useNavigate();

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
    if (!user) {
      setSavedCard(null);
      setShippingAddress('');
      setCardExpiry('');
      setSaveCard(false);
      setSaveAddress(false);
      return;
    }

    const card = user.savedCardLast4 ? { last4: user.savedCardLast4, expiry: user.savedCardExpiry } : null;
    setSavedCard(card);
    setShippingAddress(user.savedAddress || '');
    setCardExpiry(user.savedCardExpiry || '');
    setSaveCard(!!user.savedCardLast4);
    setSaveAddress(!!user.savedAddress);
  }, [user]);

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

    // Save address / card preferences on the server securely
    if (user) {
      const billingPayload = {
        savedAddress: saveAddress ? shippingAddress : null,
        savedCardLast4: saveCard ? (usingSavedCard ? savedCard.last4 : rawCard.slice(-4)) : null,
        savedCardExpiry: saveCard ? cardExpiry : null
      };

      patch('/auth/profile/billing', billingPayload)
        .then(billingRes => {
          if (billingRes && billingRes.success && updateUserBilling) {
            updateUserBilling(billingRes.data);
          }
        })
        .catch(err => {
          console.warn('Failed to update billing details on server:', err);
        });
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
      <div className="cart-page-style-057">
        <div
          className="glass-panel-static cart-page-style-056"
          
        >
          <div className="cart-page-style-055">
            <CheckCircle size={52} />
          </div>
          <h1 className="cart-page-style-054">Purchase Successful!</h1>
          <p className="cart-page-style-053">
            Your payment was processed. Order <strong className="cart-page-style-052">#{purchaseSuccess.orderId}</strong> is now registered.
          </p>
          <div className="cart-page-style-051">
            <button onClick={() => navigate('/orders')} className="btn btn-primary btn-lg cart-page-style-050" >
              Track My Order <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary cart-page-style-049" >
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
        <div className="glass-panel-static empty-state cart-page-style-048" >
          <ShoppingBag size={56} className="empty-state-icon" />
          <h2 className="cart-page-style-047">Your cart is empty</h2>
          <p className="cart-page-style-046">Browse the marketplace to find items near you.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container cart-page-style-045" >

      {/* Header */}
      <div>
        <h1 className="cart-page-style-044">
          Shopping <span className="text-gradient">Basket</span>
        </h1>
        <p className="cart-page-style-043">
          Review your items and complete checkout
        </p>
      </div>

      {errorMsg && (
        <div className="alert alert-error">
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="split-layout cart-page-style-042" >

        {/* Left: Items */}
        <div className="cart-page-style-041">
          <h2 className="cart-page-style-040">
            <ShoppingBag size={16} />
            Items ({cart.length})
          </h2>

          {cart.map((item) => (
            <div
              key={item.id}
              className="cart-page-style-039"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <img
                src={getImageUrl(item.imageUrl)}
                alt={item.title}
                className="cart-page-style-038"
              />
              <div className="cart-page-style-037">
                <div className="cart-page-style-036">
                  <h3 className="cart-page-style-035">
                    {item.title}
                  </h3>
                  <span className="cart-page-style-034">
                    {formatPrice(item.price, item.currency)}
                  </span>
                </div>

                <div className="cart-page-style-033">
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
                    className="btn btn-ghost btn-icon cart-page-style-032"
                    
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
        <form onSubmit={handleSubmitCheckout} className="glass-panel-static cart-page-style-031" >
          <h2 className="cart-page-style-030">Checkout Summary</h2>

          {/* Shipping */}
          <div>
            <p className="cart-page-style-029">
              <MapPin size={13} /> Shipping
            </p>
            <div className="form-group address-autocomplete-wrapper cart-page-style-028" >
              <label className="form-label" htmlFor="checkout-address">Delivery Address</label>
              <div className="cart-page-style-027">
                <Search size={14} className="cart-page-style-026" />
                <input
                  id="checkout-address"
                  type="text"
                  className="form-input cart-page-style-025"
                  
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
                  <div className="cart-page-style-024">
                    <span className="spinner spinner-xs cart-page-style-023"  />
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
                className="cart-page-style-022"
              />
              <div>
                <span className="cart-page-style-021">
                  Remember address for next time
                </span>
                <span className="cart-page-style-020">
                  📍 The address will be saved locally in your browser for a faster checkout next time.
                </span>
              </div>
            </label>
          </div>

          <div className="divider cart-page-style-019"  />

          {/* Payment */}
          <div>
            <p className="cart-page-style-018">
              <CreditCard size={13} /> Payment (Demo)
            </p>

            {/* Saved card banner */}
            {savedCard && (
              <div className="cart-page-style-017">
                <CreditCard size={15} className="cart-page-style-016" />
                <span>
                  Saved card: <strong className="cart-page-style-015">•••• •••• •••• {savedCard.last4}</strong> — expires <strong className="cart-page-style-014">{savedCard.expiry}</strong>
                </span>
              </div>
            )}

            <div className="cart-page-style-013">
              <div className="form-group cart-page-style-012" >
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
              <div className="cart-page-style-011">
                <div className="form-group cart-page-style-010" >
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
                <div className="form-group cart-page-style-009" >
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
                  className="cart-page-style-008"
                />
                <div>
                  <span className="cart-page-style-007">
                    Remember card for next time
                  </span>
                  <span className="cart-page-style-006">
                    🔒 Only the last 4 digits &amp; expiry are stored locally. Your full card number and CVV are <strong>never saved</strong>.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="divider cart-page-style-005"  />

          {/* Total + CTA */}
          <div className="cart-page-style-004">
            <span className="cart-page-style-003">Grand Total</span>
            <span className="cart-page-style-002">
              {getCartTotalFormatted()}
            </span>
          </div>

          <button
            id="checkout-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg cart-page-style-001"
            
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
