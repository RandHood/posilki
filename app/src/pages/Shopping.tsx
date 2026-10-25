import { AISLES, DAYS } from '../data/fixed';
import { Dropdown, Icon } from '../components/common';
import { ING, liveStore, notInStore } from '../services/catalog';
import { aggregate, country, itemLabel, needText, packText, plainName } from '../services/logic';
import { S, save } from '../services/state';
import { goTab } from '../app/actions';
import { UI, openSheet, refresh, rerender, toast } from '../app/ui';

const LANGS = [['orig', 'Original', 'Labels as written in the store'], ['en', 'English', 'Labels translated to English']];

function ItemRow({ k, g, checked, onToggle }: { k: string; g: number; checked: boolean; onToggle: () => void }) {
  const store = S.profile.store!;
  const label = notInStore(k, store) ? plainName(k, S.shopping.lang) : itemLabel(k, store, S.shopping.lang);
  return (
    <li class={'item' + (checked ? ' done' : '')}>
      <button class="itemmain" aria-pressed={checked} onClick={onToggle}>
        <span class="box"><Icon n="check" size={16} /></span>
        <span class="nm"><b>{label}</b></span>
        <span class="need">need {needText(k, g)}<small>{packText(k, g)}</small></span>
      </button>
    </li>
  );
}

// Checks or unchecks an ingredient everywhere on the list.
function toggleAll(k: string): void {
  let all = true;
  S.shopping.entries.forEach((e) => { e.items.forEach((i) => { if (i.key === k && !i.checked) all = false; }); });
  S.shopping.entries.forEach((e) => { e.items.forEach((i) => { if (i.key === k) i.checked = !all; }); });
  refresh();
}

function LangDropdown() {
  const cur = S.shopping.lang === 'en' ? LANGS[1] : LANGS[0];
  return (
    <Dropdown id="langDd" open={UI.langOpen} label="Label language" wrapClass="langdd" button={
      <button class="storedd" aria-expanded={UI.langOpen} aria-controls="langDd" aria-label={'Labels: ' + cur[1]} onClick={() => { UI.langOpen = !UI.langOpen; rerender(); }}>
        <span class="grow"><small>Labels</small><span>{cur[1]}</span></span><span class="chev"><Icon n="chev" size={18} /></span>
      </button>}>
      {LANGS.map((l) => {
        const on = l === cur;
        return (
          <button key={l[0]} role="radio" aria-checked={on} tabIndex={UI.langOpen ? undefined : -1}
            onClick={() => { UI.langOpen = false; if (S.shopping.lang !== l[0]) { S.shopping.lang = l[0] as 'orig' | 'en'; save(); } rerender(); }}>
            <span class="grow">{l[1]}<small class="muted" style={{ display: 'block', fontWeight: 400 }}>{l[2]}</small></span>
            {on ? <span class="check"><Icon n="check" size={18} /></span> : null}
          </button>
        );
      })}
    </Dropdown>
  );
}

export function Shopping() {
  const E = S.shopping.entries;
  if (!E.length) {
    return (
      <>
        <p class="empty">Your shopping list is empty. When you add meals, their ingredients will show up here. Use Add to shopping list on any meal page, or add a day or the whole week from Prep.</p>
        <div class="btnrow"><button class="btn primary" onClick={() => goTab('meals')}>Browse meals</button><button class="btn" onClick={() => goTab('prep')}>Open Prep</button></div>
      </>
    );
  }
  const view = S.shopping.view, store = S.profile.store!, agg = aggregate();
  const missing = Object.keys(agg).filter((k) => notInStore(k, store));
  const here = (key: string) => !!ING[key] && !notInStore(key, store);
  let total = 0, done = 0; E.forEach((e) => { e.items.forEach((i) => { total++; if (i.checked) done++; }); });
  return (
    <>
      <div class="shopbar">
        <div class="seg" role="group" aria-label="View">
          <button aria-pressed={view === 'meal'} onClick={() => { S.shopping.view = 'meal'; save(); rerender(); }}>By meal</button>
          <button aria-pressed={view === 'all'} onClick={() => { S.shopping.view = 'all'; save(); rerender(); }}>All ingredients</button>
        </div>
        <LangDropdown />
      </div>
      <p class="small muted" style={{ marginTop: '10px' }}>{done} of {total} checked. Check off anything you buy or already have. {liveStore(store)
        ? 'Products, pack sizes and prices are from ' + store + '’s online shop.' : 'Products are typical examples for ' + store + ', with typical pack sizes.'}</p>
      {missing.length ? (
        <section class="shopgroup warn">
          <h3><span><span aria-hidden="true">⚠️ </span>Not sold at {store}</span><small>{missing.length}{missing.length === 1 ? ' item' : ' items'}</small></h3>
          <p class="small">These are on your list by their usual names. Look for them in another shop, or swap them in the recipe.</p>
          <ul class="items">{missing.map((k) => { const r = agg[k]; return <ItemRow key={k} k={k} g={r.g} checked={r.done === r.n} onToggle={() => toggleAll(k)} />; })}</ul>
        </section>
      ) : null}
      {view === 'meal' ? E.map((e) => {
        const its = e.items.filter((i) => here(i.key)); if (!its.length) return null;
        const d = its.filter((i) => i.checked).length;
        return (
          <section class="shopgroup" key={e.id}>
            <h3>
              <span>{e.name}{e.serv && e.serv !== 1 ? <> <small>{e.serv} portions</small></> : null}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <small>{d} of {its.length}</small>
                <button class="iconbtn sm" aria-label={'Remove ' + e.name + ' from list'} onClick={() => { S.shopping.entries = S.shopping.entries.filter((x) => x.id !== e.id); refresh(); }}><Icon n="x" size={18} /></button>
              </span>
            </h3>
            {e.day != null ? <p class="small muted">{DAYS[e.day]}</p> : null}
            <ul class="items">{its.map((it) => <ItemRow key={it.key} k={it.key} g={it.g} checked={it.checked} onToggle={() => { it.checked = !it.checked; refresh(); }} />)}</ul>
          </section>
        );
      }) : AISLES.map((a: string[]) => {
        const keys = Object.keys(agg).filter((k) => ING[k].a === a[0] && !notInStore(k, store));
        if (!keys.length) return null;
        keys.sort((x, y) => (agg[x].done === agg[x].n ? 1 : 0) - (agg[y].done === agg[y].n ? 1 : 0));
        return (
          <section class="shopgroup" key={a[0]}>
            <h3><span>{country() === 'PL' && S.shopping.lang !== 'en' ? <>{a[1]} <small>{a[2]}</small></> : a[2]}</span></h3>
            <ul class="items">{keys.map((k) => { const r = agg[k]; return <ItemRow key={k} k={k} g={r.g} checked={r.done === r.n} onToggle={() => toggleAll(k)} />; })}</ul>
          </section>
        );
      })}
      <div class="btnrow" style={{ marginTop: '22px' }}>
        <button class="btn sm" disabled={!done} onClick={() => {
          S.shopping.entries.forEach((e) => { e.items = e.items.filter((i) => !i.checked); });
          S.shopping.entries = S.shopping.entries.filter((e) => e.items.length); refresh(); toast('Checked items removed');
        }}>Remove checked</button>
        <button class="btn sm danger" onClick={() => openSheet({ type: 'confirm', title: 'Clear the shopping list?', text: 'This removes every item.', action: 'clearList', label: 'Clear list' })}>Clear list</button>
      </div>
    </>
  );
}
