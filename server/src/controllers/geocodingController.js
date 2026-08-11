const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Custom User-Agent to identify our application for external keyless APIs (required by Nominatim)
const USER_AGENT = 'C2CMarketplace/1.0 (contact@c2c.com)';


const reverseGeocode = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: lat, lon'
      });
    }

    const cacheKey = `reverse:${lat}:${lon}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      return res.status(200).json({
        success: true,
        data: cachedData.data
      });
    }

    let data;
    let success = false;

    // 1. Try Photon first
    try {
      const response = await fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`, {
        headers: { 'User-Agent': USER_AGENT }
      });
      if (response.ok) {
        data = await response.json();
        if (data && data.features) {
          success = true;
          console.log(`[Geocoding] Reverse lookup succeeded via Photon for coords: ${lat}, ${lon}`);
        }
      } else {
        console.warn(`[Geocoding] Photon reverse lookup returned status ${response.status}`);
      }
    } catch (photonError) {
      console.error('[Geocoding] Photon reverse lookup error:', photonError.message);
    }

    // 2. Fallback to Nominatim if Photon failed
    if (!success) {
      try {
        console.log(`[Geocoding] Falling back to Nominatim reverse lookup for coords: ${lat}, ${lon}`);
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
          headers: { 'User-Agent': USER_AGENT }
        });
        if (response.ok) {
          const nominatimData = await response.json();
          if (nominatimData && nominatimData.address) {
            // Map Nominatim to Photon format
            const mappedFeature = {
              type: "Feature",
              properties: {
                name: nominatimData.name || "",
                street: nominatimData.address.road || nominatimData.address.street || "",
                housenumber: nominatimData.address.house_number || "",
                city: nominatimData.address.city || nominatimData.address.town || nominatimData.address.village || "",
                country: nominatimData.address.country || ""
              },
              geometry: {
                type: "Point",
                coordinates: [parseFloat(lon), parseFloat(lat)]
              }
            };
            data = {
              type: "FeatureCollection",
              features: [mappedFeature]
            };
            success = true;
            console.log('[Geocoding] Reverse lookup succeeded via Nominatim fallback');
          }
        } else {
          console.warn(`[Geocoding] Nominatim reverse lookup returned status ${response.status}`);
        }
      } catch (nominatimError) {
        console.error('[Geocoding] Nominatim reverse lookup error:', nominatimError.message);
      }
    }

    // 3. Last resort fallback (coordinates text) if both external APIs are down
    if (!success) {
      console.warn('[Geocoding] Both geocoding services failed. Using coordinates fallback.');
      const fallbackFeature = {
        type: "Feature",
        properties: {
          name: `Pinned Location (${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)})`
        },
        geometry: {
          type: "Point",
          coordinates: [parseFloat(lon), parseFloat(lat)]
        }
      };
      data = {
        type: "FeatureCollection",
        features: [fallbackFeature]
      };
    }

    // Cache the result (even fallback results can be cached briefly, but cache valid results for CACHE_TTL)
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
  reverseGeocode
};
