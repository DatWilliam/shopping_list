// Nährwerte von Markenprodukten aus Open Food Facts (https://world.openfoodfacts.org, Daten: ODbL).
// Die Suche ist ein kostenloser Gemeinschaftsdienst und manchmal überlastet – daher ein zweiter Versuch.

const FIELDS = 'code,product_name,product_name_de,brands,quantity,nutriments';

function mapProduct(p) {
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n.energy_100g != null) kcal = n.energy_100g / 4.184;
  if (kcal == null) return null;
  const num = x => (typeof x === 'number' && Number.isFinite(x) ? x : Number.parseFloat(x) || 0);
  return {
    code: p.code,
    name: (p.product_name_de || p.product_name || '').trim() || 'Unbenanntes Produkt',
    brand: String(p.brands || '').split(',')[0].trim(),
    quantity: p.quantity || '',
    v: [num(kcal), num(n.proteins_100g), num(n.carbohydrates_100g), num(n.fat_100g), num(n.fiber_100g)],
  };
}

export async function searchOFF(query) {
  const url = 'https://world.openfoodfacts.org/cgi/search.pl?' + new URLSearchParams({
    search_terms: query, search_simple: '1', action: 'process', json: '1', page_size: '20', fields: FIELDS,
  });
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (res.ok) {
        const json = await res.json();
        return (json.products || []).map(mapProduct).filter(Boolean);
      }
      lastError = new Error(`Open Food Facts antwortet nicht (${res.status}).`);
    } catch (e) {
      lastError = e;
    } finally {
      clearTimeout(timeout);
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  if (!navigator.onLine) throw new Error('Keine Internetverbindung.');
  throw new Error('Open Food Facts ist gerade überlastet – versuch es gleich nochmal.', { cause: lastError });
}
