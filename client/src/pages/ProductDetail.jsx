import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFetch, cachedExternalFetch } from '../hooks/useFetch';
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
      const res = await get(`/reviews/product/${id}`, { ttl: Infinity }); // Cached infinitely (until reviews change)
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
        const result = await get(`/currency/convert?amount=${product.price}&from=${product.currency}&to=ILS`, { ttl: 60 * 60 * 1000 }); // 60 mins cache
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
        const result = await get(`/currency/convert?amount=${product.price}&from=${product.currency}&to=${customCurrency}`, { ttl: 60 * 60 * 1000 }); // 60 mins cache
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
      const data = await cachedExternalFetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(product.description)}&langpair=en|he`, { ttl: Infinity }); // Cached infinitely (translation never changes)
      if (data && data.responseData && data.responseData.translatedText) {
        setTranslatedDesc(data.responseData.translatedText);
        setShowTranslation(true);
      } else {
        alert('Could not translate text. Please try again.');
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
        const result = await get(`/products/${id}`, { ttl: Infinity }); // Cached infinitely (invalidated on CUD/order)
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
        const data = await cachedExternalFetch(`https://api.open-meteo.com/v1/forecast?latitude=${product.latitude}&longitude=${product.longitude}&current_weather=true`, { ttl: 60 * 60 * 1000 }); // 60 minutes weather cache
        if (data && data.current_weather) {
          setWeatherData(data.current_weather);
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

        const data = await cachedExternalFetch(
          `http://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${prodLng},${prodLat}?overview=false`,
          { signal: controller.signal, ttl: Infinity } // Cached infinitely (distance doesn't change)
        );

        if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setOsrmData({
            boxShadow: 'none', // dummy property to match structure or keep OSRM data mapping
            duration: route.duration, // seconds
            distance: route.distance  // meters
          });
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
          const data = await cachedExternalFetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${barcodeStr}&format=json&jscmd=data`, { ttl: Infinity }); // Cached infinitely
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
        } else if (catName === 'Food & Grocery') {
          const data = await cachedExternalFetch(`https://world.openfoodfacts.org/api/v2/product/${barcodeStr}.json`, { ttl: Infinity }); // Cached infinitely
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
        } else {
          const data = await cachedExternalFetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcodeStr}`, { ttl: Infinity }); // Cached infinitely
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
      <div className="loading-center product-detail-style-132" >
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="product-detail-style-131">
        <h2 className="product-detail-style-130">
          Product not found
        </h2>
        <p className="product-detail-style-129">
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
    <div className="page-container product-detail-style-128" >

      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm product-detail-style-127"
          
        >
          <ChevronLeft size={18} /> Back
        </button>
      </div>

      {/* Main Grid */}
      <div className="split-layout">

        {/* Left: Image + Description */}
        <div className="product-detail-style-126">

          {/* Image */}
          <div
            className="glass-panel-static product-detail-style-125"
            
          >
            <img
              src={getImageUrl(product.imageUrl)}
              alt={product.title}
              className="product-detail-style-124"
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
          </div>

          {/* Description */}
          <div className="glass-panel-static product-detail-style-123" >
            <div className="product-detail-style-122">
              <h2 className="product-detail-style-121">
                Product Description
              </h2>
              <button
                className="btn btn-ghost btn-sm product-detail-style-120"
                
                onClick={handleTranslateDescription}
                disabled={isTranslating}
              >
                <Languages size={15} />
                {isTranslating ? 'Translating...' : showTranslation ? 'Show Original' : 'Translate to Hebrew'}
              </button>
            </div>
            <p className="product-detail-style-119">
              {showTranslation ? translatedDesc : product.description}
            </p>
          </div>

          {/* Barcode Specifications Card */}
          {barcodeLoading && (
            <div className="glass-panel-static product-detail-style-118" >
              <div className="spinner spinner-sm product-detail-style-117"  />
              <span className="product-detail-style-116">Retrieving barcode specifications...</span>
            </div>
          )}

          {!barcodeLoading && barcodeData && (
            <div className="glass-panel-static animate-in product-detail-style-115" >
              
              <div className="product-detail-style-114">
                <h3 className="product-detail-style-113">
                  Barcode Metadata Specification
                </h3>
                <span className="badge badge-teal product-detail-style-112" >
                  {barcodeData.type === 'food' ? 'Open Food Facts' : barcodeData.type === 'book' ? 'Open Library' : 'UPCitemdb'}
                </span>
              </div>

              {barcodeData.type === 'food' && (
                <div className="product-detail-style-111">
                  <div className="product-detail-style-110">
                    {barcodeData.brand && (
                      <div className="product-detail-style-109">
                        <span className="product-detail-style-108">Brand</span>
                        <span className="product-detail-style-107">{barcodeData.brand}</span>
                      </div>
                    )}
                    {barcodeData.grade && (
                      <div className="product-detail-style-106">
                        <span className="product-detail-style-105">Nutri-Score</span>
                        <span className={`badge-nutri badge-nutri-${barcodeData.grade.toLowerCase()} product-detail-nutri-badge`}>
                          {barcodeData.grade}
                        </span>
                      </div>
                    )}
                  </div>

                  {barcodeData.allergens && barcodeData.allergens.length > 0 && (
                    <div>
                      <span className="product-detail-style-103">Declared Allergens</span>
                      <div className="product-detail-style-102">
                        {barcodeData.allergens.filter(Boolean).map((alg, index) => (
                          <span key={index} className="badge badge-error product-detail-style-101" >
                            ⚠️ {alg.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {barcodeData.ingredients && (
                    <div>
                      <span className="product-detail-style-100">Ingredients List</span>
                      <p className="product-detail-style-099">
                        {barcodeData.ingredients}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {barcodeData.type === 'book' && (
                <div className="product-detail-style-098">
                  {barcodeData.cover && (
                    <div className="product-detail-style-097">
                      <img src={barcodeData.cover} alt="Cover Preview" className="product-detail-style-096" />
                    </div>
                  )}
                  <div className="product-detail-style-095">
                    <div className="product-detail-style-094">
                      <div>
                        <span className="product-detail-style-093">Authors</span>
                        <span className="product-detail-style-092">{barcodeData.authors}</span>
                      </div>
                      <div>
                        <span className="product-detail-style-091">Publishers</span>
                        <span className="product-detail-style-090">{barcodeData.publishers}</span>
                      </div>
                      <div>
                        <span className="product-detail-style-089">Publication Date</span>
                        <span className="product-detail-style-088">{barcodeData.publishDate || 'N/A'}</span>
                      </div>
                      {barcodeData.pages && (
                        <div>
                          <span className="product-detail-style-087">Pages count</span>
                          <span className="product-detail-style-086">{barcodeData.pages}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {barcodeData.type === 'general' && (
                <div className="product-detail-style-085">
                  <div className="product-detail-style-084">
                    {barcodeData.brand && (
                      <div>
                        <span className="product-detail-style-083">Brand</span>
                        <span className="product-detail-style-082">{barcodeData.brand}</span>
                      </div>
                    )}
                    {barcodeData.model && (
                      <div>
                        <span className="product-detail-style-081">Model</span>
                        <span className="product-detail-style-080">{barcodeData.model}</span>
                      </div>
                    )}
                  </div>
                  {barcodeData.description && (
                    <div>
                      <span className="product-detail-style-079">Specification Details</span>
                      <p className="product-detail-style-078">
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
        <div className="product-detail-style-077">

          {/* Summary Card */}
          <div className="glass-panel-static product-detail-style-076" >

            {/* Category badge */}
            <div>
              <span className="badge badge-primary">{product.category?.name}</span>
            </div>

            <h1 className="product-detail-style-075">
              {product.title}
            </h1>

            {(reviewsData?.count || 0) > 0 ? (
              <div className="product-rating-summary">
                <span className="product-detail-style-074">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx} style={{ opacity: idx < Math.round(reviewsData?.average || 0) ? 1 : 0.25 }}>★</span>
                  ))}
                </span>
                <span className="product-detail-style-073">{reviewsData?.average || 0}</span>
                <span className="product-detail-style-072">({reviewsData?.count || 0} reviews)</span>
              </div>
            ) : (
              <div className="product-rating-summary-empty">
                No reviews yet
              </div>
            )}

            <div className="product-detail-style-071">
              <span className="product-detail-style-070">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.currency !== 'ILS' && (
                <span className="product-detail-style-069">
                  {isIlsConverting ? '(calculating...)' : ilsConvertedPrice ? `(≈ ${ilsConvertedPrice})` : ''}
                </span>
              )}
            </div>

            <div className="product-detail-style-068">
              <span className="product-detail-style-067">
                <Box size={15} />
                {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Interactive Currency Converter Panel */}
            <div className="product-detail-style-066">
              <span className="product-detail-style-065">
                <Globe size={13} className="product-detail-style-064" /> Currency Converter (Frankfurter)
              </span>
              <div className="product-detail-style-063">
                <select
                  className="form-input product-detail-style-062"
                  
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
                <div className="product-detail-style-061">
                  {isCustomConverting ? (
                    <span className="product-detail-style-060"><RefreshCw size={12} className="spinner product-detail-style-059"  /> Calculating...</span>
                  ) : customConvertedPrice ? (
                    <span className="text-gradient product-detail-style-058" >{customConvertedPrice}</span>
                  ) : (
                    <span className="product-detail-style-057">Select currency</span>
                  )}
                </div>
              </div>
            </div>

            <div className="divider product-detail-style-056"  />

          {(() => {
              const isOwnProduct = user && product.seller && user.id === product.seller.id;
              if (isOwnProduct) {
                return (
                  <div className="product-detail-style-055">
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
                    className="btn btn-lg btn-primary product-detail-style-054"
                    
                    disabled
                  >
                    <ShoppingCart size={18} /> Add to Cart
                  </button>
                );
              }

              return (
                <div className="product-detail-style-053">
                  {product.stockQuantity > 0 && (
                    <div className="product-detail-style-052">
                      <span className="product-detail-style-051">Quantity:</span>
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
                            className="btn btn-lg btn-secondary product-detail-style-050"
                            
                          >
                            Remove from Cart
                          </button>
                        );
                      }
                      return (
                        <button
                          className="btn btn-lg btn-primary product-detail-style-049"
                          
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
                          className={`btn btn-lg product-detail-cart-action-btn ${added ? 'btn-accent' : 'btn-primary'}`}
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
                        <div className="product-detail-style-047">
                          <button
                            className="btn btn-lg btn-secondary product-detail-style-046"
                            
                            onClick={() => {
                              removeFromCart(product.id);
                              setQty(1); // Reset local state
                            }}
                          >
                            Remove
                          </button>
                          <div
                            className="btn btn-lg btn-accent product-detail-style-045"
                            
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
                        className={`btn btn-lg product-detail-cart-action-btn ${added ? 'btn-accent' : 'btn-primary'}`}
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
              <p className="product-detail-style-043">
                This item is currently out of stock.
              </p>
            )}
          </div>

          {/* Seller Card */}
          <div
            className="glass-panel-static product-detail-style-042"
            
          >
            <div className="avatar avatar-lg">
              {product.seller?.fullName?.charAt(0)?.toUpperCase() || <User size={22} />}
            </div>
            <div className="product-detail-style-041">
              <p className="product-detail-style-040">
                Seller
              </p>
              <h3 className="product-detail-style-039">
                {user && product.seller && user.id === product.seller.id ? 'Me (אני)' : product.seller?.fullName}
              </h3>
              <p className="product-detail-style-038">
                {product.seller?.email}
              </p>
            </div>
          </div>

          {/* Weather Widget */}
          {hasLocation && (weatherData || weatherLoading) && (
            <div className="glass-panel-static weather-card">
              <h3 className="section-title weather-header product-detail-style-037" >
                <Globe size={14} className="product-detail-style-036" /> Pick-up Location Weather
              </h3>
              {weatherLoading ? (
                <div className="product-detail-style-035">
                  <span className="spinner spinner-sm" />
                </div>
              ) : (
                (() => {
                  const advice = getWeatherAdvice(weatherData.weathercode, weatherData.temperature);
                  return (
                    <div className="product-detail-style-034">
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
            <div className="product-detail-style-033">
              <h3 className="section-title product-detail-style-032" >
                <MapPin size={16} className="product-detail-style-031" />
                Sale Location
              </h3>
              {product.address && (
                <p className="product-detail-style-030">
                  <strong>Address:</strong> {product.address}
                </p>
              )}

              {/* OSRM Route Info / Fallback straight-line distance */}
              {hasLocation && (
                <div className="product-detail-style-029">
                  <span className="product-detail-style-028">Proximity:</span>
                  {osrmLoading ? (
                    <span className="product-detail-style-027"><span className="spinner spinner-xs product-detail-style-026"  /> Calculating route...</span>
                  ) : osrmData ? (
                    <span className="product-detail-style-025">
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
                        <span className="product-detail-style-024">
                          📍 {straightDist.toFixed(1)} km away (straight line)
                        </span>
                      );
                    })()
                  ) : (
                    <span className="product-detail-style-023">Location permission required for route calculation</span>
                  )}
                </div>
              )}
              <div
                className="glass-panel-static product-detail-style-022"
                
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
        <h3 className="section-title product-detail-style-021" >
          ⭐ Ratings & Reviews ({reviewsData?.count || 0})
        </h3>

        <div className="reviews-layout-grid">
          
          {/* Reviews List */}
          <div className="reviews-list-column">
            {(!reviewsData?.reviews || reviewsData.reviews.length === 0) ? (
              <div className="glass-panel-static product-detail-style-020" >
                No reviews yet for this product. Be the first to review!
              </div>
            ) : (
              <div className="product-detail-style-019">
                {(reviewsData?.reviews || []).map((rev) => (
                  <div 
                    key={rev.id} 
                    className="glass-panel-static review-item-card"
                  >
                    <div className="product-detail-style-018">
                      <div className="product-detail-style-017">
                        <span className="product-detail-style-016">
                          {rev.buyer?.fullName || 'Anonymous'}
                        </span>
                        <span className="product-detail-style-015">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <span key={idx} style={{ opacity: idx < rev.rating ? 1 : 0.2 }}>★</span>
                          ))}
                        </span>
                      </div>
                      <span className="product-detail-style-014">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {rev.comment && (
                      <p className="product-detail-style-013">
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
              user.id === product?.sellerId ? (
                <div className="glass-panel-static product-detail-style-003" >
                  <p className="product-detail-style-002">You cannot review your own product.</p>
                </div>
              ) : (() => {
                const alreadyReviewed = (reviewsData?.reviews || []).some(r => r.buyerId === user.id || r.buyer_id === user.id);
                return (
                  <div className="glass-panel-static product-detail-style-012" >
                    <div className="product-detail-style-011">
                      <h4 className="product-detail-style-010">
                        {alreadyReviewed ? 'Edit Your Review' : 'Leave a Review'}
                      </h4>
                      {alreadyReviewed && (
                        <span className="badge badge-success product-detail-style-009" >
                          ✓ Reviewed
                        </span>
                      )}
                    </div>
                    
                    {reviewError && (
                      <div className="alert alert-error product-detail-style-008" >
                        <span>{reviewError}</span>
                      </div>
                    )}

                    <form onSubmit={handleReviewSubmit} className="product-detail-style-007">
                      <div className="form-group product-detail-style-006" >
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

                      <div className="form-group product-detail-style-005" >
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
                        className="btn btn-primary product-detail-style-004"
                        
                        disabled={isSubmittingReview}
                      >
                        {isSubmittingReview ? 'Submitting...' : alreadyReviewed ? 'Update Review' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                );
              })()
            ) : (
              <div className="glass-panel-static product-detail-style-003" >
                <p className="product-detail-style-002">Please <Link to="/login" className="product-detail-style-001">log in</Link> to share your review and rate this product.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
