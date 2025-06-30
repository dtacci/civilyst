'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
if (typeof window !== 'undefined') {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
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
    if (onLocationSelect) {
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        onLocationSelect(lat, lng);
      });
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map center when props change
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.setCenter([longitude, latitude]);
    }
  }, [latitude, longitude, mapLoaded]);

  // Handle markers
  useEffect(() => {
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
  }, [markers, mapLoaded]);

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
}