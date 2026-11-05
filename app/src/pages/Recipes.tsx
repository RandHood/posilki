// Your own recipes: create and edit, and the ingredient picker.
import { useLayoutEffect, useRef } from 'preact/hooks';
import { AISLE_ART, AISLES } from '../data/fixed';
import { EmojiDot, Icon, PageHead } from '../components/common';
import { ING, type IngLine, type Meal } from '../services/catalog';
import { type Draft, amountText, draftItems, getMeal, gramsFromInput, ingEmoji, ingStep, inputUnit, inputValue, stepText, swapInDraft, variantsOf } from '../services/logic';
import { S, save } from '../services/state';
import { cap, uid } from '../services/util';
import { mealPageOf } from '../app/actions';
import { UI, openSheet, popPage, pushPage, replaceTop, rerender, toast, top } from '../app/ui';

function autosize(t: HTMLTextAreaElement): void { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
function focusStep(i: number): void { setTimeout(() => { const t = document.querySelector<HTMLTextAreaElement>('textarea[data-step="' + i + '"]'); if (t) t.focus(); }, 30); }

// − and + move by a usual kitchen step; the box in the middle takes the exact amount (grams, or cloves for garlic).
function Counter({ d, k }: { d: Draft; k: string }) {
  const g = d.g[k] || 0, unit = inputUnit(k, g);
  const set = (next: number) => { d.g[k] = next; if (next && d.order.indexOf(k) < 0) d.order.push(k); rerender(); };
  const change = (dir: number) => {
    const st = ingStep(k);
    set(dir > 0 ? Math.min(5000, g + st) : (g - st < st / 2 ? 0 : g - st));
  };
  return (
    <span class="ctr">
      <button aria-label={'Less ' + ING[k].en} disabled={!(g > 0)} onClick={() => change(-1)}><Icon n="minus" size={18} /></button>
      <label class="amt">
        <input class="num" type="text" inputMode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="0" value={g > 0 ? String(inputValue(k, g)) : ''}
          aria-label={'Amount of ' + ING[k].en + ' in ' + unit}
          onFocus={(e) => (e.currentTarget as HTMLInputElement).select()}
          onInput={(e) => {
            const el = e.currentTarget as HTMLInputElement, v = el.value.replace(/\D/g, '').slice(0, 4);
            if (v !== el.value) el.value = v;
            // An empty box while typing keeps the old amount; it is only removed when you leave the box empty.
            if (+v > 0) set(gramsFromInput(k, +v));
          }}
          onBlur={(e) => { if (!(+(e.currentTarget as HTMLInputElement).value > 0) && g > 0) set(0); }} />
        <small aria-hidden="true">{unit}</small>
      </label>
      <button aria-label={'More ' + ING[k].en} onClick={() => change(1)}><Icon n="plus" size={18} /></button>
    </span>
  );
}

// Cream fat, pasta shape and other kinds of the same food.
export function VariantPick({ k, onPick }: { k: string; onPick: (to: string) => void }) {
  const v = variantsOf(k); if (!v) return null;
  return (
    <span class="varpick">
      <select aria-label={v.label + ' of ' + ING[k].en} value={k} onChange={(e) => onPick((e.currentTarget as HTMLSelectElement).value)}>
        {v.opts.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
      </select>
      <span class="chev" aria-hidden="true"><Icon n="chev" size={14} /></span>
    </span>
  );
}

function saveRecipe(d: Draft): void {
  const name = d.name.trim(); if (!name) return;
  const ing = draftItems(d).map((k) => [k, d.g[k]] as IngLine);
  const fields = { name, desc: d.desc.trim(), ing, steps: d.steps.map((s) => s.trim()).filter(Boolean), video: d.video.trim() };
  if (d.id) {
    const m = getMeal(d.id)!; Object.assign(m, fields); save();
    const below = UI.stack[UI.stack.length - 2]; if (below && below.type === 'meal' && below.id === m.id) { below.grams = ing.map((x) => x[1]); below.keys = ing.map((x) => x[0]); }
    popPage(); toast('Recipe saved');
  } else {
    const r: Meal = { id: 'r' + uid(), custom: true, pl: '', types: [], mins: 0, tags: [], style: 'plate', created: Date.now(), ...fields };
    S.library.recipes.push(r); save();
    replaceTop(mealPageOf(r, S.profile.store!)); toast('Saved to Recipes');
  }
}

export function RecipeEdit() {
  const p = top() as { type: 'recipeEdit'; draft: Draft }, d = p.draft, items = draftItems(d);
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { root.current?.querySelectorAll<HTMLTextAreaElement>('textarea.area').forEach(autosize); });
  const ok = !!d.name.trim();
  return (
    <div ref={root} style={{ display: 'contents' }}>
      <PageHead title={d.id ? 'Edit recipe' : 'New recipe'} onBack={popPage} />
      <section class="section">
        <label class="lbl" for="rName" style={{ marginTop: 0 }}>Name <span class="req">Required</span></label>
        <input id="rName" class="field" autocomplete="off" placeholder="For example Chicken pesto pasta" value={d.name} onInput={(e) => { d.name = (e.currentTarget as HTMLInputElement).value; rerender(); }} />
        <label class="lbl" for="rDesc">Description</label>
        <textarea id="rDesc" class="field area" rows={2} placeholder="A line or two about the meal" value={d.desc}
          onInput={(e) => { d.desc = (e.currentTarget as HTMLTextAreaElement).value; autosize(e.currentTarget as HTMLTextAreaElement); }} />
      </section>
      <section class="section">
        <div class="blockhead"><h2>Ingredients</h2>{items.length ? <span class="small muted">{items.length}{items.length === 1 ? ' item' : ' items'}</span> : null}</div>
        {items.length ? (
          <div class="rlist">{items.map((k) => (
            <div class="ritem" key={k}><EmojiDot e={ingEmoji(k)} /><span class="grow"><b>{cap(ING[k].en)}</b>{amountText(k, d.g[k]) ? <small>{amountText(k, d.g[k])}</small> : null}
              <VariantPick k={k} onPick={(to) => { swapInDraft(d, k, to); rerender(); }} /></span><Counter d={d} k={k} /></div>
          ))}</div>
        ) : <p class="note" style={{ marginTop: '4px' }}>Search or browse by category to add what goes in.</p>}
        <button class="btn block" style={{ marginTop: '12px' }} onClick={() => pushPage({ type: 'ingPick', draft: d, q: '' })}><Icon n="plus" size={18} />Add ingredients</button>
      </section>
      <section class="section"><h2>Instructions</h2>
        <ol class="rsteps">{d.steps.map((s, i) => (
          <li key={i}>
            <span class="snum" aria-hidden="true">{i + 1}</span>
            <textarea class="field area" rows={1} data-step={i} aria-label={'Step ' + (i + 1)} placeholder={i === 0 ? 'For example: Boil the pasta for 10 minutes' : 'Next step'} value={s}
              onInput={(e) => { d.steps[i] = (e.currentTarget as HTMLTextAreaElement).value; autosize(e.currentTarget as HTMLTextAreaElement); }}
              onKeyDown={(e) => {
                // Return ends the step and starts a new one under it.
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); d.steps.splice(i + 1, 0, ''); rerender(); focusStep(i + 1); }
              }} />
            <button class="iconbtn sm" aria-label={'Remove step ' + (i + 1)} onClick={() => { d.steps.splice(i, 1); if (!d.steps.length) d.steps.push(''); rerender(); }}><Icon n="x" size={18} /></button>
          </li>
        ))}</ol>
        <button class="linkbtn addstep" onClick={() => { d.steps.push(''); rerender(); focusStep(d.steps.length - 1); }}><Icon n="plus" size={18} />Add step</button>
        <p class="note">Press return at the end of a step to start the next one.</p>
      </section>
      <section class="section"><h2>Video</h2>
        <label class="lbl" for="rVideo" style={{ marginTop: '6px' }}>Link to a video of this meal</label>
        <input id="rVideo" class="field" type="url" inputMode="url" autocomplete="off" placeholder="Paste a YouTube, TikTok or Instagram link" value={d.video}
          onInput={(e) => { d.video = (e.currentTarget as HTMLInputElement).value; }} />
      </section>
      <p class="note" style={{ marginTop: '12px' }}>Anything you leave empty stays hidden on the recipe.</p>
      {d.id ? <button class="btn block danger delbtn" onClick={() => {
        const m = getMeal(d.id!); if (m) openSheet({ type: 'confirm', title: 'Delete “' + m.name + '”?', text: 'It will be removed from Recipes, your favorites, collections and plan. This can’t be undone.', action: 'deleteRecipe', label: 'Delete recipe', id: m.id });
      }}>Delete recipe</button> : null}
      <div class="savebar">
        <button class="btn primary block" id="rSave" disabled={!ok} onClick={() => saveRecipe(d)}>Save</button>
        {ok ? null : <p class="note" id="rSaveNote">Give the recipe a name to save it.</p>}
      </div>
    </div>
  );
}

