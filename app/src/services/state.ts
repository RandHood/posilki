/* Everything the app saves on the phone, under the localStorage key "posilki" (same key and format as
   the single-file app, so updates keep all saved data). Each data change gets a migration step. */
import { COUNTRIES, DAYS } from '../data/fixed';
import { KEY } from './catalog';
import { clone, isObj, storesFor } from './util';

export const DATA_VERSION = 5;

export interface Target { p: number; f: number; c: number }
export interface PlanItem { id: string; slot: string; serv: number }
export interface ShopItem { key: string; g: number; checked: boolean }
export interface ShopEntry { id: string; mealId: string; name: string; serv: number; day: number | null; items: ShopItem[] }
export interface Collection { id: string; name: string; ids: string[] }
export interface State {
  v: number; app: 'posilki'; onboarded: boolean;
  profile: { name: string; country: string | null; store: string | null };
  theme: 'system' | 'light' | 'dark';
  targets: { mode: 'same' | 'days'; same: Target; days: Target[] };
  library: { favorites: string[]; recipes: any[]; collections: Collection[]; weeks: any[]; lists: any[]; history: { mealId: string; date: number }[] };
  libSort: Record<string, string>;
  shopping: { view: 'meal' | 'all'; lang: 'orig' | 'en'; entries: ShopEntry[] };
  prep: { weekStart: string | null; days: PlanItem[][] | null };
  lastBackup: number | null;
  createdAt: number;
  [k: string]: any;
}

export function defTarget(): Target { return { p: 120, f: 68, c: 227 }; }
export function defaults(): State {
  return {
    v: DATA_VERSION, app: 'posilki', onboarded: false,
    profile: { name: '', country: null, store: null },
    theme: 'system',
    targets: { mode: 'same', same: defTarget(), days: DAYS.map(defTarget) },
    library: { favorites: [], recipes: [], collections: [], weeks: [], lists: [], history: [] },
    libSort: { favorites: 'new', recipes: 'new', collections: 'new' },
    shopping: { view: 'meal', lang: 'orig', entries: [] },
    prep: { weekStart: null, days: null },
    lastBackup: null,
    createdAt: Date.now(),
  };
}
function fill(def: any, saved: any): any {
  if (!isObj(saved)) return def;
  const out: any = {};
  Object.keys(saved).forEach((k) => { out[k] = saved[k]; });
  Object.keys(def).forEach((k) => {
    if (!(k in saved)) out[k] = def[k];
    else if (isObj(def[k]) && isObj(saved[k])) out[k] = fill(def[k], saved[k]);
  });
  return out;
}

/** Set when a migration moved someone off a store or country that was removed, so the app can say so. */
export let MOVED: { from: string; to: string; country?: boolean } | null = null;
export function clearMoved(): void { MOVED = null; }

// Each data change gets a step here, so updates always keep saved data. Copied unchanged from 0.17.x.
const MIGRATIONS: Record<number, (s: any) => any> = {
  1: function (s) { s.v = 2; return s; },
  2: function (s) {
    // Targets used to store calories; now calories are worked out from protein, fat and carbs.
    function conv(t: any) {
      if (!isObj(t)) return defTarget();
      if ('c' in t) return { p: t.p || 0, f: t.f || 0, c: t.c || 0 };
      const c = Math.max(0, Math.round(((t.kcal || 2000) - 4 * (t.p || 0) - 9 * (t.f || 0)) / 4));
      return { p: t.p || 0, f: t.f || 0, c: c };
    }
    if (isObj(s.targets)) { s.targets.same = conv(s.targets.same); if (Array.isArray(s.targets.days)) s.targets.days = s.targets.days.map(conv); }
    if (!s.theme) s.theme = 'system';
    if (!isObj(s.prep) || !('days' in s.prep)) s.prep = { weekStart: null, days: null };
    if (!isObj(s.shopping) || !Array.isArray(s.shopping.entries)) s.shopping = { view: 'meal', entries: [] };
    s.v = 3; return s;
  },
  3: function (s) {
    // Stores without a food catalogue online were removed. Move anyone using one to the first store left.
    if (isObj(s.profile) && s.profile.store && s.profile.country && COUNTRIES[s.profile.country] && storesFor(s.profile.country).indexOf(s.profile.store) < 0) {
      MOVED = { from: s.profile.store, to: storesFor(s.profile.country)[0] };
      s.profile.store = MOVED.to;
    }
    s.v = 4; return s;
  },
  4: function (s) {
    // Auchan, Carrefour and Krónan were removed (their products can't be read), and Iceland with Krónan.
    if (isObj(s.profile) && s.profile.country) {
      const from = s.profile.store;
      const gone = !COUNTRIES[s.profile.country];
      if (gone) s.profile.country = 'PL';
      if (storesFor(s.profile.country).indexOf(s.profile.store) < 0) { s.profile.store = storesFor(s.profile.country)[0]; if (from) MOVED = { from: from, to: s.profile.store, country: gone }; }
    }
    if (isObj(s.shopping) && s.shopping.lang !== 'en') s.shopping.lang = 'orig';
    s.v = 5; return s;
  },
};
export function migrate(s: any): State {
  if (!isObj(s)) return defaults();
  if (!s.v) s.v = 1;
  while (s.v < DATA_VERSION && MIGRATIONS[s.v]) s = MIGRATIONS[s.v](s);
  s = fill(defaults(), s);
  if (!Array.isArray(s.targets.days) || s.targets.days.length !== 7) s.targets.days = DAYS.map(() => clone(s.targets.same));
  s.v = DATA_VERSION;
  return s;
}

export let S: State = defaults();
export function setState(next: State): void { S = next; }
export function load(): void {
  try { const raw = localStorage.getItem(KEY); if (raw) S = migrate(JSON.parse(raw)); } catch { S = defaults(); }
}
let saveTimer: ReturnType<typeof setTimeout> | undefined;
export function save(): void { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage full or blocked */ } }
export function saveSoon(): void { clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); }
