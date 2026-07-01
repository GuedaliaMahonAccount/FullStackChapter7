import React, { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { OpenFreeMap } from '../common/OpenFreeMap';
import { X, Tag, Info, CheckCircle, Pencil, MapPin, Search, Upload } from 'lucide-react';
import { getImageUrl } from '../../utils/format';

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

  // Barcode integration states
  const [isBarcodeLoading, setIsBarcodeLoading]       = useState(false);
  const [barcodeStatus, setBarcodeStatus]             = useState('');
  const [showBarcodeSearch, setShowBarcodeSearch]     = useState(false);
  const [barcodeSearchQuery, setBarcodeSearchQuery]   = useState('');
  const [isBarcodeSearching, setIsBarcodeSearching]   = useState(false);
  const [barcodeSearchResults, setBarcodeSearchResults] = useState([]);

  // Pexels/Image upload integration states
  const [imageSource, setImageSource]                 = useState('file'); // 'file' | 'pexels'
  const [imageFile, setImageFile]                     = useState(null);
  const [imagePreview, setImagePreview]               = useState(null);
  const [dragOver, setDragOver]                       = useState(false);
  const [pexelsQuery, setPexelsQuery]                 = useState('');
  const [pexelsResults, setPexResults]                = useState([]);
  const [isPexelsLoading, setIsPexelsLoading]         = useState(false);
  const [selectedPexelsUrl, setSelectedPexelsUrl]     = useState('');
  const [pexelsApiKey, setPexelsApiKey]               = useState(localStorage.getItem('pexels_api_key') || '');

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
    
    // Set initial image preview
    if (product.imageUrl) {
      setImagePreview(getImageUrl(product.imageUrl));
      setSelectedPexelsUrl(product.imageUrl.startsWith('http') ? product.imageUrl : '');
    } else {
      setImagePreview(null);
      setSelectedPexelsUrl('');
    }
    setImageSource('file');
    setImageFile(null);
    setPexelsQuery('');
    setPexResults([]);

    setBarcodeStatus('');
    setShowBarcodeSearch(false);
    setBarcodeSearchQuery('');
    setBarcodeSearchResults([]);

    setErrorMsg('');
    setSuccessMsg('');
  }, [isOpen, product]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCats = async () => {
      try {
        const res = await get('/categories', { ttl: Infinity }); // Cached infinitely
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

  // Barcode Autofill Logic
  const handleBarcodeAutofill = async () => {
    if (!barcode.trim()) {
      setErrorMsg('Please enter a barcode (EAN/UPC) first.');
      return;
    }

    setIsBarcodeLoading(true);
    setBarcodeStatus('');
    setErrorMsg('');

    const activeCat = categories.find(c => c.id === categoryId);
    const categoryName = activeCat ? activeCat.name : '';

    try {
      if (categoryName === 'Books & Education') {
        const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${barcode.trim()}&format=json&jscmd=data`);
        if (!response.ok) throw new Error('Failed to query Open Library API.');
        
        const data = await response.json();
        const bookKey = `ISBN:${barcode.trim()}`;
        
        if (data && data[bookKey]) {
          const book = data[bookKey];
          setTitle(book.title || '');
          
          const authors = book.authors?.map(a => a.name).join(', ') || 'Unknown Author';
          const publishers = book.publishers?.map(p => p.name).join(', ') || 'Unknown Publisher';
          const pubDate = book.publish_date || 'Unknown Date';
          const pages = book.pagination ? `${book.pagination} pages` : '';
          
          setDescription(`Title: ${book.title || ''}\nAuthors: ${authors}\nPublisher: ${publishers} (${pubDate})\n${pages ? 'Details: ' + pages : ''}`);
          
          if (book.cover?.large || book.cover?.medium) {
            setImageSource('pexels');
            const imgUrl = book.cover.large || book.cover.medium;
            setSelectedPexelsUrl(imgUrl);
            setImagePreview(imgUrl);
          }
          setBarcodeStatus('success');
        } else {
          throw new Error('Book not found in Open Library database.');
        }
      } else if (categoryName === 'Food & Grocery') {
        const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode.trim()}.json`);
        if (!response.ok) throw new Error('Failed to query Open Food Facts API.');
        
        const data = await response.json();
        if (data && data.status === 1 && data.product) {
          const p = data.product;
          setTitle(p.product_name || p.product_name_he || p.product_name_en || '');
          
          const brand = p.brands || 'Unknown Brand';
          const ingredients = p.ingredients_text || 'No ingredients text found';
          const allergens = p.allergens ? p.allergens.replace(/en:/g, '') : 'None declared';
          
          setDescription(`Product Name: ${p.product_name || ''}\nBrand: ${brand}\nIngredients: ${ingredients}\nAllergens: ${allergens}`);
          
          const imgUrl = p.image_url || p.image_front_url || p.image_front_small_url;
          if (imgUrl) {
            setImageSource('pexels');
            setSelectedPexelsUrl(imgUrl);
            setImagePreview(imgUrl);
          }
          setBarcodeStatus('success');
        } else {
          throw new Error('Food product not found in Open Food Facts database.');
        }
      } else {
        const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode.trim()}`);
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('UPCitemdb API rate limit reached (100 queries/day). Please enter details manually.');
          }
          throw new Error('Failed to query general barcode database.');
        }
        
        const data = await response.json();
        if (data && data.items && data.items.length > 0) {
          const item = data.items[0];
          setTitle(item.title || '');
          
          const brand = item.brand || '';
          const model = item.model || '';
          const desc = item.description || '';
          
          setDescription(`Brand: ${brand}\nModel: ${model}\nDescription: ${desc}`);
          
          if (item.images && item.images.length > 0) {
            setImageSource('pexels');
            setSelectedPexelsUrl(item.images[0]);
            setImagePreview(item.images[0]);
          }
          setBarcodeStatus('success');
        } else {
          throw new Error('Product not found in general barcode database.');
        }
      }
    } catch (err) {
      console.warn('Barcode lookup failed:', err.message);
      setErrorMsg(err.message || 'Failed to fetch details for this barcode.');
      setBarcodeStatus('error');
    } finally {
      setIsBarcodeLoading(false);
    }
  };

  // Search Barcode by Product Name
  const handleSearchBarcodeByName = async () => {
    if (!barcodeSearchQuery.trim()) return;
    setIsBarcodeSearching(true);
    setErrorMsg('');
    setBarcodeSearchResults([]);

    const activeCat = categories.find(c => c.id === categoryId);
    const categoryName = activeCat ? activeCat.name : '';

    try {
      if (categoryName === 'Books & Education') {
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(barcodeSearchQuery)}&fields=title,author_name,isbn&limit=15`);
        if (!response.ok) throw new Error('Search failed on Open Library.');
        const data = await response.json();
        
        if (data && data.docs) {
          const results = data.docs
            .filter(doc => doc.isbn && doc.isbn.length > 0)
            .map(doc => ({
              title: doc.title,
              subtext: doc.author_name ? `By ${doc.author_name.join(', ')}` : 'Unknown Author',
              barcode: doc.isbn[0],
              source: 'Open Library Books'
            }));
          setBarcodeSearchResults(results);
          if (results.length === 0) setErrorMsg('No books with valid ISBN found. Try refining search.');
        }
      } else {
        const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(barcodeSearchQuery)}&search_simple=1&action=process&json=1&page_size=20`);
        if (!response.ok) throw new Error('Search failed on Open Food Facts.');
        const data = await response.json();
        
        if (data && data.products) {
          const results = data.products
            .filter(p => p.code)
            .map(p => ({
              title: p.product_name || 'Generic Item',
              subtext: p.brands ? `Brand: ${p.brands}` : 'Generic Brand',
              barcode: p.code,
              source: 'Product Catalog'
            }));
          setBarcodeSearchResults(results);
          if (results.length === 0) setErrorMsg('No products with barcodes found.');
        } else {
          setErrorMsg('No results found.');
        }
      }
    } catch (err) {
      console.warn('Barcode catalog search failed:', err);
      setErrorMsg(err.message || 'Failed to search catalog.');
    } finally {
      setIsBarcodeSearching(false);
    }
  };

  // Image Upload / Drag and Drop handlers
  const handleImageChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setSelectedPexelsUrl('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageChange(file);
  };

  // Pexels Search
  const searchPexelsImages = async (query) => {
    if (!query) return;
    setIsPexelsLoading(true);
    setErrorMsg('');

    if (pexelsApiKey) {
      try {
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=9`, {
          headers: { Authorization: pexelsApiKey }
        });
        if (!res.ok) throw new Error(`Pexels API error: status ${res.status}`);
        const data = await res.json();
        if (data && data.photos) {
          setPexResults(data.photos);
        }
      } catch (err) {
        console.error('Error searching Pexels directly:', err);
        setErrorMsg('Failed to search Pexels. Please verify API key.');
      } finally {
        setIsPexelsLoading(false);
      }
    } else {
      try {
        const res = await get(`/products/pexels-search?query=${encodeURIComponent(query)}`);
        if (res.success && res.data && res.data.photos) {
          setPexResults(res.data.photos);
        } else {
          const fallbackQuery = 'marketplace';
          const fallbackRes = await fetch(`https://images.pexels.com/photos/15252515/pexels-photo-15252515.jpeg?auto=compress&cs=tinysrgb&h=150&w=150`);
          const fallbackResults = [{
            id: 15252515,
            photographer: 'Pexels Default',
            src: {
              medium: 'https://images.pexels.com/photos/15252515/pexels-photo-15252515.jpeg?auto=compress&cs=tinysrgb&h=150&w=150',
              large: 'https://images.pexels.com/photos/15252515/pexels-photo-15252515.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
            }
          }];
          setPexResults(fallbackResults);
        }
      } catch (err) {
        console.error('Error searching Pexels via proxy:', err);
        setErrorMsg('Failed to search Pexels via server.');
      } finally {
        setIsPexelsLoading(false);
      }
    }
  };

  const handleSavePexelsKey = (key) => {
    setPexelsApiKey(key);
    localStorage.setItem('pexels_api_key', key);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('categoryId', categoryId);
      formData.append('stockQuantity', stockQuantity);
      formData.append('currency', currency);
      
      if (address) {
        formData.append('address', address);
      }
      if (barcode) {
        formData.append('barcode', barcode);
      }

      if (imageSource === 'file') {
        if (imageFile) {
          formData.append('image', imageFile);
        } else {
          // Keep original image URL if no new upload
          formData.append('imageUrl', product.imageUrl);
        }
      } else if (imageSource === 'pexels' && selectedPexelsUrl) {
        formData.append('imageUrl', selectedPexelsUrl);
      } else {
        formData.append('imageUrl', product.imageUrl);
      }

      if (pinnedCoords) {
        formData.append('latitude', pinnedCoords.lat);
        formData.append('longitude', pinnedCoords.lng);
      }

      const res = await put(`/products/${product.id}`, formData);
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
      <div className="modal-panel">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="edit-product-modal-gemini-style-064">
          <h2 className="text-gradient edit-product-modal-gemini-style-063">Edit Listing</h2>
          <p className="edit-product-modal-gemini-style-062">Update product details, pricing, location or catalog barcodes.</p>
        </div>

        {errorMsg && (
          <div className="alert alert-error animate-in">
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success animate-in">
            <CheckCircle size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="split-layout edit-product-modal-gemini-style-061" >
          
          {/* Left Side: Product Fields */}
          <div className="edit-product-modal-gemini-style-060">
            <div className="edit-product-modal-gemini-style-059">
              <h3 className="edit-product-modal-gemini-style-058">
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
            <div className="edit-product-modal-gemini-style-057">
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

            {/* Barcode input & Autofill */}
            <div className="form-group">
              <label className="form-label flex justify-between items-center" htmlFor="edit-product-barcode">
                <span>Barcode (EAN/UPC)</span>
                <span className="edit-product-modal-gemini-style-056">Autofills fields</span>
              </label>
              <div className="edit-product-modal-gemini-style-055">
                <input
                  id="edit-product-barcode"
                  type="text"
                  className="form-input edit-product-modal-gemini-style-054"
                  
                  placeholder="e.g. 3017300045601"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleBarcodeAutofill}
                  disabled={isBarcodeLoading || !barcode.trim()}
                  className="btn btn-secondary btn-sm edit-product-modal-gemini-style-053"
                  
                >
                  {isBarcodeLoading ? 'Searching...' : 'Autofill'}
                </button>
              </div>

              {/* Status messages */}
              <div className="edit-product-modal-gemini-style-052">
                <div>
                  {barcodeStatus === 'success' && (
                    <span className="edit-product-modal-gemini-style-051">✓ Metadata auto-populated successfully!</span>
                  )}
                  {barcodeStatus === 'error' && (
                    <span className="edit-product-modal-gemini-style-050">✗ Failed to autofill barcode</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowBarcodeSearch(!showBarcodeSearch)}
                  className="edit-product-modal-gemini-style-049"
                >
                  {showBarcodeSearch ? 'Close Search Panel' : 'Search barcode by name'}
                </button>
              </div>

              {/* Barcode Search Panel */}
              {showBarcodeSearch && (
                <div className="glass-panel-static animate-in edit-product-modal-gemini-style-048" >
                  <span className="edit-product-modal-gemini-style-047">Find Barcode in Catalog</span>
                  <div className="edit-product-modal-gemini-style-046">
                    <input
                      type="text"
                      className="form-input edit-product-modal-gemini-style-045"
                      
                      placeholder="Enter product name (e.g. Nutella, Clean Code)"
                      value={barcodeSearchQuery}
                      onChange={(e) => setBarcodeSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchBarcodeByName(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleSearchBarcodeByName}
                      disabled={isBarcodeSearching || !barcodeSearchQuery.trim()}
                      className="btn btn-primary btn-sm edit-product-modal-gemini-style-044"
                      
                    >
                      {isBarcodeSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  {barcodeSearchResults.length > 0 && (
                    <div className="edit-product-modal-gemini-style-043">
                      {barcodeSearchResults.map((result, idx) => (
                        <div
                          key={idx}
                          onClick={async () => {
                            setBarcode(result.barcode);
                            setShowBarcodeSearch(false);
                            setIsBarcodeLoading(true);
                            setBarcodeStatus('');
                            setErrorMsg('');
                            try {
                              const activeCat = categories.find(c => c.id === categoryId);
                              const categoryName = activeCat ? activeCat.name : '';
                              if (categoryName === 'Books & Education') {
                                const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${result.barcode}&format=json&jscmd=data`);
                                if (response.ok) {
                                  const data = await response.json();
                                  const bookKey = `ISBN:${result.barcode}`;
                                  if (data && data[bookKey]) {
                                    const book = data[bookKey];
                                    setTitle(book.title || '');
                                    const authors = book.authors?.map(a => a.name).join(', ') || 'Unknown Author';
                                    const publishers = book.publishers?.map(p => p.name).join(', ') || 'Unknown Publisher';
                                    setDescription(`Title: ${book.title || ''}\nAuthors: ${authors}\nPublisher: ${publishers} (${book.publish_date || 'N/A'})`);
                                    if (book.cover?.large || book.cover?.medium) {
                                      setImageSource('pexels');
                                      const imgUrl = book.cover.large || book.cover.medium;
                                      setSelectedPexelsUrl(imgUrl);
                                      setImagePreview(imgUrl);
                                    }
                                    setBarcodeStatus('success');
                                  }
                                }
                              } else {
                                const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${result.barcode}.json`);
                                if (response.ok) {
                                  const data = await response.json();
                                  if (data && data.status === 1 && data.product) {
                                    const p = data.product;
                                    setTitle(p.product_name || p.product_name_he || p.product_name_en || '');
                                    setDescription(`Product: ${p.product_name || ''}\nBrand: ${p.brands || 'N/A'}\nIngredients: ${p.ingredients_text || 'N/A'}`);
                                    const imgUrl = p.image_url || p.image_front_url;
                                    if (imgUrl) {
                                      setImageSource('pexels');
                                      setSelectedPexelsUrl(imgUrl);
                                      setImagePreview(imgUrl);
                                    }
                                    setBarcodeStatus('success');
                                  }
                                }
                              }
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsBarcodeLoading(false);
                            }
                          }}
                          className="edit-product-modal-gemini-style-042"
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        >
                          <div className="edit-product-modal-gemini-style-041">{result.title}</div>
                          <div className="edit-product-modal-gemini-style-040">
                            <span>{result.subtext}</span>
                            <span>{result.barcode}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                      <span className="spinner spinner-xs edit-product-modal-gemini-style-039"  />
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

            {/* Image Selection Options */}
            <div className="form-group">
              <label className="form-label flex justify-between items-center">
                <span>Product Image</span>
                <span className="edit-product-modal-gemini-style-038">
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: imageSource === 'file' ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: imageSource === 'file' ? '700' : '400', cursor: 'pointer', padding: 0 }}
                    onClick={() => setImageSource('file')}
                  >
                    Local File
                  </button>
                  <span>|</span>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: imageSource === 'pexels' ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: imageSource === 'pexels' ? '700' : '400', cursor: 'pointer', padding: 0 }}
                    onClick={() => {
                      setImageSource('pexels');
                      if (!pexelsQuery) setPexelsQuery(title);
                    }}
                  >
                    Pexels Search
                  </button>
                </span>
              </label>

              {imageSource === 'file' ? (
                <label
                  htmlFor="edit-product-image-input"
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  style={{
                    display: 'flex',
                    flexDirection: imagePreview ? 'row' : 'column',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '14px',
                    padding: imagePreview ? '12px' : '22px 16px',
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
                        className="edit-product-modal-gemini-style-037"
                      />
                      <div className="edit-product-modal-gemini-style-036">
                        <p className="edit-product-modal-gemini-style-035">
                          {imageFile ? imageFile.name : 'Current product image'}
                        </p>
                        <p className="edit-product-modal-gemini-style-034">Click to replace</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Upload size={20} className="edit-product-modal-gemini-style-033" />
                      </div>
                      <div className="edit-product-modal-gemini-style-032">
                        <p className="edit-product-modal-gemini-style-031">Drop image or click to upload</p>
                        <p className="edit-product-modal-gemini-style-030">PNG, JPG, WEBP up to 10 MB</p>
                      </div>
                    </>
                  )}
                  <input
                    id="edit-product-image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files[0])}
                    className="edit-product-modal-gemini-style-029"
                  />
                </label>
              ) : (
                <div className="edit-product-modal-gemini-style-028">
                  {!import.meta.env.VITE_PEXELS_API_KEY && (
                    <div className="edit-product-modal-gemini-style-027">
                      <span className="edit-product-modal-gemini-style-026">
                        Optional: Override Pexels API Key:
                      </span>
                      <input
                        type="password"
                        placeholder="Paste Pexels API Key..."
                        className="form-input edit-product-modal-gemini-style-025"
                        
                        value={pexelsApiKey}
                        onChange={(e) => handleSavePexelsKey(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="edit-product-modal-gemini-style-024">
                    <input
                      type="text"
                      className="form-input edit-product-modal-gemini-style-023"
                      
                      placeholder="Search items, e.g. bicycle..."
                      value={pexelsQuery}
                      onChange={(e) => setPexelsQuery(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary edit-product-modal-gemini-style-022"
                      
                      onClick={() => searchPexelsImages(pexelsQuery)}
                    >
                      Search
                    </button>
                  </div>

                  {isPexelsLoading ? (
                    <div className="edit-product-modal-gemini-style-021">
                      <div className="spinner spinner-sm" />
                    </div>
                  ) : (
                    <>
                      <div className="edit-product-modal-gemini-style-020">
                        {pexelsResults.map((photo) => (
                          <div
                            key={photo.id}
                            style={{
                              position: 'relative',
                              aspectRatio: '1',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: `2px solid ${selectedPexelsUrl === photo.src.large ? 'var(--primary)' : 'transparent'}`
                            }}
                            onClick={() => {
                              setSelectedPexelsUrl(photo.src.large);
                              setImagePreview(photo.src.large);
                            }}
                          >
                            <img
                              src={photo.src.medium}
                              alt={photo.photographer}
                              className="edit-product-modal-gemini-style-019"
                            />
                            {selectedPexelsUrl === photo.src.large && (
                              <div className="edit-product-modal-gemini-style-018">
                                <CheckCircle size={10} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Map & Geolocation */}
          <div className="edit-product-modal-gemini-style-017">
            <h3 className="edit-product-modal-gemini-style-016">
              <MapPin size={14} className="edit-product-modal-gemini-style-015" /> Location & Address
            </h3>

            {/* Photon Autocomplete Address Search Input */}
            <div className="edit-product-modal-gemini-style-014">
              <label className="form-label" htmlFor="edit-product-address">Address Search (Photon API)</label>
              <div className="edit-product-modal-gemini-style-013">
                <Search size={14} className="edit-product-modal-gemini-style-012" />
                <input
                  id="edit-product-address"
                  type="text"
                  className="form-input edit-product-modal-gemini-style-011"
                  
                  placeholder="Search address..."
                  value={addressSearchQuery}
                  onChange={(e) => {
                    setAddressSearchQuery(e.target.value);
                    searchAddress(e.target.value);
                  }}
                />
                {isAddressLoading && (
                  <div className="edit-product-modal-gemini-style-010">
                    <span className="spinner spinner-xs edit-product-modal-gemini-style-009"  />
                  </div>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {addressSuggestions.length > 0 && (
                <ul className="edit-product-modal-gemini-style-008">
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
              <div className="form-group edit-product-modal-gemini-style-007" >
                <label className="form-label">Saved Address</label>
                <input
                  type="text"
                  className="form-input edit-product-modal-gemini-style-006"
                  
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            )}

            <div className="edit-product-modal-gemini-style-005">
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
              <div className="alert alert-success edit-product-modal-gemini-style-004" >
                <CheckCircle size={12} />
                <span>
                  Pinned — Lat {pinnedCoords.lat.toFixed(5)}, Lng {pinnedCoords.lng.toFixed(5)}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="edit-product-modal-gemini-style-003">
              <button
                type="button"
                className="btn btn-secondary edit-product-modal-gemini-style-002"
                
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                id="edit-product-submit-btn"
                type="submit"
                className="btn btn-primary edit-product-modal-gemini-style-001"
                
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
