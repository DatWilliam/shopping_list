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
  catOrder: [...DEFAULT_ORDER],
  recipes: [],       // { id, title, servings, tags, ings: [{ t, f?, l?, ln? }], steps, notes, created, updated }
  draft: null,       // ungespeicherter Rezept-Entwurf { key, data }
  hintDone: false,
});

function normalize(s) {
  const out = { ...fresh(), ...(s && typeof s === 'object' ? s : {}) };
  for (const k of ['list', 'recent', 'recipes']) if (!Array.isArray(out[k])) out[k] = [];
  for (const k of ['customFoods', 'catOverride']) {
    if (!out[k] || typeof out[k] !== 'object' || Array.isArray(out[k])) out[k] = {};
  }
  const order = Array.isArray(out.catOrder) ? out.catOrder.filter(id => DEFAULT_ORDER.includes(id)) : [];
  out.catOrder = [...new Set([...order, ...DEFAULT_ORDER])];
  out.list = out.list.filter(i => i && i.id && i.f);
  out.recipes = out.recipes
    .filter(r => r && r.id && typeof r.title === 'string')
    .map(r => ({ servings: 1, tags: [], steps: '', notes: '', ...r, ings: Array.isArray(r.ings) ? r.ings.filter(g => g && typeof g.t === 'string') : [] }));
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) {
    console.warn('Gespeicherte Daten konnten nicht gelesen werden', e);
  }
  return fresh();
}

export const state = load();

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
  const { draft, ...data } = state;
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
