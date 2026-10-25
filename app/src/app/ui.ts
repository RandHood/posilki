/* Screen state that isn't saved: the open tab, the stack of full-screen pages, sheets, the side panel,
   dropdowns, toasts. Handlers change S (saved data) or UI, then call rerender() or refresh(). */
import { useLayoutEffect, useState } from 'preact/hooks';
import type { Draft } from '../services/logic';
import type { SharedRecipe } from '../services/share';
import { save } from '../services/state';
import { todayIdx } from '../services/util';

export type Page =
  | { type: 'settings' }
  | { type: 'lib'; sec: string; cid?: string }
  | { type: 'meal'; id: string; store: string; grams: number[]; open: boolean }
  | { type: 'recipeEdit'; draft: Draft }
  | { type: 'ingPick'; draft: Draft; cat?: string; q: string }
  | { type: 'shared'; rec: SharedRecipe; link: string; copied?: boolean };

export type Sheet =
  | { type: 'store'; scope: 'meal' | 'default' }
  | { type: 'pick'; title: string; slot: string | null; onPick: (id: string) => boolean | void }
  | { type: 'slot'; day: number; id: string }
  | { type: 'plan'; id: string; day: number; slot: string }
  | { type: 'name'; title: string; placeholder: string; action: string; value: string }
  | { type: 'coll'; id: string }
  | { type: 'confirm'; title: string; text: string; action: string; label: string; id?: string }
  | { type: 'paste' }
  | { type: 'import'; data: any };

export const UI = {
  tab: 'home',
  ob: { step: 1, name: '', country: null as string | null },
  stack: [] as Page[],
  filter: 'all',
  cats: [] as string[],
  q: '',
  limit: 40,
  sheet: null as Sheet | null,
  prepDay: todayIdx(),
  prepScroll: 'jump' as 'jump' | 'smooth' | null,
  panel: false,
  storeOpen: false,
  countryOpen: false,
  langOpen: false,
  sortOpen: false,
  shuffle: 0,
  sugSlot: null as string | null,
  toast: '',
  toastShow: false,
  notice: null as { keys: string[]; store: string } | null,
  noticeShow: false,
};

/** Set while a new version is waiting; the Update button calls it. */
export let updateNow: (() => void) | null = null;
export function setUpdateNow(fn: (() => void) | null): void { updateNow = fn; }

let listener: (() => void) | null = null;
let after: (() => void)[] = [];
/** Redraws the app. */
export function rerender(): void { if (listener) listener(); }
/** Runs fn once the next redraw is on screen. */
export function afterRender(fn: () => void): void { after.push(fn); }
/** Saves and redraws. */
export function refresh(): void { save(); rerender(); }

export function useAppRender(): void {
  const [, set] = useState(0);
  listener = () => set((n) => n + 1);
  useLayoutEffect(() => {
    const run = after; after = [];
    run.forEach((fn) => fn());
  });
}

export function top(): Page | undefined { return UI.stack[UI.stack.length - 1]; }
export function topOf<T extends Page["type"]>(_type: T): Extract<Page, { type: T }> { return top() as Extract<Page, { type: T }>; }

/* ---------- Toast and the top notice ---------- */
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string): void {
  UI.toast = msg; UI.toastShow = true; rerender();
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { UI.toastShow = false; rerender(); }, 2600);
}
export function showNotice(keys: string[], store: string): void {
  UI.notice = { keys, store }; UI.noticeShow = false; rerender();
  // Off first, then on, so it slides in again if it was already showing.
  requestAnimationFrame(() => requestAnimationFrame(() => { UI.noticeShow = true; rerender(); }));
}
export function closeNotice(): void { UI.noticeShow = false; rerender(); }

/* ---------- Sheets ---------- */
export function openSheet(s: Sheet): void { UI.sheet = s; rerender(); }
export function closeSheet(): void { UI.sheet = null; rerender(); }

/* ---------- Side panel ---------- */
export function openPanel(): void { if (!UI.panel) UI.storeOpen = false; UI.panel = true; rerender(); }
export function closePanel(): void { if (!UI.panel) return; UI.panel = false; UI.storeOpen = false; rerender(); }

/* ---------- Full-screen pages (a stack, so Back returns to the previous page) ---------- */
function motionOK(): boolean { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; } }
function overlay(): HTMLElement | null { return document.getElementById('overlay'); }
// A still copy of the page on screen, so it can slide away while the next one is drawn.
function pageGhost(cls: string): void {
  const o = overlay(); if (!o) return;
  const g = document.createElement('div'); g.className = 'pgghost ' + cls; g.setAttribute('aria-hidden', 'true');
  g.innerHTML = o.innerHTML;
  const first = g.firstElementChild as HTMLElement | null; if (first) first.style.marginTop = (-o.scrollTop) + 'px';
  document.body.appendChild(g); setTimeout(() => g.remove(), 420);
}
export function animatePage(cls: string): void {
  const o = overlay(); if (!o) return;
  o.classList.remove('pg-in', 'pg-back'); void o.offsetWidth; o.classList.add(cls);
  setTimeout(() => o.classList.remove(cls), 420);
}
const scrollOf = new WeakMap<Page, number>();
export function pushPage(p: Page): void {
  UI.panel = false; UI.storeOpen = false;
  const anim = motionOK(), o = overlay(), shown = UI.stack.length && o && o.classList.contains('open');
  if (anim && shown) pageGhost('under');
  const cur = top(); if (cur && o) scrollOf.set(cur, o.scrollTop);
  UI.stack.push(p);
  afterRender(() => { const el = overlay(); if (el) el.scrollTop = 0; if (anim) animatePage('pg-in'); });
  rerender();
}
export function popPage(): void {
  const o = overlay();
  if (motionOK() && o && o.classList.contains('open')) pageGhost('out');
  UI.stack.pop();
  const cur = top();
  if (cur) {
    afterRender(() => { const el = overlay(); if (el) el.scrollTop = scrollOf.get(cur) || 0; if (motionOK()) animatePage('pg-back'); });
  } else if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  rerender();
}
/** Swaps the page on top for another, as when a new recipe is saved and its page opens. */
export function replaceTop(p: Page, slide?: boolean): void {
  UI.stack[UI.stack.length - 1] = p;
  afterRender(() => { const el = overlay(); if (el) el.scrollTop = 0; if (slide && motionOK()) animatePage('pg-in'); });
  rerender();
}
export function closeAllPages(): void { UI.stack = []; rerender(); }
// Drops the pages that showed something now deleted and slides back to what's left.
export function leavePages(gone: (p: Page) => boolean): void {
  const keep = UI.stack.filter((p) => !gone(p));
  if (keep.length === UI.stack.length) { refresh(); return; }
  UI.stack = keep.concat([UI.stack[UI.stack.length - 1]]);
  popPage();
}
