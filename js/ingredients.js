// Zutaten verstehen: „200 g Hähnchenbrust“ → Menge, Einheit, Lebensmittel, Gramm, Nährwerte.
// Reine Logik ohne DOM – lässt sich auch mit Node testen.

/** Kleinbuchstaben, ß→ss, Akzente/Umlaute entfernen (ä→a). */
export const fold = s => String(s ?? '').toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
/** Wie fold, zusätzlich ohne Leer- und Sonderzeichen, „ae“ = „ä“: „Oliven Öl“ → „olivenol“, „Kaese“ → „kase“. */
export const compact = s => fold(s).replace(/[^a-z0-9]/g, '').replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');

// ---------- Einheiten ----------
// g/ml: Umrechnung in Gramm bzw. Milliliter; piece: Stückgewicht des Lebensmittels verwenden.
const U = (label, plural, aliases, base = {}) => ({ label, plural, aliases: aliases.split(' '), ...base });
export const UNITS = {
  g: U('g', 'g', 'g gr gramm', { g: 1 }),
  kg: U('kg', 'kg', 'kg kilo kilogramm', { g: 1000 }),
  mg: U('mg', 'mg', 'mg', { g: 0.001 }),
  ml: U('ml', 'ml', 'ml milliliter', { ml: 1 }),
  cl: U('cl', 'cl', 'cl', { ml: 10 }),
  dl: U('dl', 'dl', 'dl', { ml: 100 }),
  l: U('l', 'l', 'l liter ltr', { ml: 1000 }),
  el: U('EL', 'EL', 'el essloffel essl', { ml: 15 }),
  tl: U('TL', 'TL', 'tl teeloffel teel', { ml: 5 }),
  prise: U('Prise', 'Prisen', 'prise prisen', { g: 0.4 }),
  msp: U('Msp.', 'Msp.', 'msp messerspitze messerspitzen', { g: 0.3 }),
  schuss: U('Schuss', 'Schuss', 'schuss', { ml: 10 }),
  spritzer: U('Spritzer', 'Spritzer', 'spritzer', { ml: 2 }),
  tasse: U('Tasse', 'Tassen', 'tasse tassen', { ml: 200 }),
  handvoll: U('Handvoll', 'Handvoll', 'handvoll', { g: 30 }),
  stk: U('Stück', 'Stück', 'stk stuck stucke st', { piece: true }),
  zehe: U('Zehe', 'Zehen', 'zehe zehen', { g: 4 }),
  scheibe: U('Scheibe', 'Scheiben', 'scheibe scheiben', { g: 25 }),
  dose: U('Dose', 'Dosen', 'dose dosen', { g: 400 }),
  packung: U('Packung', 'Packungen', 'packung packungen pck pkg pack packchen paket pakete beutel tute tuten schale schalen', { g: 250 }),
  becher: U('Becher', 'Becher', 'becher', { g: 200 }),
  glas: U('Glas', 'Gläser', 'glas glaser', { g: 300 }),
  flasche: U('Flasche', 'Flaschen', 'flasche flaschen', { ml: 700 }),
  tube: U('Tube', 'Tuben', 'tube tuben', { g: 200 }),
  bund: U('Bund', 'Bund', 'bund bunde bundchen', { g: 50 }),
  zweig: U('Zweig', 'Zweige', 'zweig zweige', { g: 1 }),
  blatt: U('Blatt', 'Blätter', 'blatt blatter', { g: 0.5 }),
  stange: U('Stange', 'Stangen', 'stange stangen stangel', { piece: true }),
  kopf: U('Kopf', 'Köpfe', 'kopf kopfe', { piece: true }),
  knolle: U('Knolle', 'Knollen', 'knolle knollen', { g: 50 }),
  wuerfel: U('Würfel', 'Würfel', 'wurfel', { g: 10 }),
  tafel: U('Tafel', 'Tafeln', 'tafel tafeln', { g: 100 }),
  kugel: U('Kugel', 'Kugeln', 'kugel kugeln', { g: 125 }),
  platte: U('Platte', 'Platten', 'platte platten', { g: 20 }),
  topf: U('Topf', 'Töpfe', 'topf', { g: 30 }),
  rolle: U('Rolle', 'Rollen', 'rolle rollen', { g: 275 }),
  kiste: U('Kiste', 'Kisten', 'kiste kisten kasten', {}),
};
const UNIT_BY_ALIAS = new Map();
for (const [key, u] of Object.entries(UNITS)) for (const a of u.aliases) UNIT_BY_ALIAS.set(a, key);

