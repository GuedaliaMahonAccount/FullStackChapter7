import React from 'react';
import { MapPin, Navigation, Sun, Languages, Globe, ArrowLeft, Cpu, Sparkles, Map, BookOpen, Apple, Barcode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ApiInfo = () => {
  const navigate = useNavigate();

  const apis = [
    {
      title: 'Photon Geocoding API',
      icon: <MapPin size={22} style={{ color: '#14b8a6' }} />,
      endpoint: 'https://photon.komoot.io/api/',
      description: 'Used for address auto-completion and geocoding coordinates lookup. Whenever sellers enter coordinates or buyers search checkout delivery details, Photon queries OpenStreetMap data to autocomplete and fill fields instantly.',
      badges: ['Keyless', 'OpenStreetMap', 'Autocomplete']
    },
    {
      title: 'OSRM Routing Engine',
      icon: <Navigation size={22} style={{ color: '#6366f1' }} />,
      endpoint: 'http://router.project-osrm.org/route/v1/',
      description: 'Calculates real-world road-driving distance and duration. Measures routes between buyer position (HTML5 browser Geolocation) and pickup locations, running inside a 2-second timeout wrapper falling back to Haversine math if OSRM limits queries.',
      badges: ['Keyless', 'Routing Machine', 'Driving Distance']
    },
    {
      title: 'Open-Meteo API',
      icon: <Sun size={22} style={{ color: '#f59e0b' }} />,
      endpoint: 'https://api.open-meteo.com/v1/',
      description: 'Retrieves current weather details of the product pickup location using its coordinates. Displays temperature and weather states dynamically with advice tips (e.g. umbrella suggestions on rainy days, dehydration warnings in hot summer days).',
      badges: ['Keyless', 'Weather Forecast', 'Dynamic Advice']
    },
    {
      title: 'MyMemory Translation API',
      icon: <Languages size={22} style={{ color: '#ec4899' }} />,
      endpoint: 'https://api.mymemory.translated.net/get',
      description: 'Allows buyers to translate listing descriptions on-the-fly between Hebrew and English. Provides regional accessibility dynamically with zero backend caching dependencies.',
      badges: ['Keyless', 'Free Tier', 'Localization']
    },
    {
      title: 'Frankfurter Currency API',
      icon: <Globe size={22} style={{ color: '#a78bfa' }} />,
      endpoint: 'https://api.frankfurter.app/',
      description: 'Provides real-time currency conversion rates (such as ILS to USD/EUR) to automatically format foreign seller listings in local currency, keeping product listing lists consistent and readable.',
      badges: ['Keyless', 'Exchange Rates', 'Financial Conversion']
    },
    {
      title: 'Gemini LLM / mlvoca API',
      icon: <Sparkles size={22} style={{ color: '#ef4444' }} />,
      endpoint: 'Google Gemini 1.5 Flash / mlvoca TinyLlama',
      description: 'Generates smart AI description suggestions for products based on their titles. If a Gemini API key is configured on the server, Google Gemini is used; otherwise, it falls back to mlvoca TinyLlama or static templates, ensuring 100% setup resilience.',
      badges: ['LLM Generation', 'Gemini 1.5 Flash', 'TinyLlama Fallback']
    },
    {
      title: 'OpenFreeMap & MapLibre GL',
      icon: <Map size={22} style={{ color: '#06b6d4' }} />,
      endpoint: 'https://tiles.openfreemap.org/styles/liberty',
      description: 'Used to render interactive, high-performance vector maps. MapLibre GL provides the client-side WebGL rendering engine, while OpenFreeMap serves open-source map tiles with zero keys, tracking, or usage limits.',
      badges: ['Keyless', 'MapLibre GL', 'Vector Tiles']
    },
    {
      title: 'Open Food Facts API',
      icon: <Apple size={22} style={{ color: '#10b981' }} />,
      endpoint: 'https://world.openfoodfacts.org/api/v2/',
      description: 'Provides rich nutritional values, brand identification, allergen warnings, and ingredient sheets dynamically when EAN barcodes are scanned in the Food & Grocery category.',
      badges: ['Keyless', 'Food Catalog', 'Allergen Checker']
    },
    {
      title: 'Open Library API',
      icon: <BookOpen size={22} style={{ color: '#f97316' }} />,
      endpoint: 'https://openlibrary.org/api/',
      description: 'Fetches publication dates, authors, pages counts, and original book cover previews automatically when ISBN barcodes are queried in the Books & Education category.',
      badges: ['Keyless', 'Book Catalog', 'Cover Preview']
    },
    {
      title: 'UPCitemdb API',
      icon: <Barcode size={22} style={{ color: '#3b82f6' }} />,
      endpoint: 'https://api.upcitemdb.com/prod/trial/',
      description: 'Searches generic consumer products (Electronics, Home, Fashion) by UPC/EAN barcodes. Implements a rate-limited free trial query (100 requests/day) with robust fail-safe bypasses.',
      badges: ['100 Req/Day Free', 'General Catalog', 'Fail-Safe Fallback']
    }
  ];

  return (
    <div className="api-info-container page-container animate-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon" title="Go back">
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={24} style={{ color: 'var(--secondary)' }} /> System Architecture & External APIs
        </h1>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0, maxWidth: '800px' }}>
        GeoMarket is a standalone C2C E-commerce platform that implements multiple free, keyless third-party microservices.
        This design guarantees <strong>Zero Configuration setup</strong>—grading instructors can run the code instantly without acquiring API keys.
      </p>

      <div className="api-info-grid">
        {apis.map((api, idx) => (
          <div key={idx} className="glass-panel-static api-info-card">
            <div className="api-info-header">
              {api.icon}
              <h2 className="api-info-title">{api.title}</h2>
            </div>
            <div className="api-info-endpoint" title={api.endpoint}>
              {api.endpoint}
            </div>
            <p className="api-info-description">{api.description}</p>
            <div className="api-info-badges">
              {api.badges.map((badge, bIdx) => (
                <span key={bIdx} className="badge badge-teal api-info-badge">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiInfo;
