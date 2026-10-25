// Meals, macros, categories, planning, suggestions and product labels. Ported from the single-file app.
import { AISLE_EMOJI, CAT_LABEL, CATS, DAYS, ING_EMOJI, PROD, SLOT_SHARE, SLOTS, STEP_G } from '../data/fixed';
import { CATALOG, DIET, ING, type IngLine, LIVE, MB, MEALS, type Meal, catalogRev, liveItem, liveStore } from './catalog';
import { type PlanItem, S, type Target } from './state';
import { fmtDate, isoDate, mondayIso, money, nf, parseIso, rng, todayIdx } from './util';

export interface Macros { p: number; f: number; c: number; kcal: number; g?: number }

export function country(): string { return S.profile.country || 'PL'; }
export function tKcal(t: Target): number { return 4 * t.p + 4 * t.c + 9 * t.f; }
export function dayTarget(i: number): Macros { const t = S.targets.mode === 'same' ? S.targets.same : S.targets.days[i]; return { p: t.p, f: t.f, c: t.c, kcal: tKcal(t) }; }
export function backupDue(): boolean { const ref = S.lastBackup || S.createdAt || Date.now(); return Date.now() - ref > 14 * 864e5; }

/* ---------- Meals and macros ---------- */
export function allMeals(): Meal[] { return MEALS.concat(S.library.recipes); }
export function getMeal(id: string): Meal | null {
  if (MB[id]) return MB[id];
  const r = S.library.recipes; for (let i = 0; i < r.length; i++) if (r[i].id === id) return r[i];
  return null;
}
// Rounded protein, fat and carbs first, then calories from them, so the numbers always add up.
export function macrosOf(ing: IngLine[], serv?: number): Required<Macros> {
  serv = serv || 1; let p = 0, f = 0, c = 0, g = 0;
  ing.forEach((x) => { const it = ING[x[0]]; if (!it) return; const q = x[1] * serv!; p += it.p * q / 100; f += it.f * q / 100; c += it.c * q / 100; g += q; });
  p = Math.round(p); f = Math.round(f); c = Math.round(c);
  return { p, f, c, kcal: 4 * p + 4 * c + 9 * f, g: Math.round(g) };
}
export function sumMacros(list: Macros[]): Macros { let p = 0, f = 0, c = 0; list.forEach((m) => { p += m.p; f += m.f; c += m.c; }); return { p, f, c, kcal: 4 * p + 4 * c + 9 * f }; }
export function mealMacros(m: Meal, serv?: number) { return macrosOf(m.ing, serv); }
export function isFav(id: string): boolean { return S.library.favorites.indexOf(id) > -1; }
export function mealSub(m: Meal): string { return country() === 'PL' && m.pl ? m.pl : ''; }
function round5(g: number): number { return g < 5 ? Math.round(g * 10) / 10 : Math.round(g / 5) * 5; }
export function needText(k: string, g: number): string {
  const x = ING[k]; let t = round5(g) + ' ' + x.u;
  if (x.piece) { const n = Math.max(1, Math.round(g / x.piece)); t += ' (≈ ' + n + (n === 1 ? ' pc)' : ' pcs)'); }
  return t;
}
export function packText(k: string, g: number, store?: string): string {
  const x = ING[k], li = liveItem(k, store || S.profile.store!);
  if (li && li.size! > 0 && li.unit === x.u) {
    const m = Math.max(1, Math.ceil(g / li.size! - 1e-9));
    const sz = li.size! >= 1000 ? (Math.round(li.size! / 100) / 10 + ' ' + (li.unit === 'ml' ? 'l' : 'kg')).replace('.', ',') : nf(li.size!) + ' ' + li.unit;
    return m + ' × ' + sz + (li.price! > 0 ? ', ' + money(m * li.price!, li.currency) : '');
  }
  if (li && li.price! > 0) return money(li.price!, li.currency) + ' each';
  if (x.pack) { const n = Math.max(1, Math.ceil(g / x.pack - 1e-9)); return n + ' × ' + x.packLabel; }
  if (x.piece) { const n = Math.max(1, Math.ceil(g / x.piece - 0.15)); return 'sold loose, buy ≈ ' + n + (n === 1 ? ' pc' : ' pcs'); }
  return 'sold loose';
}

