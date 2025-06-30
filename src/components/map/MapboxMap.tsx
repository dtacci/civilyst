'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet version (client-only) for graceful fallback
const LeafletMap = dynamic(
  () => import('./LeafletMap').then((m) => m.LeafletMap),
  { ssr: false }
);

// Set Mapbox access token
const rawToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? '';
const hasValidToken = rawToken !== '' && rawToken !== 'your_mapbox_token_here';

if (typeof window !== 'undefined' && hasValidToken) {
  mapboxgl.accessToken = rawToken;
}

export interface MapboxMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  className?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: Array<{
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
  }>;
}

export function MapboxMap({
  latitude = 37.7749, // Default to San Francisco
  longitude = -122.4194,
  zoom = 10,
  className = 'w-full h-96',
  onLocationSelect,
  markers = [],
}: MapboxMapProps) {
  // Hooks MUST run unconditionally and in the same order on every render
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  /** keep the latest onLocationSelect without re-initialising the map */
  const onLocationSelectRef = useRef<typeof onLocationSelect>();
  // update ref when prop changes
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Decide once per render whether to use Mapbox or fall back to Leaflet.
  // This value is stable for the lifetime of the component.
  const shouldUseMapbox = typeof window !== 'undefined' && hasValidToken;

  // Initialize map
  useEffect(() => {
    if (!shouldUseMapbox) return; // Skip when using Leaflet fallback
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: zoom,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Add click handler for location selection
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      const cb = onLocationSelectRef.current;
      if (cb) cb(lat, lng);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // We include position/zoom so the map initialises correctly for new values
  }, [shouldUseMapbox, latitude, longitude, zoom]);

  // Update map center when props change
  useEffect(() => {
    if (!shouldUseMapbox) return;
    if (map.current && mapLoaded) {
      map.current.setCenter([longitude, latitude]);
    }
  }, [latitude, longitude, mapLoaded, shouldUseMapbox]);

  // Handle markers
  useEffect(() => {
    if (!shouldUseMapbox) return;
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach((marker) => marker.remove());

    // Add new markers
    markers.forEach((marker) => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `
          <div class="p-2">
            ${marker.title ? `<h3 class="font-semibold">${marker.title}</h3>` : ''}
            ${marker.description ? `<p class="text-sm text-gray-600">${marker.description}</p>` : ''}
          </div>
        `
      );

      new mapboxgl.Marker()
        .setLngLat([marker.longitude, marker.latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [markers, mapLoaded, shouldUseMapbox]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (!shouldUseMapbox) {
    return (
      <LeafletMap
        latitude={latitude}
        longitude={longitude}
        zoom={zoom}
        className={className}
        onLocationSelect={onLocationSelect}
        markers={markers}
      />
    );
  }

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
}
