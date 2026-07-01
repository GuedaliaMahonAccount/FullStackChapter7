import React, { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { OpenFreeMap } from '../common/OpenFreeMap';
import { X, Tag, MapPin, Upload, Info, CheckCircle, Search, Image, Globe } from 'lucide-react';

export const NewProductModal = ({ isOpen, onClose, onSuccess }) => {
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

  const [address, setAddress]                         = useState('');
  const [currency, setCurrency]                       = useState('USD');
  const [barcode, setBarcode]                         = useState('');
  const [isBarcodeLoading, setIsBarcodeLoading]       = useState(false);
  const [barcodeStatus, setBarcodeStatus]             = useState(''); // 'success' | 'error' | ''
  const [showBarcodeSearch, setShowBarcodeSearch]     = useState(false);
  const [barcodeSearchQuery, setBarcodeSearchQuery]   = useState('');
  const [barcodeSearchResults, setBarcodeSearchResults] = useState([]);
  const [isBarcodeSearching, setIsBarcodeSearching]   = useState(false);
  
  // Pexels integration states
  const [imageSource, setImageSource]                 = useState('file'); // 'file' | 'pexels'
  const [pexelsQuery, setPexelsQuery]                 = useState('');
  const [pexelsResults, setPexelsResults]             = useState([]);
  const [isPexelsLoading, setIsPexelsLoading]         = useState(false);
  const [selectedPexelsUrl, setSelectedPexelsUrl]     = useState('');
  const [pexelsApiKey, setPexelsApiKey]               = useState(localStorage.getItem('pexels_api_key') || '');
  
  // Photon autocomplete states
  const [addressSearchQuery, setAddressSearchQuery]   = useState('');
  const [addressSuggestions, setAddressSuggestions]   = useState([]);
  const [isAddressLoading, setIsAddressLoading]       = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc]       = useState(false);

  const { get, post } = useFetch();

  useEffect(() => {
    if (!isOpen) return;
    const fetchCats = async () => {
      try {
        const res = await get('/categories', { ttl: Infinity }); // Cached infinitely
        if (res.success) {
          setCategories(res.data);
          if (res.data.length > 0) setCategoryId(res.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setPrice('');
    setDescription('');
    setStockQuantity('1');
    setImageFile(null);
    setImagePreview(null);
    setPinnedCoords(null);
    setAddress('');
    setCurrency('USD');
    setBarcode('');
    setBarcodeStatus('');
    setShowBarcodeSearch(false);
    setBarcodeSearchQuery('');
    setBarcodeSearchResults([]);
    setImageSource('file');
    setPexelsQuery('');
    setPexelsResults([]);
    setSelectedPexelsUrl('');
    setAddressSearchQuery('');
    setAddressSuggestions([]);
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setSelectedPexelsUrl(''); // Reset pexels selection if a file is chosen
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageChange(file);
  };

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

  // Pexels API search
  const searchPexelsImages = async (query) => {
    if (!query) return;
    setIsPexelsLoading(true);
    setErrorMsg('');

    // If user provided their own key locally, call Pexels directly
    if (pexelsApiKey) {
      try {
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=9`, {
          headers: { Authorization: pexelsApiKey }
        });
        if (!res.ok) {
          throw new Error(`Pexels API error: status ${res.status}`);
        }
        const data = await res.json();
        if (data && data.photos) {
          setPexelsResults(data.photos);
        }
      } catch (err) {
        console.error('Error searching Pexels directly:', err);
        setErrorMsg('Failed to search Pexels. Please verify your API key.');
      } finally {
        setIsPexelsLoading(false);
      }
      return;
    }

    // Otherwise, request securely through our backend proxy
    try {
      const res = await get(`/products/pexels-search?query=${encodeURIComponent(query)}`, { ttl: Infinity }); // Cached infinitely
      if (res.success && res.data && res.data.photos) {
        setPexelsResults(res.data.photos);
      } else {
        // Fallback to placeholder images if backend doesn't return photos
        const fallbackResults = [
          { id: 1, src: { medium: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60`, large: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200` }, photographer: 'Unsplash Placeholder' },
          { id: 2, src: { medium: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60`, large: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200` }, photographer: 'Unsplash Placeholder' },
          { id: 3, src: { medium: `https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60`, large: `https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200` }, photographer: 'Unsplash Placeholder' },
          { id: 4, src: { medium: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60`, large: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200` }, photographer: 'Unsplash Placeholder' },
          { id: 5, src: { medium: `https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60`, large: `https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200` }, photographer: 'Unsplash Placeholder' },
          { id: 6, src: { medium: `https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&auto=format&fit=crop&q=60`, large: `https://images.unsplash.com/photo-1560343090-f0409e92791a?w=1200` }, photographer: 'Unsplash Placeholder' }
        ];
        setPexelsResults(fallbackResults);
      }
    } catch (err) {
      console.error('Error searching Pexels via proxy:', err);
      setErrorMsg('Failed to search Pexels via server.');
    } finally {
      setIsPexelsLoading(false);
    }
  };

  const handleSavePexelsKey = (key) => {
    setPexelsApiKey(key);
    localStorage.setItem('pexels_api_key', key);
  };

  const handleSuggestDescription = async () => {
    if (!title.trim()) return;
    setIsGeneratingDesc(true);
    setErrorMsg('');
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
            setSelectedPexelsUrl(book.cover.large || book.cover.medium);
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
              subtext: doc.author_name ? `by ${doc.author_name.join(', ')}` : 'Unknown Author',
              barcode: doc.isbn[0],
              source: 'Open Library'
            }));
          setBarcodeSearchResults(results);
          if (results.length === 0) setErrorMsg('No books with barcodes found matching your search.');
        } else {
          setErrorMsg('No results found.');
        }
      } else if (categoryName === 'Food & Grocery') {
        const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(barcodeSearchQuery)}&search_simple=1&action=process&json=1&page_size=8`);
        if (!response.ok) throw new Error('Search failed on Open Food Facts.');
        const data = await response.json();
        
        if (data && data.products) {
          const results = data.products
            .filter(p => p.code)
            .map(p => ({
              title: p.product_name || p.product_name_he || p.product_name_en || 'Unknown Food Item',
              subtext: p.brands ? `Brand: ${p.brands}` : 'Unknown Brand',
              barcode: p.code,
              source: 'Open Food Facts'
            }));
          setBarcodeSearchResults(results);
          if (results.length === 0) setErrorMsg('No food products with barcodes found.');
        } else {
          setErrorMsg('No results found.');
        }
      } else {
        const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(barcodeSearchQuery)}&search_simple=1&action=process&json=1&page_size=8`);
        if (!response.ok) throw new Error('Search failed.');
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
          if (results.length === 0) setErrorMsg('No general products with barcodes found. Try selecting "Food & Grocery" or "Books & Education" for optimal catalog searches.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (imageSource === 'file' && !imageFile) {
      setErrorMsg('A product image file is required.');
      return;
    }
    if (imageSource === 'pexels' && !selectedPexelsUrl) {
      setErrorMsg('Please select an image from the Pexels search results.');
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
      formData.append('currency', currency);
      if (address) {
        formData.append('address', address);
      }
      if (barcode) {
        formData.append('barcode', barcode);
      }
      if (imageSource === 'file') {
        formData.append('image', imageFile);
      } else {
        formData.append('imageUrl', selectedPexelsUrl);
      }
      if (pinnedCoords) {
        formData.append('latitude', pinnedCoords.lat);
        formData.append('longitude', pinnedCoords.lng);
      }

      const res = await post('/products', formData);
      if (res.success) {
        resetForm();
        onSuccess();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to publish product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal-panel">
        <button className="modal-close-btn" onClick={handleClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="new-product-modal-style-076">
          <h2 className="new-product-modal-style-075">
            Create a New <span className="text-gradient">Product</span>
          </h2>
          <p className="new-product-modal-style-074">
            Sell your items to local buyers in your neighborhood.
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-error new-product-modal-style-073" >
            <Info size={16} className="new-product-modal-style-072" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="split-layout new-product-modal-style-071" >

          {/* Left: Fields */}
          <div className="new-product-modal-style-070">
            <h3 className="new-product-modal-style-069">
              <Tag size={15} /> Product Details
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="modal-sell-title">Product Title</label>
              <input
                id="modal-sell-title"
                type="text"
                className="form-input"
                placeholder="e.g. Vintage leather jacket"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="new-product-modal-style-068">
              <div className="form-group">
                <label className="form-label" htmlFor="modal-sell-price">Price</label>
                <input
                  id="modal-sell-price"
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
                <label className="form-label" htmlFor="modal-sell-currency">Currency</label>
                <select
                  id="modal-sell-currency"
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
                <label className="form-label" htmlFor="modal-sell-stock">Stock Qty</label>
                <input
                  id="modal-sell-stock"
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
              <label className="form-label" htmlFor="modal-sell-category">Category</label>
              <select
                id="modal-sell-category"
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
              <label className="form-label new-product-modal-style-067" htmlFor="modal-sell-barcode" >
                <span>Barcode (EAN/UPC)</span>
                <span className="new-product-modal-style-066">Autofills title & description</span>
              </label>
              <div className="new-product-modal-style-065">
                <input
                  id="modal-sell-barcode"
                  type="text"
                  className="form-input new-product-modal-style-064"
                  placeholder="e.g. 3017300045601 or 9780132350884"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  
                />
                <button
                  type="button"
                  onClick={handleBarcodeAutofill}
                  disabled={isBarcodeLoading || !barcode.trim()}
                  className="btn btn-secondary btn-sm new-product-modal-style-063"
                  
                >
                  {isBarcodeLoading ? 'Searching...' : 'Autofill'}
                </button>
              </div>
              <div className="new-product-modal-style-062">
                <div>
                  {barcodeStatus === 'success' && (
                    <span className="new-product-modal-style-061">✓ Metadata auto-populated successfully!</span>
                  )}
                  {barcodeStatus === 'error' && (
                    <span className="new-product-modal-style-060">✗ Failed to autofill from barcode</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowBarcodeSearch(!showBarcodeSearch)}
                  className="new-product-modal-style-059"
                >
                  {showBarcodeSearch ? 'Close Search Panel' : 'Search barcode by name'}
                </button>
              </div>

              {showBarcodeSearch && (
                <div className="glass-panel-static animate-in new-product-modal-style-058" >
                  <span className="new-product-modal-style-057">Find Barcode in Catalog</span>
                  <div className="new-product-modal-style-056">
                    <input
                      type="text"
                      className="form-input new-product-modal-style-055"
                      
                      placeholder="Enter product name (e.g. Nutella, Clean Code)"
                      value={barcodeSearchQuery}
                      onChange={(e) => setBarcodeSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchBarcodeByName(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleSearchBarcodeByName}
                      disabled={isBarcodeSearching || !barcodeSearchQuery.trim()}
                      className="btn btn-primary btn-sm new-product-modal-style-054"
                      
                    >
                      {isBarcodeSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  {barcodeSearchResults.length > 0 && (
                    <div className="new-product-modal-style-053">
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
                                if (!response.ok) throw new Error('Failed to query Open Library API.');
                                const data = await response.json();
                                const bookKey = `ISBN:${result.barcode}`;
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
                                    setSelectedPexelsUrl(book.cover.large || book.cover.medium);
                                  }
                                  setBarcodeStatus('success');
                                } else {
                                  throw new Error('Book details not found.');
                                }
                              } else if (categoryName === 'Food & Grocery') {
                                const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${result.barcode}.json`);
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
                                  }
                                  setBarcodeStatus('success');
                                } else {
                                  throw new Error('Food details not found.');
                                }
                              } else {
                                const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${result.barcode}`);
                                if (!response.ok) throw new Error('Failed to query general database.');
                                const data = await response.json();
                                if (data && data.items && data.items.length > 0) {
                                  const item = data.items[0];
                                  setTitle(item.title || '');
                                  setDescription(`Brand: ${item.brand || ''}\nModel: ${item.model || ''}\nDescription: ${item.description || ''}`);
                                  if (item.images && item.images.length > 0) {
                                    setImageSource('pexels');
                                    setSelectedPexelsUrl(item.images[0]);
                                  }
                                  setBarcodeStatus('success');
                                } else {
                                  throw new Error('Product details not found.');
                                }
                              }
                            } catch (e) {
                              setErrorMsg(e.message);
                              setBarcodeStatus('error');
                            } finally {
                              setIsBarcodeLoading(false);
                            }
                          }}
                          className="new-product-modal-style-052"
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                        >
                          <span className="new-product-modal-style-051">{result.title}</span>
                          <div className="new-product-modal-style-050">
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

            <div className="form-group">
              <label className="form-label flex justify-between items-center">
                <span htmlFor="modal-sell-desc">Description</span>
                <button
                  type="button"
                  onClick={handleSuggestDescription}
                  disabled={isGeneratingDesc || !title.trim()}
                  className="ai-suggest-btn"
                >
                  {isGeneratingDesc ? (
                    <>
                      <span className="spinner spinner-xs new-product-modal-style-049"  />
                      Generating...
                    </>
                  ) : (
                    'Suggest with AI'
                  )}
                </button>
              </label>
              <textarea
                id="modal-sell-desc"
                className="form-input"
                rows={3}
                placeholder="Describe the item's condition, size, brand…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Image Selection Option: File upload vs Pexels search */}
            <div className="form-group new-product-modal-style-048" >
              <label className="form-label new-product-modal-style-047" >
                <span>Product Image</span>
                <span className="new-product-modal-style-046">
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: imageSource === 'file' ? 'var(--primary-light)' : 'var(--text-muted)',
                      fontWeight: imageSource === 'file' ? '700' : '400',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    onClick={() => setImageSource('file')}
                  >
                    Local File
                  </button>
                  <span className="new-product-modal-style-045">|</span>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: imageSource === 'pexels' ? 'var(--primary-light)' : 'var(--text-muted)',
                      fontWeight: imageSource === 'pexels' ? '700' : '400',
                      cursor: 'pointer',
                      padding: 0
                    }}
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
                  htmlFor="modal-sell-image-input"
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
                        className="new-product-modal-style-044"
                      />
                      <div className="new-product-modal-style-043">
                        <p className="new-product-modal-style-042">
                          {imageFile?.name}
                        </p>
                        <p className="new-product-modal-style-041">Click to change</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="new-product-modal-style-040">
                        <Upload size={20} className="new-product-modal-style-039" />
                      </div>
                      <div className="new-product-modal-style-038">
                        <p className="new-product-modal-style-037">Drop image or click to upload</p>
                        <p className="new-product-modal-style-036">PNG, JPG, WEBP up to 10 MB</p>
                      </div>
                    </>
                  )}
                  <input
                    id="modal-sell-image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files[0])}
                    className="new-product-modal-style-035"
                  />
                </label>
              ) : (
                <div className="new-product-modal-style-034">
                  {/* API Key setting (interactive setup!) */}
                  {!import.meta.env.VITE_PEXELS_API_KEY && (
                    <div className="new-product-modal-style-033">
                      <span className="new-product-modal-style-032">
                        Optional: Override with custom <a href="https://www.pexels.com/api/" target="_blank" rel="noreferrer" className="new-product-modal-style-031">Pexels API Key</a>:
                      </span>
                      <input
                        type="password"
                        placeholder="Paste Pexels API Key here..."
                        className="form-input new-product-modal-style-030"
                        
                        value={pexelsApiKey}
                        onChange={(e) => handleSavePexelsKey(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Search query box */}
                  <div className="new-product-modal-style-029">
                    <input
                      type="text"
                      className="form-input new-product-modal-style-028"
                      
                      placeholder="Search items, e.g. bicycle..."
                      value={pexelsQuery}
                      onChange={(e) => setPexelsQuery(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary new-product-modal-style-027"
                      
                      onClick={() => searchPexelsImages(pexelsQuery)}
                    >
                      Search
                    </button>
                  </div>

                  {/* Search results */}
                  {isPexelsLoading ? (
                    <div className="new-product-modal-style-026">
                      <div className="spinner spinner-sm" />
                    </div>
                  ) : (
                    <>
                      <div className="new-product-modal-style-025">
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
                            onClick={() => setSelectedPexelsUrl(photo.src.large)}
                          >
                            <img
                              src={photo.src.medium}
                              alt={photo.photographer}
                              className="new-product-modal-style-024"
                            />
                            {selectedPexelsUrl === photo.src.large && (
                              <div className="new-product-modal-style-023">
                                <CheckCircle size={10} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {selectedPexelsUrl && (
                        <div className="new-product-modal-style-022">
                          <img src={selectedPexelsUrl} className="new-product-modal-style-021" alt="Selected" />
                          <span className="new-product-modal-style-020">
                            Pexels image selected!
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Map + Submit */}
          <div className="new-product-modal-style-019">
            <div className="new-product-modal-style-018">
              <h3 className="new-product-modal-style-017">
                <MapPin size={15} className="new-product-modal-style-016" />
                Sale Location & Address
                <span className="new-product-modal-style-015">
                  Optional
                </span>
              </h3>

              {/* Photon Autocomplete Address Search Input */}
              <div className="new-product-modal-style-014">
                <label className="form-label" htmlFor="modal-sell-address">Address Search (Photon API)</label>
                <div className="new-product-modal-style-013">
                  <Search size={14} className="new-product-modal-style-012" />
                  <input
                    id="modal-sell-address"
                    type="text"
                    className="form-input new-product-modal-style-011"
                    
                    placeholder="Type address, e.g. Dizengoff 100, Tel Aviv..."
                    value={addressSearchQuery}
                    onChange={(e) => {
                      setAddressSearchQuery(e.target.value);
                      searchAddress(e.target.value);
                    }}
                  />
                  {isAddressLoading && (
                    <div className="new-product-modal-style-010">
                      <span className="spinner spinner-xs new-product-modal-style-009"  />
                    </div>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {addressSuggestions.length > 0 && (
                  <ul className="new-product-modal-style-008">
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

              {/* Exact Address input display */}
              {address && (
                <div className="form-group new-product-modal-style-007" >
                  <label className="form-label">Saved Address</label>
                  <input
                    type="text"
                    className="form-input new-product-modal-style-006"
                    
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              )}

              <p className="new-product-modal-style-005">
                Click on the map to pin coords, or search address above (autofills coordinates).
              </p>

              <div className="new-product-modal-style-004">
                <OpenFreeMap
                  onSelectCoords={(coords) => {
                    setPinnedCoords(coords);
                    reverseGeocode(coords.lat, coords.lng);
                  }}
                  pinnedCoords={pinnedCoords}
                  height="100%"
                />
              </div>

              {pinnedCoords ? (
                <div className="alert alert-success new-product-modal-style-003" >
                  <CheckCircle size={14} />
                  <span>
                    Pinned — Lat {pinnedCoords.lat.toFixed(5)}, Lng {pinnedCoords.lng.toFixed(5)}
                  </span>
                </div>
              ) : (
                <div className="alert alert-info new-product-modal-style-002" >
                  <Info size={14} />
                  <span>No location pinned. Product will list without a map marker.</span>
                </div>
              )}
            </div>

            <button
              id="modal-sell-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg new-product-modal-style-001"
              
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><span className="spinner spinner-sm" /> Publishing…</>
              ) : (
                'Publish Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProductModal;