/* ---------- Products on the shelf ---------- */
export function product(k: string, store: string): { brand: string; name: string; label: string } {
  const li = liveItem(k, store);
  if (li) return { brand: li.brand || '', name: li.name, label: li.brand && li.name.toLowerCase().indexOf(li.brand.toLowerCase()) < 0 ? li.brand + ' ' + li.name : li.name };
  const x = ING[k], base: string = (PROD[country()] || {})[k] || ('|' + (country() === 'PL' ? x.pl : x.en));
  const b = base.split('|');
  return { brand: b[0], name: b[1], label: b[0] ? b[0] + ' ' + b[1] : b[1] };
}
// One line per item: "product label, brand". English uses the English ingredient name with the same brand,
// since store product names only exist in the store's language.
export function itemLabel(k: string, store: string, lang: string): string {
  const pr = product(k, store);
  let name = lang === 'en' ? ING[k].en : pr.name;
  name = String(name || '').replace(/[,\s]+\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l)\b\.?\s*$/i, '');
  const b = pr.brand && name.toLowerCase().indexOf(pr.brand.toLowerCase()) < 0 ? pr.brand : '';
  return b ? name + ', ' + b : name;
}
export function plainName(k: string, lang: string): string { const n = lang === 'en' || country() !== 'PL' ? ING[k].en : ING[k].pl; return n.charAt(0).toUpperCase() + n.slice(1); }
export function liveNote(store: string): string {
  const s = liveStore(store);
  if (!s) return 'Product names and values are typical examples for ' + store + '. Its online shop can’t be read automatically yet.';
  return 'Products and prices from ' + (s.source || store) + ', checked ' + fmtDate(parseIso(s.checked || LIVE.updated || isoDate()).getTime()) + '. They are found by search, so check the label in the store.';
}

/* ---------- Categories ----------
   Some come from the numbers (protein, calories, carbs, time, ingredients), the rest from the catalog's tags. */
let catCache: Record<string, string[]> = {}, catRev = -1;
export function mealCats(m: Meal): string[] {
  if (catRev !== catalogRev) { catCache = {}; catRev = catalogRev; }
  const key = m.id + '|' + m.ing.map((x) => x[0] + x[1]).join(',');
  if (catCache[key]) return catCache[key];
  const x = mealMacros(m), snack = m.types.every((t) => t === 'snack'), out: Record<string, 1> = {};
  if (x.p >= (snack ? 15 : 25) && x.p * 4 >= x.kcal * 0.3) out.protein = 1;
  if (x.kcal <= (snack ? 200 : 400)) out.light = 1;
  if (x.c <= (snack ? 10 : 20)) out.lowcarb = 1;
  if (m.mins <= 15) out.quick = 1;
  const d = m.ing.map((i) => DIET[i[0]] || '');
  if (d.indexOf('meat') < 0 && d.indexOf('fish') < 0) { out.vegetarian = 1; if (d.indexOf('animal') < 0) out.vegan = 1; }
  if (d.indexOf('fish') > -1) out.fish = 1;
  const base = m.custom ? (MB[m.base!] || m) : m;
  (base.tags || m.tags || []).forEach((t) => { if (CAT_LABEL[t]) out[t] = 1; });
  const arr = CATS.map((c: string[]) => c[0]).filter((c: string) => out[c]);
  catCache[key] = arr; return arr;
}
export function hasCats(m: Meal, want: string[]): boolean { if (!want.length) return true; const c = mealCats(m); return want.every((w) => c.indexOf(w) > -1); }

