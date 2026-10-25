/* The meal catalog (meals.json) and store products (products.json).
   The full catalog lives in meals.json so new meals can be added without an app update. The meals in
   data/fixed.ts are the offline fallback. A copy of the last catalog and products is kept on the phone. */
import { BASE_DIET, FALLBACK_MEALS, ING_RAW, PROD } from '../data/fixed';
import { isObj } from './util';

export const KEY = __PREVIEW__ ? 'posilki-next' : 'posilki';
const CAT_KEY = KEY + '-catalog';
const LIVE_KEY = KEY + '-products';

export interface Ingredient {
  key: string; pl: string; en: string; a: string; u: string; p: number; f: number; c: number;
  pack: number; packLabel: string; piece: number; col: string; shape: string;
}
export type IngLine = [string, number];
export interface Meal {
  id: string; name: string; pl?: string; types: string[]; mins: number; style?: string; base?: string;
  desc?: string; ing: IngLine[]; steps?: string[]; tags?: string[]; custom?: boolean; video?: string;
  created?: number; shared?: boolean;
}

export const ING: Record<string, Ingredient> = {};
Object.keys(ING_RAW).forEach((k) => {
  const r = ING_RAW[k];
  ING[k] = { key: k, pl: r[0], en: r[1], a: r[2], u: r[3], p: r[4], f: r[5], c: r[6], pack: r[7], packLabel: r[8], piece: r[9], col: r[10], shape: r[11] };
});
export const DIET: Record<string, string> = { ...BASE_DIET };
export let MEALS: Meal[] = FALLBACK_MEALS;
export let MB: Record<string, Meal> = {};
MEALS.forEach((m) => { MB[m.id] = m; });
export let CATALOG = { loaded: false, updated: null as string | null, count: MEALS.length };
// Bumped whenever the catalog changes, so caches keyed on meals start over.
export let catalogRev = 0;

export function applyCatalog(d: any): boolean {
  if (!d || !isObj(d.ingredients) || !Array.isArray(d.meals)) return false;
  Object.keys(d.ingredients).forEach((k) => {
    const r = d.ingredients[k];
    ING[k] = { key: k, pl: r.pl, en: r.en, a: r.aisle, u: r.unit, p: r.p, f: r.f, c: r.c, pack: r.pack, packLabel: r.packLabel, piece: r.piece, col: r.color, shape: r.shape };
    if (r.diet) DIET[k] = r.diet;
    if (isObj(r.products)) Object.keys(r.products).forEach((cc) => { if (PROD[cc] && r.products[cc]) PROD[cc][k] = r.products[cc]; });
  });
  const list: Meal[] = d.meals.filter((m: any) => m && m.id && Array.isArray(m.ing) && Array.isArray(m.types) && m.ing.every((x: IngLine) => ING[x[0]]));
  if (!list.length) return false;
  MEALS = list; MB = {}; MEALS.forEach((m) => { MB[m.id] = m; }); catalogRev++;
  CATALOG = { loaded: true, updated: d.updated || null, count: MEALS.length };
  return true;
}
export function loadCachedCatalog(): void { try { const raw = localStorage.getItem(CAT_KEY); if (raw) applyCatalog(JSON.parse(raw)); } catch { /* keep the fallback */ } }
/** Resolves true when the catalog changed. */
export async function fetchCatalog(): Promise<boolean> {
  const r = await fetch('meals.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('catalog');
  const d = await r.json();
  const changed = !CATALOG.loaded || d.updated !== CATALOG.updated || (d.meals || []).length !== CATALOG.count;
  if (!applyCatalog(d)) return false;
  try { localStorage.setItem(CAT_KEY, JSON.stringify(d)); } catch { /* storage full */ }
  return changed;
}

/* A daily GitHub job searches the stores' online shops and writes products.json.
   Stores or ingredients it has not matched fall back to the typical products. */
export interface LiveItem { name: string; brand?: string; size?: number; unit?: string; price?: number; currency?: string }
export let LIVE: { updated: string | null; stores: Record<string, any> } = { updated: null, stores: {} };
export function applyProducts(d: any): boolean {
  if (!d || !isObj(d.stores)) return false;
  LIVE = { updated: d.updated || null, stores: d.stores };
  return true;
}
export function loadCachedProducts(): void { try { const raw = localStorage.getItem(LIVE_KEY); if (raw) applyProducts(JSON.parse(raw)); } catch { /* none yet */ } }
/** Resolves true when the products changed. */
export async function fetchProducts(): Promise<boolean> {
  const r = await fetch('products.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('products');
  const d = await r.json();
  const changed = d.updated !== LIVE.updated;
  if (!applyProducts(d)) return false;
  try { localStorage.setItem(LIVE_KEY, JSON.stringify(d)); } catch { /* storage full */ }
  return changed;
}
// A store counts as checked only when most ingredients were matched; a handful of matches would mix real and typical products.
export function liveStore(store: string): any { const s = LIVE.stores[store]; return s && isObj(s.items) && Object.keys(s.items).length >= 40 ? s : null; }
export function liveItem(k: string, store: string): LiveItem | null { const s = liveStore(store); return s && isObj(s.items[k]) && s.items[k].name ? (s.items[k] as LiveItem) : null; }
// Ingredients the store's online shop doesn't carry. Only known for stores we can read.
export function notInStore(k: string, store: string): boolean { return !!liveStore(store) && !liveItem(k, store); }
