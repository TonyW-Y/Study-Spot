// Vercel serverless function: fetches study spots from OpenStreetMap's Overpass API
// on the server (no browser CORS issues) and lets Vercel's CDN cache each area.
// Only StudySpot's own query is ever sent, so this is not an open proxy.
// The ".js" extension is required: Vercel runs this as a native Node ES module.
import { buildOverpassQuery, fetchOverpassHedged, roundCoord } from '../src/services/overpassQuery.js';

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
  const query = buildOverpassQuery(roundCoord(lat), roundCoord(lon), radiusKm);

  try {
    const { elements, endpoint } = await fetchOverpassHedged(query, {
      userAgent: USER_AGENT,
      totalTimeoutMs: 40000,
    });
    // Study spots rarely change: cache each area on the CDN for a week, and serve it
    // stale for up to 30 days while a fresh copy is fetched in the background
    return json({ elements, source: new URL(endpoint).host }, 200,
      'public, s-maxage=604800, stale-while-revalidate=2592000');
  } catch (err) {
    return json({ error: 'All Overpass servers are busy', details: err instanceof Error ? err.message : String(err) },
      502, 'no-store');
  }
}
