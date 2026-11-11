/** Public Mapbox token, set VITE_MAPBOX_TOKEN in a local .env file (never committed) */
export const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

export const DEFAULT_CENTER = { latitude: 37.7749, longitude: -122.4194, label: 'San Francisco' };

export const mapStyleFor = (theme?: string) =>
  theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
