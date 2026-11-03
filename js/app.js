// Küchenzettel – Einkaufsliste & Rezepte mit Nährwerten.
import { CAT_BY_ID, FOODS, FOOD_BY_ID } from './foods.js';
import * as I from './ingredients.js';
import { state, save, flush, uid, exportJSON, parseBackup, applyBackup, DEFAULT_ORDER, activeStore } from './store.js';
import { searchOFF } from './off.js';

const VERSION = '1.2';
const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => { s = String(s || '').trim(); return s.charAt(0).toUpperCase() + s.slice(1); };
const { fmtInt, fmtG } = I;
const view = $('#view');

// ---------- Oberflächen-Icons (Linien, 24×24) ----------
const UI = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  up: '<path d="M18 15l-6-6-6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h7"/>',
  more: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  share: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v7h14v-7"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-10-1 12-5 17-9 17z"/><path d="M4 21c4-4 7-7 11-11"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z"/>',
  store: '<path d="M4 10v10h16V10"/><path d="M3 4h18l-1.2 5.2a2.4 2.4 0 0 1-4.6.3 2.6 2.6 0 0 1-5 0 2.4 2.4 0 0 1-4.6-.3L3 4z"/><path d="M10 20v-5h4v5"/>',
  next: '<path d="M9 6l6 6-6 6"/>',
};
const ui = (name, cls = 'ui') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${UI[name]}</svg>`;

// ---------- Lebensmittel ----------
const getFood = id => FOOD_BY_ID.get(id) || state.customFoods[id] || null;
const allFoods = () => [...FOODS, ...Object.values(state.customFoods)];
const catOf = f => state.catOverride[f.id] || f.c || 'sonstiges';
const itemName = (item, food) => item?.n || food?.n || '?';

let ingIdx = null, searchIdx = null, matchCache = new Map();
function invalidateFoods() { ingIdx = searchIdx = null; matchCache = new Map(); }
const ingIndex = () => (ingIdx ||= I.buildIndex(allFoods().filter(f => f.c !== 'drogerie')));
const searchIndex = () => (searchIdx ||= I.buildIndex(allFoods()));
function matchName(name) {
  const k = I.compact(name);
  if (!matchCache.has(k)) matchCache.set(k, I.matchFood(name, ingIndex()));
  return matchCache.get(k);
}
const ctx = { get: getFood, match: matchName };

const iconKey = e => [...e].filter(c => c !== '️').map(c => c.codePointAt(0).toString(16).toUpperCase()).join('-');
function icon(food, cls = 'ico') {
  if (food?.i) return `<svg class="${cls}" aria-hidden="true"><use href="#e${iconKey(food.i)}"/></svg>`;
  const ch = (food?.n || '?').trim().charAt(0).toUpperCase() || '?';
  return `<span class="${cls} ico-letter" aria-hidden="true">${esc(ch)}</span>`;
}
const catOptions = sel => activeStore().order.map(id => `<option value="${id}"${id === sel ? ' selected' : ''}>${esc(CAT_BY_ID[id].n)}</option>`).join('');

/** Eigenes Lebensmittel für einen unbekannten Namen (Kategorie & Icon werden geraten). */
function ensureCustomFood(rawName) {
  const name = cap(rawName);
  if (!name) return null;
  const k = I.compact(name);
  const existing = Object.values(state.customFoods).find(f => I.compact(f.n) === k);
  if (existing) return existing.id;
  const guess = I.matchFood(name, searchIndex());
  const base = guess && !guess.weak ? guess.food : null;
  const id = 'c_' + uid();
  state.customFoods[id] = { id, n: name, c: base ? catOf(base) : 'sonstiges', i: base?.i || null, v: null, custom: true };
  invalidateFoods();
  save();
  return id;
}

// ---------- Toast ----------
const toastEl = $('#toast');
let toastTimer = null;
function toast(msg, { html = false, action, onAction, ms = 3200 } = {}) {
  toastEl.innerHTML = `<div class="toast-msg">${html ? msg : esc(msg)}</div>${action ? `<button class="toast-btn" type="button">${esc(action)}</button>` : ''}`;
  if (action) toastEl.querySelector('.toast-btn').onclick = () => { hideToast(); onAction?.(); };
  toastEl.hidden = false;
  toastEl.classList.remove('show');
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? ms + 1800 : ms);
}
function hideToast() {
  clearTimeout(toastTimer);
  toastEl.classList.remove('show');
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 200);
}

// ---------- Bottom Sheet ----------
const sheetEl = $('#sheet'), backdrop = $('#sheet-backdrop');
let sheetOpen = false, sheetCallbacks = [];
function openSheet(html, { onClose } = {}) {
  sheetEl.innerHTML = `<div class="sheet-grip" aria-hidden="true"></div>${html}`;
  if (onClose) sheetCallbacks.push(onClose);
  if (!sheetOpen) {
    sheetOpen = true;
    sheetEl.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('sheet-open')));
    history.pushState({ sheet: true }, '');
  }
  sheetEl.scrollTop = 0;
}
function hideSheet() {
  if (!sheetOpen) return;
  sheetOpen = false;
  document.body.classList.remove('sheet-open');
  setTimeout(() => { if (!sheetOpen) { sheetEl.hidden = true; backdrop.hidden = true; sheetEl.innerHTML = ''; } }, 220);
  const cbs = sheetCallbacks;
  sheetCallbacks = [];
  cbs.forEach(cb => cb());
}
function closeSheet() {
  if (!sheetOpen) return;
  hideSheet();
  if (history.state?.sheet) history.back();
}
addEventListener('popstate', () => { if (sheetOpen && !history.state?.sheet) hideSheet(); });
backdrop.addEventListener('click', closeSheet);

// =====================================================================
// Einkaufsliste
// =====================================================================
const openCats = new Set();
let search = { first: null };

const onListIds = () => new Set(state.list.map(i => i.f));

function renderList() {
  view.innerHTML = `
  <header class="top">
    <div class="top-row"><h1>Einkaufsliste</h1><span class="count" id="list-count"></span>
      ${state.stores.length > 1 ? `<button type="button" class="store-chip" data-act="store-menu" aria-label="Supermarkt wechseln, ausgewählt: ${esc(activeStore().name)}">${ui('store')}<span>${esc(activeStore().name)}</span>${ui('down')}</button>` : ''}</div>
    <div class="search">
      ${ui('plus')}
      <input id="add-input" type="text" placeholder="Was brauchst du? z. B. 2 Zwiebeln" autocomplete="off" enterkeyhint="done" aria-label="Artikel hinzufügen">
      <button class="icon-btn small" type="button" data-act="clear-add" id="add-clear" hidden aria-label="Eingabe löschen">${ui('x')}</button>
    </div>
  </header>
  <div id="add-results" class="pad" hidden></div>
  <div id="list-body" class="pad"></div>`;
  search = { first: null };
  drawListBody();
}

function tileHtml(food, { on = false, spec = '', item = null, name = '', act } = {}) {
  const label = name || food.n;
  act ||= item ? 'buy' : on ? 'buy-food' : 'add-food';
  return `<button type="button" class="tile${on ? ' on' : ''}" data-act="${act}" data-food="${esc(food.id)}"${item ? ` data-item="${item}"` : ''}${spec ? ` data-spec="${esc(spec)}"` : ''}${name ? ` data-name="${esc(name)}"` : ''}>
    ${icon(food)}<span class="t-name${label.split(' ').some(w => w.length > 12) ? ' long' : ''}">${esc(label)}</span>${spec ? `<span class="t-spec">${esc(spec)}</span>` : ''}</button>`;
}

function drawListBody() {
  const body = $('#list-body');
  if (!body) return;
  const groups = new Map();
  for (const item of state.list) {
    const food = getFood(item.f);
    if (!food) continue;
    const c = catOf(food);
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push({ item, food });
  }
  let html = '';
  if (!state.list.length) {
    html += `<div class="empty">${icon({ i: '🧺' }, 'ico big')}<p><b>Die Liste ist leer.</b></p><p class="muted">Tipp oben ein, was du brauchst – oder such dir unten etwas aus dem Sortiment aus.</p></div>`;
  } else if (!state.hintDone) {
    const touch = matchMedia('(pointer: coarse)').matches;
    html += `<p class="hint-bar">${touch ? 'Antippen = gekauft · Gedrückt halten' : 'Klick = gekauft · Rechtsklick'} = Menge & Infos <button class="link" type="button" data-act="hide-hint">Verstanden</button></p>`;
  }
  for (const cid of activeStore().order) {
    const arr = groups.get(cid);
    if (!arr) continue;
    html += `<section class="group"><h2 class="group-title">${esc(CAT_BY_ID[cid].n)}</h2><div class="tiles">
      ${arr.map(({ item, food }) => tileHtml(food, { on: true, spec: item.s, item: item.id, name: item.n })).join('')}</div></section>`;
  }
  const on = onListIds();
  const recent = state.recent.filter(r => !on.has(r.f) && getFood(r.f)).slice(0, 18);
  if (recent.length) {
    html += `<section class="group"><h2 class="group-title">Zuletzt gekauft</h2><div class="tiles">
      ${recent.map(r => tileHtml(getFood(r.f), { name: r.n })).join('')}</div></section>`;
  }
  html += `<section class="group"><h2 class="group-title">Sortiment</h2>${catalogHtml(on)}</section>`;
  body.innerHTML = html;
  const n = state.list.length;
  const count = $('#list-count');
  if (count) count.textContent = n ? `${n} Artikel` : '';
}

function catalogHtml(on) {
  const foods = allFoods();
  return activeStore().order.map(cid => {
    const inCat = foods.filter(f => catOf(f) === cid);
    if (!inCat.length) return '';
    const c = CAT_BY_ID[cid], open = openCats.has(cid);
    return `<details class="cat" data-cat="${cid}"${open ? ' open' : ''}>
      <summary>${icon(c, 'ico sm')}<span>${esc(c.n)}</span><span class="muted">${inCat.length}</span></summary>
      <div class="tiles">${open ? catTiles(cid, on) : ''}</div></details>`;
  }).join('');
}
function catTiles(cid, on = onListIds()) {
  return allFoods().filter(f => catOf(f) === cid).sort((a, b) => a.n.localeCompare(b.n, 'de'))
    .map(f => tileHtml(f, { on: on.has(f.id) })).join('');
}
document.addEventListener('toggle', e => {
  const d = e.target;
  if (!d.matches?.('details.cat')) return;
  const cid = d.dataset.cat;
  if (d.open) {
    openCats.add(cid);
    const box = d.querySelector('.tiles');
    if (box && !box.children.length) box.innerHTML = catTiles(cid);
  } else openCats.delete(cid);
}, true);

function onAddInput(value) {
  const box = $('#add-results'), body = $('#list-body');
  $('#add-clear').hidden = !value;
  const q = value.trim();
  if (!q) { box.hidden = true; body.hidden = false; search = { first: null }; return; }
  const p = I.parseLine(q);
  const name = (p.name || q).trim();
  const spec = p.name ? I.specFromParsed(p) : '';
  const hits = name ? I.searchFoods(name, searchIndex(), 15) : [];
  const exact = hits.find(h => h.exact);
  const custom = { custom: true, name, spec };
  let order;
  if (exact) order = [exact, ...hits.filter(h => h !== exact)];
  else if (hits[0]?.strong) order = [hits[0], custom, ...hits.slice(1)];
  else order = [custom, ...hits];
  order = order.map(h => (h.custom ? h : { ...h, spec, label: h.alias ? cap(name) : '' }));
  search = { first: order[0] };
  const on = onListIds();
  box.innerHTML = `<div class="tiles">${order.map(h => h.custom
    ? `<button type="button" class="tile custom" data-act="add-custom" data-name="${esc(name)}" data-spec="${esc(spec)}">${icon({ n: name })}<span class="t-name">${esc(cap(name))}</span><span class="t-spec">${spec ? esc(spec) + ' · ' : ''}neu</span></button>`
    : tileHtml(h.food, { spec, on: on.has(h.food.id), name: h.label, act: 'add-food' })).join('')}</div>
    <p class="hint">${spec ? `Menge: <b>${esc(spec)}</b> · ` : ''}Enter fügt den ersten Vorschlag hinzu</p>`;
  box.hidden = false;
  body.hidden = true;
}

function afterAdd(fromSearch) {
  if (fromSearch) {
    const inp = $('#add-input');
    if (inp) { inp.value = ''; onAddInput(''); inp.focus(); }
  }
  drawListBody();
}

function addFood(foodId, spec = '', { name = '', recipe = '', quiet = false } = {}) {
  const food = getFood(foodId);
  if (!food) return null;
  let item = state.list.find(i => i.f === foodId);
  const merged = !!item;
  if (item) {
    item.s = I.mergeSpecs(item.s, spec);
    if (recipe && !(item.r || '').split(', ').includes(recipe)) item.r = item.r ? `${item.r}, ${recipe}` : recipe;
  } else {
    item = { id: uid(), f: foodId, s: spec, r: recipe, t: Date.now() };
    if (name && I.compact(name) !== I.compact(food.n)) item.n = cap(name);
    state.list.push(item);
  }
  save();
  if (!quiet) addedToast(food, item, merged, spec);
  return item;
}

function addedToast(food, item, merged, spec) {
  const bits = [];
  if (food.v && !food.z) bits.push(`${fmtInt(food.v[0])} kcal · ${fmtG(food.v[1])} g Eiweiß pro 100 g`);
  if (food.s && I.inSeason(food.s)) bits.push('hat gerade Saison');
  const nm = itemName(item, food);
  const title = !merged ? `${nm} hinzugefügt` : spec ? `${nm}: jetzt ${item.s}` : `${nm} ist schon auf der Liste`;
  toast(`<b>${esc(title)}</b>${bits.length ? `<small>${esc(bits.join(' · '))}</small>` : ''}`,
    { html: true, action: 'Infos', onAction: () => openFoodSheet(food.id, item.id) });
}

function buyItem(id, el) {
  const idx = state.list.findIndex(i => i.id === id);
  if (idx < 0) return;
  const prevRecent = state.recent;
  const [item] = state.list.splice(idx, 1);
  state.recent = [{ f: item.f, ...(item.n ? { n: item.n } : {}), t: Date.now() }, ...state.recent.filter(r => r.f !== item.f)].slice(0, 40);
  save();
  if (el) { el.classList.add('leaving'); setTimeout(drawListBody, 170); } else drawListBody();
  toast(`${itemName(item, getFood(item.f))} abgehakt`, {
    action: 'Rückgängig',
    onAction: () => { state.list.splice(Math.min(idx, state.list.length), 0, item); state.recent = prevRecent; save(); drawListBody(); },
  });
}

// ---------- Lebensmittel-Infos ----------
function foodInfoHtml(food) {
  let h = '';
  if (food.v && !food.z) {
    const [k, p, c, f, b] = food.v;
    h += `<div class="nutri-box">
      <div class="nutri-head"><span>Nährwerte pro 100 g</span>${food.custom ? '' : '<span class="muted">Richtwerte</span>'}</div>
      <div class="nutri-grid">
        <div class="kcal"><b>${fmtInt(k)}</b><span>kcal</span></div>
        <div><b>${fmtG(p)}</b><span>Eiweiß</span></div>
        <div><b>${fmtG(c)}</b><span>Kohlenh.</span></div>
        <div><b>${fmtG(f)}</b><span>Fett</span></div>
        <div><b>${fmtG(b)}</b><span>Ballastst.</span></div>
      </div>
      ${food.p ? `<p class="muted small">1 Stück ≈ ${fmtInt(food.p)} g ≈ ${fmtInt((k * food.p) / 100)} kcal</p>` : ''}
    </div>`;
    const badges = [];
    if (p >= 10 && p * 4 >= k * 0.2) badges.push('eiweißreich');
    if (b >= 6) badges.push('ballaststoffreich');
    if (k <= 40) badges.push('kalorienarm');
    if (badges.length) h += `<div class="pills">${badges.map(x => `<span class="pill">${x}</span>`).join('')}</div>`;
  } else if (food.z) {
    h += `<p class="muted small">Kaum Kalorien – zählt in Rezepten nicht mit.</p>`;
  } else if (food.custom) {
    h += `<p class="muted small">Noch keine Nährwerte hinterlegt.</p>`;
  }
  if (food.s) h += `<div class="info-row">${ui('leaf')}<div><b>Saison:</b> ${esc(food.s)}${I.inSeason(food.s) ? ' <span class="pill ok">jetzt</span>' : ''}</div></div>`;
  if (food.t) h += `<div class="info-row">${ui('bulb')}<div>${esc(food.t)}</div></div>`;
  if (food.src) h += `<p class="muted small">Quelle: ${esc(food.src)}</p>`;
  if (food.custom) h += `<button type="button" class="btn ghost small" data-act="edit-food" data-food="${esc(food.id)}">${ui('edit')} ${food.v ? 'Nährwerte bearbeiten' : 'Nährwerte eintragen'}</button>`;
  return h;
}

function openFoodSheet(foodId, itemId, name = '') {
  const food = getFood(foodId);
  if (!food) return;
  const item = (itemId && state.list.find(i => i.id === itemId)) || state.list.find(i => i.f === foodId) || null;
  const title = item ? itemName(item, food) : name || food.n;
  openSheet(`
    <div class="sheet-head">
      <div class="big-ico">${icon(food)}</div>
      <div class="grow">
        <h2>${esc(title)}</h2>
        ${title !== food.n ? `<div class="muted small">Im Katalog: ${esc(food.n)}</div>` : ''}
        <label class="cat-pick">${ui('tag')}<select data-change="cat" data-food="${esc(food.id)}" aria-label="Kategorie">${catOptions(catOf(food))}</select></label>
      </div>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="Schließen">${ui('x')}</button>
    </div>
    ${item ? `<label class="field"><span>Menge / Notiz</span><input id="spec-input" data-item="${item.id}" value="${esc(item.s || '')}" placeholder="z. B. 500 g, 2 Stück, Bio" autocomplete="off" enterkeyhint="done"></label>
      ${item.r ? `<p class="muted small">Für: ${esc(item.r)}</p>` : ''}` : ''}
    ${foodInfoHtml(food)}
    <div class="sheet-actions">
      ${item
        ? `<button type="button" class="btn ghost" data-act="sheet-remove" data-item="${item.id}">${ui('trash')} Entfernen</button>
           <button type="button" class="btn primary" data-act="sheet-buy" data-item="${item.id}">${ui('check')} Gekauft</button>`
        : `<button type="button" class="btn primary" data-act="sheet-add" data-food="${esc(food.id)}"${name ? ` data-name="${esc(name)}"` : ''}>${ui('plus')} Auf die Liste</button>`}
    </div>`, { onClose: drawListBody });
}

function setFoodCat(id, cat) {
  const f = getFood(id);
  if (!f) return;
  if (f.custom) f.c = cat;
  else if (cat === f.c) delete state.catOverride[id];
  else state.catOverride[id] = cat;
  invalidateFoods();
  save();
}

// ---------- Eigenes Lebensmittel bearbeiten (+ Open Food Facts) ----------
let FE = null;
function parseDec(s) {
  s = String(s ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function openFoodEditor(foodId, { name = '', onSave } = {}) {
  const f = foodId ? getFood(foodId) : null;
  FE = { id: f?.custom ? f.id : null, onSave, src: f?.src || '', results: [] };
  const v = f?.v || [];
  const num = (i, label) => `<label class="field"><span>${label}</span><input id="fe-v${i}" inputmode="decimal" autocomplete="off" value="${v[i] != null ? String(v[i]).replace('.', ',') : ''}" placeholder="0"></label>`;
  const guess = !f && name ? I.matchFood(name, searchIndex()) : null;
  openSheet(`
    <div class="sheet-head"><h2 class="grow">${f ? 'Lebensmittel bearbeiten' : 'Neues Lebensmittel'}</h2>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="Schließen">${ui('x')}</button></div>
    <label class="field"><span>Name</span><input id="fe-name" value="${esc(f?.n || cap(name))}" placeholder="z. B. Heinz Mango Curry" autocomplete="off"></label>
    <label class="field"><span>Kategorie</span><select id="fe-cat">${catOptions(f ? catOf(f) : guess && !guess.weak ? catOf(guess.food) : 'sonstiges')}</select></label>
    <div class="off-box">
      <div class="off-title">${ui('globe')} Nährwerte online suchen</div>
      <div class="row gap"><input id="off-q" class="grow" value="${esc(f?.n || cap(name))}" placeholder="Marke und Produkt" autocomplete="off" enterkeyhint="search" aria-label="Produkt bei Open Food Facts suchen">
        <button type="button" class="btn" data-act="off-search">Suchen</button></div>
      <p class="muted small">Aus der freien Datenbank Open Food Facts – praktisch für Markenprodukte.</p>
      <div id="off-results" class="pick-list"></div>
    </div>
    <h3 class="sub">Nährwerte pro 100 g</h3>
    <div class="grid-5">${num(0, 'kcal')}${num(1, 'Eiweiß')}${num(2, 'Kohlenh.')}${num(3, 'Fett')}${num(4, 'Ballastst.')}</div>
    <label class="field"><span>Gewicht pro Stück in g (optional)</span><input id="fe-p" inputmode="decimal" autocomplete="off" value="${f?.p ?? ''}" placeholder="z. B. 120"></label>
    <p class="muted small" id="fe-src">${FE.src ? 'Quelle: ' + esc(FE.src) : ''}</p>
    <div class="sheet-actions">
      ${FE.id ? `<button type="button" class="btn ghost danger" data-act="fe-delete">${ui('trash')} Löschen</button>` : ''}
      <button type="button" class="btn primary" data-act="fe-save">${ui('check')} Speichern</button>
    </div>`);
}

// ---------- Lebensmittel zuordnen (für Rezept-Zutaten) ----------
let picker = null;
function openFoodPicker(query, onPick) {
  picker = { onPick };
  openSheet(`
    <div class="sheet-head"><h2 class="grow">Lebensmittel zuordnen</h2>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="Schließen">${ui('x')}</button></div>
    <div class="search">${ui('search')}<input id="fp-q" value="${esc(query)}" placeholder="Lebensmittel suchen" autocomplete="off" enterkeyhint="search"></div>
    <div id="fp-results" class="pick-list"></div>
    <div class="sheet-actions col">
      <button type="button" class="btn" data-act="fp-new"></button>
      <button type="button" class="btn ghost" data-act="fp-none">Nicht mitrechnen</button>
    </div>`);
  drawPicker(query);
}
function drawPicker(q) {
  const hits = I.searchFoods(q, ingIndex(), 20);
  $('#fp-results').innerHTML = hits.length
    ? hits.map(h => `<button type="button" class="pick" data-act="fp-pick" data-id="${esc(h.food.id)}">${icon(h.food, 'ico sm')}
        <span class="grow">${esc(h.food.n)}<small>${esc(CAT_BY_ID[catOf(h.food)]?.n || '')}</small></span>
        <span class="muted small">${h.food.v ? (h.food.z ? '0' : fmtInt(h.food.v[0])) + ' kcal' : '–'}</span></button>`).join('')
    : `<p class="muted small">Nichts im Katalog gefunden. Leg es als eigenes Lebensmittel an – die Nährwerte kannst du online suchen.</p>`;
  $('[data-act="fp-new"]').innerHTML = `${ui('plus')} „${esc(cap(q.trim()) || 'Neues Lebensmittel')}“ neu anlegen`;
}

// =====================================================================
// Rezepte
// =====================================================================
function computeRecipe(r) {
  const rows = r.ings.map(g => I.analyze(g, ctx));
  return {
    rows,
    total: I.sumNutrition(rows),
    grams: rows.reduce((s, a) => s + (a.grams || 0), 0),
    issues: rows.filter(a => I.ISSUE.has(a.status)).length,
    count: rows.filter(a => a.status !== 'header' && a.status !== 'empty').length,
  };
}
const fmtWeight = g => (g >= 1000 ? `${(Math.round(g / 100) / 10).toLocaleString('de-DE')} kg` : `${Math.round(g / 10) * 10 || Math.round(g)} g`);

// Gewürze stehen im Rezept getrennt (hat man meistens da). sp = true/false; fehlt es (alte Rezepte), nach Kategorie raten.
const autoSpice = g => { const f = I.analyze(g, ctx).food; return !!f && catOf(f) === 'gewuerze'; };
const isSpice = g => g.sp ?? autoSpice(g);

function renderRecipes() {
  view.innerHTML = `
  <header class="top">
    <div class="top-row"><h1>Rezepte</h1><span class="count">${state.recipes.length || ''}</span></div>
    ${state.recipes.length ? `<div class="search">${ui('search')}<input id="recipe-search" type="search" placeholder="Rezept oder Zutat suchen" autocomplete="off" aria-label="Rezepte durchsuchen"></div>` : ''}
  </header>
  <div id="recipe-list" class="pad">${recipeListHtml('')}</div>
  ${state.recipes.length ? `<a class="fab" href="#/rezept/neu">${ui('plus')}<span>Neues Rezept</span></a>` : ''}`;
}

function recipeListHtml(q) {
  if (!state.recipes.length) {
    return `<div class="empty">${icon({ i: '📖' }, 'ico big')}<p><b>Noch keine Rezepte.</b></p>
      <p class="muted">Leg dein erstes Rezept an – Kalorien und Eiweiß rechnet die App schon beim Eintippen der Zutaten aus.</p>
      <a class="btn primary" href="#/rezept/neu">${ui('plus')} Rezept anlegen</a></div>`;
  }
  const k = I.compact(q);
  const list = state.recipes
    .filter(r => !k || I.compact([r.title, ...r.ings.map(i => i.t)].join(' ')).includes(k))
    .sort((a, b) => a.title.localeCompare(b.title, 'de'));
  if (!list.length) return `<p class="muted center">Kein Rezept gefunden.</p>`;
  return list.map(r => {
    const c = computeRecipe(r);
    return `<a class="card recipe-card" href="#/rezept/${r.id}">
      <div class="rc-title">${esc(r.title)}</div>
      <div class="rc-meta">${c.count} Zutaten${c.grams ? ` · ≈ ${fmtWeight(c.grams)}` : ''}${c.issues ? ` · <span class="warn-text">${c.issues} ohne Werte</span>` : ''}</div>
      <div class="pills"><span class="pill kcal">${fmtInt(c.total[0])} kcal</span><span class="pill prot">${fmtG(c.total[1])} g Eiweiß</span></div>
    </a>`;
  }).join('');
}

const ISSUE_TEXT = { nofood: 'nicht erkannt – tippen zum Zuordnen', noamount: 'Menge fehlt', nonutr: 'keine Nährwerte – tippen zum Eintragen' };
// „Menge fehlt“ oder – wenn eine Stückzahl dasteht, die sich nicht in Gramm umrechnen lässt – Hinweis auf g/ml
const issueText = a => (a.status === 'noamount' && a.p.qty != null ? 'Stückzahl lässt sich nicht umrechnen – Gramm oder Milliliter wählen' : ISSUE_TEXT[a.status]);

function nutriCardHtml(c) {
  const [k, p, carb, fat, fib] = c.total;
  const kc = p * 4 + carb * 4 + fat * 9 || 1;
  // Balken = Anteil an den Kalorien (Ballaststoffe zählen kaum, daher ohne Balken)
  const macro = (val, label, cls, part) => `<div class="macro ${cls}"><b>${fmtG(val)} g</b><span>${label}</span>
    ${part == null ? '' : `<div class="bar" title="${Math.round((part / kc) * 100)} % der Kalorien"><i style="width:${Math.round((part / kc) * 100)}%"></i></div>`}</div>`;
  const issues = c.rows.map((a, i) => ({ a, i })).filter(x => I.ISSUE.has(x.a.status));
  return `<section class="nutri-card">
    <div class="nutri-main"><b>${fmtInt(k)}</b><span>kcal gesamt</span></div>
    <div class="macros">${macro(p, 'Eiweiß', 'm-p', p * 4)}${macro(carb, 'Kohlenhydr.', 'm-c', carb * 4)}${macro(fat, 'Fett', 'm-f', fat * 9)}${macro(fib, 'Ballastst.', 'm-b', null)}</div>
    ${c.grams ? `<p class="muted small">Alle Zutaten zusammen ≈ ${fmtWeight(c.grams)}</p>` : ''}
    ${issues.length ? `<div class="issues"><p>${ui('alert')} <b>${issues.length === 1 ? '1 Zutat wird' : issues.length + ' Zutaten werden'} nicht mitgerechnet:</b></p>
      <ul>${issues.map(({ a, i }) => `<li><button type="button" class="link" data-act="relink" data-i="${i}">${esc(a.food?.n || a.p.name || '?')}</button> <span class="muted">– ${issueText(a)}</span></li>`).join('')}</ul></div>` : ''}
  </section>`;
}

// ---------- Rezept ansehen ----------
let D = null; // { id, sel: Set }
const splitSteps = s => String(s || '').split(/\n+/).map(x => x.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean);
const selectableRow = a => a.status !== 'header' && a.status !== 'empty';

function renderRecipe(id) {
  const r = state.recipes.find(x => x.id === id);
  if (!r) { location.replace('#/rezepte'); return; }
  if (!D || D.id !== id) D = { id, sel: new Set() };
  view.innerHTML = `
  <header class="top bar">
    <a class="icon-btn" href="#/rezepte" data-act="back" aria-label="Zurück">${ui('back')}</a>
    <div class="grow"></div>
    <a class="btn small" href="#/rezept/${id}/bearbeiten">${ui('edit')} Bearbeiten</a>
  </header>
  <article class="pad recipe" id="recipe-view"></article>
  <div class="cta" id="cta" hidden><button type="button" class="btn primary block" data-act="add-selected"></button></div>`;
  drawRecipe();
}

function drawRecipe() {
  const r = D && state.recipes.find(x => x.id === D.id);
  const el = $('#recipe-view');
  if (!r || !el) return;
  const c = computeRecipe(r);
  const on = onListIds();
  const idx = r.ings.map((g, i) => i);
  const main = idx.filter(i => !isSpice(r.ings[i]));
  const spices = idx.filter(i => isSpice(r.ings[i]));
  const mainSel = main.filter(i => selectableRow(c.rows[i]));
  const allSel = mainSel.length > 0 && mainSel.every(i => D.sel.has(i));
  const li = i => ingLiHtml(r, c.rows[i], i, on);
  const steps = splitSteps(r.steps);
  el.innerHTML = `
    <h1 class="recipe-title">${esc(r.title)}</h1>
    ${nutriCardHtml(c)}
    <section class="block">
      <div class="section-head"><h2>Zutaten</h2>${mainSel.length ? `<button type="button" class="link" data-act="sel-all">${allSel ? 'Auswahl aufheben' : 'Alle auswählen'}</button>` : ''}</div>
      ${c.count ? `<p class="muted small">Wähle aus, was dir fehlt – dann ab auf die Einkaufsliste.</p>` : '<p class="muted">Noch keine Zutaten.</p>'}
      ${main.length ? `<ul class="ing-list">${main.map(li).join('')}</ul>` : ''}
      ${spices.length ? `<h3 class="sub-head">Gewürze</h3><ul class="ing-list">${spices.map(li).join('')}</ul>` : ''}
    </section>
    ${steps.length ? `<section class="block"><h2>Zubereitung</h2><ol class="steps">${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>` : ''}
    ${r.notes?.trim() ? `<section class="block"><h2>Notizen</h2><p class="notes">${esc(r.notes)}</p></section>` : ''}
    <div class="block center"><button type="button" class="btn ghost danger" data-act="delete-recipe">${ui('trash')} Rezept löschen</button></div>`;
  updateCta();
}

function ingLiHtml(r, a, i, on) {
  if (a.status === 'empty') return '';
  if (a.status === 'header') return `<li class="ing-head">${esc(a.p.name)}</li>`;
  const text = r.ings[i].t.replace(/^\s*[-*•·]\s+/, '').trim();
  let right = '';
  if (a.status === 'ok') right = `${fmtInt(a.nutr[0])} kcal`;
  else if (I.ISSUE.has(a.status)) right = `<button type="button" class="warn-chip" data-act="relink" data-i="${i}" aria-label="Nährwerte ergänzen">?</button>`;
  return `<li><label class="ing">
      <input type="checkbox" data-change="sel" data-i="${i}"${D.sel.has(i) ? ' checked' : ''}>
      ${icon(a.food || { n: a.p.name }, 'ico sm')}
      <span class="ing-text">${esc(text)}${a.food && on.has(a.food.id) ? ' <span class="badge">auf der Liste</span>' : ''}</span>
      <span class="ing-kcal">${right}</span>
    </label></li>`;
}

function updateCta() {
  const cta = $('#cta');
  if (!cta) return;
  const n = D.sel.size;
  cta.hidden = !n;
  cta.firstElementChild.innerHTML = `${ui('bag')} ${n} ${n === 1 ? 'Zutat' : 'Zutaten'} auf die Einkaufsliste`;
}

// ---------- Rezept bearbeiten ----------
let E = null; // { id, key, draft, dirty }
// Editor-Zeile: t = Zeile für Parser & Anzeige, a/u/n = Menge, Einheit (stk|g|ml), Zutat, sp = Gewürz
const blankIng = sp => ({ t: '', a: '', u: 'stk', n: '', sp });
function editIng(g) {
  const r = g.n != null ? { a: '', u: 'stk', ...g } : { ...g, ...I.splitIng(g.t) };
  r.sp ??= autoSpice(r);
  return r;
}
/** In beiden Rubriken mindestens eine Zeile zum Eintippen. */
function ensureRows(ings) {
  if (!ings.some(g => !g.sp)) ings.push(blankIng(false));
  if (!ings.some(g => g.sp)) ings.push(blankIng(true));
}

function renderEditor(id) {
  const r = id ? state.recipes.find(x => x.id === id) : null;
  if (id && !r) { location.replace('#/rezepte'); return; }
  const key = id || 'neu';
  const restored = state.draft?.key === key;
  const draft = restored
    ? state.draft.data
    : structuredClone(r || { title: '', ings: [], steps: '', notes: '' });
  draft.ings = draft.ings.map(editIng);
  E = { id, key, draft, dirty: restored };
  view.innerHTML = `
  <header class="top bar">
    <button type="button" class="icon-btn" data-act="editor-cancel" aria-label="Abbrechen">${ui('x')}</button>
    <h1 class="bar-title">${id ? 'Rezept bearbeiten' : 'Neues Rezept'}</h1>
    <button type="button" class="btn primary small" data-act="editor-save">Speichern</button>
  </header>
  <form class="pad editor" id="editor" autocomplete="off">
    <label class="field"><span>Titel</span><input data-ed="title" value="${esc(draft.title)}" placeholder="z. B. Thai-Curry mit Huhn"></label>
    <div class="section-head"><h2>Zutaten</h2><span class="muted small">Menge · Einheit · Zutat</span></div>
    <div id="ed-main" class="ed-ings"></div>
    <button type="button" class="btn ghost small add-row" data-act="ing-add" data-sp="0">${ui('plus')} Zutat</button>
    <div class="section-head"><h2>Gewürze</h2><span class="muted small">hast du meistens da</span></div>
    <div id="ed-sp" class="ed-ings"></div>
    <button type="button" class="btn ghost small add-row" data-act="ing-add" data-sp="1">${ui('plus')} Gewürz</button>
    <p class="muted small ed-hint">Menge in Stück, Gramm oder Milliliter – oder leer lassen. Eine ganze Zutatenliste kannst du auch auf einmal ins Zutatenfeld einfügen, Gewürze werden dabei automatisch einsortiert. Zwischenüberschriften enden mit „:“.</p>
    <div id="ed-nutri"></div>
    <label class="field"><span>Zubereitung</span><textarea data-ed="steps" rows="8" placeholder="Ein Schritt pro Zeile">${esc(draft.steps)}</textarea></label>
    <label class="field"><span>Notizen</span><textarea data-ed="notes" rows="3" placeholder="Tipps, Varianten …">${esc(draft.notes)}</textarea></label>
  </form>`;
  redrawIngs();
  if (restored) toast('Ungespeicherter Entwurf wiederhergestellt', { action: 'Verwerfen', onAction: () => { state.draft = null; save(); renderEditor(id); } });
  else if (!id) $('[data-ed="title"]').focus();
}

// Im Auswahlmenü stehen die vollen Namen, im Feld die Abkürzung
const UNIT_OPTS = [['stk', 'Stk', 'Stück'], ['g', 'g', 'Gramm'], ['ml', 'ml', 'Milliliter']];
const unitShort = u => (UNIT_OPTS.find(o => o[0] === u) || UNIT_OPTS[0])[1];

function ingRowHtml(g, i, first) {
  const what = g.sp ? 'Gewürz' : 'Zutat';
  const ph = first ? (g.sp ? 'z. B. Paprikapulver' : 'z. B. Hähnchenbrust') : (g.sp ? 'Weiteres Gewürz' : 'Weitere Zutat');
  return `<div class="ing-row" data-i="${i}">
    <input class="ing-amt" data-ing-a="${i}" value="${esc(g.a)}" placeholder="Menge" inputmode="decimal" enterkeyhint="next" autocomplete="off" aria-label="Menge">
    <label class="ing-unit"><span class="ing-unit-txt">${unitShort(g.u)}</span>
      <select data-ing-u="${i}" aria-label="Einheit">${UNIT_OPTS.map(([v, , long]) => `<option value="${v}"${g.u === v ? ' selected' : ''}>${long}</option>`).join('')}</select></label>
    <input class="ing-input" data-ing="${i}" value="${esc(g.n)}" placeholder="${ph}" enterkeyhint="next" autocomplete="off" aria-label="${what}">
    <button type="button" class="icon-btn small" data-act="ing-del" data-i="${i}" aria-label="${what} entfernen" tabindex="-1">${ui('x')}</button>
    <div class="ing-prev" id="prev-${i}">${ingPreviewHtml(g, i)}</div>
  </div>`;
}

function ingPreviewHtml(g, i) {
  if (!g.t?.trim()) return '';
  const a = I.analyze(g, ctx);
  const btn = (cls, inner) => `<button type="button" class="prev ${cls}" data-act="relink" data-i="${i}">${inner}</button>`;
  switch (a.status) {
    case 'header': return `<span class="prev muted">Zwischenüberschrift</span>`;
    case 'ok': {
      // „200“ + Stück ist fast immer vergessenes „Gramm“
      const many = g.u === 'stk' && g.a?.trim() && !a.p.unit && a.p.qty >= 50;
      const note = many ? ' · <em>wirklich Stück? Sonst Gramm oder Milliliter wählen</em>' : a.guess ? ' · <em>stimmt das?</em>' : '';
      return btn(a.guess || many ? 'guess' : '', `${icon(a.food, 'ico xs')}<span>${esc(a.food.n)} · ${fmtInt(a.grams)} g · <b>${fmtInt(a.nutr[0])} kcal</b> · ${fmtG(a.nutr[1])} g Eiweiß${note}</span>`);
    }
    case 'zero': return btn('', `${icon(a.food, 'ico xs')}<span>${esc(a.food.n)} · zählt nicht</span>`);
    case 'noamount': return btn('warn', `${icon(a.food, 'ico xs')}<span>${esc(a.food.n)} · ${issueText(a)}</span>`);
    case 'nonutr': return btn('warn', `${icon(a.food, 'ico xs')}<span>${esc(a.food.n)} · keine Nährwerte – tippen</span>`);
    case 'ignored': return btn('', `<span>wird nicht mitgerechnet</span>`);
    default: return btn('warn', `${ui('alert')}<span>Nicht erkannt – tippen zum Zuordnen</span>`);
  }
}

function drawEditorNutri() {
  const box = $('#ed-nutri');
  if (!box || !E) return;
  box.innerHTML = nutriCardHtml(computeRecipe(E.draft));
}
function redrawIngs() {
  if (!$('#ed-main') || !E) return;
  ensureRows(E.draft.ings);
  const rows = sp => {
    let first = true;
    return E.draft.ings.map((g, i) => {
      if (!!g.sp !== sp) return '';
      const h = ingRowHtml(g, i, first);
      first = false;
      return h;
    }).join('');
  };
  $('#ed-main').innerHTML = rows(false);
  $('#ed-sp').innerHTML = rows(true);
  drawEditorNutri();
}
function persistDraft() {
  E.dirty = true;
  state.draft = { key: E.key, data: E.draft };
  save();
}
const ingRowIndex = el => +el.closest('.ing-row').dataset.i;
/** Eine der drei Eingaben einer Zutatenzeile hat sich geändert. */
function onIngInput(el) {
  const row = el.closest('.ing-row');
  const i = +row.dataset.i, g = E?.draft.ings[i];
  if (!g) return;
  g.a = row.querySelector('.ing-amt').value;
  g.u = row.querySelector('[data-ing-u]').value;
  g.n = row.querySelector('.ing-input').value;
  row.querySelector('.ing-unit-txt').textContent = unitShort(g.u);
  g.t = I.joinIng(g);
  if (g.l && I.compact(I.parseLine(g.t).name) !== g.ln) { delete g.l; delete g.f; delete g.ln; }
  $('#prev-' + i).innerHTML = ingPreviewHtml(g, i);
  drawEditorNutri();
  persistDraft();
}
/** „200 g Hack“ ins Zutatenfeld getippt (Menge leer) → beim Verlassen auf die drei Felder verteilen. */
function onIngNameDone(input) {
  const g = E?.draft.ings[ingRowIndex(input)];
  if (!g || g.a.trim()) return;
  const s = I.splitIng(g.n);
  if (!s.a) return;
  const row = input.closest('.ing-row');
  row.querySelector('.ing-amt').value = s.a;
  row.querySelector('[data-ing-u]').value = s.u;
  input.value = s.n;
  onIngInput(input);
}
/** Neue leere Zeile in der Rubrik – außer die letzte ist ohnehin noch leer. */
function addIngRow(sp) {
  const own = E.draft.ings.map((g, i) => ({ g, i })).filter(x => !!x.g.sp === sp);
  const last = own[own.length - 1];
  if (last && !last.g.t.trim()) { $(`[data-ing-a="${last.i}"]`)?.focus(); return; }
  E.draft.ings.push(blankIng(sp));
  const i = E.draft.ings.length - 1;
  const box = $(sp ? '#ed-sp' : '#ed-main');
  box.insertAdjacentHTML('beforeend', ingRowHtml(E.draft.ings[i], i, !own.length));
  $(`[data-ing-a="${i}"]`).focus();
}
/** Enter: Menge → Zutat; Zutat (mit Namen) → nächste Zeile bzw. neue Zeile. */
function onIngEnter(input) {
  const row = input.closest('.ing-row');
  if (input.matches('.ing-amt')) { row.querySelector('.ing-input').focus(); return; }
  const g = E.draft.ings[+row.dataset.i];
  if (!g?.n.trim()) return;
  const next = row.nextElementSibling;
  if (next) next.querySelector('.ing-amt').focus();
  else addIngRow(!!g.sp);
}
function onEdField(t) {
  E.draft[t.dataset.ed] = t.value;
  persistDraft();
}
document.addEventListener('paste', e => {
  const t = e.target;
  if (!t.matches?.('.ing-input') || !E) return;
  const text = e.clipboardData?.getData('text') || '';
  if (!/\n/.test(text.trim())) return;
  e.preventDefault();
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const i = ingRowIndex(t), g = E.draft.ings[i];
  lines[0] = t.value.slice(0, t.selectionStart) + lines[0];
  lines[lines.length - 1] += t.value.slice(t.selectionEnd);
  const rows = lines.map(x => ({ t: x, ...I.splitIng(x) }));
  if (g.a.trim()) rows[0] = { a: g.a, u: g.u, n: lines[0] }; // schon eingetragene Menge behalten
  // In die Gewürze eingefügt → alles Gewürze; bei den Zutaten → Gewürze automatisch erkennen
  rows.forEach(r => { r.t = I.joinIng(r); r.sp = !!g.sp || autoSpice(r); });
  const same = rows.filter(r => r.sp === !!g.sp), moved = rows.filter(r => r.sp !== !!g.sp);
  E.draft.ings.splice(i, 1, ...same);
  // in die andere Rubrik einsortierte Zeilen hinten anstellen (leere Platzhalter dort entfallen)
  if (moved.length) E.draft.ings = E.draft.ings.filter(r => r.t.trim() || !!r.sp === !!g.sp).concat(moved);
  redrawIngs();
  persistDraft();
  const last = same.length ? E.draft.ings.indexOf(same[same.length - 1]) : -1;
  if (last >= 0) $(`[data-ing="${last}"]`)?.focus();
});

let navCount = 0;
function goBack(fallback) {
  if (navCount > 0) history.back();
  else location.replace(fallback);
}

// =====================================================================
// Einstellungen
// =====================================================================
let pendingImport = null;
function renderSettings() {
  const customs = Object.values(state.customFoods).sort((a, b) => a.n.localeCompare(b.n, 'de'));
  const n = state.stores.length;
  view.innerHTML = `
  <header class="top"><div class="top-row"><h1>Mehr</h1></div></header>
  <div class="pad stack">
    <a class="card nav-card" href="#/maerkte">
      <span class="nav-ico">${ui('store')}</span>
      <span class="grow"><b>Supermärkte & Reihenfolge</b>
        <small>Ausgewählt: ${esc(activeStore().name)}${n > 1 ? ` · ${n} gespeichert` : ''}</small></span>
      ${ui('next')}
    </a>
    <section class="card">
      <h2>Eigene Lebensmittel</h2>
      ${customs.length
        ? `<div class="pick-list">${customs.map(f => `<button type="button" class="pick" data-act="edit-food" data-food="${esc(f.id)}">${icon(f, 'ico sm')}
            <span class="grow">${esc(f.n)}<small>${esc(CAT_BY_ID[catOf(f)]?.n || '')}</small></span>
            <span class="muted small">${f.v ? fmtInt(f.v[0]) + ' kcal' : 'ohne Werte'}</span></button>`).join('')}</div>`
        : `<p class="muted small">Noch keine. Sie entstehen automatisch, wenn du etwas hinzufügst, das nicht im Katalog steht.</p>`}
      <button type="button" class="btn ghost small" data-act="new-food">${ui('plus')} Lebensmittel anlegen</button>
    </section>
    <section class="card">
      <h2>Backup & PC</h2>
      <p class="muted small">Deine Daten liegen nur auf diesem Gerät. Mit einem Backup überträgst du Rezepte und Liste auf ein anderes Gerät, z. B. den PC: Datei speichern, in OneDrive ablegen und dort laden.</p>
      <div class="row wrap gap">
        <button type="button" class="btn" data-act="export">${ui('download')} Backup speichern</button>
        <label class="btn">${ui('share')} Backup laden<input type="file" id="import-file" accept=".json,application/json" hidden></label>
      </div>
      <div id="import-confirm"></div>
    </section>
    <section class="card">
      <h2>Aufräumen</h2>
      <div class="row wrap gap">
        <button type="button" class="btn ghost" data-act="clear-list"${state.list.length ? '' : ' disabled'}>${ui('trash')} Einkaufsliste leeren</button>
        <button type="button" class="btn ghost" data-act="clear-recent"${state.recent.length ? '' : ' disabled'}>„Zuletzt gekauft“ leeren</button>
      </div>
    </section>
    <section class="about muted small">
      <p><b>Küchenzettel ${VERSION}</b> · ${FOODS.length} Lebensmittel im Katalog · ${state.recipes.length} ${state.recipes.length === 1 ? 'Rezept' : 'Rezepte'}</p>
      <p>Nährwerte sind Richtwerte. Icons: <a href="https://openmoji.org" target="_blank" rel="noopener">OpenMoji</a> (CC BY-SA 4.0). Produktdaten: <a href="https://openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a> (ODbL).</p>
    </section>
  </div>`;
}

// ---------- Supermärkte ----------
const storeById = id => state.stores.find(x => x.id === id);
let focusStoreName = null;

function renderStores() {
  view.innerHTML = `
  <header class="top bar">
    <a class="icon-btn" href="#/einstellungen" data-act="back" aria-label="Zurück">${ui('back')}</a>
    <h1 class="bar-title">Supermärkte</h1>
    <span class="bar-spacer"></span>
  </header>
  <div class="pad stack">
    <p class="muted small">Jeder Supermarkt hat seine eigene Reihenfolge der Bereiche. Die Einkaufsliste sortiert nach dem ausgewählten – tipp einen an, um ihn auszuwählen.</p>
    <div class="card store-list">${state.stores.map(s => {
      const on = s.id === state.storeId;
      return `<div class="store-row${on ? ' on' : ''}">
        <button type="button" class="store-pick" data-act="store-pick" data-store="${esc(s.id)}" aria-pressed="${on}">
          <span class="radio" aria-hidden="true"></span>
          <span class="grow"><b>${esc(s.name)}</b><small>${on ? 'Ausgewählt' : 'Antippen zum Auswählen'}</small></span>
        </button>
        <a class="icon-btn" href="#/markt/${esc(s.id)}" aria-label="${esc(s.name)} bearbeiten">${ui('edit')}</a>
      </div>`;
    }).join('')}</div>
    <button type="button" class="btn" data-act="store-add">${ui('plus')} Supermarkt hinzufügen</button>
  </div>`;
}

function renderStore(id) {
  const s = storeById(id);
  if (!s) { location.replace('#/maerkte'); return; }
  const on = s.id === state.storeId;
  view.innerHTML = `
  <header class="top bar">
    <a class="icon-btn" href="#/maerkte" data-act="back" aria-label="Zurück">${ui('back')}</a>
    <h1 class="bar-title">Supermarkt</h1>
    <span class="bar-spacer"></span>
  </header>
  <div class="pad stack">
    <label class="field"><span>Name</span><input id="store-name" data-store="${esc(s.id)}" value="${esc(s.name)}" placeholder="z. B. REWE Hauptstraße" autocomplete="off" enterkeyhint="done"></label>
    ${on ? `<p class="store-state">${ui('check')} Die Einkaufsliste ist nach diesem Supermarkt sortiert.</p>`
      : `<button type="button" class="btn primary block" data-act="store-pick" data-store="${esc(s.id)}">Diesen Supermarkt auswählen</button>`}
    <section class="card">
      <h2>Reihenfolge der Bereiche</h2>
      <p class="muted small">So, wie du durch den Markt läufst – von oben nach unten.</p>
      <ol class="order-list" id="order-list"></ol>
      <button type="button" class="btn ghost small" data-act="cat-reset" data-store="${esc(s.id)}">Standard wiederherstellen</button>
    </section>
    ${state.stores.length > 1 ? `<div class="center"><button type="button" class="btn ghost danger" data-act="store-delete" data-store="${esc(s.id)}">${ui('trash')} Supermarkt löschen</button></div>` : ''}
  </div>`;
  drawOrder(s);
  if (focusStoreName === id) {
    focusStoreName = null;
    const n = $('#store-name');
    n.focus();
    n.select();
  }
}

function drawOrder(s) {
  const box = $('#order-list');
  if (!box) return;
  const last = s.order.length - 1;
  box.innerHTML = s.order.map((id, i) => `<li>${icon(CAT_BY_ID[id], 'ico sm')}<span class="grow">${esc(CAT_BY_ID[id].n)}</span>
    <button type="button" class="icon-btn" data-act="cat-move" data-store="${esc(s.id)}" data-i="${i}" data-d="-1" aria-label="${esc(CAT_BY_ID[id].n)} nach oben"${i === 0 ? ' disabled' : ''}>${ui('up')}</button>
    <button type="button" class="icon-btn" data-act="cat-move" data-store="${esc(s.id)}" data-i="${i}" data-d="1" aria-label="${esc(CAT_BY_ID[id].n)} nach unten"${i === last ? ' disabled' : ''}>${ui('down')}</button></li>`).join('');
}

/** Schnellwahl auf der Einkaufsliste (nur bei mehreren Supermärkten sichtbar). */
function openStoreMenu() {
  openSheet(`
    <div class="sheet-head"><h2 class="grow">Wo kaufst du ein?</h2>
      <button type="button" class="icon-btn" data-act="close-sheet" aria-label="Schließen">${ui('x')}</button></div>
    <div class="store-list">${state.stores.map(s => `<div class="store-row${s.id === state.storeId ? ' on' : ''}">
      <button type="button" class="store-pick" data-act="store-pick" data-store="${esc(s.id)}" aria-pressed="${s.id === state.storeId}">
        <span class="radio" aria-hidden="true"></span><span class="grow"><b>${esc(s.name)}</b></span></button></div>`).join('')}</div>
    <div class="sheet-actions"><a class="btn ghost small" href="#/maerkte">${ui('edit')} Supermärkte verwalten</a></div>`);
}

async function onImportFile(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    pendingImport = parseBackup(await file.text());
  } catch {
    toast('Das ist keine gültige Backup-Datei.');
    return;
  }
  const d = pendingImport.data;
  const date = pendingImport.exportedAt ? new Date(pendingImport.exportedAt).toLocaleDateString('de-DE') : 'unbekanntem Datum';
  $('#import-confirm').innerHTML = `<div class="confirm-box">
    <p><b>Backup vom ${esc(date)}</b><br>${d.recipes.length} Rezepte · ${d.list.length} Artikel auf der Liste · ${Object.keys(d.customFoods).length} eigene Lebensmittel</p>
    <div class="row wrap gap">
      <button type="button" class="btn" data-act="import" data-mode="recipes">Nur Rezepte übernehmen</button>
      <button type="button" class="btn danger-solid" data-act="import" data-mode="replace">Alles ersetzen</button>
      <button type="button" class="btn ghost" data-act="import-cancel">Abbrechen</button>
    </div>
    <p class="muted small">„Nur Rezepte“ ergänzt und aktualisiert Rezepte, deine Einkaufsliste bleibt. „Alles ersetzen“ überschreibt alle Daten auf diesem Gerät.</p>
  </div>`;
}

// =====================================================================
// Aktionen (data-act)
// =====================================================================
const A = {
  'clear-add': () => { const inp = $('#add-input'); inp.value = ''; onAddInput(''); inp.focus(); },
  'hide-hint': () => { state.hintDone = true; save(); drawListBody(); },
  'add-food': el => {
    const fromSearch = !!el.closest('#add-results');
    addFood(el.dataset.food, el.dataset.spec || '', { name: el.dataset.name || '' });
    afterAdd(fromSearch);
  },
  'add-custom': el => {
    const id = ensureCustomFood(el.dataset.name);
    if (id) addFood(id, el.dataset.spec || '');
    afterAdd(true);
  },
  buy: el => buyItem(el.dataset.item, el),
  'buy-food': el => { const it = state.list.find(i => i.f === el.dataset.food); if (it) buyItem(it.id, el); },

  'close-sheet': () => closeSheet(),
  'sheet-buy': el => { const id = el.dataset.item; closeSheet(); buyItem(id); },
  'sheet-remove': el => {
    const idx = state.list.findIndex(i => i.id === el.dataset.item);
    if (idx < 0) return;
    const [it] = state.list.splice(idx, 1);
    save();
    closeSheet();
    toast(`${itemName(it, getFood(it.f))} entfernt`, { action: 'Rückgängig', onAction: () => { state.list.splice(idx, 0, it); save(); drawListBody(); } });
  },
  'sheet-add': el => { addFood(el.dataset.food, '', { name: el.dataset.name || '' }); closeSheet(); },

  'edit-food': el => {
    const id = el.dataset.food;
    const inSheet = !!el.closest('#sheet');
    openFoodEditor(id, { onSave: () => { if (inSheet) openFoodSheet(id); else { closeSheet(); renderSettings(); } } });
  },
  'new-food': () => openFoodEditor(null, { onSave: () => { closeSheet(); renderSettings(); } }),
  'off-search': async el => {
    const q = $('#off-q').value.trim();
    if (!q) return;
    const box = $('#off-results');
    box.innerHTML = `<p class="muted small">Suche bei Open Food Facts …</p>`;
    el.disabled = true;
    try {
      const res = await searchOFF(q);
      if (!FE) return;
      FE.results = res;
      box.innerHTML = res.length
        ? res.map((p, k) => `<button type="button" class="pick" data-act="off-pick" data-k="${k}"><span class="grow">${esc(p.name)}<small>${esc([p.brand, p.quantity].filter(Boolean).join(' · '))}</small></span><span class="muted small">${fmtInt(p.v[0])} kcal</span></button>`).join('')
        : `<p class="muted small">Keine Produkte mit Nährwerten gefunden. Versuch es mit Marke und Produkt, z. B. „Heinz Mango Curry“.</p>`;
    } catch (e) {
      box.innerHTML = `<p class="warn-text small">${esc(e.message || 'Suche fehlgeschlagen.')}</p>`;
    } finally {
      el.disabled = false;
    }
  },
  'off-pick': el => {
    const p = FE?.results?.[+el.dataset.k];
    if (!p) return;
    p.v.forEach((x, i) => { $('#fe-v' + i).value = String(Math.round(x * 10) / 10).replace('.', ','); });
    FE.src = `Open Food Facts – ${p.name}${p.brand ? ' (' + p.brand + ')' : ''}`;
    $('#fe-src').textContent = 'Quelle: ' + FE.src;
    $('#off-results').innerHTML = `<p class="ok-text small">${ui('check')} Werte von „${esc(p.name)}“ übernommen</p>`;
  },
  'fe-save': () => {
    const name = cap($('#fe-name').value);
    if (!name) { $('#fe-name').focus(); return; }
    const nums = [0, 1, 2, 3, 4].map(i => parseDec($('#fe-v' + i).value));
    const v = nums.every(x => x == null) ? null : nums.map(x => x ?? 0);
    const p = parseDec($('#fe-p').value);
    const id = FE.id || 'c_' + uid();
    const old = state.customFoods[id] || {};
    const guess = old.i === undefined ? I.matchFood(name, searchIndex()) : null;
    const food = { ...old, id, n: name, c: $('#fe-cat').value, i: old.i ?? (guess && !guess.weak ? guess.food.i : null), v, custom: true };
    if (p) food.p = p; else delete food.p;
    if (FE.src) food.src = FE.src;
    state.customFoods[id] = food;
    invalidateFoods();
    save();
    const cb = FE.onSave;
    FE = null;
    toast(`${name} gespeichert`);
    if (cb) cb(id); else closeSheet();
  },
  'fe-delete': () => {
    const id = FE?.id;
    if (!id) return;
    const name = state.customFoods[id]?.n;
    delete state.customFoods[id];
    state.list = state.list.filter(i => i.f !== id);
    state.recent = state.recent.filter(r => r.f !== id);
    for (const r of state.recipes) for (const g of r.ings) if (g.f === id) { delete g.f; delete g.l; delete g.ln; }
    invalidateFoods();
    save();
    FE = null;
    closeSheet();
    route();
    toast(`${name} gelöscht`);
  },

  'fp-pick': el => picker?.onPick(el.dataset.id),
  'fp-none': () => picker?.onPick(null),
  'fp-new': () => {
    const q = $('#fp-q').value.trim();
    const pk = picker;
    openFoodEditor(null, { name: q, onSave: id => pk?.onPick(id) });
  },
  relink: el => {
    const i = +el.dataset.i;
    const inEditor = currentView === 'editor';
    const recipe = inEditor ? E?.draft : state.recipes.find(r => r.id === D?.id);
    const g = recipe?.ings[i];
    if (!g) return;
    const a = I.analyze(g, ctx);
    const refresh = () => (inEditor ? redrawIngs() : drawRecipe());
    if (a.status === 'nonutr' && a.food?.custom) {
      openFoodEditor(a.food.id, { onSave: () => { closeSheet(); refresh(); } });
      return;
    }
    if (!inEditor && a.status === 'noamount') {
      location.hash = `#/rezept/${D.id}/bearbeiten`;
      toast('Trag bei der Zutat links eine Menge ein – in g, ml oder als Stückzahl.');
      return;
    }
    openFoodPicker(a.p.name || g.t, foodId => {
      if (foodId) g.f = foodId; else delete g.f;
      g.l = true;
      g.ln = I.compact(a.p.name);
      if (inEditor) persistDraft(); else save();
      closeSheet();
      refresh();
    });
  },

  back: el => goBack(el.getAttribute('href')),
  // „Alle auswählen“ nimmt nur die Zutaten, nicht die Gewürze
  'sel-all': () => {
    const r = state.recipes.find(x => x.id === D.id);
    const c = computeRecipe(r);
    const idx = r.ings.map((g, i) => i).filter(i => !isSpice(r.ings[i]) && selectableRow(c.rows[i]));
    const all = idx.every(i => D.sel.has(i));
    idx.forEach(i => (all ? D.sel.delete(i) : D.sel.add(i)));
    drawRecipe();
  },
  'add-selected': () => {
    const r = state.recipes.find(x => x.id === D.id);
    if (!r) return;
    const c = computeRecipe(r);
    let n = 0;
    for (const i of [...D.sel].sort((a, b) => a - b)) {
      const a = c.rows[i];
      if (!a || a.status === 'header' || a.status === 'empty') continue;
      const foodId = a.food ? a.food.id : ensureCustomFood(a.p.name || r.ings[i].t);
      if (!foodId) continue;
      addFood(foodId, a.food?.z ? '' : I.specFromParsed(a.p), { recipe: r.title, quiet: true });
      n++;
    }
    D.sel = new Set();
    drawRecipe();
    toast(`${n} ${n === 1 ? 'Zutat' : 'Zutaten'} auf der Einkaufsliste`, { action: 'Zur Liste', onAction: () => { location.hash = '#/liste'; } });
  },
  'delete-recipe': () => {
    const idx = state.recipes.findIndex(r => r.id === D.id);
    if (idx < 0) return;
    const [r] = state.recipes.splice(idx, 1);
    save();
    D = null;
    location.replace('#/rezepte');
    toast(`„${r.title}“ gelöscht`, { action: 'Rückgängig', onAction: () => { state.recipes.splice(idx, 0, r); save(); location.hash = '#/rezept/' + r.id; } });
  },

  'ing-add': el => addIngRow(el.dataset.sp === '1'),
  'ing-del': el => {
    const i = +el.dataset.i;
    E.draft.ings.splice(i, 1);
    redrawIngs();
    persistDraft();
  },
  'editor-save': () => {
    const d = E.draft;
    const title = (d.title || '').trim();
    if (!title) { toast('Gib dem Rezept noch einen Titel.'); $('[data-ed="title"]').focus(); return; }
    const old = E.id ? state.recipes.find(r => r.id === E.id) : null;
    const rec = {
      id: E.id || uid(),
      title,
      ings: d.ings.filter(g => g.t.trim()).map(g => ({
        t: g.t.trim(), a: g.a.trim(), u: g.u, n: g.n.trim(), sp: !!g.sp,
        ...(g.l ? { l: true, ln: g.ln, ...(g.f ? { f: g.f } : {}) } : {}),
      })),
      steps: (d.steps || '').trim(),
      notes: (d.notes || '').trim(),
      created: old?.created || Date.now(),
      updated: Date.now(),
    };
    if (old) state.recipes[state.recipes.indexOf(old)] = rec; else state.recipes.push(rec);
    state.draft = null;
    save();
    D = null;
    E = null;
    history.replaceState(null, '', '#/rezept/' + rec.id);
    route();
    toast('Rezept gespeichert');
  },
  'editor-cancel': () => {
    const { id, key, draft, dirty } = E;
    state.draft = null;
    save();
    goBack(id ? '#/rezept/' + id : '#/rezepte');
    if (dirty) {
      toast('Änderungen verworfen', { action: 'Wiederherstellen', onAction: () => { state.draft = { key, data: draft }; save(); location.hash = id ? `#/rezept/${id}/bearbeiten` : '#/rezept/neu'; } });
    }
  },

  // ---- Supermärkte ----
  'cat-move': el => {
    const s = storeById(el.dataset.store);
    const i = +el.dataset.i, j = i + +el.dataset.d, o = s?.order;
    if (!o || j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    save();
    drawOrder(s);
    $(`[data-act="cat-move"][data-i="${j}"][data-d="${el.dataset.d}"]`)?.focus({ preventScroll: true });
  },
  'cat-reset': el => {
    const s = storeById(el.dataset.store);
    if (!s) return;
    s.order = [...DEFAULT_ORDER];
    save();
    drawOrder(s);
    toast('Standard-Reihenfolge wiederhergestellt');
  },
  'store-pick': el => {
    state.storeId = el.dataset.store;
    save();
    if (currentView === 'list') { closeSheet(); renderList(); toast(`Sortiert für ${activeStore().name}`); } else route();
  },
  'store-menu': openStoreMenu,
  'store-add': () => {
    const s = { id: uid(), name: `Supermarkt ${state.stores.length + 1}`, order: [...activeStore().order] };
    state.stores.push(s);
    save();
    focusStoreName = s.id;
    location.hash = '#/markt/' + s.id;
  },
  'store-delete': el => {
    const idx = state.stores.findIndex(x => x.id === el.dataset.store);
    if (idx < 0 || state.stores.length < 2) return;
    const [s] = state.stores.splice(idx, 1);
    const wasActive = state.storeId === s.id;
    if (wasActive) state.storeId = state.stores[0].id;
    save();
    goBack('#/maerkte');
    toast(`„${s.name}“ gelöscht`, {
      action: 'Rückgängig',
      onAction: () => { state.stores.splice(idx, 0, s); if (wasActive) state.storeId = s.id; save(); route(); },
    });
  },
  export: async () => {
    flush();
    const name = `kuechenzettel-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([exportJSON()], name, { type: 'application/json' });
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Küchenzettel-Backup' }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast(`${name} gespeichert (Downloads)`);
  },
  import: el => {
    if (!pendingImport) return;
    applyBackup(pendingImport, el.dataset.mode);
    pendingImport = null;
    invalidateFoods();
    D = null;
    renderSettings();
    toast('Backup geladen');
  },
  'import-cancel': () => { pendingImport = null; $('#import-confirm').innerHTML = ''; },
  'clear-list': () => {
    const prev = state.list;
    state.list = [];
    save();
    renderSettings();
    toast('Einkaufsliste geleert', { action: 'Rückgängig', onAction: () => { state.list = prev; save(); renderSettings(); } });
  },
  'clear-recent': () => { state.recent = []; save(); renderSettings(); toast('„Zuletzt gekauft“ geleert'); },
};

// ---------- Ereignisse ----------
// Gedrückt halten (oder Rechtsklick) auf eine Kachel öffnet die Infos.
let press = null;
document.addEventListener('pointerdown', e => {
  const tile = e.target.closest('.tile[data-food]');
  if (!tile || e.button > 0) { press = null; return; }
  const p = { tile, x: e.clientX, y: e.clientY, fired: false };
  p.timer = setTimeout(() => {
    if (press !== p) return;
    p.fired = true;
    tile.classList.remove('pressing');
    navigator.vibrate?.(12);
    openFoodSheet(tile.dataset.food, tile.dataset.item, tile.dataset.name);
  }, 450);
  press = p;
  tile.classList.add('pressing');
});
function endPress() {
  if (!press || press.fired) return;
  clearTimeout(press.timer);
  press.tile.classList.remove('pressing');
}
document.addEventListener('pointermove', e => { if (press && !press.fired && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) { endPress(); press = null; } });
document.addEventListener('pointerup', () => { if (press?.fired) press.upAt = Date.now(); else endPress(); });
// Nach dem langen Drücken löst das Loslassen noch einen Klick aus – der würde sonst
// das gerade geöffnete Infofenster (Hintergrund) wieder schließen.
document.addEventListener('click', e => {
  if (press?.fired && press.upAt && Date.now() - press.upAt < 600) {
    press = null;
    e.preventDefault();
    e.stopPropagation();
  }
}, true);
document.addEventListener('pointercancel', () => { endPress(); press = null; });
document.addEventListener('contextmenu', e => {
  const tile = e.target.closest('.tile[data-food]');
  if (!tile) return;
  e.preventDefault();
  if (!press?.fired) {
    if (press) clearTimeout(press.timer);
    tile.classList.remove('pressing');
    press = { tile, fired: true };
    openFoodSheet(tile.dataset.food, tile.dataset.item, tile.dataset.name);
  }
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  fn(el, e);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'add-input') onAddInput(t.value);
  else if (t.id === 'recipe-search') $('#recipe-list').innerHTML = recipeListHtml(t.value);
  else if (t.id === 'spec-input') { const it = state.list.find(i => i.id === t.dataset.item); if (it) { it.s = t.value; save(); } }
  else if (t.dataset.ing != null || t.dataset.ingA != null || t.dataset.ingU != null) onIngInput(t);
  else if (t.dataset.ed) onEdField(t);
  else if (t.id === 'fp-q') drawPicker(t.value);
  else if (t.id === 'store-name') { const s = storeById(t.dataset.store); if (s) { s.name = t.value.trim() || 'Supermarkt'; save(); } }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.change === 'cat') setFoodCat(t.dataset.food, t.value);
  else if (t.dataset.change === 'sel') { if (t.checked) D.sel.add(+t.dataset.i); else D.sel.delete(+t.dataset.i); updateCta(); }
  else if (t.id === 'import-file') onImportFile(t);
  else if (t.dataset.ing != null) onIngNameDone(t);
  else if (t.id === 'store-name' && !t.value.trim()) t.value = storeById(t.dataset.store)?.name || '';
});
document.addEventListener('keydown', e => {
  const t = e.target;
  if (e.key === 'Escape' && sheetOpen) { closeSheet(); return; }
  if (e.key !== 'Enter' || e.isComposing) return;
  if (t.id === 'add-input') {
    e.preventDefault();
    const h = search.first;
    if (!h) return;
    if (h.custom) { const id = ensureCustomFood(h.name); if (id) addFood(id, h.spec); }
    else addFood(h.food.id, h.spec, { name: h.label });
    afterAdd(true);
  } else if (t.dataset?.ing != null || t.dataset?.ingA != null) {
    e.preventDefault();
    if (t.dataset.ing != null) onIngNameDone(t);
    onIngEnter(t);
  }
  else if (t.id === 'off-q') { e.preventDefault(); $('[data-act="off-search"]')?.click(); }
  else if (t.id === 'fp-q') { e.preventDefault(); $('#fp-results .pick')?.click(); }
  else if (t.id === 'spec-input') { e.preventDefault(); closeSheet(); }
  else if (t.id === 'store-name') { e.preventDefault(); t.blur(); }
});
document.addEventListener('submit', e => e.preventDefault());

// ---------- Navigation ----------
let currentView = '';
function route() {
  if (sheetOpen) hideSheet();
  const h = location.hash || '#/liste';
  let m, tab = 'liste';
  if (h === '#/liste' || h === '#/' || h === '#') { currentView = 'list'; renderList(); }
  else if (h === '#/rezepte') { currentView = 'recipes'; tab = 'rezepte'; renderRecipes(); }
  else if (h === '#/rezept/neu') { currentView = 'editor'; tab = 'rezepte'; renderEditor(null); }
  else if ((m = h.match(/^#\/rezept\/([\w-]+)\/bearbeiten$/))) { currentView = 'editor'; tab = 'rezepte'; renderEditor(m[1]); }
  else if ((m = h.match(/^#\/rezept\/([\w-]+)$/))) { currentView = 'recipe'; tab = 'rezepte'; renderRecipe(m[1]); }
  else if (h === '#/einstellungen') { currentView = 'settings'; tab = 'einstellungen'; renderSettings(); }
  else if (h === '#/maerkte') { currentView = 'stores'; tab = 'einstellungen'; renderStores(); }
  else if ((m = h.match(/^#\/markt\/([\w-]+)$/))) { currentView = 'store'; tab = 'einstellungen'; renderStore(m[1]); }
  else { location.replace('#/liste'); return; }
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  document.body.dataset.view = currentView;
  window.scrollTo(0, 0);
}
addEventListener('hashchange', () => { navCount++; route(); });

// ---------- Start ----------
async function loadSprite() {
  try {
    const res = await fetch('icons/sprite.svg');
    if (!res.ok) throw new Error(String(res.status));
    const holder = document.createElement('div');
    holder.className = 'sprite';
    holder.setAttribute('aria-hidden', 'true');
    holder.innerHTML = await res.text();
    document.body.prepend(holder);
  } catch (e) {
    console.warn('Icons konnten nicht geladen werden', e);
  }
}

function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service Worker:', e));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) toast('Neue Version installiert', { action: 'Neu laden', onAction: () => location.reload(), ms: 8000 });
  });
}

(async function init() {
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = ui(el.dataset.icon); });
  addEventListener('save-error', () => toast('Speichern fehlgeschlagen – ist der Speicher voll?'));
  await loadSprite();
  route();
  navigator.storage?.persist?.().catch(() => {});
  registerSW();
})();
