import type { Location } from '@/types/location';
import { readJSON, writeJSON } from './storage';

interface NearbyCache {
  center: { latitude: number; longitude: number };
  label?: string;
  savedAt: number;
  locations: Location[];
}

const KEY = 'nearby';
const MAX_AGE_MS = 1000 * 60 * 60 * 6; // 6 hours

export const saveNearby = (data: Omit<NearbyCache, 'savedAt'>) =>
  writeJSON<NearbyCache>(KEY, { ...data, savedAt: Date.now() });

export const loadNearby = (): NearbyCache | null => {
  const cached = readJSON<NearbyCache | null>(KEY, null);
  if (!cached || Date.now() - cached.savedAt > MAX_AGE_MS) return null;
  return cached;
};

export const findCachedLocation = (id: string): Location | undefined =>
  readJSON<NearbyCache | null>(KEY, null)?.locations.find((l) => l.id === id);
