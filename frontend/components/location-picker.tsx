'use client';

import { useEffect, useRef, useState } from 'react';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: string, lng: string) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Dynamically load Leaflet CSS and JS
    const loadLeaflet = async () => {
      // Check if already loaded
      if (window.L) {
        initMap();
        return;
      }

      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = window.L;
      const map = L.map(mapRef.current).setView([latitude, longitude], 13);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add marker
      const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
      
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        onChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setIsLoaded(true);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when props change
  useEffect(() => {
    if (markerRef.current && isLoaded) {
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude, isLoaded]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">Click on the map to select your location</p>
      <div 
        ref={mapRef} 
        className="h-64 w-full rounded-xl border border-gray-300 z-0"
        style={{ minHeight: '256px' }}
      />
      <p className="text-xs text-gray-500">
        Selected: {latitude}, {longitude}
      </p>
    </div>
  );
}

// Type declaration for Leaflet
declare global {
  interface Window {
    L: any;
  }
}