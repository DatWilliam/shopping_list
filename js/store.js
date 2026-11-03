// Speicherung im Browser (localStorage) + Backup als JSON-Datei.
import { CATEGORIES } from './foods.js';

const KEY = 'kuechenzettel.v1';
export const DEFAULT_ORDER = CATEGORIES.map(c => c.id);

const fresh = () => ({
  v: 1,
  list: [],          // Einkaufsliste: { id, f: Lebensmittel-ID, n?: angezeigter Name, s: Menge/Notiz, r: Rezept(e), t }
  recent: [],        // zuletzt gekauft: { f, n?, t }
  customFoods: {},   // eigene Lebensmittel: id → { id, n, c, i, v, p?, src?, custom: true }
  catOverride: {},   // geänderte Kategorie eines Katalog-Lebensmittels
  stores: [],        // Supermärkte: { id, name, order: Kategorie-IDs in Laufreihenfolge }
  storeId: null,     // ausgewählter Supermarkt
  recipes: [],       // { id, title, prepMin?, cookMin?, ings: [{ t, a?, u?, n?, sp?: Gewürz, f?, l?, ln? }], steps, notes, created, updated }
  draft: null,       // ungespeicherter Rezept-Entwurf { key, data }
  cook: null,        // Kochmodus-Fortschritt { id: Rezept, steps: [erledigte Schritte], ings: [bereitgestellte Zutaten] }
  timers: [],        // laufende Küchen-Timer { id, label, dur: Sekunden, end: Zeitstempel, rang?: abgelaufen }
  hintDone: false,
});

/** Reihenfolge bereinigen: unbekannte Bereiche raus, fehlende hinten anhängen. */
export const fixOrder = o => [...new Set([...(Array.isArray(o) ? o.filter(id => DEFAULT_ORDER.includes(id)) : []), ...DEFAULT_ORDER])];

function normalize(s) {
  const src = s && typeof s === 'object' ? s : {};
  const out = { ...fresh(), ...src };
  for (const k of ['list', 'recent', 'recipes']) if (!Array.isArray(out[k])) out[k] = [];
  for (const k of ['customFoods', 'catOverride']) {
    if (!out[k] || typeof out[k] !== 'object' || Array.isArray(out[k])) out[k] = {};
  }
  // Supermärkte (ältere Versionen hatten nur eine Reihenfolge „catOrder“)
  let stores = Array.isArray(src.stores) ? src.stores.filter(x => x && x.id && typeof x.name === 'string') : [];
  if (!stores.length) stores = [{ id: 'standard', name: 'Mein Supermarkt', order: src.catOrder }];
  out.stores = stores.map(x => ({ ...x, order: fixOrder(x.order) }));
  if (!out.stores.some(x => x.id === out.storeId)) out.storeId = out.stores[0].id;
  delete out.catOrder;
  out.timers = Array.isArray(out.timers) ? out.timers.filter(t => t && t.id && Number.isFinite(t.end) && Number.isFinite(t.dur)) : [];
  const ck = out.cook;
  out.cook = ck && ck.id ? { id: ck.id, steps: Array.isArray(ck.steps) ? ck.steps : [], ings: Array.isArray(ck.ings) ? ck.ings : [] } : null;
  out.list = out.list.filter(i => i && i.id && i.f);
  out.recipes = out.recipes
    .filter(r => r && r.id && typeof r.title === 'string')
    .map(r => ({ steps: '', notes: '', ...r, ings: Array.isArray(r.ings) ? r.ings.filter(g => g && typeof g.t === 'string') : [] }));
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) {
    console.warn('Gespeicherte Daten konnten nicht gelesen werden', e);
  }
  return normalize(fresh());
}

export const state = load();
export const activeStore = () => state.stores.find(x => x.id === state.storeId) || state.stores[0];

let timer = null;
export function save() {
  clearTimeout(timer);
  timer = setTimeout(flush, 120);
}
export function flush() {
  clearTimeout(timer);
  timer = null;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error(e);
    window.dispatchEvent(new CustomEvent('save-error', { detail: e }));
  }
}
addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function exportJSON() {
  const { draft, cook, timers, ...data } = state;
  return JSON.stringify({ app: 'kuechenzettel', version: 1, exportedAt: new Date().toISOString(), data }, null, 1);
}

/** Liest eine Backup-Datei. Wirft einen Fehler, wenn es keine ist. */
export function parseBackup(text) {
  const obj = JSON.parse(text);
  const data = obj && obj.app === 'kuechenzettel' ? obj.data : obj;
  if (!data || !Array.isArray(data.recipes) || !Array.isArray(data.list)) throw new Error('Keine Küchenzettel-Datei');
  return { exportedAt: obj.exportedAt || null, data: normalize(data) };
}

/** mode 'replace': alles ersetzen · 'recipes': nur Rezepte und eigene Lebensmittel übernehmen/aktualisieren. */
export function applyBackup(backup, mode = 'replace') {
  if (mode === 'replace') {
    const n = normalize(backup.data);
    for (const k of Object.keys(state)) delete state[k];
    Object.assign(state, n);
  } else {
    for (const [id, f] of Object.entries(backup.data.customFoods)) if (!state.customFoods[id]) state.customFoods[id] = f;
    for (const r of backup.data.recipes) {
      const i = state.recipes.findIndex(x => x.id === r.id);
      if (i < 0) state.recipes.push(r);
      else if ((r.updated || 0) >= (state.recipes[i].updated || 0)) state.recipes[i] = r;
    }
  }
  flush();
}
