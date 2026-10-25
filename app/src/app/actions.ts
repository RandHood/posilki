// Actions used from more than one screen.
import { DAYS } from '../data/fixed';
import { type IngLine, MB, type Meal, notInStore } from '../services/catalog';
import { getMeal } from '../services/logic';
import { recipeLink, readRecipeLink, sameRecipe, type SharedRecipe } from '../services/share';
import { DATA_VERSION, S, migrate, save, setState } from '../services/state';
import { clone, fmtDate, isObj, isoDate, uid } from '../services/util';
import { UI, closeAllPages, closePanel, closeSheet, leavePages, openSheet, popPage, pushPage, refresh, replaceTop, rerender, showNotice, toast, top } from './ui';

export function openMealPage(id: string): void {
  const m = getMeal(id); if (!m) { toast('That meal isn’t available on this phone.'); return; }
  UI.sheet = null;
  pushPage({ type: 'meal', id, store: S.profile.store!, grams: m.ing.map((x) => x[1]), open: false });
}
export function mealPageOf(m: Meal, store: string): { type: 'meal'; id: string; store: string; grams: number[]; open: boolean } {
  return { type: 'meal', id: m.id, store, grams: m.ing.map((x) => x[1]), open: true };
}
export function openShared(rec: SharedRecipe, link: string): void { pushPage({ type: 'shared', rec, link }); }
export function goTab(tab: string): void {
  UI.langOpen = false; UI.stack = []; UI.tab = tab;
  if (tab === 'prep') UI.prepScroll = 'jump';
  rerender(); window.scrollTo(0, 0);
}

/* ---------- Shopping ---------- */
export function addEntry(meal: Meal, ing: IngLine[], serv: number, day: number | null): void {
  S.shopping.entries.push({
    id: uid(), mealId: meal.id, name: meal.name, serv: serv || 1, day: day == null ? null : day,
    items: ing.filter((x) => x[1] > 0).map((x) => ({ key: x[0], g: x[1] * (serv || 1), checked: false })),
  });
}
export function mealToList(m: Meal, ing: IngLine[]): void {
  const store = S.profile.store!;
  addEntry(m, ing, 1, null); refresh();
  const miss = ing.filter((x) => x[1] > 0 && notInStore(x[0], store)).map((x) => x[0]);
  if (miss.length) showNotice(miss, store); else toast(m.name + ' added to your shopping list');
}
export function dayToList(d: number): void {
  S.prep.days![d].forEach((it) => { const m = getMeal(it.id); if (m) addEntry(m, m.ing, it.serv, d); });
  refresh(); toast(DAYS[d] + ' added to your shopping list');
}
export function weekToList(): void {
  let n = 0;
  S.prep.days!.forEach((items, d) => { items.forEach((it) => { const m = getMeal(it.id); if (m) { addEntry(m, m.ing, it.serv, d); n++; } }); });
  refresh(); toast(n + ' meals added to your shopping list');
}

/* ---------- Library ---------- */
export function toggleFav(id: string): void {
  const i = S.library.favorites.indexOf(id);
  if (i > -1) S.library.favorites.splice(i, 1); else S.library.favorites.push(id);
  refresh(); toast(i > -1 ? 'Removed from favorites' : 'Saved to favorites');
}
export function deleteRecipe(id: string): void {
  const L = S.library;
  L.recipes = L.recipes.filter((m) => m.id !== id);
  L.favorites = L.favorites.filter((x) => x !== id);
  L.collections.forEach((c) => { c.ids = c.ids.filter((x) => x !== id); });
  S.prep.days = S.prep.days!.map((d) => d.filter((it) => it.id !== id));
  save(); leavePages((p) => p.type === 'recipeEdit' || (p.type === 'meal' && p.id === id)); toast('Recipe deleted');
}
export function deleteCollection(id: string): void {
  S.library.collections = S.library.collections.filter((c) => c.id !== id);
  save(); leavePages((p) => p.type === 'lib' && p.cid === id); toast('Collection deleted');
}
export function addAsRecipe(m: Meal, store: string): void {
  // A copy of the meal goes into Recipes and opens straight away; Edit recipe changes it from there.
  const r: Meal = clone(m); r.id = 'r' + uid(); r.custom = true; r.base = m.id; r.video = ''; r.created = Date.now();
  S.library.recipes.push(r); save();
  replaceTop(mealPageOf(r, store), true); toast('Added to Recipes');
}
export function saveShared(rec: SharedRecipe): void {
  if (!S.onboarded) { toast('Set up Posiłki first, then open the link again.'); return; }
  const have = S.library.recipes.find((m) => sameRecipe(m, rec));
  let r = have;
  if (!r) {
    r = { id: 'r' + uid(), custom: true, pl: '', types: [], mins: 0, tags: [], style: 'plate', created: Date.now(), shared: true, ...clone(rec) };
    S.library.recipes.push(r); save();
  }
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  replaceTop(mealPageOf(r, S.profile.store!)); toast(have ? 'Already in your recipes' : 'Saved to Recipes');
}

