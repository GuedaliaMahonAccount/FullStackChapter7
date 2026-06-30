import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { OpenFreeMap } from '../components/common/OpenFreeMap';
import { ShoppingCart, User, ChevronLeft, MapPin, Box, CheckCircle, Lock, Globe, Languages, RefreshCw, Plus, Minus } from 'lucide-react';
import { getImageUrl, formatPrice } from '../utils/format';

export const ProductDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [added, setAdded]       = useState(false);
  const [qty, setQty]           = useState(1);

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

  // Weather states
  const [weatherData, setWeatherData]             = useState(null);
  const [weatherLoading, setWeatherLoading]       = useState(false);

  // OSRM & Location states
  const [userCoords, setUserCoords]               = useState(null);
  const [osrmData, setOsrmData]                   = useState(null);
  const [osrmLoading, setOsrmLoading]             = useState(false);

  // Reviews states
  const [reviewsData, setReviewsData] = useState({ reviews: [], count: 0, average: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Barcode specifications states
  const [barcodeData, setBarcodeData]             = useState(null);
  const [barcodeLoading, setBarcodeLoading]       = useState(false);

  const { get, post }      = useFetch();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { user }     = useAuth();

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await get(`/reviews/product/${id}`);
      if (res.success) {
        setReviewsData(res.data);
      }
    } catch (err) {
      console.error('Error fetching product reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    setReviewError('');
    try {
      const res = await post('/reviews', { rating, comment, productId: id });
      if (res.success) {
        setComment('');
        setRating(5);
        fetchReviews(); // Reload reviews list
      }
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(product.description)}&langpair=en|he`);
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
    fetchReviews();
  }, [id]);

  // Sync local qty state with cart quantity on load
  useEffect(() => {
    if (product) {
      const itemInCart = cart.find(item => item.id === product.id);
      setQty(itemInCart ? itemInCart.quantity : 1);
    }
  }, [product, cart.length]);

  // Pre-fill user review details if they already submitted one
  useEffect(() => {
    if (user && reviewsData?.reviews) {
      const myReview = reviewsData.reviews.find(r => r.buyerId === user.id || r.buyer_id === user.id);
      if (myReview) {
        setRating(myReview.rating);
        setComment(myReview.comment || '');
      }
    }
  }, [reviewsData, user]);

  // Fetch weather data from Open-Meteo on product load
  useEffect(() => {
    if (!product || !product.latitude || !product.longitude) return;
    
    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${product.latitude}&longitude=${product.longitude}&current_weather=true`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.current_weather) {
            setWeatherData(data.current_weather);
          }
        }
      } catch (err) {
        console.error('Error fetching weather:', err);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [product]);

  const getWeatherAdvice = (code, temp) => {
    let condition = 'Clear Sky ☀️';
    let advice = 'Weather is perfect for picking up your item!';
    let type = 'pleasant';
    
    if (code >= 51 && code <= 67) {
      condition = 'Rainy 🌧️';
      advice = 'It is raining outside! Drive safely and remember your umbrella.';
      type = 'rainy';
    } else if (code >= 80 && code <= 82) {
      condition = 'Rain Showers 🌦️';
      advice = 'Showers detected. You might want to grab a coat and leave umbrellas outside!';
      type = 'rainy';
    } else if (code >= 95 && code <= 99) {
      condition = 'Thunderstorm ⛈️';
      advice = 'Thunderstorms in area! We recommend contacting the seller to reschedule pick-up.';
      type = 'stormy';
    } else if (code >= 71 && code <= 77) {
      condition = 'Snowy ❄️';
      advice = 'Snowing! Dress very warmly and check road conditions.';
      type = 'snowy';
    } else if (code >= 1 && code <= 3) {
      condition = 'Partly Cloudy ⛅';
    } else if (code >= 45 && code <= 48) {
      condition = 'Foggy 🌫️';
      advice = 'Low visibility due to fog. Drive carefully when picking up.';
      type = 'foggy';
    }

    if (type === 'pleasant') {
      if (temp > 30) {
        advice = 'It is very hot outside! Stay hydrated during pick-up.';
      } else if (temp < 13) {
        advice = 'It is chilly outside. Remember to wear a warm jacket/coat!';
      }
    }

    return { condition, advice, type };
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
          console.warn("Could not retrieve user location for details:", error.message);
          // Fallback to Tel Aviv Center default coordinate
          setUserCoords({ lat: 32.0853, lng: 34.7818 });
        }
      );
    } else {
      setUserCoords({ lat: 32.0853, lng: 34.7818 });
    }
  }, []);

  // Fetch OSRM routing data with timeout abort controller
  useEffect(() => {
    if (!product || !product.latitude || !product.longitude || !userCoords) return;

    const fetchRouting = async () => {
      setOsrmLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout

      try {
        const prodLat = parseFloat(product.latitude);
        const prodLng = parseFloat(product.longitude);
        const userLat = parseFloat(userCoords.lat);
        const userLng = parseFloat(userCoords.lng);

        const response = await fetch(
          `http://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${prodLng},${prodLat}?overview=false`,
          { signal: controller.signal }
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            setOsrmData({
              duration: route.duration, // seconds
              distance: route.distance  // meters
            });
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn("OSRM routing request timed out after 2 seconds.");
        } else {
          console.error("Error fetching OSRM routing:", err);
        }
      } finally {
        clearTimeout(timeoutId);
        setOsrmLoading(false);
      }
    };

    fetchRouting();
  }, [product, userCoords]);

  // Fetch barcode specs on load
  useEffect(() => {
    if (!product || !product.barcode) {
      setBarcodeData(null);
      return;
    }

    const fetchBarcodeSpecs = async () => {
      setBarcodeLoading(true);
      try {
        const catName = product.category?.name || '';
        const barcodeStr = product.barcode.trim();

        if (catName === 'Books & Education') {
          const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${barcodeStr}&format=json&jscmd=data`);
          if (response.ok) {
            const data = await response.json();
            const key = `ISBN:${barcodeStr}`;
            if (data && data[key]) {
              setBarcodeData({
                type: 'book',
                title: data[key].title,
                authors: data[key].authors?.map(a => a.name).join(', ') || 'Unknown',
                publishers: data[key].publishers?.map(p => p.name).join(', ') || 'Unknown',
                publishDate: data[key].publish_date,
                pages: data[key].pagination,
                cover: data[key].cover?.medium
              });
            }
          }
        } else if (catName === 'Food & Grocery') {
          const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcodeStr}.json`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.status === 1 && data.product) {
              const p = data.product;
              setBarcodeData({
                type: 'food',
                brand: p.brands,
                grade: p.nutrition_grades?.toUpperCase(),
                allergens: p.allergens ? p.allergens.replace(/en:/g, '').split(',') : [],
                ingredients: p.ingredients_text,
                image: p.image_url || p.image_front_url
              });
            }
          }
        } else {
          const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcodeStr}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.items && data.items.length > 0) {
              const item = data.items[0];
              setBarcodeData({
                type: 'general',
                brand: item.brand,
                model: item.model,
                description: item.description,
                specs: item.specifications
              });
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch specs details:', err);
      } finally {
        setBarcodeLoading(false);
      }
    };

    fetchBarcodeSpecs();
  }, [product]);

  // Haversine Distance Calculation (in km)
  const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
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

          {/* Barcode Specifications Card */}
          {barcodeLoading && (
            <div className="glass-panel-static" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="spinner spinner-sm" style={{ marginRight: '8px' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Retrieving barcode specifications...</span>
            </div>
          )}

          {!barcodeLoading && barcodeData && (
            <div className="glass-panel-static animate-in" style={{ padding: '28px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Barcode Metadata Specification
                </h3>
                <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>
                  {barcodeData.type === 'food' ? 'Open Food Facts' : barcodeData.type === 'book' ? 'Open Library' : 'UPCitemdb'}
                </span>
              </div>

              {barcodeData.type === 'food' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {barcodeData.brand && (
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Brand</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{barcodeData.brand}</span>
                      </div>
                    )}
                    {barcodeData.grade && (
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Nutri-Score</span>
                        <span className={`badge-nutri badge-nutri-${barcodeData.grade.toLowerCase()}`} style={{ display: 'inline-block', fontWeight: 950, padding: '4px 12px', borderRadius: '4px', fontSize: '1.05rem', color: '#fff' }}>
                          {barcodeData.grade}
                        </span>
                      </div>
                    )}
                  </div>

                  {barcodeData.allergens && barcodeData.allergens.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Declared Allergens</span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {barcodeData.allergens.filter(Boolean).map((alg, index) => (
                          <span key={index} className="badge badge-error" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                            ⚠️ {alg.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {barcodeData.ingredients && (
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Ingredients List</span>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                        {barcodeData.ingredients}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {barcodeData.type === 'book' && (
                <div style={{ display: 'flex', gap: '20px', alignItems: 'start', flexWrap: 'wrap' }}>
                  {barcodeData.cover && (
                    <div style={{ width: '100px', height: '140px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                      <img src={barcodeData.cover} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Authors</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{barcodeData.authors}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Publishers</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{barcodeData.publishers}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Publication Date</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{barcodeData.publishDate || 'N/A'}</span>
                      </div>
                      {barcodeData.pages && (
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Pages count</span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{barcodeData.pages}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {barcodeData.type === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {barcodeData.brand && (
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Brand</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{barcodeData.brand}</span>
                      </div>
                    )}
                    {barcodeData.model && (
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Model</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{barcodeData.model}</span>
                      </div>
                    )}
                  </div>
                  {barcodeData.description && (
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Specification Details</span>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {barcodeData.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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

            {(reviewsData?.count || 0) > 0 ? (
              <div className="product-rating-summary">
                <span style={{ color: '#fbbf24', display: 'flex', gap: '2px', fontSize: '1rem' }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx} style={{ opacity: idx < Math.round(reviewsData?.average || 0) ? 1 : 0.25 }}>★</span>
                  ))}
                </span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{reviewsData?.average || 0}</span>
                <span style={{ color: 'var(--text-muted)' }}>({reviewsData?.count || 0} reviews)</span>
              </div>
            ) : (
              <div className="product-rating-summary-empty">
                No reviews yet
              </div>
            )}

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
              const cartItem = cart.find(item => item.id === product.id);
              const currentQty = cartItem ? cartItem.quantity : 0;

              if (product.stockQuantity <= 0) {
                return (
                  <button
                    className="btn btn-lg btn-primary"
                    style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
                    disabled
                  >
                    <ShoppingCart size={18} /> Add to Cart
                  </button>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {product.stockQuantity > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Quantity:</span>
                      <div className="qty-control">
                        <button 
                          className="qty-btn" 
                          onClick={() => setQty(prev => Math.max(0, prev - 1))}
                          disabled={qty <= 0}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="qty-value">{qty}</span>
                        <button 
                          className="qty-btn" 
                          onClick={() => setQty(prev => Math.min(product.stockQuantity, prev + 1))}
                          disabled={qty >= product.stockQuantity}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  {(() => {
                    if (qty === 0) {
                      if (currentQty > 0) {
                        return (
                          <button
                            onClick={() => {
                              removeFromCart(product.id);
                              setQty(1); // Reset local state
                            }}
                            className="btn btn-lg btn-secondary"
                            style={{ width: '100%', borderRadius: 'var(--radius-sm)', color: 'var(--status-cancelled)' }}
                          >
                            Remove from Cart
                          </button>
                        );
                      }
                      return (
                        <button
                          className="btn btn-lg btn-primary"
                          style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
                          disabled
                        >
                          Add to Cart
                        </button>
                      );
                    }

                    if (currentQty === 0) {
                      return (
                        <button
                          id="product-add-to-cart-btn"
                          onClick={() => {
                            addToCart(product, qty);
                            setAdded(true);
                            setTimeout(() => setAdded(false), 2200);
                          }}
                          className={`btn btn-lg ${added ? 'btn-accent' : 'btn-primary'}`}
                          style={{ width: '100%', borderRadius: 'var(--radius-sm)', transition: 'all 0.3s ease' }}
                        >
                          {added ? (
                            <><CheckCircle size={18} /> Added to Cart!</>
                          ) : (
                            <><ShoppingCart size={18} /> Add to Cart</>
                          )}
                        </button>
                      );
                    }

                    // If already in cart
                    if (qty === currentQty) {
                      return (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            className="btn btn-lg btn-secondary"
                            style={{ flex: 1, borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--status-cancelled)', padding: '10px 4px' }}
                            onClick={() => {
                              removeFromCart(product.id);
                              setQty(1); // Reset local state
                            }}
                          >
                            Remove
                          </button>
                          <div
                            className="btn btn-lg btn-accent"
                            style={{ flex: 1.2, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'default', pointerEvents: 'none' }}
                          >
                            <CheckCircle size={16} /> Added ({currentQty})
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        onClick={() => {
                          updateQuantity(product.id, qty);
                          setAdded(true);
                          setTimeout(() => setAdded(false), 2200);
                        }}
                        className={`btn btn-lg ${added ? 'btn-accent' : 'btn-primary'}`}
                        style={{ width: '100%', borderRadius: 'var(--radius-sm)', transition: 'all 0.3s ease' }}
                      >
                        {added ? (
                          <><CheckCircle size={18} /> Cart Updated!</>
                        ) : (
                          <>Update Cart Quantity</>
                        )}
                      </button>
                    );
                  })()}
                </div>
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
                {user && product.seller && user.id === product.seller.id ? 'Me (אני)' : product.seller?.fullName}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.seller?.email}
              </p>
            </div>
          </div>

          {/* Weather Widget */}
          {hasLocation && (weatherData || weatherLoading) && (
            <div className="glass-panel-static weather-card">
              <h3 className="section-title weather-header" style={{ margin: 0 }}>
                <Globe size={14} style={{ color: 'var(--primary-light)' }} /> Pick-up Location Weather
              </h3>
              {weatherLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                  <span className="spinner spinner-sm" />
                </div>
              ) : (
                (() => {
                  const advice = getWeatherAdvice(weatherData.weathercode, weatherData.temperature);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      <div className="weather-info-row">
                        <span className="weather-condition">{advice.condition}</span>
                        <span className="weather-temp">{weatherData.temperature}°C</span>
                      </div>
                      <p className="weather-advice-text">
                        {advice.advice}
                      </p>
                    </div>
                  );
                })()
              )}
            </div>
          )}

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

              {/* OSRM Route Info / Fallback straight-line distance */}
              {hasLocation && (
                <div style={{ fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginTop: '-4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Proximity:</span>
                  {osrmLoading ? (
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><span className="spinner spinner-xs" style={{ width: '10px', height: '10px' }} /> Calculating route...</span>
                  ) : osrmData ? (
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      🚗 {Math.round(osrmData.duration / 60)} min drive ({(osrmData.distance / 1000).toFixed(1)} km by road)
                    </span>
                  ) : userCoords ? (
                    (() => {
                      const straightDist = getHaversineDistance(
                        parseFloat(userCoords.lat),
                        parseFloat(userCoords.lng),
                        parseFloat(product.latitude),
                        parseFloat(product.longitude)
                      );
                      return (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          📍 {straightDist.toFixed(1)} km away (straight line)
                        </span>
                      );
                    })()
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Location permission required for route calculation</span>
                  )}
                </div>
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

      {/* Reviews & Ratings Section */}
      <div className="divider reviews-section-divider" />
      
      <div className="reviews-section-container">
        <h3 className="section-title" style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⭐ Ratings & Reviews ({reviewsData?.count || 0})
        </h3>

        <div className="reviews-layout-grid">
          
          {/* Reviews List */}
          <div className="reviews-list-column">
            {(!reviewsData?.reviews || reviewsData.reviews.length === 0) ? (
              <div className="glass-panel-static" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                No reviews yet for this product. Be the first to review!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(reviewsData?.reviews || []).map((rev) => (
                  <div 
                    key={rev.id} 
                    className="glass-panel-static review-item-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                          {rev.buyer?.fullName || 'Anonymous'}
                        </span>
                        <span style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <span key={idx} style={{ opacity: idx < rev.rating ? 1 : 0.2 }}>★</span>
                          ))}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {rev.comment && (
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {rev.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Write a Review Form */}
          <div className="reviews-form-column">
            {user ? (
              (() => {
                const alreadyReviewed = (reviewsData?.reviews || []).some(r => r.buyerId === user.id || r.buyer_id === user.id);
                return (
                  <div className="glass-panel-static" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                        {alreadyReviewed ? 'Edit Your Review' : 'Leave a Review'}
                      </h4>
                      {alreadyReviewed && (
                        <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          ✓ Reviewed
                        </span>
                      )}
                    </div>
                    
                    {reviewError && (
                      <div className="alert alert-error" style={{ padding: '8px 12px', fontSize: '0.78rem' }}>
                        <span>{reviewError}</span>
                      </div>
                    )}

                    <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Rating</label>
                        <div className="review-stars-interactive">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span 
                              key={star} 
                              onClick={() => setRating(star)}
                              style={{ opacity: star <= rating ? 1 : 0.25 }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="review-comment-textarea">Comments</label>
                        <textarea
                          id="review-comment-textarea"
                          className="form-input"
                          rows={3}
                          placeholder="What did you think of the item? Write your review here..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                        disabled={isSubmittingReview}
                      >
                        {isSubmittingReview ? 'Submitting...' : alreadyReviewed ? 'Update Review' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                );
              })()
            ) : (
              <div className="glass-panel-static" style={{ padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '0.85rem' }}>Please <a href="/login" style={{ color: 'var(--primary-light)', textDecoration: 'underline', fontWeight: 600 }}>log in</a> to share your review and rate this product.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
