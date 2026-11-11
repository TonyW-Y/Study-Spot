import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location } from '@/types/location';
import { getCategory } from '@/lib/categories';

interface MapProps {
  locations: Location[];
  onLocationClick?: (locationId: string) => void;
  className?: string;
  userLocation?: { latitude: number; longitude: number } | null;
}

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  '';

const DEFAULT_CENTER: [number, number] = [-122.4194, 37.7749];

const markerColor = (category: string) => getCategory(category).color;

const buildPopupContent = (location: Location) => {
  const root = document.createElement('div');
  root.style.padding = '4px';
  const title = document.createElement('div');
  title.style.fontWeight = '600';
  title.style.fontSize = '13px';
  title.textContent = location.name;
  const meta = document.createElement('div');
  meta.style.fontSize = '12px';
  meta.style.opacity = '0.75';
  meta.textContent = `${getCategory(location.category).label} · ★ ${location.ratings.overall.toFixed(1)}`;
  root.append(title, meta);
  return root;
};

const Map = ({ locations, onLocationClick, className, userLocation }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const clickRef = useRef(onLocationClick);
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    clickRef.current = onLocationClick;
  }, [onLocationClick]);

  // Create the map exactly once
  useEffect(() => {
    if (!mapContainer.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: DEFAULT_CENTER,
      zoom: 12,
    });
    instance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current = instance;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      userMarkerRef.current = null;
      instance.remove();
      map.current = null;
    };
  }, []);

  // Sync location markers without re-creating the map
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    locations.forEach((location) => {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 30px; height: 30px; background-color: ${markerColor(location.category)};
        border: 3px solid white; border-radius: 50%; cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', location.name);

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: false, closeOnClick: false })
        .setDOMContent(buildPopupContent(location));

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .addTo(instance);

      el.addEventListener('click', () => clickRef.current?.(location.id));
      el.addEventListener('mouseenter', () =>
        popup.setLngLat([location.longitude, location.latitude]).addTo(instance)
      );
      el.addEventListener('mouseleave', () => popup.remove());

      markersRef.current.push(marker);
    });
  }, [locations]);

  // User marker + center once when location first arrives
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    if (!userLocation) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    const lngLat: [number, number] = [userLocation.longitude, userLocation.latitude];
    if (!userMarkerRef.current) {
      const userEl = document.createElement('div');
      userEl.style.cssText = `
        width: 16px; height: 16px; background-color: #3B82F6; border: 2px solid white;
        border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      userMarkerRef.current = new mapboxgl.Marker(userEl).setLngLat(lngLat).addTo(instance);
    } else {
      userMarkerRef.current.setLngLat(lngLat);
    }
    if (!hasCenteredRef.current) {
      hasCenteredRef.current = true;
      instance.jumpTo({ center: lngLat, zoom: 13 });
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
