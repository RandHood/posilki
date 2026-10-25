// Shared recipes: the whole recipe travels inside the link (#recipe=…), so sharing needs no server or account.
// The format is the same as in 0.17.x, so links sent before the rewrite still open.
import { ING, type IngLine, type Meal } from './catalog';
import { videoUrl } from './logic';

export interface SharedRecipe { name: string; desc: string; ing: IngLine[]; steps: string[]; video: string }

function toB64(s: string): string { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function fromB64(b: string): string { return decodeURIComponent(escape(atob(b.replace(/-/g, '+').replace(/_/g, '/')))); }

export function pageUrl(): string { return location.href.split('#')[0]; }
export function recipeLink(m: Meal): string {
  const d = { n: m.name, d: m.desc || '', i: m.ing, s: m.steps || [], v: m.video || '' };
  return pageUrl() + '#recipe=' + toB64(JSON.stringify(d));
}
export function readRecipeLink(t: string): SharedRecipe | null {
  const i = (t || '').indexOf('#recipe='); if (i < 0) return null;
  try {
    const d = JSON.parse(fromB64(t.slice(i + 8).trim()));
    const name = String(d.n || '').trim().slice(0, 120); if (!name) return null;
    const ing = (Array.isArray(d.i) ? d.i : []).filter((x: any) => Array.isArray(x) && ING[x[0]] && +x[1] > 0).map((x: any) => [x[0], Math.min(5000, Math.round(+x[1]))] as IngLine);
    const steps = (Array.isArray(d.s) ? d.s : []).map((x: any) => String(x).trim().slice(0, 1000)).filter(Boolean);
    return { name, desc: String(d.d || '').trim().slice(0, 1000), ing, steps, video: videoUrl(String(d.v || '')) };
  } catch { return null; }
}
// Links always open in Safari on iPhone, and Safari keeps its data apart from the home-screen app.
export function inIosSafari(): boolean { return /iP(hone|ad|od)/.test(navigator.userAgent) && (navigator as any).standalone === false; }
export function sameRecipe(a: { name: string; ing: IngLine[] }, b: { name: string; ing: IngLine[] }): boolean {
  return a.name.toLowerCase() === b.name.toLowerCase() && JSON.stringify(a.ing) === JSON.stringify(b.ing);
}
