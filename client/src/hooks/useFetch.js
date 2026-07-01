import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const activeRequests = new Map();
const clientCache = new Map();
const externalCache = new Map();
let lastToken = typeof window !== 'undefined' ? localStorage.getItem('c2c_token') : null;

// Helper to invalidate local cache keys starting with a prefix
const invalidateCache = (prefix) => {
  for (const key of clientCache.keys()) {
    if (key.startsWith(prefix)) {
      // Exclude pexels-search from general product invalidation to keep image search cached
      if (prefix === '/products' && key.startsWith('/products/pexels-search')) {
        continue;
      }
      clientCache.delete(key);
    }
  }
};

// Helper for caching external direct API fetches (e.g. Photon, OpenLibrary, etc.)
export const cachedExternalFetch = async (url, optionsOrTtl = {}) => {
  const ttl = typeof optionsOrTtl === 'number' ? optionsOrTtl : optionsOrTtl.ttl;
  const fetchOptions = typeof optionsOrTtl === 'object' ? optionsOrTtl : {};

  if (ttl) {
    const cached = externalCache.get(url);
    if (cached && (Date.now() - cached.timestamp < ttl)) {
      console.log(`[Cache Hit] External URL: ${url}`);
      return cached.data;
    }
    console.log(`[Cache Miss] External URL: ${url}`);
  } else {
    console.log(`[No Cache Configured] External URL: ${url}`);
  }

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new Error(`External fetch failed with status ${response.status}`);
  }
  const data = await response.json();

  if (ttl) {
    externalCache.set(url, {
      timestamp: Date.now(),
      data
    });
  }

  return data;
};

export const useFetch = () => {
  const { token, logout, API_URL } = useAuth();

  useEffect(() => {
    // Only clear cache when the token actually changes (login or logout)
    if (token !== lastToken) {
      clientCache.clear();
      externalCache.clear();
      lastToken = token;
      console.log(`[Cache Cleared] User session changed (login/logout). Old: ${lastToken ? 'Exists' : 'Null'}, New: ${token ? 'Exists' : 'Null'}`);
    }
  }, [token]);

  const customFetch = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;
    const isGet = options.method === 'GET';
    const ttl = options.ttl;

    // Check completed requests cache (only for GET with a ttl specified)
    if (isGet && ttl) {
      const cached = clientCache.get(endpoint);
      if (cached && (Date.now() - cached.timestamp < ttl)) {
        console.log(`[Cache Hit] Internal URL: ${endpoint}`);
        return cached.data;
      }
      console.log(`[Cache Miss] Internal URL: ${endpoint} (Reason: not found or expired)`);
    } else if (isGet) {
      console.log(`[No Cache Configured] Internal URL: ${endpoint}`);
    }

    // Check inflight requests (deduplication)
    if (isGet && activeRequests.has(url)) {
      console.log(`[Deduplicated In-Flight] Internal URL: ${endpoint}`);
      return activeRequests.get(url);
    }

    // Setup headers
    const headers = { ...options.headers };
    
    // Attach JWT if authenticated
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do not set content-type for FormData (e.g. image uploads), browser handles it automatically
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Filter out custom properties like ttl so they don't break native fetch options
    const { ttl: optionsTtl, ...fetchOptions } = options;

    const config = {
      ...fetchOptions,
      headers
    };

    const fetchPromise = (async () => {
      try {
        const response = await fetch(url, config);
        
        // Auto logout only if token is invalid/expired (401)
        if (response.status === 401) {
          logout();
          throw new Error('Session expired. Please log in again.');
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Something went wrong. Please try again.');
        }

        // Cache the successful GET response
        if (isGet && ttl) {
          clientCache.set(endpoint, {
            timestamp: Date.now(),
            data: result
          });
        }

        // Auto-invalidate cache on mutating requests (POST, PUT, PATCH, DELETE)
        if (!isGet && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
          if (endpoint.startsWith('/products')) {
            invalidateCache('/products');
          }
          if (endpoint.startsWith('/orders')) {
            invalidateCache('/orders');
            invalidateCache('/admin/orders');
            invalidateCache('/products'); // stock levels change
          }
          if (endpoint.startsWith('/admin/orders') || (endpoint.startsWith('/orders') && endpoint.includes('/status'))) {
            invalidateCache('/orders');
            invalidateCache('/admin/orders');
          }
          if (endpoint.startsWith('/reviews')) {
            invalidateCache('/reviews');
            invalidateCache('/products'); // ratings change
          }
          if (endpoint.startsWith('/admin/users')) {
            invalidateCache('/admin/users');
          }
        }

        return result;
      } catch (error) {
        console.error(`Fetch API Error [${url}]:`, error.message);
        throw error;
      } finally {
        if (isGet) {
          activeRequests.delete(url);
        }
      }
    })();

    if (isGet) {
      activeRequests.set(url, fetchPromise);
    }

    return fetchPromise;
  };

  const get = (endpoint, options = {}) => customFetch(endpoint, { method: 'GET', ...options });
  
  const post = (endpoint, body, options = {}) => customFetch(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options
  });

  const del = (endpoint, options = {}) => customFetch(endpoint, { method: 'DELETE', ...options });

  const patch = (endpoint, body, options = {}) => customFetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...options
  });

  const put = (endpoint, body, options = {}) => customFetch(endpoint, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options
  });

  return { get, post, del, patch, put };
};
