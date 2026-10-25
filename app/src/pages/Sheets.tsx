// Bottom sheets: pickers, confirmations and small forms.
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { DAYS, DAYS_SHORT, SLOT_LABEL, TYPES } from '../data/fixed';
import { Badge, Icon, MealImg } from '../components/common';
import { allMeals, dayDate, getMeal, isFav, mealMacros, newWeek, poolFor } from '../services/logic';
import { readRecipeLink } from '../services/share';
import { S, save } from '../services/state';
import { nf, storesFor, uid } from '../services/util';
import { deleteCollection, deleteRecipe, importMerge, importReplace, importWhen, openShared } from '../app/actions';
import { type Sheet, UI, closeSheet, refresh, rerender, toast, top } from '../app/ui';

function Head({ title, sub }: { title: string; sub?: string }) {
  return (
    <div class="shead"><div><h2>{title}</h2>{sub ? <p class="small muted" style={{ marginTop: '4px' }}>{sub}</p> : null}</div>
      <button class="iconbtn" onClick={closeSheet} aria-label="Close"><Icon n="x" /></button></div>
  );
}

function StoreSheet({ s }: { s: Extract<Sheet, { type: 'store' }> }) {
  const page = top(), cur = s.scope === 'meal' && page && page.type === 'meal' ? page.store : S.profile.store;
  return (
    <>
      <Head title={s.scope === 'meal' ? 'Show products from' : 'Default store'} sub={s.scope === 'meal' ? 'Only changes this meal page.' : 'Used everywhere in the app.'} />
      <div class="slist">{storesFor(S.profile.country).map((st) => {
        const on = st === cur;
        return (
          <button key={st} class="storebtn" aria-pressed={on} onClick={() => {
            UI.sheet = null;
            const p = top();
            if (s.scope === 'meal' && p && p.type === 'meal') { p.store = st; rerender(); }
            else { S.profile.store = st; refresh(); toast('Default store: ' + st); }
          }}>
            <Badge store={st} /><span class="grow">{st}{st === S.profile.store && s.scope === 'meal' ? <> <span class="small muted">(default)</span></> : null}</span>
            {on ? <span class="check"><Icon n="check" size={20} /></span> : null}
          </button>
        );
      })}</div>
    </>
  );
}

function PickSheet({ s }: { s: Extract<Sheet, { type: 'pick' }> }) {
  const arr = (s.slot ? poolFor(s.slot) : allMeals()).slice().sort((a, b) => (isFav(b.id) ? 1 : 0) - (isFav(a.id) ? 1 : 0));
  return (
    <>
      <Head title={s.title} sub="Favorites first." />
      <div>{arr.map((m) => {
        const x = mealMacros(m);
        return (
          <button key={m.id} class="mrow" onClick={() => { const keep = s.onPick(m.id); if (!keep) { UI.sheet = null; refresh(); } }}>
            <span class="thumb" style={{ width: '56px', flexBasis: '56px' }}><MealImg m={m} /></span>
            <span class="grow"><b>{m.name}</b><span class="mline">{nf(x.kcal)} kcal, {x.p} g protein{isFav(m.id) ? ', favorite' : ''}</span></span>
          </button>
        );
      })}</div>
    </>
  );
}

function SlotSheet({ s }: { s: Extract<Sheet, { type: 'slot' }> }) {
  const m = getMeal(s.id)!;
  return (
    <>
      <Head title={'Add to ' + DAYS[s.day]} sub={m.name} />
      <div class="slist">{TYPES.map((t: string) => (
        <button key={t} class="storebtn" onClick={() => { S.prep.days![s.day].push({ id: s.id, slot: t, serv: 1 }); UI.sheet = null; refresh(); toast('Added to ' + DAYS[s.day]); }}>
          <span class="grow">{SLOT_LABEL[t]}</span><span class="chev"><Icon n="chev" size={18} /></span>
        </button>
      ))}</div>
    </>
  );
}

function PlanSheet({ s }: { s: Extract<Sheet, { type: 'plan' }> }) {
  const m = getMeal(s.id)!;
  return (
    <>
      <Head title="Add to plan" sub={m.name} />
      <span class="lbl" style={{ marginTop: 0 }}>Day</span>
      <div class="daypick">{DAYS_SHORT.map((d: string, i: number) => (
        <button key={i} aria-pressed={s.day === i} onClick={() => { s.day = i; rerender(); }}>{d}<small>{dayDate(i).getDate()}</small></button>
      ))}</div>
      <span class="lbl">Meal</span>
      <div class="seg" role="group" aria-label="Meal">{TYPES.map((t: string) => (
        <button key={t} aria-pressed={s.slot === t} onClick={() => { s.slot = t; rerender(); }}>{SLOT_LABEL[t]}</button>
      ))}</div>
      <div class="btnrow"><button class="btn primary block" onClick={() => { S.prep.days![s.day].push({ id: s.id, slot: s.slot, serv: 1 }); UI.sheet = null; refresh(); toast('Added to ' + DAYS[s.day]); }}>Add to {DAYS[s.day]}</button></div>
    </>
  );
}

function NameSheet({ s }: { s: Extract<Sheet, { type: 'name' }> }) {
  const [v, setV] = useState(s.value);
  const ok = () => {
    const name = v.trim(); if (!name) return;
    if (s.action === 'newCollection') { S.library.collections.push({ id: uid(), name, ids: [] }); toast('Collection created'); }
    UI.sheet = null; refresh();
  };
  return (
    <>
      <Head title={s.title} />
      <input id="nameInput" class="field" placeholder={s.placeholder} value={v} aria-label={s.title} autoFocus
        onInput={(e) => setV((e.currentTarget as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === 'Enter') ok(); }} />
      <div class="btnrow"><button class="btn primary" onClick={ok}>Save</button><button class="btn" onClick={closeSheet}>Cancel</button></div>
    </>
  );
}

