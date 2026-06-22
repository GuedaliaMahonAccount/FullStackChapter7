export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${apiBase}${url}`;
};

export const formatPrice = (price, currency = 'USD') => {
  const p = parseFloat(price || 0).toFixed(2);
  switch (currency?.toUpperCase()) {
    case 'EUR': return `€${p}`;
    case 'ILS': return `₪${p}`;
    case 'USD':
    default: return `$${p}`;
  }
};
