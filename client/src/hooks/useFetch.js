import { useAuth } from '../context/AuthContext';

export const useFetch = () => {
  const { token, logout, API_URL } = useAuth();

  const customFetch = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;
    
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

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
      // Auto logout if token expires (401/403 status)
      if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong. Please try again.');
      }

      return result;
    } catch (error) {
      console.error(`Fetch API Error [${url}]:`, error.message);
      throw error;
    }
  };

  const get = (endpoint) => customFetch(endpoint, { method: 'GET' });
  
  const post = (endpoint, body) => customFetch(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body)
  });

  const del = (endpoint) => customFetch(endpoint, { method: 'DELETE' });

  const patch = (endpoint, body) => customFetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });

  return { get, post, del, patch };
};