function doneLabel(d: Draft): string { const n = draftItems(d).length; return n ? 'Done · ' + n + (n === 1 ? ' ingredient' : ' ingredients') : 'Done'; }

export function IngPick() {
  const p = top() as { type: 'ingPick'; draft: Draft; cat?: string; q: string }, d = p.draft, q = (p.q || '').trim().toLowerCase();
  const a = p.cat ? AISLES.filter((x: string[]) => x[0] === p.cat)[0] : null;
  const rows = (keys: string[]) => keys.length ? (
    <div class="rlist">{keys.map((k) => {
      const n = d.g[k] > 0;
      return <div class={'ritem' + (n ? ' on' : '')} key={k}><EmojiDot e={ingEmoji(k)} /><span class="grow"><b>{cap(ING[k].en)}</b>{n && !amountText(k, d.g[k]) ? null : <small>{n ? amountText(k, d.g[k]) : stepText(k)}</small>}</span><Counter d={d} k={k} /></div>;
    })}</div>
  ) : <p class="empty">Nothing matches “{p.q}”. Try another word, like rice or chicken.</p>;
  let results;
  if (q) results = rows(Object.keys(ING).filter((k) => (ING[k].en + ' ' + ING[k].pl).toLowerCase().indexOf(q) > -1));
  else if (p.cat) results = rows(Object.keys(ING).filter((k) => ING[k].a === p.cat));
  else results = (
    <div class="catgrid">{AISLES.map((ai: string[]) => {
      const art = AISLE_ART[ai[0]], n = Object.keys(ING).filter((k) => ING[k].a === ai[0]).length;
      const picked = Object.keys(d.g).filter((k) => d.g[k] > 0 && ING[k] && ING[k].a === ai[0]).length;
      return (
        <button class="catcard" key={ai[0]} onClick={() => pushPage({ type: 'ingPick', draft: d, cat: ai[0], q: '' })}>
          <span class="catpic" style={{ '--tile': art[0] }} aria-hidden="true"><i>{art[1]}</i><i>{art[2]}</i><i>{art[3]}</i></span>
          <b>{ai[2]}</b><small>{n} items{picked ? ' · ' + picked + ' added' : ''}</small>
        </button>
      );
    })}</div>
  );
  return (
    <>
      <PageHead title={a ? a[2] : 'Add ingredients'} onBack={popPage} />
      <input id="ingSearch" class="field" type="search" placeholder="Search all ingredients" aria-label="Search ingredients" value={p.q}
        onInput={(e) => { p.q = (e.currentTarget as HTMLInputElement).value; rerender(); }} />
      <div id="ingResults" style={{ marginTop: '14px' }}>{results}</div>
      <div class="savebar"><button class="btn primary block" id="ingDone" onClick={() => {
        // Go straight back to the recipe, however many category pages are open.
        while (UI.stack.length > 1 && UI.stack[UI.stack.length - 2].type !== 'recipeEdit') UI.stack.splice(UI.stack.length - 2, 1);
        popPage();
      }}>{doneLabel(d)}</button></div>
    </>
  );
}
