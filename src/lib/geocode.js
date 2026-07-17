// Geocodifica indirizzo → lat/lng con Nominatim (OpenStreetMap).
// Volumi bassi (una chiamata quando un professionista salva l'indirizzo):
// entro la policy d'uso, con User-Agent identificativo come richiesto.

const UA = "InfermieriWeb.it/1.0 (contatto: info@infermieriweb.it)";

export async function geocodeAddress({ address = "", city = "", province = "" }) {
  const query = [address, city, province, "Italia"].filter(Boolean).join(", ");
  if (!city && !address) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "it");
    url.searchParams.set("addressdetails", "0");

    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "it" } });
    if (!r.ok) return null;
    const results = await r.json();
    if (!results.length) return null;

    const { lat, lon } = results[0];
    return { lat: Number(lat), lng: Number(lon), matched: results[0].display_name };
  } catch (err) {
    console.error("[geocode] errore:", err.message);
    return null;
  }
}

/**
 * Geocodifica con ripiego: prima indirizzo completo, poi solo città.
 * Ritorna anche `precision`: "indirizzo" | "citta" | null.
 */
export async function geocodeWithFallback({ address, city, province }) {
  if (address) {
    const preciso = await geocodeAddress({ address, city, province });
    if (preciso) return { ...preciso, precision: "indirizzo" };
  }
  if (city) {
    const cittaSola = await geocodeAddress({ city, province });
    if (cittaSola) return { ...cittaSola, precision: "citta" };
  }
  return null;
}

// Scostamento deterministico (~200-450m) per non far sovrapporre i segnaposti
// di professionisti geocodificati sullo stesso comune (precisione "citta").
export function jitterPerId(lat, lng, id) {
  const angolo = (id * 2.399963) % (2 * Math.PI);
  const raggio = 0.0022 + (id % 3) * 0.0009;
  return {
    lat: +(lat + raggio * Math.cos(angolo)).toFixed(6),
    lng: +(lng + raggio * Math.sin(angolo)).toFixed(6),
  };
}

// Geocodifica per la mappa: prova indirizzo/città del profilo, poi ripiega
// sulle zone coperte (comuni singoli, sempre validi). Ritorna lat/lng o null.
export async function geocodePerMappa({ address, city, province, zone = [] }) {
  const preciso = await geocodeWithFallback({ address, city, province });
  if (preciso) return preciso;
  for (const z of zone) {
    const g = await geocodeAddress({ city: z.city, province: z.province });
    if (g) return { ...g, precision: "citta" };
  }
  return null;
}
