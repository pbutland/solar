import { useMap } from 'react-leaflet';
// Helper to update map center when lat/long change
function MapCenterUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng]);
    }
  }, [lat, lng, map]);
  return null;
}

import { useEffect, useState } from 'react';
import './LocationMapInput.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LeafletMouseEvent } from 'leaflet';
import './LocationInput.css';

const DEFAULT_POSITION = { lat: -37.8136, lng: 144.9631 }; // Melbourne

function LocationMarker({ position, onLocationChange }: { position: { lat: number; lng: number } | null, onLocationChange?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return position ? <Marker position={position} /> : null;
}

function LocationInputMapToggle({ onLocationChange }: { onLocationChange?: (latitude: number | null, longitude: number | null) => void }) {
  const [mode, setMode] = useState<'fields' | 'map'>('map');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_POSITION);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Only call onLocationChange in handlers below

  // When user clicks on map, update fields and notify parent
  const handleMapLocationChange = (lat: number, lng: number) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    if (onLocationChange) {
      onLocationChange(lat, lng);
    }
  };

  // When user changes input, update fields and notify parent
  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLatitude(value);
    const latNum = value === '' ? null : parseFloat(value);
    const lngNum = longitude === '' ? null : parseFloat(longitude);
    if (onLocationChange) {
      onLocationChange(latNum, lngNum);
    }
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLongitude(value);
    const latNum = latitude === '' ? null : parseFloat(latitude);
    const lngNum = value === '' ? null : parseFloat(value);
    if (onLocationChange) {
      onLocationChange(latNum, lngNum);
    }
  };

  // Center map on selected location when switching to map view
  useEffect(() => {
    if (mode === 'map' && latitude && longitude) {
      setMapCenter({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
    }
  }, [mode, latitude, longitude]);

  return (
    <div className="latlong-section" style={{ position: 'relative' }}>
      <h3 style={{ marginRight: '2.5em' }}>Location Coordinates</h3>
      <button
        className="location-toggle-btn"
        onClick={() => setMode(mode === 'fields' ? 'map' : 'fields')}
        aria-label={mode === 'fields' ? 'Switch to Map' : 'Switch to Fields'}
      >
        {mode === 'fields' ? '📌' : '📝'}
      </button>
      {mode === 'fields' ? (
        <>
          <div className="location-input-row">
            <label htmlFor="latitude">Latitude</label>
            <input
              type="number"
              id="latitude"
              name="latitude"
              step="any"
              min="-90"
              max="90"
              placeholder="e.g. -37.8136"
              value={latitude}
              onChange={handleLatitudeChange}
            />
          </div>
          <div className="location-input-row">
            <label htmlFor="longitude">Longitude</label>
            <input
              type="number"
              id="longitude"
              name="longitude"
              step="any"
              min="-180"
              max="180"
              placeholder="e.g. 144.9631"
              value={longitude}
              onChange={handleLongitudeChange}
            />
          </div>
        </>
      ) : (
        <>
          <div className="location-input-row">
            <MapContainer center={mapCenter} zoom={13} style={{ height: '300px', width: '100%' } as React.CSSProperties}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {latitude !== '' && longitude !== '' && !isNaN(Number(latitude)) && !isNaN(Number(longitude)) && (
                <MapCenterUpdater lat={Number(latitude)} lng={Number(longitude)} />
              )}
              <LocationMarker
                position={
                  latitude !== '' && longitude !== '' && !isNaN(Number(latitude)) && !isNaN(Number(longitude))
                    ? { lat: Number(latitude), lng: Number(longitude) }
                    : null
                }
                onLocationChange={handleMapLocationChange}
              />
            </MapContainer>
          </div>
          {(latitude && longitude) && (
            <div className="location-output-row">
              <label><strong>Selected:</strong></label>
              <span>{parseFloat(latitude).toFixed(5)}, {parseFloat(longitude).toFixed(5)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LocationInputMapToggle;
