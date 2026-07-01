import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getImageUrl, formatPrice } from '../../utils/format';

export const OpenFreeMap = ({ 
  products = [], 
  center = [34.7818, 32.0853], // Default center coords (Tel Aviv center)
  zoom = 11,
  onSelectCoords = null, // Callback when user clicks on map (for coordinate selection)
  pinnedCoords = null, // Currently selected coordinate pin (for product upload)
  height = '350px'
}) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const selectionMarkerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Use OpenFreeMap free style URL
    mapInstance.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty', 
      center: pinnedCoords ? [pinnedCoords.lng, pinnedCoords.lat] : center,
      zoom: zoom,
      attributionControl: true
    });

    // Add navigation controls (zoom in/out buttons)
    mapInstance.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Handle map click events (coordinate pinning for sellers)
    if (onSelectCoords) {
      mapInstance.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        onSelectCoords({ lat, lng });

        // Update local selection marker
        if (selectionMarkerRef.current) {
          selectionMarkerRef.current.setLngLat([lng, lat]);
        } else {
          selectionMarkerRef.current = new maplibregl.Marker({ color: '#ef4444' }) // Red marker for selected position
            .setLngLat([lng, lat])
            .addTo(mapInstance.current);
        }
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update selection marker if coordinates changed externally
  useEffect(() => {
    if (!mapInstance.current || !onSelectCoords) return;

    if (pinnedCoords) {
      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.setLngLat([pinnedCoords.lng, pinnedCoords.lat]);
      } else {
        selectionMarkerRef.current = new maplibregl.Marker({ color: '#ef4444' })
          .setLngLat([pinnedCoords.lng, pinnedCoords.lat])
          .addTo(mapInstance.current);
      }
      mapInstance.current.flyTo({ center: [pinnedCoords.lng, pinnedCoords.lat], zoom: 14 });
    } else if (selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
      selectionMarkerRef.current = null;
    }
  }, [pinnedCoords]);

  // Update product markers
  useEffect(() => {
    if (!mapInstance.current || onSelectCoords) return; // Skip product updates if in click-to-pin mode

    // 1. Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 2. Add marker for each product with location coordinates
    products.forEach((product) => {
      const lat = parseFloat(product.latitude);
      const lng = parseFloat(product.longitude);

      if (isNaN(lat) || isNaN(lng)) return; // Skip if coordinates are invalid

      // Create a HTML popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 0.85rem; color: #fff; max-width: 160px;">
          <div style="font-weight: 700; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${product.title}
          </div>
          <div style="margin-bottom: 6px;">
            <img src="${getImageUrl(product.imageUrl)}" 
                 style="width: 100%; height: 75px; object-fit: cover; border-radius: 4px;"
                 alt="${product.title}" />
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #14b8a6; font-weight: 700;">${formatPrice(product.price, product.currency)}</span>
            <a href="/products/${product.id}" 
               style="background: #6366f1; color: #fff; text-decoration: none; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">
               View Details
            </a>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(popupHtml);

      // Create marker element
      const marker = new maplibregl.Marker({ color: '#6366f1' }) // Indigo marker
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapInstance.current);

      markersRef.current.push(marker);
    });
  }, [products]);

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 'inherit' }}>
      <div ref={mapContainer} className="open-free-map-style-001" />
    </div>
  );
};
