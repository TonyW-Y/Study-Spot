import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location } from '@/types/location';
import { getCategory } from '@/lib/categories';
import { useTheme } from 'next-themes';
import { DEFAULT_CENTER, MAPBOX_TOKEN, createPinElement, mapStyleFor as styleFor } from '@/lib/mapbox';

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

// Popup sits just above the pin (pin is ~53px tall, ~56px when lifted on hover)
const POPUP_OFFSET: mapboxgl.PopupOptions['offset'] = {
  top: [0, 8],
  'top-left': [0, 8],
  'top-right': [0, 8],
  bottom: [0, -60],
  'bottom-left': [0, -60],
  'bottom-right': [0, -60],
  left: [18, -30],
  right: [-18, -30],
};

const buildPopupContent = (location: Location) => {
  const meta = getCategory(location.category);
  const root = document.createElement('div');
  root.className = 'cozy-popup';
  root.style.setProperty('--pin', meta.color);

  const title = document.createElement('div');
  title.className = 'cozy-popup-title';
  title.textContent = location.name;

  const row = document.createElement('div');
  row.className = 'cozy-popup-meta';
  const chip = document.createElement('span');
  chip.className = 'cozy-popup-chip';
  chip.textContent = `${meta.emoji} ${meta.label}`;
  const rating = document.createElement('span');
  rating.className = 'cozy-popup-rating';
  rating.textContent = `★ ${location.ratings.overall.toFixed(1)}`;
  row.append(chip, rating);
  if (location.distance) {
    const dist = document.createElement('span');
    dist.className = 'cozy-popup-dist';
    dist.textContent = location.distance;
    row.append(dist);
  }

  root.append(title, row);
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
      const el = createPinElement(meta.emoji, meta.color);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', location.name);

      const popup = new mapboxgl.Popup({
        offset: POPUP_OFFSET,
        closeButton: false,
        closeOnClick: false,
        maxWidth: '260px',
        className: 'cozy-hover-popup',
      }).setDOMContent(buildPopupContent(location));

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([location.longitude, location.latitude])
        .addTo(instance);

      const open = () => clickRef.current?.(location.id);
      el.addEventListener('click', open);
      el.addEventListener('keydown', (e) => e.key === 'Enter' && open());
      const show = () => popup.setLngLat([location.longitude, location.latitude]).addTo(instance);
      el.addEventListener('mouseenter', show);
      el.addEventListener('mouseleave', () => popup.remove());
      el.addEventListener('focus', show);
      el.addEventListener('blur', () => popup.remove());

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
