// Lightweight place search using OpenStreetMap's Nominatim service.
// Only called when the user explicitly submits a search (per Nominatim usage policy).

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  label: string;
}

export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data.length) return null;
  const [first] = data;
  return {
    latitude: parseFloat(first.lat),
    longitude: parseFloat(first.lon),
    label: first.display_name.split(',').slice(0, 2).join(',').trim(),
  };
}
