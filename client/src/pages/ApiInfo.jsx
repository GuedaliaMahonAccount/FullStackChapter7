import React from 'react';
import { MapPin, Navigation, Sun, Languages, Globe, ArrowLeft, Cpu, Sparkles, Map, BookOpen, Apple, Barcode, CreditCard, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ApiInfo = () => {
  const navigate = useNavigate();

  const apis = [
    {
      title: 'Photon Geocoding API',
      icon: <MapPin size={22} className="api-info-style-014" />,
      endpoint: 'GET /api/geocoding/reverse & Direct GET https://photon.komoot.io/api/',
      description: 'Used for address auto-completion (direct client-side to prevent backend load) and reverse geocoding coordinates lookup (proxied via backend to bypass user-agent block policies and secure request caching).',
      badges: ['Keyless', 'OpenStreetMap', 'Hybrid Proxied']
    },
    {
      title: 'OSRM Routing Engine',
      icon: <Navigation size={22} className="api-info-style-013" />,
      endpoint: 'http://router.project-osrm.org/route/v1/',
      description: 'Calculates real-world road-driving distance and duration. Measures routes between buyer position (HTML5 browser Geolocation) and pickup locations, running inside a 2-second timeout wrapper falling back to Haversine math if OSRM limits queries.',
      badges: ['Keyless', 'Routing Machine', 'Driving Distance']
    },
    {
      title: 'Open-Meteo API',
      icon: <Sun size={22} className="api-info-style-012" />,
      endpoint: 'https://api.open-meteo.com/v1/',
      description: 'Retrieves current weather details of the product pickup location using its coordinates. Displays temperature and weather states dynamically with advice tips (e.g. umbrella suggestions on rainy days, dehydration warnings in hot summer days).',
      badges: ['Keyless', 'Weather Forecast', 'Dynamic Advice']
    },
    {
      title: 'MyMemory Translation API',
      icon: <Languages size={22} className="api-info-style-011" />,
      endpoint: 'https://api.mymemory.translated.net/get',
      description: 'Allows buyers to translate listing descriptions on-the-fly between Hebrew and English. Provides regional accessibility dynamically with zero backend caching dependencies.',
      badges: ['Keyless', 'Free Tier', 'Localization']
    },
    {
      title: 'Frankfurter Currency API',
      icon: <Globe size={22} className="api-info-style-010" />,
      endpoint: 'https://api.frankfurter.app/',
      description: 'Provides real-time currency conversion rates (such as ILS to USD/EUR) to automatically format foreign seller listings in local currency, keeping product listing lists consistent and readable.',
      badges: ['Keyless', 'Exchange Rates', 'Financial Conversion']
    },
    {
      title: 'Gemini LLM / mlvoca API',
      icon: <Sparkles size={22} className="api-info-style-009" />,
      endpoint: 'Google Gemini 1.5 Flash / mlvoca TinyLlama',
      description: 'Generates smart AI description suggestions for products based on their titles. If a Gemini API key is configured on the server, Google Gemini is used; otherwise, it falls back to mlvoca TinyLlama or static templates, ensuring 100% setup resilience.',
      badges: ['LLM Generation', 'Gemini 1.5 Flash', 'TinyLlama Fallback']
    },
    {
      title: 'OpenFreeMap & MapLibre GL',
      icon: <Map size={22} className="api-info-style-008" />,
      endpoint: 'https://tiles.openfreemap.org/styles/liberty',
      description: 'Used to render interactive, high-performance vector maps. MapLibre GL provides the client-side WebGL rendering engine, while OpenFreeMap serves open-source map tiles with zero keys, tracking, or usage limits.',
      badges: ['Keyless', 'MapLibre GL', 'Vector Tiles']
    },
    {
      title: 'Open Food Facts API',
      icon: <Apple size={22} className="api-info-style-007" />,
      endpoint: 'https://world.openfoodfacts.org/api/v2/',
      description: 'Provides rich nutritional values, brand identification, allergen warnings, and ingredient sheets dynamically when EAN barcodes are scanned in the Food & Grocery category.',
      badges: ['Keyless', 'Food Catalog', 'Allergen Checker']
    },
    {
      title: 'Open Library API',
      icon: <BookOpen size={22} className="api-info-style-006" />,
      endpoint: 'https://openlibrary.org/api/',
      description: 'Fetches publication dates, authors, pages counts, and original book cover previews automatically when ISBN barcodes are queried in the Books & Education category.',
      badges: ['Keyless', 'Book Catalog', 'Cover Preview']
    },
    {
      title: 'UPCitemdb API',
      icon: <Barcode size={22} className="api-info-style-005" />,
      endpoint: 'https://api.upcitemdb.com/prod/trial/',
      description: 'Searches generic consumer products (Electronics, Home, Fashion) by UPC/EAN barcodes. Implements a rate-limited free trial query (100 requests/day) with robust fail-safe bypasses.',
      badges: ['100 Req/Day Free', 'General Catalog', 'Fail-Safe Fallback']
    },
    {
      title: 'Payment Gateway (Stripe Test Mode)',
      icon: <CreditCard size={22} className="api-info-gemini-style-032" />,
      endpoint: 'Stripe API: POST /api/payment/create-payment-intent',
      description: 'Integrates secure, tokenized credit card processing via Stripe Elements (iframe) and Stripe SDK. Calculates transaction totals on the backend from database prices to prevent tampering, confirms client charge status, and splits orders by seller.',
      badges: ['Stripe Elements', 'Secure Tokenization', 'Order Splitting']
    },
    {
      title: 'Email Notification Service (Demo / Simulation)',
      icon: <Mail size={22} className="api-info-gemini-style-031" />,
      endpoint: 'Internal Simulation: Console / Admin Logs',
      description: 'Simulates transactional email notifications (e.g. order receipt confirmations, seller notifications). Instead of requiring mail credentials, it outputs simulated mails to the console and logs them to the Admin System Logs, keeping the code zero-config.',
      badges: ['Simulation', 'Console Logging', 'Zero-Config SMTP']
    }
  ];

  return (
    <div className="api-info-container page-container animate-in">
      <div className="api-info-style-004">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon" title="Go back">
          <ArrowLeft size={18} />
        </button>
        <h1 className="api-info-style-003">
          <Cpu size={24} className="api-info-style-002" /> System Architecture & External APIs
        </h1>
      </div>

      <p className="api-info-style-001">
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

      {/* Stripe Test Cards Guide Section */}
      <div className="glass-panel-static api-info-gemini-style-030" >
        <h2 className="api-info-gemini-style-029">
          <CreditCard size={20} className="api-info-gemini-style-028" /> Stripe Test Cards Guide
        </h2>
        <p className="api-info-gemini-style-027">
          To test checkouts in development mode, use any future expiry date (e.g. <code>12/28</code>) and any 3-digit CVC (e.g. <code>123</code>) with the following card numbers:
        </p>
        <div className="api-info-gemini-style-026">
          <table className="api-info-gemini-style-025">
            <thead>
              <tr className="api-info-gemini-style-024">
                <th className="api-info-gemini-style-023">Scenario</th>
                <th className="api-info-gemini-style-022">Card Number</th>
                <th className="api-info-gemini-style-021">Expected Behavior</th>
              </tr>
            </thead>
            <tbody>
              <tr className="api-info-gemini-style-020">
                <td className="api-info-gemini-style-019">Success Payment</td>
                <td className="api-info-gemini-style-018">4242 4242 4242 4242</td>
                <td className="api-info-gemini-style-017">Succeeds and registers the orders.</td>
              </tr>
              <tr className="api-info-gemini-style-016">
                <td className="api-info-gemini-style-015">Incorrect CVC</td>
                <td className="api-info-gemini-style-014">4000 0000 0000 0127</td>
                <td className="api-info-gemini-style-013">Fails with CVC security code error.</td>
              </tr>
              <tr className="api-info-gemini-style-012">
                <td className="api-info-gemini-style-011">Expired Card</td>
                <td className="api-info-gemini-style-010">4000 0000 0000 0069</td>
                <td className="api-info-gemini-style-009">Fails with Card Expired error.</td>
              </tr>
              <tr className="api-info-gemini-style-008">
                <td className="api-info-gemini-style-007">Insufficient Funds</td>
                <td className="api-info-gemini-style-006">4000 0000 0000 9995</td>
                <td className="api-info-gemini-style-005">Fails with card declined / insufficient funds.</td>
              </tr>
              <tr className="api-info-gemini-style-004">
                <td className="api-info-gemini-style-003">Lost / Stolen Card</td>
                <td className="api-info-gemini-style-002">4000 0000 0000 9987</td>
                <td className="api-info-gemini-style-001">Fails with Lost or Stolen status error.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApiInfo;
