'use client';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue with Webpack
// https://github.com/PaulLeCam/react-leaflet/issues/453
// Extend the prototype type to include the optional internal method
interface MutableIconDefault extends L.Icon.Default {
  // This private property exists in the bundled Leaflet build but is not
  // declared in the public type definitions.
  _getIconUrl?: () => string;
}

// Remove the private method so we can provide custom marker URLs without
// relying on Webpack asset handling.
// Casting to `MutableIconDefault` avoids the `any` escape hatch and satisfies ESLint.
delete (L.Icon.Default.prototype as MutableIconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

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

export function LeafletMap({
  latitude = 37.7749, // Default to San Francisco
  longitude = -122.4194,
  zoom = 10,
  className = 'w-full h-96',
  onLocationSelect,
  markers = [],
}: MapboxMapProps) {
  // Component to handle map clicks and pass them up
  function MapClickHandler() {
    useMapEvents({
      click: (e) => {
        if (onLocationSelect) {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={zoom}
      scrollWheelZoom={true}
      className={className}
      style={{ height: '100%', width: '100%' }} // Ensure map fills container
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler />

      {markers.map((marker, index) => (
        <Marker key={index} position={[marker.latitude, marker.longitude]}>
          {marker.title || marker.description ? (
            <Popup>
              <div className="p-2">
                {marker.title && (
                  <h3 className="font-semibold">{marker.title}</h3>
                )}
                {marker.description && (
                  <p className="text-sm text-gray-600">{marker.description}</p>
                )}
              </div>
            </Popup>
          ) : null}
        </Marker>
      ))}
    </MapContainer>
  );
}