// Größenangaben vor der Einheit oder dem Lebensmittel: „1 kleine Zwiebel“, „1 gehäufter EL“
const ADJ = {
  klein: 0.7, kleine: 0.7, kleiner: 0.7, kleines: 0.7, kleinen: 0.7,
  gross: 1.4, grosse: 1.4, grosser: 1.4, grosses: 1.4, grossen: 1.4,
  mittel: 1, mittlere: 1, mittlerer: 1, mittelgross: 1, mittelgrosse: 1, mittelgrosser: 1, mittelgrossen: 1, medium: 1,
  gestrichen: 1, gestrichene: 1, gestrichener: 1, gehauft: 1.4, gehaufte: 1.4, gehaufter: 1.4,
  knapp: 0.9, knappe: 0.9, knapper: 0.9, gut: 1.1, gute: 1.1, guter: 1.1, reichlich: 1.2,
};
const NUM_WORDS = {
  ein: 1, eine: 1, einen: 1, einem: 1, einer: 1, eins: 1, zwei: 2, drei: 3, vier: 4, funf: 5, sechs: 6,
  sieben: 7, acht: 8, neun: 9, zehn: 10, halb: 0.5, halbe: 0.5, halber: 0.5, halbes: 0.5, halben: 0.5,
  anderthalb: 1.5, eineinhalb: 1.5,
};
const FRAC = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };

const NUM = String.raw`(?:\d+[.,]\d+|\d+\s+\d+\/\d+|\d+\/\d+|\d+\s?[½¼¾⅓⅔⅛]|\d+|[½¼¾⅓⅔⅛])`;
const LEAD_RE = new RegExp(String.raw`^\s*(?:(?:ca\.?|circa|etwa|ungef[äa]hr|~)\s*)?(${NUM})(?:\s*(?:-|–|bis)\s*(${NUM}))?(?:\s*[x×](?=\s))?(?!\d)`, 'i');
const TRAIL_RE = new RegExp(String.raw`\s(?:ca\.?\s*|~\s*)?(${NUM})(?:\s*(?:-|–)\s*(${NUM}))?\s*([A-Za-zÄÖÜäöüß]+\.?)?\s*$`);
const WORD_RE = /^\s*([A-Za-zÄÖÜäöüß]+)\.?(?=[\s,;:)]|$)/;

export function parseNum(s) {
  s = String(s).trim();
  let m, n;
  if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/))) n = +m[1] + m[2] / m[3];
  else if ((m = s.match(/^(\d+)\/(\d+)$/))) n = m[1] / m[2];
  else if ((m = s.match(/^(\d+)\s?([½¼¾⅓⅔⅛])$/))) n = +m[1] + FRAC[m[2]];
  else if (s in FRAC) n = FRAC[s];
  else n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Menge am Anfang von s: „2-3 …“, „½ …“, „eine …“. Liefert Position der Zahl(en) relativ zu s. */
function amountAt(s) {
  let m = s.match(LEAD_RE);
  if (m) {
    const qty = parseNum(m[1]);
    if (qty == null) return null;
    const a = m[0].indexOf(m[1]);
    const b = m[2] ? m[0].lastIndexOf(m[2]) + m[2].length : a + m[1].length;
    return { qty, qty2: m[2] ? parseNum(m[2]) : null, span: [a, b], rest: s.slice(m[0].length) };
  }
  m = s.match(WORD_RE);
  if (m && NUM_WORDS[fold(m[1])] != null) {
    const a = m[0].indexOf(m[1]);
    return { qty: NUM_WORDS[fold(m[1])], qty2: null, span: [a, a + m[1].length], rest: s.slice(m[0].length) };
  }
  return null;
}

