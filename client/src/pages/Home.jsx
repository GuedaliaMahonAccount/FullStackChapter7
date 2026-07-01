import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { OpenFreeMap } from '../components/common/OpenFreeMap';
import { Search, MapPin, Layers, ShoppingCart, ArrowRight, TrendingUp } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl, formatPrice } from '../utils/format';

export const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState(null);

  // Sorting and Location states
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'priceAsc' | 'priceDesc' | 'distance'
  const [userCoords, setUserCoords] = useState(null);

  const { get } = useFetch();
  const { addToCart } = useCart();

  // Haversine Distance Calculation (in km)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  // Get user coordinates on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Could not retrieve user location:", error.message);
          // Fallback to Tel Aviv Center default coordinate
          setUserCoords({ lat: 32.0853, lng: 34.7818 });
        }
      );
    } else {
      setUserCoords({ lat: 32.0853, lng: 34.7818 });
    }
  }, []);

  // Fetch Frankfurter rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const result = await get('/currency/rates?from=ILS', { ttl: 60 * 60 * 1000 }); // 60 minutes cache
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
          const catRes = await get('/categories', { ttl: Infinity }); // Cached infinitely (until categories clear)
          if (catRes.success) setCategories(catRes.data);
        }

        let endpoint = '/products';
        const params = [];
        if (selectedCategory) params.push(`categoryId=${selectedCategory}`);
        if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
        if (params.length > 0) endpoint += `?${params.join('&')}`;

        const prodRes = await get(endpoint, { ttl: Infinity }); // Cached infinitely (invalidated on product CUD/order)
        if (prodRes.success) setProducts(prodRes.data);
      } catch (err) {
        console.error('Error fetching marketplace feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCategory, searchQuery]);



  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'priceAsc') {
      return parseFloat(a.price) - parseFloat(b.price);
    }
    if (sortBy === 'priceDesc') {
      return parseFloat(b.price) - parseFloat(a.price);
    }
    if (sortBy === 'distance' && userCoords) {
      const distA = a.latitude && a.longitude ? getDistance(userCoords.lat, userCoords.lng, parseFloat(a.latitude), parseFloat(a.longitude)) : Infinity;
      const distB = b.latitude && b.longitude ? getDistance(userCoords.lat, userCoords.lng, parseFloat(b.latitude), parseFloat(b.longitude)) : Infinity;
      return distA - distB;
    }
    return 0; // featured (default)
  });

  return (
    <div className="page-container home-page">

      {/* ── Hero ── */}
      <section className="hero-section animate-in">
        <div className="home-hero-content">
          <div className="home-hero-badge-row">
            <span className="badge badge-teal home-live-badge">
              <TrendingUp size={11} /> Live Marketplace
            </span>
          </div>

          <h1 className="home-hero-title">
            Discover items for sale{' '}
            <span className="text-gradient">right around&nbsp;you</span>
          </h1>

          <p className="home-hero-copy">
            GeoMarket is the local C2C marketplace — find deals nearby and list your items in seconds.
          </p>

          {/* Search bar */}
          <div className="home-search-row">
            <div className="home-search-field">
              <Search
                size={18}
                className="home-search-icon"
              />
              <input
                id="home-search-input"
                type="text"
                className="form-input home-search-input"
                placeholder="Search listings — e.g. iPhone, bicycle, textbook…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
      <div className="split-layout home-content-layout">

        {/* Left: Product Grid */}
        <div className="home-listings-column">
          <div className="section-header w-full">
            <h2 className="section-title home-section-title">
              <Layers size={18} className="home-section-title-icon-secondary" />
              Active Listings
              <span className="listing-count-badge">
                {products.length}
              </span>
            </h2>
            
            <div className="listings-sort-container">
              <span className="listings-sort-label">Sort by:</span>
              <select
                className="form-input listings-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                {userCoords && <option value="distance">Distance: Nearest</option>}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : products.length === 0 ? (
            <div className="glass-panel-static empty-state">
              <Layers size={44} className="empty-state-icon" />
              <p className="home-empty-text">No listings match your current filters.</p>
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
              {sortedProducts.map((product, i) => {
                const distance = product.latitude && product.longitude && userCoords
                  ? getDistance(userCoords.lat, userCoords.lng, parseFloat(product.latitude), parseFloat(product.longitude))
                  : null;

                return (
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
                      <div className="product-card-price-badge home-price-badge">
                        <div className="home-price-primary">{formatPrice(product.price, product.currency)}</div>
                        {product.currency !== 'ILS' && exchangeRates && exchangeRates.rates?.[product.currency] && (
                          <div className="home-price-converted">
                            ≈ {formatPrice(product.price / exchangeRates.rates[product.currency], 'ILS')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="product-card-body">
                      {/* Tags */}
                      <div className="home-card-tags">
                        <span className="badge badge-primary">{product.category?.name}</span>
                        {distance !== null ? (
                          <span className="badge badge-teal home-distance-badge">
                            <MapPin size={9} /> {distance.toFixed(1)} km away
                          </span>
                        ) : product.latitude ? (
                          <span className="badge badge-teal">
                            <MapPin size={9} /> Local
                          </span>
                        ) : null}

                        {product.stockQuantity <= 0 ? (
                          <span className="badge badge-error home-stock-badge">Out of Stock</span>
                        ) : (
                          <span className="badge badge-secondary home-stock-badge home-stock-badge-available">
                            {product.stockQuantity} in stock
                          </span>
                        )}
                      </div>

                      {(() => {
                        const reviews = product.reviews || [];
                        const reviewsCount = reviews.length;
                        const avgRating = reviewsCount > 0 
                          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
                          : 0;

                        return reviewsCount > 0 ? (
                          <div className="card-rating-badge">
                            <span>★</span>
                            <span className="home-rating-value">{avgRating}</span>
                            <span className="home-rating-count">({reviewsCount})</span>
                          </div>
                        ) : (
                          <div className="card-rating-empty">
                            No reviews yet
                          </div>
                        );
                      })()}

                    <h3 className="home-product-title">
                      {product.title}
                    </h3>

                    <p className="home-product-description">
                      {product.description}
                    </p>

                    {/* Footer */}
                    <div className="product-card-footer">
                      <span className="home-product-seller">
                        By {user && product.seller && user.id === product.seller.id ? 'Me' : product.seller?.fullName}
                      </span>

                      <div className="home-card-actions">
                        <button
                          onClick={() => {
                            if (!user) {
                              navigate('/login');
                            } else {
                              addToCart(product, 1);
                            }
                          }}
                          className="btn btn-secondary btn-icon"
                          title="Add to Cart"
                          disabled={product.stockQuantity === 0}
                        >
                          <ShoppingCart size={15} />
                        </button>
                         <Link
                          to={`/products/${product.id}`}
                          className="btn btn-primary btn-sm home-details-btn"
                        >
                          Details <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div className="home-map-column">
          <h2 className="section-title home-section-title">
            <MapPin size={18} className="home-section-title-icon-primary" />
            Geomapping Feed
          </h2>

          <div className="glass-panel-static home-map-panel">
            {!loading && <OpenFreeMap products={products} height="100%" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
