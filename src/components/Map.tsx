import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location } from '@/types/location';
import { getCategory } from '@/lib/categories';
import { useTheme } from 'next-themes';
import { DEFAULT_CENTER, MAPBOX_TOKEN, mapStyleFor as styleFor } from '@/lib/mapbox';

interface MapProps {
  locations: Location[];
  onLocationClick?: (locationId: string) => void;
  className?: string;
  userLocation?: { latitude: number; longitude: number } | null;
  highlightedId?: string | null;
  /** Show a 'you are here' dot (false when browsing a searched city) */
  showUserMarker?: boolean;
}

const DEFAULT: [number, number] = [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude];

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

const Map = ({ locations, onLocationClick, className, userLocation, highlightedId, showUserMarker = true }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<globalThis.Map<string, { marker: mapboxgl.Marker; el: HTMLDivElement }>>(new globalThis.Map());
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const clickRef = useRef(onLocationClick);
  const hasCenteredRef = useRef(false);
  const { resolvedTheme } = useTheme();
  const themeRef = useRef(resolvedTheme);

  useEffect(() => {
    clickRef.current = onLocationClick;
  }, [onLocationClick]);

  // Create the map exactly once
  useEffect(() => {
    if (!mapContainer.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: styleFor(themeRef.current),
      center: DEFAULT,
      zoom: 12,
    });
    instance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current = instance;
    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      userMarkerRef.current = null;
      instance.remove();
      map.current = null;
    };
  }, []);

  // Swap basemap with the cozy day/night theme
  useEffect(() => {
    if (!map.current || themeRef.current === resolvedTheme) return;
    themeRef.current = resolvedTheme;
    map.current.setStyle(styleFor(resolvedTheme));
  }, [resolvedTheme]);

  // Sync location markers without re-creating the map
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    locations.forEach((location) => {
      const meta = getCategory(location.category);
      const el = document.createElement('div');
      el.className = 'cozy-pin';
      el.style.setProperty('--pin', meta.color);
      const inner = document.createElement('span');
      inner.textContent = meta.emoji;
      el.appendChild(inner);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', location.name);

      const popup = new mapboxgl.Popup({ offset: 26, closeButton: false, closeOnClick: false })
        .setDOMContent(buildPopupContent(location));

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([location.longitude, location.latitude])
        .addTo(instance);

      const open = () => clickRef.current?.(location.id);
      el.addEventListener('click', open);
      el.addEventListener('keydown', (e) => e.key === 'Enter' && open());
      el.addEventListener('mouseenter', () =>
        popup.setLngLat([location.longitude, location.latitude]).addTo(instance)
      );
      el.addEventListener('mouseleave', () => popup.remove());

      markersRef.current.set(location.id, { marker, el });
    });
  }, [locations]);

  // Highlight the marker for the hovered card
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => el.classList.toggle('is-active', id === highlightedId));
  }, [highlightedId, locations]);

  // User marker + recenter whenever the search center changes
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    if (!userLocation) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    const lngLat: [number, number] = [userLocation.longitude, userLocation.latitude];
    if (!showUserMarker) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
    } else if (!userMarkerRef.current) {
      const userEl = document.createElement('div');
      userEl.className = 'cozy-me';
      userEl.setAttribute('aria-label', 'You are here');
      userMarkerRef.current = new mapboxgl.Marker(userEl).setLngLat(lngLat).addTo(instance);
    } else {
      userMarkerRef.current.setLngLat(lngLat);
    }
    if (!hasCenteredRef.current) {
      hasCenteredRef.current = true;
      instance.jumpTo({ center: lngLat, zoom: 13 });
    } else {
      instance.flyTo({ center: lngLat, zoom: 13, essential: true });
    }
  }, [userLocation, showUserMarker]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`flex items-center justify-center rounded-3xl border border-dashed border-border bg-muted/50 p-6 text-center ${className ?? ""}`}>
        <div className="max-w-xs">
          <div className="mb-2 text-3xl">🗺️</div>
          <p className="font-bold">Map needs a Mapbox token</p>
          <p className="text-sm text-muted-foreground">Add VITE_MAPBOX_TOKEN to a .env file and restart the dev server.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="h-full w-full overflow-hidden rounded-3xl border border-border/70 shadow-md" style={{ minHeight: '320px' }} />
      <button
        type="button"
        disabled={!userLocation}
        onClick={() => {
          if (!map.current || !userLocation) return;
          map.current.flyTo({ center: [userLocation.longitude, userLocation.latitude], zoom: 13 });
        }}
        className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-card/90 px-3.5 py-2 text-sm font-bold text-foreground shadow-md backdrop-blur transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden>🧭</span> Recenter
      </button>
    </div>
  );
};

export default Map;
