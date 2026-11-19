/** Public Mapbox token, set VITE_MAPBOX_TOKEN in a local .env file (never committed) */
export const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

export const DEFAULT_CENTER = { latitude: 37.7749, longitude: -122.4194, label: 'San Francisco' };

export const mapStyleFor = (theme?: string) =>
  theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

/**
 * Builds a teardrop map pin. Mapbox writes its own inline `transform` on the
 * element it positions, so the rotation and hover lift live on inner elements:
 * root (positioned by Mapbox) > lift (hover scale) > pin (rotated) > emoji.
 */
export const createPinElement = (emoji: string, color: string): HTMLDivElement => {
  const root = document.createElement('div');
  root.className = 'cozy-marker';
  root.style.setProperty('--pin', color);
  root.innerHTML =
    '<div class="cozy-pin-lift"><div class="cozy-pin"><span class="cozy-pin-emoji"></span></div></div>';
  root.querySelector('.cozy-pin-emoji')!.textContent = emoji;
  return root;
};

export const setPinAppearance = (root: HTMLElement, emoji: string, color: string) => {
  root.style.setProperty('--pin', color);
  root.querySelector('.cozy-pin-emoji')!.textContent = emoji;
};