/* ---------- Sharing ---------- */
export function shareMeal(m: Meal): void {
  const url = location.href.split('#')[0] + '#meal-' + m.id;
  if (navigator.share) { navigator.share({ title: m.name, text: m.name + ' on Posiłki', url }).catch(() => undefined); return; }
  try { navigator.clipboard.writeText(url).then(() => toast('Link copied'), () => toast(url)); } catch { toast(url); }
}
export function shareRecipe(m: Meal): void {
  const url = recipeLink(m);
  if (navigator.share) { navigator.share({ title: m.name, text: 'Here’s my recipe for ' + m.name + '. Open it to save it to your Posiłki.', url }).catch(() => undefined); return; }
  try { navigator.clipboard.writeText(url).then(() => toast('Recipe link copied'), () => toast('Couldn’t copy the link')); } catch { toast('Couldn’t copy the link'); }
}
export function pasteRecipe(): void {
  const fail = () => openSheet({ type: 'paste' });
  if (!navigator.clipboard || !navigator.clipboard.readText) return fail();
  navigator.clipboard.readText().then((t) => { const r = readRecipeLink(t); if (r) openShared(r, t.trim()); else fail(); }, fail);
}
export function openFromHash(): void {
  const h = location.hash || '';
  const t = top();
  if (h.indexOf('#recipe=') === 0) { const r = readRecipeLink(h); if (r && !(t && t.type === 'shared')) openShared(r, location.href); return; }
  if (!S.onboarded || h.indexOf('#meal-') !== 0) return;
  const id = decodeURIComponent(h.slice(6));
  if (MB[id] && !(t && t.type === 'meal' && t.id === id)) openMealPage(id);
}

/* ---------- Backup ---------- */
function markBackup(): void { S.lastBackup = Date.now(); refresh(); toast('Backup created'); }
function downloadFallback(json: string, name: string): void {
  const blob = new Blob([json], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  markBackup();
}
export function doExport(): void {
  save();
  const payload = { app: 'posilki', appVersion: __APP_VERSION__, dataVersion: DATA_VERSION, exportedAt: new Date().toISOString(), data: S };
  const name = 'posilki-backup-' + isoDate() + '.json', json = JSON.stringify(payload, null, 2);
  let file: File | null = null;
  try { file = new File([json], name, { type: 'application/json' }); } catch { /* old browser */ }
  if (file && navigator.canShare && navigator.share) {
    let ok = false; try { ok = navigator.canShare({ files: [file] }); } catch { /* not supported */ }
    if (ok) { navigator.share({ files: [file], title: 'Posiłki backup' }).then(markBackup).catch((err) => { if (!err || err.name !== 'AbortError') downloadFallback(json, name); }); return; }
  }
  downloadFallback(json, name);
}
export function handleImportFile(file: File): void {
  const r = new FileReader();
  r.onload = () => {
    let parsed: any = null; try { parsed = JSON.parse(String(r.result)); } catch { /* not JSON */ }
    if (!parsed || parsed.app !== 'posilki' || !isObj(parsed.data)) { toast('That file isn’t a Posiłki backup.'); return; }
    openSheet({ type: 'import', data: parsed });
  };
  r.onerror = () => toast('Couldn’t read that file.');
  r.readAsText(file);
}
export function importWhen(parsed: any): string { return parsed.exportedAt ? fmtDate(parsed.exportedAt) : 'an unknown date'; }
function mergeArrays(cur: any[], inc: any): any[] {
  if (!Array.isArray(inc)) return cur;
  const seen: Record<string, 1> = {}; cur.forEach((x) => { seen[typeof x === 'string' ? x : (x && x.id)] = 1; });
  inc.forEach((x: any) => { const k = typeof x === 'string' ? x : (x && x.id); if (k && seen[k]) return; cur.push(x); if (k) seen[k] = 1; });
  return cur;
}
export function importReplace(parsed: any): void {
  const next = migrate(clone(parsed.data)); next.onboarded = true; setState(next);
  save(); UI.sheet = null; UI.stack = []; rerender(); toast('Backup restored');
}
export function importMerge(parsed: any): void {
  const d = migrate(clone(parsed.data)) as any;
  (Object.keys(S.library) as (keyof typeof S.library)[]).forEach((k) => { (S.library as any)[k] = mergeArrays(S.library[k] as any[], d.library[k]); });
  S.shopping.entries = mergeArrays(S.shopping.entries, d.shopping.entries);
  save(); UI.sheet = null; rerender(); toast('Backup merged');
}

export { closeAllPages, closePanel, closeSheet, popPage };