/* ---------- Planner ---------- */
export function poolFor(t: string): Meal[] { return allMeals().filter((m) => m.types.indexOf(t) > -1); }
export function dayTotals(items: PlanItem[]): Macros { return sumMacros(items.map((it) => { const m = getMeal(it.id); return m ? mealMacros(m, it.serv) : { p: 0, f: 0, c: 0, kcal: 0 }; })); }
function fit(items: PlanItem[], T: Macros): void {
  const order = [3, 1, 0];
  for (let n = 0; n < 8; n++) {
    const gap = T.kcal - dayTotals(items).kcal; let best: { it: PlanItem; d: number } | null = null, bestGap = Math.abs(gap);
    if (bestGap <= 120) break;
    order.forEach((j) => {
      const it = items[j]; if (!it) return; const m = getMeal(it.id); if (!m) return;
      const step = mealMacros(m, 0.5).kcal;
      if (gap > 0 && it.serv < 2) { const g = Math.abs(gap - step); if (g < bestGap) { bestGap = g; best = { it, d: 0.5 }; } }
      if (gap < 0 && it.serv > 0.5) { const g2 = Math.abs(gap + step); if (g2 < bestGap) { bestGap = g2; best = { it, d: -0.5 }; } }
    });
    if (!best) break;
    (best as { it: PlanItem; d: number }).it.serv += (best as { it: PlanItem; d: number }).d;
  }
}
function genDay(i: number, used: Record<string, number>): PlanItem[] {
  const T = dayTarget(i); let best: PlanItem[] = [], bs = 1e12;
  for (let n = 0; n < 300; n++) {
    const ids: string[] = [], items: PlanItem[] = [];
    SLOTS.forEach((t: string) => {
      const arr = poolFor(t).filter((m) => ids.indexOf(m.id) < 0);
      const m = arr[Math.floor(Math.random() * arr.length)]; ids.push(m.id); items.push({ id: m.id, slot: t, serv: 1 });
    });
    const tot = dayTotals(items);
    let score = Math.abs(tot.kcal - T.kcal) + Math.max(0, T.p - tot.p) * 14;
    items.forEach((it) => { score += (used[it.id] || 0) * 70; if (isFav(it.id)) score -= 40; });
    if (score < bs) { bs = score; best = items; }
  }
  fit(best, T);
  best.forEach((it) => { used[it.id] = (used[it.id] || 0) + 1; });
  return best;
}
export function newWeek(): void {
  const used: Record<string, number> = {}, days: PlanItem[][] = [];
  for (let i = 0; i < 7; i++) days.push(genDay(i, used));
  S.prep = { weekStart: mondayIso(), days };
}
export function ensurePrep(): void {
  const P = S.prep, ok = P && P.weekStart === mondayIso() && Array.isArray(P.days) && P.days.length === 7;
  // Drop meals that no longer exist, but only once the full catalog is here, so nothing planned is lost offline.
  if (ok && CATALOG.loaded) P.days = P.days!.map((d) => (d || []).filter((it) => getMeal(it.id)));
  if (!ok) newWeek();
}
export function planDays(): PlanItem[][] { return S.prep.days!; }
export function dayDate(i: number): Date { const d = parseIso(S.prep.weekStart!); d.setDate(d.getDate() + i); return d; }
export function currentSlot(): string { const h = new Date().getHours(); return h < 10 ? 'breakfast' : h < 14 ? 'lunch' : h < 17 ? 'snack' : h < 21 ? 'dinner' : 'snack'; }
function startOfToday(): number { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
// Calories left for this slot: what's left of today's target after meals marked as cooked today,
// split across this slot and the ones still to come.
export function slotBudget(slot: string): { kcal: number; p: number; T: Macros; eaten: Macros | null } {
  const T = dayTarget(todayIdx()), t0 = startOfToday();
  const cooked = S.library.history.filter((h) => h.date >= t0).map((h) => getMeal(h.mealId)).filter(Boolean) as Meal[];
  if (!cooked.length) return { kcal: T.kcal * SLOT_SHARE[slot], p: T.p * SLOT_SHARE[slot], T, eaten: null };
  const eaten = sumMacros(cooked.map((m) => mealMacros(m)));
  const order = ['breakfast', 'lunch', 'snack', 'dinner'], from = order.indexOf(slot); let share = 0;
  order.forEach((s, i) => { if (i >= from) share += SLOT_SHARE[s]; });
  const f = SLOT_SHARE[slot] / (share || 1);
  return { kcal: Math.max(80, (T.kcal - eaten.kcal) * f), p: Math.max(0, (T.p - eaten.p) * f), T, eaten };
}
// Scores every meal for the slot, then picks from the best ones with a daily random seed,
// so the list changes from day to day and on every shuffle.
export function suggestions(slot: string, n: number, shuffle: number): Meal[] {
  const B = slotBudget(slot), now = Date.now(), seed = rng(isoDate() + slot + '#' + shuffle);
  const recent: Record<string, 1> = {}, aff: Record<string, number> = {};
  S.library.history.forEach((h) => { if (now - h.date < 7 * 864e5) recent[h.mealId] = 1; });
  ((S.prep.days && S.prep.days[todayIdx()]) || []).forEach((it) => { recent[it.id] = 1; });
  S.library.favorites.concat(S.library.history.map((h) => h.mealId)).forEach((id) => {
    const m = getMeal(id); if (m) mealCats(m).forEach((c) => { aff[c] = (aff[c] || 0) + 1; });
  });
  const scored = poolFor(slot).filter((m) => !m.custom || isFav(m.id)).map((m) => {
    const x = mealMacros(m); let sc = Math.abs(x.kcal - B.kcal) / Math.max(1, B.kcal) * 300;
    sc -= Math.min(x.p, B.p * 1.3) * 2.5;
    if (recent[m.id]) sc += 160;
    if (isFav(m.id)) sc -= 50;
    const mc = mealCats(m);
    mc.forEach((c) => { sc -= Math.min(aff[c] || 0, 4) * 6; });
    // Dishes from the other country still show up, just less often.
    if (mc.indexOf(country() === 'PL' ? 'icelandic' : 'polish') > -1) sc += 60;
    return { m, score: sc + seed() * 140 };
  }).sort((a, b) => a.score - b.score);
  const pick: Meal[] = [], pool = scored.slice(0, Math.max(n * 4, 12));
  while (pick.length < n && pool.length) { const i = Math.floor(Math.pow(seed(), 1.6) * pool.length); pick.push(pool.splice(i, 1)[0].m); }
  return pick;
}
export function openShopCount(): number { let n = 0; S.shopping.entries.forEach((e) => { e.items.forEach((i) => { if (!i.checked) n++; }); }); return n; }
export function aggregate(): Record<string, { key: string; g: number; n: number; done: number }> {
  const map: Record<string, { key: string; g: number; n: number; done: number }> = {};
  S.shopping.entries.forEach((e) => { e.items.forEach((it) => {
    if (!ING[it.key]) return; const r = map[it.key] || (map[it.key] = { key: it.key, g: 0, n: 0, done: 0 }); r.g += it.g; r.n++; if (it.checked) r.done++;
  }); });
  return map;
}
export function macroLine(x: Macros): string { return nf(x.kcal) + ' kcal, protein ' + x.p + ' g, fat ' + x.f + ' g, carbs ' + x.c + ' g'; }
export function dayName(i: number): string { return DAYS[i]; }

/* ---------- Ingredients in your own recipes ---------- */
export function ingEmoji(k: string): string { return ING_EMOJI[k] || AISLE_EMOJI[(ING[k] || ({} as any)).a] || '🍽️'; }
// One tap of + adds one piece where the food comes in pieces, otherwise a usual kitchen amount.
export function ingStep(k: string): number { const x = ING[k]; return x.piece || STEP_G[k] || 100; }
export function stepText(k: string): string { const x = ING[k]; return x.piece ? '1 piece ≈ ' + x.piece + ' ' + x.u : 'Each + adds ' + ingStep(k) + ' ' + x.u; }
export function amountText(k: string, g: number): string {
  const x = ING[k];
  return x.piece ? '≈ ' + Math.max(1, Math.round(g / x.piece)) + (Math.round(g / x.piece) > 1 ? ' pieces' : ' piece') + ', ' + nf(g) + ' ' + x.u : nf(g) + ' ' + x.u;
}
export interface Draft { id?: string; name: string; desc: string; g: Record<string, number>; order: string[]; steps: string[]; video: string }
export function newDraft(): Draft { return { name: '', desc: '', g: {}, order: [], steps: [''], video: '' }; }
export function draftFrom(m: Meal): Draft {
  const d: Draft = { id: m.id, name: m.name, desc: m.desc || '', g: {}, order: [], steps: (m.steps && m.steps.length ? m.steps.slice() : ['']), video: m.video || '' };
  m.ing.forEach((x) => { d.g[x[0]] = x[1]; d.order.push(x[0]); });
  return d;
}
export function draftItems(d: Draft): string[] { return d.order.filter((k) => d.g[k] > 0 && ING[k]); }
// Amounts are kept in grams, so a recipe made from a meal keeps its exact amounts; the counter shows them in steps.
export function cntOf(d: Draft, k: string): number { const g = d.g[k] || 0; return g > 0 ? Math.max(1, Math.round(g / ingStep(k))) : 0; }
export function videoUrl(v: string): string {
  v = (v || '').trim(); if (!v) return '';
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  return /^https?:\/\/[^\s/]+\.[^\s]+/i.test(v) ? v : '';
}
