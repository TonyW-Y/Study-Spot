// Vercel serverless function: fetches study spots from OpenStreetMap's Overpass API
// on the server (no browser CORS issues) and lets Vercel's CDN cache each area.
// Only StudySpot's own query is ever sent, so this is not an open proxy.
import { buildOverpassQuery, OVERPASS_ENDPOINTS } from '../src/services/overpassQuery';

// Overpass usage policy asks clients to identify themselves.
const USER_AGENT = 'StudySpot/1.0 (+https://study-spot-two.vercel.app)';

const json = (body: unknown, status: number, cache: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  });

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));
  const r = Number(url.searchParams.get('r') ?? 5);

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return json({ error: 'Invalid coordinates' }, 400, 'no-store');
  }
  const radiusKm = Math.min(10, Math.max(1, Number.isFinite(r) ? r : 5));
  // Round to ~1 km so nearby visitors share the cached response
  const query = buildOverpassQuery(Math.round(lat * 100) / 100, Math.round(lon * 100) / 100, radiusKm);

  const errors: string[] = [];
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { elements?: unknown[] };
      // Cache good answers on the CDN for a day, serve stale for a week while refreshing
      return json({ elements: data.elements ?? [], source: new URL(endpoint).host }, 200,
        'public, s-maxage=86400, stale-while-revalidate=604800');
    } catch (err) {
      errors.push(`${new URL(endpoint).host}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }
  return json({ error: 'All Overpass servers are busy', details: errors }, 502, 'no-store');
}
