const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

const convertCurrency = async (req, res, next) => {
  try {
    const { amount, from, to } = req.query;
    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: amount, from, to'
      });
    }

    const cacheKey = `convert:${amount}:${from}:${to}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      return res.status(200).json({
        success: true,
        data: cachedData.data
      });
    }

    const response = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`);
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        success: false,
        message: 'Error from external currency service',
        details: text
      });
    }

    const data = await response.json();
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data
    });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getRates = async (req, res, next) => {
  try {
    const { from = 'ILS' } = req.query;

    const cacheKey = `rates:${from}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      return res.status(200).json({
        success: true,
        data: cachedData.data
      });
    }

    const response = await fetch(`https://api.frankfurter.app/latest?from=${from}`);
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        success: false,
        message: 'Error from external currency service',
        details: text
      });
    }

    const data = await response.json();
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data
    });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  convertCurrency,
  getRates
};
