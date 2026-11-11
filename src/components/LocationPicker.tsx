import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";
import { MAPBOX_TOKEN, mapStyleFor } from "@/lib/mapbox";

interface LocationPickerProps {
  center: { latitude: number; longitude: number };
  value: { latitude: number; longitude: number } | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  emoji?: string;
  color?: string;
}

/** Small map where the user clicks (or drags the pin) to place a new spot */
const LocationPicker = ({ center, value, onChange, emoji = "📍", color = "#C9773B" }: LocationPickerProps) => {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const pinEl = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!container.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const instance = new mapboxgl.Map({
      container: container.current,
      style: mapStyleFor(resolvedTheme),
      center: [center.longitude, center.latitude],
      zoom: 14,
    });
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    instance.on("click", (e) => onChangeRef.current({ latitude: e.lngLat.lat, longitude: e.lngLat.lng }));
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- create once
  }, []);

  const themeRef = useRef(resolvedTheme);
  useEffect(() => {
    if (!map.current || themeRef.current === resolvedTheme) return;
    themeRef.current = resolvedTheme;
    map.current.setStyle(mapStyleFor(resolvedTheme));
  }, [resolvedTheme]);

  useEffect(() => {
    map.current?.flyTo({ center: [center.longitude, center.latitude], zoom: 15 });
  }, [center.latitude, center.longitude]);

  // Keep pin appearance in sync with category
  useEffect(() => {
    if (!pinEl.current) return;
    pinEl.current.style.setProperty("--pin", color);
    pinEl.current.firstElementChild!.textContent = emoji;
  }, [emoji, color]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    if (!value) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (!marker.current) {
      const el = document.createElement("div");
      el.className = "cozy-pin is-active";
      el.style.setProperty("--pin", color);
      const span = document.createElement("span");
      span.textContent = emoji;
      el.appendChild(span);
      pinEl.current = el;
      marker.current = new mapboxgl.Marker({ element: el, anchor: "bottom", draggable: true })
        .setLngLat([value.longitude, value.latitude])
        .addTo(instance);
      marker.current.on("dragend", () => {
        const p = marker.current!.getLngLat();
        onChangeRef.current({ latitude: p.lat, longitude: p.lng });
      });
    } else {
      marker.current.setLngLat([value.longitude, value.latitude]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- emoji/color handled above
  }, [value]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={"flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/50 p-6 text-center"}>
        <div className="max-w-xs">
          <div className="mb-2 text-3xl">🗺️</div>
          <p className="font-bold">Map needs a Mapbox token</p>
          <p className="text-sm text-muted-foreground">Add VITE_MAPBOX_TOKEN to a .env file and restart the dev server.</p>
        </div>
      </div>
    );
  }

  return <div ref={container} className="h-64 w-full overflow-hidden rounded-2xl border border-border shadow-inner" />;
};

export default LocationPicker;
