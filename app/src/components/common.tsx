// Small building blocks used across screens. Class names match the stylesheet carried over from 0.17.x.
import type { ComponentChildren } from 'preact';
import type { Meal } from '../services/catalog';
import { type Macros, mealMacros } from '../services/logic';
import { mealImage } from '../services/picture';
import { nf, storeStyle } from '../services/util';
import { updateNow } from '../app/ui';

const I: Record<string, string> = {
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  meals: '<path d="M4 12h16a8 8 0 0 1-16 0z"/><path d="M9 8c0-1.5 1-1.5 1-3M14 8c0-1.5 1-1.5 1-3"/>',
  prep: '<path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>',
  shopping: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  library: '<path d="M5 4h4v16H5zM10 4h4v16h-4zM15.5 5l3.8-1 3 15-3.8 1z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  sort: '<path d="M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
  swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  share: '<path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  minus: '<path d="M5 12h14"/>',
  play: '<path d="M9 7l8 5-8 5z"/>',
};

export function Icon({ n, size = 22, fill = false }: { n: string; size?: number; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={fill ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: I[n] }} />
  );
}

export function Badge({ store, lg }: { store: string | null; lg?: boolean }) {
  const s = storeStyle(store || '');
  return <span class={'sb' + (lg ? ' lg' : '')} style={{ '--b': s[0], '--bt': s[1] }} aria-hidden="true">{(store || '?').charAt(0)}</span>;
}

export function MealImg({ m, label }: { m: Parameters<typeof mealImage>[0]; label?: string }) {
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: mealImage(m, label) }} />;
}

export function MacroTable({ x }: { x: Macros }) {
  // Calories get the wide tile; protein, fat and carbs share three equal ones.
  const tile = (cls: string, label: string, val: string | number, unit: string) => (
    <div class={'mtile ' + cls}><span>{label}</span><b>{val}</b><small>{unit}</small></div>
  );
  return <div class="macros">{tile('kcal', 'Calories', nf(x.kcal), 'kcal')}{tile('p', 'Protein', x.p, 'g')}{tile('f', 'Fat', x.f, 'g')}{tile('c', 'Carbs', x.c, 'g')}</div>;
}

export function MealRow({ m, extra, serv, onOpen }: { m: Meal; extra?: string; serv?: number; onOpen: (id: string) => void }) {
  const x = mealMacros(m, serv || 1);
  return (
    <button class="mrow" onClick={() => onOpen(m.id)}>
      <span class="thumb"><MealImg m={m} /></span>
      <span class="grow">{extra ? <span class="slotlbl">{extra}</span> : null}<b>{m.name}</b><span class="mline">{nf(x.kcal)} kcal, {x.p} g protein</span></span>
    </button>
  );
}

export function MealCard({ m, onOpen }: { m: Meal; onOpen: (id: string) => void }) {
  const x = mealMacros(m);
  return (
    <button class="mcard" onClick={() => onOpen(m.id)}>
      <MealImg m={m} />{m.custom ? <i class="mtag">Your recipe</i> : null}<b>{m.name}</b><span>{nf(x.kcal)} kcal, {x.p} g protein</span>
    </button>
  );
}

/** A dropdown that floats over the page; `id` names it so a tap outside can close it. */
export function Dropdown({ id, open, button, label, wrapClass, children }: {
  id: string; open: boolean; button: ComponentChildren; label: string; wrapClass?: string; children: ComponentChildren;
}) {
  return (
    <div class={'dd' + (wrapClass ? ' ' + wrapClass : '')} data-dd={id}>
      {button}
      <div class={'ddwrap' + (open ? ' open' : '')} id={id}><div><div class="ddlist" role="radiogroup" aria-label={label}>{children}</div></div></div>
    </div>
  );
}

/** Shown in every header while a new version is waiting, like in Polski B1. Tapping it reloads into the new version. */
export function UpdateButton() {
  return updateNow ? <button type="button" class="update-btn" onClick={updateNow}>Update</button> : null;
}

export function PageHead({ title, right, onBack }: { title?: ComponentChildren; right?: ComponentChildren; onBack: () => void }) {
  return (
    <>
      <div class="pagehead"><button class="back" onClick={onBack} aria-label="Back"><Icon n="back" size={22} /></button>
        {updateNow || right ? <span class="pheadend"><UpdateButton />{right}</span> : null}</div>
      {title ? <h1 style={{ marginBottom: '16px' }}>{title}</h1> : null}
    </>
  );
}

/** Daily-calorie pill when a day is planned past its target. */
export function OverPill({ kcal, target }: { kcal: number; target: number }) {
  return kcal > target ? <span class="overpill">{nf(kcal - target)} over</span> : null;
}

export function EmojiDot({ e }: { e: string }) { return <span class="edot" aria-hidden="true">{e}</span>; }