/** Einheit (und davor evtl. eine Größenangabe) am Anfang von rest. */
function takeUnit(rest) {
  let factor = 1, unit = null, m = rest.match(WORD_RE);
  if (m && ADJ[fold(m[1])] != null) {
    factor = ADJ[fold(m[1])];
    rest = rest.slice(m[0].length);
    m = rest.match(WORD_RE);
  }
  if (m) {
    const k = UNIT_BY_ALIAS.get(fold(m[1]));
    if (k) { unit = k; rest = rest.slice(m[0].length); }
  }
  return { unit, factor, rest };
}

/**
 * Zerlegt eine Zutatenzeile.
 * Ergebnis: { qty, qty2, unit, factor, name, span } – span = Position der Zahl(en) im Originaltext
 * (zum Umrechnen auf andere Portionen). Zusätzlich { empty } oder { header } für Leer- und Überschriftszeilen.
 */
export function parseLine(raw) {
  const text = String(raw ?? '');
  const trimmed = text.trim();
  if (!trimmed) return { empty: true, name: '', qty: null };
  if (/^#/.test(trimmed) || (/:$/.test(trimmed) && !/\d/.test(trimmed))) {
    return { header: true, name: trimmed.replace(/^#+\s*/, '').replace(/:$/, '').trim(), qty: null };
  }
  const bullet = text.match(/^\s*(?:[-*•·]\s+)?/)[0];
  const s = text.slice(bullet.length);
  let qty = null, qty2 = null, unit = null, factor = 1, span = null, rest = s;

  const lead = amountAt(s);
  if (lead) {
    ({ qty, qty2 } = lead);
    span = [bullet.length + lead.span[0], bullet.length + lead.span[1]];
    ({ unit, factor, rest } = takeUnit(lead.rest));
  }
  const restOff = text.length - rest.length;
  // Klammern ausblenden (gleiche Länge, damit Positionen stimmen)
  let masked = rest.replace(/\([^)]*\)/g, m => ' '.repeat(m.length));

  // „Hühnerbrust (~200g)“ oder „Möhre (eine)“
  if (qty == null) {
    for (const pm of rest.matchAll(/\(([^)]*)\)/g)) {
      const r = amountAt(pm[1]);
      if (!r) continue;
      const tu = takeUnit(r.rest);
      ({ qty, qty2 } = r);
      ({ unit, factor } = tu);
      const base = restOff + pm.index + 1;
      span = [base + r.span[0], base + r.span[1]];
      break;
    }
  }
  // „Zwiebeln 2“ oder „Milch 1 l“
  if (qty == null) {
    const t = masked.match(TRAIL_RE);
    if (t) {
      const uk = t[3] ? UNIT_BY_ALIAS.get(fold(t[3].replace(/\.$/, ''))) : null;
      const q = parseNum(t[1]);
      if (q != null && (uk || (!t[3] && q < 100))) {
        qty = q; qty2 = t[2] ? parseNum(t[2]) : null; unit = uk || null;
        const a = t.index + t[0].indexOf(t[1]);
        const b = t[2] ? t.index + t[0].lastIndexOf(t[2]) + t[2].length : a + t[1].length;
        span = [restOff + a, restOff + b];
        masked = masked.slice(0, t.index);
      }
    }
  }
  // Zusätze nach Komma abschneiden („Zwiebel, fein gehackt“), aber „1,5%“ stehen lassen
  let name = masked.split(/,(?!\d)/)[0].replace(/\s+/g, ' ').trim().replace(/^(?:von|vom)\s+/i, '');
  if (!name && unit) { name = UNITS[unit].label; unit = null; }
  return { qty, qty2, unit, factor, name, span };
}

// ---------- Editor: Menge | Einheit | Zutat ----------
const EDIT_UNITS = { g: ['g', 1], kg: ['g', 1000], ml: ['ml', 1], cl: ['ml', 10], dl: ['ml', 100], l: ['ml', 1000], el: ['el', 1], tl: ['tl', 1] };
const UNIT_TEXT = { g: 'g', ml: 'ml', el: 'EL', tl: 'TL' };
const numText = n => String(Math.round(n * 100) / 100).replace('.', ',');

