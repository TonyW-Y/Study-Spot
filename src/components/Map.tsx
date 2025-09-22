import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location } from '@/types/location';

interface MapProps {
  locations: Location[];
  onLocationClick?: (locationId: string) => void;
  className?: string;
  userLocation?: { latitude: number; longitude: number } | null;
}

// ✅ Just set your token here, no prompt
const MAPBOX_TOKEN = 'pk.eyJ1IjoibmljaG9sYXNsb29rIiwiYSI6ImNtZjJ4eGk4ZDBnazMybW9vc3JrMWNvaGQifQ.4mhJLBjtalIH-OZ-ETW0-A';

const Map = ({ locations, onLocationClick, className, userLocation }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: userLocation ? [userLocation.longitude, userLocation.latitude] : [-122.4194, 37.7749], // San Francisco default or user
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers
    locations.forEach((location) => {
      const categoryColors = {
        cafe: '#F59E0B',
        library: '#0F766E',
        coworking: '#059669',
        restaurant: '#6B7280',
      };
      const markerColor = categoryColors[location.category as keyof typeof categoryColors] || categoryColors.cafe;

      const markerElement = document.createElement('div');
      markerElement.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: ${markerColor};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const icon = document.createElement('div');
      icon.innerHTML = '📍';
      icon.style.fontSize = '14px';
      markerElement.appendChild(icon);

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current!);

      markerElement.addEventListener('click', () => {
        onLocationClick?.(location.id);
      });

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
        anchor: 'bottom',
      }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${location.name}</h3>
          <p class="text-xs text-gray-600 capitalize">${location.category}</p>
          <div class="flex items-center mt-1">
            <span class="text-xs">★ ${location.ratings.overall.toFixed(1)}</span>
          </div>
        </div>
      `);

      markerElement.addEventListener('mouseenter', () => {
        popup.setLngLat([location.longitude, location.latitude]).addTo(map.current!);
      });

      markerElement.addEventListener('mouseleave', () => {
        popup.remove();
      });
    });

    // Add user marker at init
    if (userLocation) {
      const userEl = document.createElement('div');
      userEl.style.cssText = `
        width: 16px;
        height: 16px;
        background-color: #3B82F6;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      userMarkerRef.current = new mapboxgl.Marker(userEl)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current!);
    }

    return () => {
      map.current?.remove();
    };
  }, [locations, onLocationClick]);

  // Update user marker when userLocation changes after init
  useEffect(() => {
    if (!map.current) return;
    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }
    if (!userMarkerRef.current) {
      const userEl = document.createElement('div');
      userEl.style.cssText = `
        width: 16px;
        height: 16px;
        background-color: #3B82F6;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      userMarkerRef.current = new mapboxgl.Marker(userEl)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current);
    } else {
      userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
    }
  }, [userLocation]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow-md" style={{ minHeight: '400px' }} />
      <button
        type="button"
        disabled={!userLocation}
        onClick={() => {
          if (!map.current || !userLocation) return;
          map.current.flyTo({ center: [userLocation.longitude, userLocation.latitude], zoom: 13 });
        }}
        className={`absolute top-4 left-4 px-3 py-2 rounded-md text-white shadow-md transition-opacity ${
          userLocation ? 'bg-blue-600 hover:bg-blue-700 opacity-100' : 'bg-gray-400 cursor-not-allowed opacity-70'
        }`}
      >
        Center on Me
      </button>
    </div>
  );
};

export default Map;
