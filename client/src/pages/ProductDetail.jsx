import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { OpenFreeMap } from '../components/common/OpenFreeMap';
import { ShoppingCart, User, ChevronLeft, MapPin, Box, CheckCircle, Lock, Globe, Languages, RefreshCw } from 'lucide-react';
import { getImageUrl, formatPrice } from '../utils/format';

export const ProductDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [added, setAdded]       = useState(false);

  // MyMemory translation states
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [isTranslating, setIsTranslating]   = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // Frankfurter currency conversion states
  const [ilsConvertedPrice, setIlsConvertedPrice] = useState('');
  const [isIlsConverting, setIsIlsConverting]     = useState(false);
  
  // Custom converter states
  const [customCurrency, setCustomCurrency]       = useState('ILS');
  const [customConvertedPrice, setCustomConvertedPrice] = useState(null);
  const [isCustomConverting, setIsCustomConverting] = useState(false);

  const { get }      = useFetch();
  const { addToCart } = useCart();
  const { user }     = useAuth();

  // Fetch Frankfurter conversion to ILS automatically
  useEffect(() => {
    if (!product) return;
    if (product.currency === 'ILS') {
      Promise.resolve().then(() => setIlsConvertedPrice(''));
      return;
    }
    
    const fetchIlsConversion = async () => {
      setIsIlsConverting(true);
      try {
        const result = await get(`/currency/convert?amount=${product.price}&from=${product.currency}&to=ILS`);
        if (result.success && result.data && result.data.rates && result.data.rates.ILS) {
          setIlsConvertedPrice(formatPrice(result.data.rates.ILS, 'ILS'));
        }
      } catch (err) {
        console.error('Error converting product price to ILS:', err);
      } finally {
        setIsIlsConverting(false);
      }
    };
    fetchIlsConversion();
  }, [product]);

  // Custom currency conversion handler
  const handleCustomConvert = (targetCurr) => {
    setCustomCurrency(targetCurr);
  };

  // Fetch custom currency conversion automatically when product or customCurrency changes
  useEffect(() => {
    if (!product) return;
    
    if (product.currency === customCurrency) {
      Promise.resolve().then(() => setCustomConvertedPrice(formatPrice(product.price, product.currency)));
      return;
    }

    const fetchCustomConversion = async () => {
      setIsCustomConverting(true);
      try {
        const result = await get(`/currency/convert?amount=${product.price}&from=${product.currency}&to=${customCurrency}`);
        if (result.success && result.data && result.data.rates && result.data.rates[customCurrency]) {
          setCustomConvertedPrice(formatPrice(result.data.rates[customCurrency], customCurrency));
        }
      } catch (err) {
        console.error(`Error converting price to ${customCurrency}:`, err);
      } finally {
        setIsCustomConverting(false);
      }
    };
    
    fetchCustomConversion();
  }, [product, customCurrency]);

  // MyMemory translation handler
  const handleTranslateDescription = async () => {
    if (translatedDesc) {
      setShowTranslation(!showTranslation);
      return;
    }
    
    setIsTranslating(true);
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(product.description)}&langpair=auto|he`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
          setTranslatedDesc(data.responseData.translatedText);
          setShowTranslation(true);
        } else {
          alert('Could not translate text. Please try again.');
        }
      } else {
        alert('Translation service error. Please try again.');
      }
    } catch (err) {
      console.error('Error translating text:', err);
      alert('Error translating description.');
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const result = await get(`/products/${id}`);
        if (result.success) setProduct(result.data);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  if (loading) {
    return (
      <div className="loading-center" style={{ height: '60vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div style={{ maxWidth: '520px', margin: '80px auto', textAlign: 'center', padding: '20px' }}>
        <h2 style={{ color: 'var(--status-cancelled)', marginBottom: '12px', fontSize: '1.4rem' }}>
          Product not found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {errorMsg || 'This listing may have been removed or is unavailable.'}
        </p>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          <ChevronLeft size={16} /> Back to Explore
        </button>
      </div>
    );
  }

  const hasLocation = product.latitude && product.longitude;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: 0 }}
        >
          <ChevronLeft size={18} /> Back
        </button>
      </div>

      {/* Main Grid */}
      <div className="split-layout">

        {/* Left: Image + Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Image */}
          <div
            className="glass-panel-static"
            style={{ height: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 0 }}
          >
            <img
              src={getImageUrl(product.imageUrl)}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
          </div>

          {/* Description */}
          <div className="glass-panel-static" style={{ padding: '28px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
                Product Description
              </h2>
              <button
                className="btn btn-ghost btn-sm"
                style={{ gap: '6px', fontSize: '0.8rem', padding: '4px 8px', height: '32px' }}
                onClick={handleTranslateDescription}
                disabled={isTranslating}
              >
                <Languages size={15} />
                {isTranslating ? 'Translating...' : showTranslation ? 'Show Original' : 'Translate to Hebrew'}
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {showTranslation ? translatedDesc : product.description}
            </p>
          </div>
        </div>

        {/* Right: Summary + Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Summary Card */}
          <div className="glass-panel-static" style={{ padding: '28px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Category badge */}
            <div>
              <span className="badge badge-primary">{product.category?.name}</span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1.2 }}>
              {product.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--secondary)', fontFamily: 'var(--font-heading)' }}>
                {formatPrice(product.price, product.currency)}
              </span>
              {product.currency !== 'ILS' && (
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                  {isIlsConverting ? '(calculating...)' : ilsConvertedPrice ? `(≈ ${ilsConvertedPrice})` : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Box size={15} />
                {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Interactive Currency Converter Panel */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={13} style={{ color: 'var(--primary-light)' }} /> Currency Converter (Frankfurter)
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.8rem', padding: '4px 8px', flex: 1 }}
                  value={customCurrency}
                  onChange={(e) => handleCustomConvert(e.target.value)}
                >
                  <option value="ILS">Convert to ILS (₪)</option>
                  <option value="USD">Convert to USD ($)</option>
                  <option value="EUR">Convert to EUR (€)</option>
                  <option value="GBP">Convert to GBP (£)</option>
                  <option value="JPY">Convert to JPY (¥)</option>
                  <option value="CAD">Convert to CAD (C$)</option>
                </select>
                <div style={{ flex: 1.2, fontSize: '0.85rem', fontWeight: 700, textAlign: 'right' }}>
                  {isCustomConverting ? (
                    <span style={{ color: 'var(--text-muted)' }}><RefreshCw size={12} className="spinner" style={{ display: 'inline', marginRight: '4px' }} /> Calculating...</span>
                  ) : customConvertedPrice ? (
                    <span className="text-gradient" style={{ fontSize: '1rem' }}>{customConvertedPrice}</span>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select currency</span>
                  )}
                </div>
              </div>
            </div>

            <div className="divider" style={{ margin: '4px 0' }} />

          {(() => {
              const isOwnProduct = user && product.seller && user.id === product.seller.id;
              if (isOwnProduct) {
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 20px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    color: 'var(--primary-light)',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}>
                    <Lock size={16} />
                    This is your listing — you can't buy your own product.
                  </div>
                );
              }
              return (
                <button
                  id="product-add-to-cart-btn"
                  onClick={handleAddToCart}
                  className={`btn btn-lg ${added ? 'btn-accent' : 'btn-primary'}`}
                  style={{ width: '100%', borderRadius: 'var(--radius-sm)', transition: 'all 0.3s ease' }}
                  disabled={product.stockQuantity === 0}
                >
                  {added ? (
                    <><CheckCircle size={18} /> Added to Cart!</>
                  ) : (
                    <><ShoppingCart size={18} /> Add to Cart</>
                  )}
                </button>
              );
            })()}

            {product.stockQuantity === 0 && (
              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--status-cancelled)' }}>
                This item is currently out of stock.
              </p>
            )}
          </div>

          {/* Seller Card */}
          <div
            className="glass-panel-static"
            style={{ padding: '20px 24px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '14px' }}
          >
            <div className="avatar avatar-lg">
              {product.seller?.fullName?.charAt(0)?.toUpperCase() || <User size={22} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '3px' }}>
                Seller
              </p>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.seller?.fullName}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.seller?.email}
              </p>
            </div>
          </div>

          {/* Map */}
          {hasLocation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 className="section-title" style={{ fontSize: '0.95rem' }}>
                <MapPin size={16} style={{ color: 'var(--primary)' }} />
                Sale Location
              </h3>
              {product.address && (
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginTop: '-4px' }}>
                  <strong>Address:</strong> {product.address}
                </p>
              )}
              <div
                className="glass-panel-static"
                style={{ height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden', padding: 0 }}
              >
                <OpenFreeMap
                  products={[product]}
                  center={[parseFloat(product.longitude), parseFloat(product.latitude)]}
                  zoom={14}
                  height="100%"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
