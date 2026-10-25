// Small helpers shared across the app.
import { COUNTRIES, STORE_STYLE } from '../data/fixed';

export function uid(): string { return Math.random().toString(36).slice(2, 10); }
function pad(n: number): string { return n < 10 ? '0' + n : '' + n; }
export function isoDate(d?: Date): string { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
export function parseIso(s: string): Date { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
export function fmtDate(ts: number | string): string { return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
export function fmtShort(d: Date): string { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
export function nf(n: number): string { return Math.round(n).toLocaleString('en-GB'); }
export function isObj(x: unknown): x is Record<string, any> { return !!x && typeof x === 'object' && !Array.isArray(x); }
export function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }
export function initial(name: string): string { const n = (name || '').trim(); return n ? n.charAt(0).toUpperCase() : '?'; }
export function todayIdx(): number { return (new Date().getDay() + 6) % 7; }
export function mondayIso(): string { const d = new Date(); d.setDate(d.getDate() - todayIdx()); return isoDate(d); }
export function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
export function money(v: number, cur?: string): string {
  return cur === 'PLN' ? v.toFixed(2).replace('.', ',') + ' zł' : cur === 'ISK' ? Math.round(v) + ' kr' : v.toFixed(2) + ' ' + (cur || '');
}

export function storesFor(cc: string | null | undefined): string[] {
  const c = cc ? COUNTRIES[cc] : null; if (!c) return [];
  const list: string[] = c.stores.slice();
  try { list.sort(new Intl.Collator(c.locale).compare); } catch { list.sort((a, b) => a.localeCompare(b)); }
  return list;
}
export function storeStyle(store: string): [string, string] { return STORE_STYLE[store] || ['#586A5D', '#FFFFFF']; }

/** Seeded random numbers, so pictures and daily suggestions stay the same for the same seed. */
export function rng(seed: string): () => number {
  let h = 2166136261; for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
