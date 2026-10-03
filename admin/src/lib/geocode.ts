/** IGN Géoplateforme geocoder (no key): addresses and places (POI), France. */
const GEOCODE_URL = "https://data.geopf.fr/geocodage/search";

export interface GeocodeHit {
  label: string;
  lat: number;
  lng: number;
}

/** Up to five places matching the query (empty on an error: the map still works by hand). */
export async function geocode(query: string, fetchImpl: typeof fetch = fetch): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const res = await fetchImpl(`${GEOCODE_URL}?${new URLSearchParams({ q, limit: "5", index: "address,poi" })}`, { headers: { accept: "application/json" } });
    if (!res.ok) return [];
    const body = (await res.json()) as { features?: { geometry?: { coordinates?: number[] }; properties?: { label?: string; name?: string; toponym?: string } }[] };
    return (body.features ?? [])
      .map(f => {
        const [lng, lat] = f.geometry?.coordinates ?? [];
        const label = f.properties?.label ?? f.properties?.toponym ?? f.properties?.name ?? "";
        return typeof lat === "number" && typeof lng === "number" && label ? { label, lat, lng } : null;
      })
      .filter((hit): hit is GeocodeHit => hit !== null);
  } catch {
    return [];
  }
}
