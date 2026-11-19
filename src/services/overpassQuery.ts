// Shared by the browser client and the /api/overpass serverless function.
// Kept dependency-free (no "@/" aliases) so Node can load it on Vercel.
// Kept lean (tag lookups only) because public Overpass servers are often busy.

export const buildOverpassQuery = (lat: number, lon: number, radiusKm: number = 5): string => {
  const radius = Math.round(radiusKm * 1000);
  const around = `(around:${radius},${lat},${lon})`;
  return `
    [out:json][timeout:25];
    (
      nwr["amenity"~"^(library|cafe|community_centre|university|college|coworking_space)$"]["name"]${around};
      nwr["office"="coworking"]["name"]${around};
      nwr["building"~"^(university|college|library)$"]["name"]${around};
    );
    out center 250;
  `;
};

export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

/** ~1 km grid, so nearby visitors share one CDN-cached response */
export const roundCoord = (value: number) => Math.round(value * 100) / 100;

interface HedgedOptions {
  endpoints?: string[];
  /** Start the next server if the current ones haven't answered after this long */
  staggerMs?: number;
  /** Give up on everything after this long */
  totalTimeoutMs?: number;
  /** Server-side only; browsers don't allow setting User-Agent */
  userAgent?: string;
}

/**
 * Ask Overpass servers in a staggered race: start with the first, and launch the
 * next one every `staggerMs` (or straight away when one fails). The first good
 * answer wins and the rest are cancelled. A busy server costs ~2.5s, not 20s+.
 */
export function fetchOverpassHedged<T = unknown>(
  query: string,
  { endpoints = OVERPASS_ENDPOINTS, staggerMs = 2500, totalTimeoutMs = 25000, userAgent }: HedgedOptions = {}
): Promise<{ elements: T[]; endpoint: string }> {
  return new Promise((resolve, reject) => {
    const controllers: AbortController[] = [];
    const errors: string[] = [];
    let next = 0;
    let inFlight = 0;
    let done = false;
    let staggerTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (settle: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(staggerTimer);
      clearTimeout(deadline);
      controllers.forEach((c) => c.abort());
      settle();
    };

    const deadline = setTimeout(
      () => finish(() => reject(new Error(`Overpass timed out (${errors.join('; ') || 'no answer'})`))),
      totalTimeoutMs
    );

    const launch = () => {
      if (done || next >= endpoints.length) return;
      const endpoint = endpoints[next++];
      const controller = new AbortController();
      controllers.push(controller);
      inFlight++;
      clearTimeout(staggerTimer);
      staggerTimer = setTimeout(launch, staggerMs);

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      };
      if (userAgent) headers['User-Agent'] = userAgent;

      fetch(endpoint, {
        method: 'POST',
        headers,
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { elements?: T[]; remark?: string };
          if (!Array.isArray(data.elements)) throw new Error('bad response');
          // Overpass reports query timeouts as a 200 with a remark and no data
          if (data.elements.length === 0 && data.remark) throw new Error(data.remark.slice(0, 80));
          finish(() => resolve({ elements: data.elements!, endpoint }));
        })
        .catch((err: unknown) => {
          if (done) return;
          inFlight--;
          errors.push(`${new URL(endpoint).host}: ${err instanceof Error ? err.message : String(err)}`);
          if (next < endpoints.length) launch();
          else if (inFlight === 0) finish(() => reject(new Error(`All Overpass servers failed (${errors.join('; ')})`)));
        });
    };

    launch();
  });
}