function CollectionSheet({ s }: { s: Extract<Sheet, { type: 'coll' }> }) {
  const C = S.library.collections, [v, setV] = useState('');
  return (
    <>
      <Head title="Add to collection" sub={getMeal(s.id)!.name} />
      {C.length ? <div class="slist">{C.map((c) => {
        const on = c.ids.indexOf(s.id) > -1;
        return (
          <button key={c.id} class="storebtn" aria-pressed={on} onClick={() => { const i = c.ids.indexOf(s.id); if (i > -1) c.ids.splice(i, 1); else c.ids.push(s.id); save(); rerender(); }}>
            <span class="grow">{c.name}</span>{on ? <span class="check"><Icon n="check" size={20} /></span> : null}
          </button>
        );
      })}</div> : <p class="muted">No collections yet. Create your first one below.</p>}
      <div class="addrow" style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <input id="nameInput" class="field" placeholder="New collection, e.g. Quick dinners" aria-label="New collection name" value={v} onInput={(e) => setV((e.currentTarget as HTMLInputElement).value)} />
        <button class="btn" onClick={() => { const name = v.trim(); if (!name) return; S.library.collections.push({ id: uid(), name, ids: [s.id] }); save(); setV(''); rerender(); toast('Added to ' + name); }}>Create</button>
      </div>
    </>
  );
}

function ConfirmSheet({ s }: { s: Extract<Sheet, { type: 'confirm' }> }) {
  const yes = () => {
    UI.sheet = null;
    if (s.action === 'deleteRecipe') return deleteRecipe(s.id!);
    if (s.action === 'deleteCollection') return deleteCollection(s.id!);
    if (s.action === 'newWeek') { newWeek(); refresh(); toast('New week planned'); }
    else if (s.action === 'clearList') { S.shopping.entries = []; refresh(); toast('Shopping list cleared'); }
  };
  return (
    <>
      <Head title={s.title} />
      <p>{s.text}</p>
      <div class="btnrow"><button class="btn danger" onClick={yes}>{s.label}</button><button class="btn" onClick={closeSheet}>Cancel</button></div>
    </>
  );
}

function PasteSheet() {
  const [v, setV] = useState('');
  const go = () => {
    const t = v.trim(), r = readRecipeLink(t);
    if (!r) { toast('That doesn’t look like a recipe link.'); return; }
    UI.sheet = null; openShared(r, t);
  };
  return (
    <>
      <Head title="Paste shared recipe" sub="Paste the recipe link a friend sent you." />
      <input id="pasteInput" class="field" placeholder="https://…#recipe=…" aria-label="Recipe link" autoFocus value={v}
        onInput={(e) => setV((e.currentTarget as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === 'Enter') go(); }} />
      <div class="btnrow"><button class="btn primary" onClick={go}>Open recipe</button><button class="btn" onClick={closeSheet}>Cancel</button></div>
    </>
  );
}

function ImportSheet({ s }: { s: Extract<Sheet, { type: 'import' }> }) {
  const d = s.data.data, L = (d && d.library) || {}, n = (k: string) => (Array.isArray(L[k]) ? L[k].length : 0);
  return (
    <>
      <Head title="Import backup" sub={'From ' + importWhen(s.data) + (d.profile && d.profile.name ? ', ' + d.profile.name : '')} />
      <p>{[n('favorites') + ' favorites', n('recipes') + ' recipes', n('collections') + ' collections', n('weeks') + ' saved weeks', n('lists') + ' saved lists', n('history') + ' history entries'].join(', ')}, plus your profile, targets, plan and shopping list.</p>
      <p class="note" style={{ marginTop: '10px' }}>Replace swaps everything here for the backup. Merge keeps your current profile, targets and plan and adds anything new from the backup.</p>
      <div class="btnrow"><button class="btn primary" onClick={() => importReplace(s.data)}>Replace everything</button><button class="btn" onClick={() => importMerge(s.data)}>Merge</button></div>
    </>
  );
}

export function Sheets() {
  const s = UI.sheet, ref = useRef<HTMLDivElement>(null);
  // Focus the close button (or the field) so keyboard and VoiceOver users land in the sheet.
  useEffect(() => {
    if (!s) return;
    const f = ref.current?.querySelector<HTMLElement>('[autofocus], #nameInput, #pasteInput') || ref.current?.querySelector<HTMLElement>('.iconbtn');
    if (f) setTimeout(() => f.focus(), 30);
  }, [s]);
  let body: ComponentChildren = null;
  if (s) {
    if (s.type === 'store') body = <StoreSheet s={s} />;
    else if (s.type === 'pick') body = <PickSheet s={s} />;
    else if (s.type === 'slot') body = <SlotSheet s={s} />;
    else if (s.type === 'plan') body = <PlanSheet s={s} />;
    else if (s.type === 'name') body = <NameSheet key={s.title} s={s} />;
    else if (s.type === 'coll') body = <CollectionSheet s={s} />;
    else if (s.type === 'confirm') body = <ConfirmSheet s={s} />;
    else if (s.type === 'paste') body = <PasteSheet />;
    else if (s.type === 'import') body = <ImportSheet s={s} />;
  }
  return (
    <div id="sheetRoot">
      {s ? <><div class="scrim" onClick={closeSheet} /><div class="sheet" role="dialog" aria-modal="true" ref={ref}>{body}</div></> : null}
    </div>
  );
}