/**
 * Zerlegt eine Zeile für die Eingabefelder des Editors: { a: Menge, u: 'stk'|'g'|'ml'|'el'|'tl', n: Zutat }.
 * „200 g Hack“ → 200 | g | Hack, „1 kg Mehl“ → 1000 | g | Mehl, „2 große Zwiebeln“ → 2 | stk | große Zwiebeln.
 * Andere Einheiten („1 Dose Tomaten“) bleiben komplett im Namen stehen – der Parser versteht sie trotzdem.
 */
export function splitIng(text) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  const whole = { a: '', u: 'stk', n: t };
  const p = parseLine(t);
  if (p.empty || p.header) return whole;
  const s = t.replace(/^[-*•·]\s+/, '');
  const lead = amountAt(s);
  if (!lead) return splitTrailing(s) || whole;
  if (s.slice(0, lead.span[0]).trim()) return whole; // „ca. 200 g“ bleibt, wie es ist
  const raw = s.slice(lead.span[0], lead.span[1]);
  const amount = /^[A-Za-zÄÖÜäöüß]/.test(raw) ? fmtQty(lead.qty) : raw; // „eine“ → 1
  const tu = takeUnit(lead.rest);
  if (!tu.unit) return lead.rest.trim() ? { a: amount, u: 'stk', n: lead.rest.trim() } : whole;
  const name = tu.rest.trim();
  if (!name || tu.factor !== 1) return whole;
  if (tu.unit === 'stk') return { a: amount, u: 'stk', n: name };
  const conv = EDIT_UNITS[tu.unit];
  if (!conv) return whole;
  const [u, mul] = conv;
  const a = mul === 1 ? amount : numText(lead.qty * mul) + (lead.qty2 != null ? '-' + numText(lead.qty2 * mul) : '');
  return { a, u, n: name };
}

/** Menge am Ende: „Hack 500 g“, „Zwiebeln 2“, „Milch 1 l“. Klammern und fremde Wörter („Pizza 4 Jahreszeiten“) bleiben stehen. */
function splitTrailing(s) {
  if (/[()]/.test(s)) return null;
  const m = s.match(TRAIL_RE);
  if (!m || m[0].includes('~') || /ca\./i.test(m[0])) return null;
  const n = s.slice(0, m.index).trim();
  const qty = parseNum(m[1]), qty2 = m[2] ? parseNum(m[2]) : null;
  if (!n || qty == null) return null;
  const unit = m[3] ? UNIT_BY_ALIAS.get(fold(m[3].replace(/\.$/, ''))) : null;
  const amount = m[2] ? `${m[1]}-${m[2]}` : m[1];
  if (!m[3]) return qty < 100 ? { a: amount, u: 'stk', n } : null;
  if (unit === 'stk') return { a: amount, u: 'stk', n };
  const conv = unit && EDIT_UNITS[unit];
  if (!conv) return null; // „Tomaten 1 Dose“: so lassen, der Parser versteht es trotzdem
  const [u, mul] = conv;
  return { a: mul === 1 ? amount : numText(qty * mul) + (qty2 != null ? '-' + numText(qty2 * mul) : ''), u, n };
}

/** Gegenstück zu splitIng: Felder → Zeile, die parseLine versteht. */
export function joinIng(g) {
  const a = String(g?.a ?? '').trim();
  const n = String(g?.n ?? '').trim();
  if (!a) return n;
  return [a, UNIT_TEXT[g.u] || '', n].filter(Boolean).join(' ');
}

// Packung bewusst nicht: „2 Gouda“ sind nicht zwangsläufig zwei Packungen
const PACKS = ['becher', 'dose', 'glas', 'flasche', 'tube', 'tafel', 'bund', 'kopf', 'knolle', 'kugel', 'rolle', 'topf'];

/** Gramm für eine geparste Zeile und ein Lebensmittel (oder null, wenn unbekannt). */
export function toGrams(p, food) {
  if (!p || p.qty == null || !food) return null;
  const q = (p.qty2 != null ? (p.qty + p.qty2) / 2 : p.qty) * (p.factor || 1);
  const u = p.unit ? UNITS[p.unit] : null;
  const fu = food.u || {};
  if (p.unit && fu[p.unit] != null) return q * fu[p.unit];
  if (!u || u.piece) {
    if (food.p) return q * food.p;
    // „1 Saure Sahne“ = 1 Becher, „1 Kokosmilch“ = 1 Dose
    const pack = (!u || p.unit === 'stk') && PACKS.find(k => fu[k] != null);
    return pack ? q * fu[pack] : null;
  }
  if (u.g != null) return q * u.g;
  if (u.ml != null) return q * u.ml * (fu.ml != null ? fu.ml : (food.d || 1));
  return null;
}

