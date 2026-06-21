import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { useCart } from '../context/CartContext';
import { OpenFreeMap } from '../components/common/OpenFreeMap';
import { ShoppingCart, User, ChevronLeft, MapPin, Box, CheckCircle } from 'lucide-react';

export const ProductDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [added, setAdded]       = useState(false);

  const { get }      = useFetch();
  const { addToCart } = useCart();

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
              src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.imageUrl}`}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
          </div>

          {/* Description */}
          <div className="glass-panel-static" style={{ padding: '28px', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Product Description
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {product.description}
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

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--secondary)', fontFamily: 'var(--font-heading)' }}>
                ${parseFloat(product.price).toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Box size={15} />
                {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
              </span>
            </div>

            <div className="divider" style={{ margin: '4px 0' }} />

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
