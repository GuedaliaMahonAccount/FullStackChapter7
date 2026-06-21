import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { OpenFreeMap } from '../components/common/OpenFreeMap';
import { Tag, MapPin, Upload, Info, CheckCircle, Image } from 'lucide-react';

export const SellProduct = () => {
  const [title, setTitle]                 = useState('');
  const [price, setPrice]                 = useState('');
  const [description, setDescription]     = useState('');
  const [categoryId, setCategoryId]       = useState('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [imageFile, setImageFile]         = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [pinnedCoords, setPinnedCoords]   = useState(null);
  const [categories, setCategories]       = useState([]);
  const [errorMsg, setErrorMsg]           = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [dragOver, setDragOver]           = useState(false);

  const { get, post } = useFetch();
  const navigate      = useNavigate();

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await get('/categories');
        if (res.success) {
          setCategories(res.data);
          if (res.data.length > 0) setCategoryId(res.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, []);

  const handleImageChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageChange(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!imageFile) {
      setErrorMsg('A product image is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('categoryId', categoryId);
      formData.append('stockQuantity', stockQuantity);
      formData.append('image', imageFile);
      if (pinnedCoords) {
        formData.append('latitude', pinnedCoords.lat);
        formData.append('longitude', pinnedCoords.lng);
      }

      const res = await post('/products', formData);
      if (res.success) navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to publish listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 900 }}>
          Create a New <span className="text-gradient">Listing</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Sell your items to local buyers in your neighborhood.
        </p>
      </div>

      {errorMsg && (
        <div className="alert alert-error">
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleSubmit} className="split-layout" style={{ alignItems: 'start' }}>

        {/* Left: Fields */}
        <div className="glass-panel-static" style={{ padding: '28px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={16} /> Item Details
          </h2>

          <div className="form-group">
            <label className="form-label" htmlFor="sell-title">Product Title</label>
            <input
              id="sell-title"
              type="text"
              className="form-input"
              placeholder="e.g. Vintage leather jacket"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Price + Stock row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="sell-price">Price ($ USD)</label>
              <input
                id="sell-price"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="25.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sell-stock">Stock Qty</label>
              <input
                id="sell-stock"
                type="number"
                min="1"
                className="form-input"
                placeholder="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sell-category">Category</label>
            <select
              id="sell-category"
              className="form-input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sell-desc">Description</label>
            <textarea
              id="sell-desc"
              className="form-input"
              rows={4}
              placeholder="Describe the item's condition, size, brand…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Image Upload */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Product Image</label>
            <label
              htmlFor="sell-image-input"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                display: 'flex',
                flexDirection: imagePreview ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                padding: imagePreview ? '14px' : '28px 20px',
                border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border-soft)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: dragOver ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
              }}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: 'var(--radius-xs)' }}
                  />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {imageFile?.name}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--primary-light)' }}>Click to change image</p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: 'var(--primary-glow)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <Upload size={22} style={{ color: 'var(--primary-light)' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '3px' }}>Drop image here or click to upload</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PNG, JPG, WEBP up to 10 MB</p>
                  </div>
                </>
              )}
              <input
                id="sell-image-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* Right: Map + Submit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="glass-panel-static" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} style={{ color: 'var(--secondary)' }} />
              Pin Geolocation
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.06em', marginLeft: 'auto' }}>
                Optional
              </span>
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.55 }}>
              Click on the map to mark where the item is located. Nearby buyers will see it on their map feed.
            </p>

            <div style={{ height: '250px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <OpenFreeMap
                onSelectCoords={setPinnedCoords}
                pinnedCoords={pinnedCoords}
                height="100%"
              />
            </div>

            {pinnedCoords ? (
              <div className="alert alert-success" style={{ padding: '10px 14px', fontSize: '0.82rem' }}>
                <CheckCircle size={15} />
                <span>
                  Pinned — Lat {pinnedCoords.lat.toFixed(5)}, Lng {pinnedCoords.lng.toFixed(5)}
                </span>
              </div>
            ) : (
              <div className="alert alert-info" style={{ padding: '10px 14px', fontSize: '0.82rem' }}>
                <Info size={15} />
                <span>No location pinned. Item will list without a map marker.</span>
              </div>
            )}
          </div>

          <button
            id="sell-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><span className="spinner spinner-sm" /> Publishing…</>
            ) : (
              'Publish Listing'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellProduct;