// ---------- Lebensmittel finden ----------
const SUFFIXES = ['', 'n', 'en', 'e', 's', 'er', 'nen'];

/** Suchindex: pro Lebensmittel alle Namen in kompakter Form. */
export function buildIndex(foods) {
  return foods.map(food => ({
    food,
    keys: [...new Set([food.n, ...(food.a || [])].map(compact).filter(Boolean))],
  }));
}

/**
 * Bestes Lebensmittel für einen Zutatennamen. Bevorzugt lange, spezifische Treffer –
 * bei deutschen Komposita zählt das Ende („Basmatireis“ → Reis, „Weizenmehl“ → Mehl).
 * weak = unsicherer Treffer (nur Wortanfang oder Teilstück).
 */
export function matchFood(name, index) {
  const q = compact(name);
  if (q.length < 2) return null;
  const words = fold(name).split(/[^a-z0-9]+/).filter(w => w.length >= 3);
  let best = null;
  for (const { food, keys } of index) {
    for (const k of keys) {
      let score = 0, weak = false;
      if (SUFFIXES.some(x => q === k + x || k === q + x)) score = 1000 + k.length;
      else if (k.length >= 3 && SUFFIXES.some(x => q.endsWith(k + x))) score = k.length * 10 + 30;
      else if (k.length >= 3 && words.some(w => SUFFIXES.some(x => w === k + x))) score = k.length * 10 + 25;
      else if (k.length >= 4 && q.startsWith(k)) { score = k.length * 10 + 15; weak = true; }
      else if (k.length >= 5 && q.includes(k)) { score = k.length * 10; weak = true; }
      else if (q.length >= 4 && k.startsWith(q)) { score = q.length * 10 + 5; weak = true; }
      if (score > (best?.score ?? 0)) best = { food, score, weak };
    }
  }
  return best;
}

/**
 * Suche fürs Hinzufügen zur Einkaufsliste.
 * exact = genau dieser Name, alias = genau ein Alternativname (z. B. „Klopapier“),
 * strong = der Hauptname beginnt so.
 */
export function searchFoods(query, index, limit = 12) {
  const q = compact(query);
  if (!q) return [];
  const out = [];
  for (const { food, keys } of index) {
    let best = 0, alias = false;
    keys.forEach((k, i) => {
      const main = i === 0;
      let s = 0;
      if (SUFFIXES.some(x => k === q + x || q === k + x)) s = main ? 102 : 100;
      else if (k.startsWith(q)) s = (main ? 80 : 64) - Math.min(20, k.length - q.length) * 0.5;
      else if (q.length >= 3 && k.includes(q)) s = main ? 50 : 40;
      else if (k.length >= 3 && q.endsWith(k)) s = 40 + k.length; // Komposita: „Bio-Vollmilch“ → Milch
      if (s > best) { best = s; alias = !main && s >= 100; }
    });
    if (best > 0) out.push({ food, score: best, exact: best >= 100, alias, strong: best >= 70 });
  }
  return out.sort((a, b) => b.score - a.score || a.food.n.localeCompare(b.food.n, 'de')).slice(0, limit);
}

// ---------- Analyse & Nährwerte ----------
export const ISSUE = new Set(['nofood', 'noamount', 'nonutr']);
const ZERO = [0, 0, 0, 0, 0];

/**
 * Analysiert eine Rezept-Zutat { t: Text, f: Lebensmittel-ID, l: fest zugeordnet }.
 * ctx: { get(id) → food, match(name) → { food, weak } | null }
 * status: ok | zero (zählt nicht) | noamount | nofood | nonutr | ignored | header | empty
 */
