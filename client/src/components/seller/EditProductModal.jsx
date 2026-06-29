import React, { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { OpenFreeMap } from '../common/OpenFreeMap';
import { X, Tag, Info, CheckCircle, Pencil, MapPin, Search } from 'lucide-react';

export const EditProductModal = ({ isOpen, onClose, onSuccess, product }) => {
  const [title, setTitle]               = useState('');
  const [price, setPrice]               = useState('');
  const [description, setDescription]     = useState('');
  const [categoryId, setCategoryId]       = useState('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [categories, setCategories]       = useState([]);
  const [errorMsg, setErrorMsg]           = useState('');
  const [successMsg, setSuccessMsg]       = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);

  const [address, setAddress]                         = useState('');
  const [currency, setCurrency]                       = useState('USD');
  const [pinnedCoords, setPinnedCoords]               = useState(null);
  const [barcode, setBarcode]                         = useState('');

  // Photon autocomplete states
  const [addressSearchQuery, setAddressSearchQuery]   = useState('');
  const [addressSuggestions, setAddressSuggestions]   = useState([]);
  const [isAddressLoading, setIsAddressLoading]       = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc]       = useState(false);

  const { get, put, post } = useFetch();

  // Pre-fill form when product changes
  useEffect(() => {
    if (!isOpen || !product) return;
    setTitle(product.title || '');
    setPrice(parseFloat(product.price).toFixed(2) || '');
    setDescription(product.description || '');
    setCategoryId(product.category?.id || product.categoryId || '');
    setStockQuantity(String(product.stockQuantity ?? 1));
    setAddress(product.address || '');
    setCurrency(product.currency || 'USD');
    setBarcode(product.barcode || '');
    setAddressSearchQuery(product.address || '');
    if (product.latitude && product.longitude) {
      setPinnedCoords({ lat: parseFloat(product.latitude), lng: parseFloat(product.longitude) });
    } else {
      setPinnedCoords(null);
    }
    setErrorMsg('');
    setSuccessMsg('');
  }, [isOpen, product]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCats = async () => {
      try {
        const res = await get('/categories');
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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

  // Photon reverse-geocode
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
      const data = await response.json();
      if (data && data.features && data.features.length > 0) {
        const bestMatch = data.features[0];
        const addr = formatPhotonAddress(bestMatch);
        setAddress(addr);
        setAddressSearchQuery(addr);
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err);
    }
  };

  // Photon autocomplete
  const searchAddress = async (query) => {
    if (!query || query.length < 2) {
      setAddressSuggestions([]);
      return;
    }
    setIsAddressLoading(true);
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
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

  const handleSuggestDescription = async () => {
    if (!title.trim()) return;
    setIsGeneratingDesc(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await post('/products/suggest-description', { title });
      if (res.success && res.data) {
        setDescription(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to generate description.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate description.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      const res = await put(`/products/${product.id}`, {
        title,
        description,
        price,
        stockQuantity,
        categoryId,
        currency,
        address: address || null,
        latitude: pinnedCoords ? pinnedCoords.lat : null,
        longitude: pinnedCoords ? pinnedCoords.lng : null,
        barcode: barcode || null
      });
      if (res.success) {
        setSuccessMsg('Product updated successfully!');
        setTimeout(() => {
          onSuccess(res.data);
        }, 800);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel" style={{ maxWidth: '880px' }}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 900 }}>
            <Pencil size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--primary-light)' }} />
            Edit <span className="text-gradient">Product</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Update the details of <strong>{product.title}</strong>.
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <Info size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="split-layout" style={{ alignItems: 'start' }}>
          {/* Left Side: Product Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={14} /> Product Details
              </h3>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-product-title">Product Title</label>
              <input
                id="edit-product-title"
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Price + Currency + Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-product-price">Price</label>
                <input
                  id="edit-product-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-product-currency">Currency</label>
                <select
                  id="edit-product-currency"
                  className="form-input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="ILS">ILS (₪)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-product-stock">Stock Qty</label>
                <input
                  id="edit-product-stock"
                  type="number"
                  min="0"
                  className="form-input"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-product-category">Category</label>
              <select
                id="edit-product-category"
                className="form-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Barcode */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-product-barcode">Barcode (EAN/UPC)</label>
              <input
                id="edit-product-barcode"
                type="text"
                className="form-input"
                placeholder="e.g. 3017300045601"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label flex justify-between items-center">
                <span htmlFor="edit-product-desc">Description</span>
                <button
                  type="button"
                  onClick={handleSuggestDescription}
                  disabled={isGeneratingDesc || !title.trim()}
                  className="ai-suggest-btn"
                >
                  {isGeneratingDesc ? (
                    <>
                      <span className="spinner spinner-xs" style={{ width: '10px', height: '10px', borderWidth: '1.5px', borderTopColor: 'transparent', display: 'inline-block' }} />
                      Generating...
                    </>
                  ) : (
                    'Suggest with AI'
                  )}
                </button>
              </label>
              <textarea
                id="edit-product-desc"
                className="form-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Right Side: Map & Geolocation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, width: '100%' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} style={{ color: 'var(--secondary)' }} /> Location & Address
            </h3>

            {/* Photon Autocomplete Address Search Input */}
            <div style={{ position: 'relative' }}>
              <label className="form-label" htmlFor="edit-product-address">Address Search (Photon API)</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  id="edit-product-address"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px', height: '36px', fontSize: '0.85rem' }}
                  placeholder="Search address..."
                  value={addressSearchQuery}
                  onChange={(e) => {
                    setAddressSearchQuery(e.target.value);
                    searchAddress(e.target.value);
                  }}
                />
                {isAddressLoading && (
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                    <span className="spinner spinner-xs" style={{ width: '12px', height: '12px' }} />
                  </div>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {addressSuggestions.length > 0 && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  background: 'var(--bg-panel, #1e1e2e)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  listStyle: 'none',
                  padding: '4px 0',
                  margin: '4px 0 0 0',
                  maxHeight: '160px',
                  overflowY: 'auto'
                }}>
                  {addressSuggestions.map((suggestion, idx) => {
                    const formatted = formatPhotonAddress(suggestion);
                    return (
                      <li
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          color: 'var(--text-primary)',
                          borderBottom: idx === addressSuggestions.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        onClick={() => {
                          const [lng, lat] = suggestion.geometry.coordinates;
                          setPinnedCoords({ lat, lng });
                          setAddress(formatted);
                          setAddressSearchQuery(formatted);
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

            {/* Exact Address Display */}
            {address && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Saved Address</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.01)', borderColor: 'var(--primary-border, var(--border))' }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            )}

            <div style={{ height: '180px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <OpenFreeMap
                onSelectCoords={(coords) => {
                  setPinnedCoords(coords);
                  reverseGeocode(coords.lat, coords.lng);
                }}
                pinnedCoords={pinnedCoords}
                height="100%"
              />
            </div>

            {pinnedCoords && (
              <div className="alert alert-success" style={{ padding: '6px 12px', fontSize: '0.75rem', marginBottom: 0 }}>
                <CheckCircle size={12} />
                <span>
                  Pinned — Lat {pinnedCoords.lat.toFixed(5)}, Lng {pinnedCoords.lng.toFixed(5)}
                </span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                id="edit-product-submit-btn"
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><span className="spinner spinner-sm" /> Saving…</>
                ) : (
                  <><Pencil size={15} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
