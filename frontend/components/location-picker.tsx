'use client';

import { useEffect, useRef, useState } from 'react';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: string, lng: string, city?: string, country?: string, stateRegion?: string) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState<string>('');

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const address = data.address ?? {};
      const city = address.city || address.town || address.village || address.county || '';
      const country = address.country || '';
      const stateRegion = address.state || address.region || address.county || '';
      setResolvedLocation([city, stateRegion, country].filter(Boolean).join(', '));
      onChange(lat.toFixed(6), lng.toFixed(6), city, country, stateRegion);
    } catch {
      onChange(lat.toFixed(6), lng.toFixed(6));
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const loadLeaflet = async () => {
      if (window.L) {
        initMap();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = window.L;
      const map = L.map(mapRef.current).setView([latitude, longitude], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20,
      }).addTo(map);

      const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setIsLoaded(true);
      reverseGeocode(latitude, longitude);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && isLoaded) {
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude, isLoaded]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">Click on the map to select your location</p>
      <div ref={mapRef} className="h-64 w-full rounded-xl border border-gray-300 z-0 overflow-hidden" style={{ minHeight: '256px' }} />
      {resolvedLocation && <p className="text-sm text-[#00349B]">Detected location: {resolvedLocation}</p>}
    </div>
  );
}

declare global {
  interface Window {
    L: any;
  }
}
