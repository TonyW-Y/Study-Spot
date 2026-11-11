// Shared by the browser client and the /api/overpass serverless function.
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
];