export function analyze(ing, ctx) {
  const p = parseLine(ing.t);
  if (p.empty) return { p, status: 'empty' };
  if (p.header) return { p, status: 'header' };
  let food = null, guess = false;
  if (ing.l) food = ing.f ? ctx.get(ing.f) : null;
  else {
    const r = ctx.match(p.name);
    if (r) { food = r.food; guess = r.weak; }
  }
  if (!food) return { p, status: ing.l ? 'ignored' : 'nofood' };
  if (!food.v) return { p, food, status: 'nonutr', guess };
  const grams = toGrams(p, food);
  if (food.z) return { p, food, grams, nutr: ZERO, status: 'zero', guess };
  if (grams == null) return { p, food, status: 'noamount', guess };
  return { p, food, grams, nutr: food.v.map(x => (x * grams) / 100), status: 'ok', guess };
}

export function sumNutrition(rows) {
  const t = [0, 0, 0, 0, 0];
  for (const a of rows) if (a.nutr) a.nutr.forEach((x, i) => { t[i] += x; });
  return t;
}

// ---------- Mengen formatieren & zusammenführen ----------
const FRAC_OUT = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔' };

export function fmtQty(n) {
  if (n == null || !Number.isFinite(n)) return '';
  const r = Math.round(n * 100) / 100;
  const int = Math.floor(r);
  const frac = Math.round((r - int) * 100) / 100;
  if (frac === 0) return String(int);
  if (FRAC_OUT[frac] && r < 10) return (int || '') + FRAC_OUT[frac];
  if (r >= 100) return String(Math.round(r / 5) * 5);
  if (r >= 10) return String(Math.round(r));
  return String(Math.round(r * 10) / 10).replace('.', ',');
}
export const fmtInt = n => Math.round(n || 0).toLocaleString('de-DE');
export const fmtG = n => {
  const v = n || 0;
  return v < 10 ? String(Math.round(v * 10) / 10).replace('.', ',') : String(Math.round(v));
};

/** Mengenangabe für die Einkaufsliste: „400 g“, „2 Dosen“, „3“. */
export function specFromParsed(p, scale = 1) {
  if (!p || p.qty == null) return '';
  const q = fmtQty(p.qty * scale) + (p.qty2 != null ? '–' + fmtQty(p.qty2 * scale) : '');
  if (!p.unit || p.unit === 'stk') return q;
  const u = UNITS[p.unit];
  const n = (p.qty2 ?? p.qty) * scale;
  return `${q} ${n > 1 ? u.plural : u.label}`;
}

function parseSpec(s) {
  const a = amountAt(s);
  if (!a) return null;
  const tu = takeUnit(a.rest);
  if (tu.rest.trim()) return null;
  return { qty: a.qty, qty2: a.qty2, unit: tu.unit };
}

/** „2“ + „1“ = „3“, „400 g“ + „200 g“ = „600 g“, sonst „a + b“. */
export function mergeSpecs(a, b) {
  a = (a || '').trim(); b = (b || '').trim();
  if (!a) return b;
  if (!b) return a;
  const pa = parseSpec(a), pb = parseSpec(b);
  if (pa && pb && pa.unit === pb.unit && pa.qty2 == null && pb.qty2 == null) {
    return specFromParsed({ qty: pa.qty + pb.qty, unit: pa.unit });
  }
  return `${a} + ${b}`;
}

/** Zeile mit umgerechneter Menge, Formatierung des Originals bleibt erhalten. */
export function scaledText(text, p, f) {
  if (f === 1 || !p || !p.span || p.qty == null) return text;
  const q = fmtQty(p.qty * f) + (p.qty2 != null ? '–' + fmtQty(p.qty2 * f) : '');
  return text.slice(0, p.span[0]) + q + text.slice(p.span[1]);
}

// ---------- Saison ----------
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'];
export function inSeason(s, month = new Date().getMonth()) {
  if (!s) return false;
  const f = fold(s);
  if (f.includes('ganzjahr')) return true;
  const m = f.match(/([a-z]{3})[a-z]*\s*[–-]\s*([a-z]{3})/);
  if (!m) return false;
  const a = MONTHS.indexOf(m[1]), b = MONTHS.indexOf(m[2]);
  if (a < 0 || b < 0) return false;
  return a <= b ? month >= a && month <= b : month >= a || month <= b;
}
