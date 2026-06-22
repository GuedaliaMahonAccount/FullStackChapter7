import React, { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { OpenFreeMap } from '../components/common/OpenFreeMap';
import { Search, MapPin, Layers, ShoppingCart, ArrowRight, TrendingUp } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl, formatPrice } from '../utils/format';

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState(null);

  const { get } = useFetch();
  const { addToCart } = useCart();

  // Fetch Frankfurter rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const result = await get('/currency/rates?from=ILS');
        if (result.success) {
          setExchangeRates(result.data);
        }
      } catch (err) {
        console.error('Error fetching Frankfurter exchange rates:', err);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (categories.length === 0) {
          const catRes = await get('/categories');
          if (catRes.success) setCategories(catRes.data);
        }

        let endpoint = '/products';
        const params = [];
        if (selectedCategory) params.push(`categoryId=${selectedCategory}`);
        if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
        if (params.length > 0) endpoint += `?${params.join('&')}`;

        const prodRes = await get(endpoint);
        if (prodRes.success) setProducts(prodRes.data);
      } catch (err) {
        console.error('Error fetching marketplace feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Hero ── */}
      <section className="hero-section animate-in">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>
              <TrendingUp size={11} /> Live Marketplace
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.7rem)', fontWeight: 900, lineHeight: 1.15 }}>
            Discover items for sale{' '}
            <span className="text-gradient">right around&nbsp;you</span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', maxWidth: '560px', fontSize: '1rem', lineHeight: 1.65 }}>
            GeoMarket is the local C2C marketplace — find deals nearby and list your items in seconds.
          </p>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: '10px', maxWidth: '620px', width: '100%', marginTop: '6px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={18}
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              />
              <input
                id="home-search-input"
                type="text"
                className="form-input"
                placeholder="Search listings — e.g. iPhone, bicycle, textbook…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '46px', height: '52px', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Chips ── */}
      <div className="category-chips">
        <button
          id="category-chip-all"
          onClick={() => setSelectedCategory(null)}
          className={`chip${selectedCategory === null ? ' active' : ''}`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            id={`category-chip-${cat.id}`}
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`chip${selectedCategory === cat.id ? ' active' : ''}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Split Layout ── */}
      <div className="split-layout" style={{ minHeight: '600px' }}>

        {/* Left: Product Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 className="section-title" style={{ fontSize: '1.1rem' }}>
            <Layers size={18} style={{ color: 'var(--secondary)' }} />
            Active Listings
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
              {products.length}
            </span>
          </h2>

          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : products.length === 0 ? (
            <div className="glass-panel-static empty-state">
              <Layers size={44} className="empty-state-icon" />
              <p style={{ color: 'var(--text-secondary)' }}>No listings match your current filters.</p>
              <button
                id="reset-filters-btn"
                onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                className="btn btn-secondary btn-sm"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid-cols-responsive">
              {products.map((product, i) => (
                <article
                  key={product.id}
                  className="product-card"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Image */}
                  <div className="product-card-img">
                    <img
                      src={getImageUrl(product.imageUrl)}
                      alt={product.title}
                    />
                    <div className="product-card-price-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', padding: '6px 10px', height: 'auto' }}>
                      <div style={{ fontWeight: 800 }}>{formatPrice(product.price, product.currency)}</div>
                      {product.currency !== 'ILS' && exchangeRates && exchangeRates.rates?.[product.currency] && (
                        <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 500 }}>
                          ≈ {formatPrice(product.price / exchangeRates.rates[product.currency], 'ILS')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="product-card-body">
                    {/* Tags */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{product.category?.name}</span>
                      {product.latitude && (
                        <span className="badge badge-teal">
                          <MapPin size={9} /> Local
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {product.title}
                    </h3>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                      {product.description}
                    </p>

                    {/* Footer */}
                    <div className="product-card-footer">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        By {product.seller?.fullName}
                      </span>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="btn btn-secondary btn-icon"
                          title="Add to Cart"
                          disabled={product.stockQuantity === 0}
                        >
                          <ShoppingCart size={15} />
                        </button>
                        <a
                          href={`/products/${product.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '7px 13px', fontSize: '0.8rem' }}
                        >
                          Details <ArrowRight size={13} />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 className="section-title" style={{ fontSize: '1.1rem' }}>
            <MapPin size={18} style={{ color: 'var(--primary)' }} />
            Geomapping Feed
          </h2>

          <div
            className="glass-panel-static"
            style={{ flex: 1, minHeight: '480px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 0 }}
          >
            {!loading && <OpenFreeMap products={products} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
