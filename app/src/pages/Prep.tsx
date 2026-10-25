import { useLayoutEffect, useRef } from 'preact/hooks';
import { DAYS, DAYS_SHORT, SLOT_LABEL } from '../data/fixed';
import { Icon, MealImg, OverPill } from '../components/common';
import { dayDate, dayTarget, dayTotals, getMeal, mealMacros } from '../services/logic';
import { S } from '../services/state';
import { fmtShort, nf, todayIdx } from '../services/util';
import { dayToList, openMealPage, weekToList } from '../app/actions';
import { UI, openSheet, refresh, rerender } from '../app/ui';

// The week is one horizontal row, Monday to Sunday, with a day strip on top.
export function Prep() {
  const ti = todayIdx(), row = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = row.current; if (!el || !UI.prepScroll) return;
    const card = el.children[UI.prepDay] as HTMLElement | undefined, first = el.firstElementChild as HTMLElement | null;
    if (card && first) {
      const x = card.offsetLeft - first.offsetLeft;
      if (UI.prepScroll === 'smooth' && el.scrollTo) el.scrollTo({ left: x, behavior: 'smooth' }); else el.scrollLeft = x;
    }
    UI.prepScroll = null;
  });

  const onScroll = (e: Event) => {
    const el = e.currentTarget as HTMLDivElement, first = el.firstElementChild; if (!first) return;
    const w = first.getBoundingClientRect().width + 12, i = Math.max(0, Math.min(6, Math.round(el.scrollLeft / w)));
    if (i !== UI.prepDay) { UI.prepDay = i; rerender(); }
  };

  const pickMeal = (title: string, slot: string | null, onPick: (id: string) => boolean | void) => openSheet({ type: 'pick', title, slot, onPick });

  return (
    <>
      <p class="muted">Week of {fmtShort(dayDate(0))}. Swipe sideways or tap a day. Each day is planned around its own target from Settings.</p>
      <div class="btngrid">
        <button class="btn primary" onClick={weekToList}>Add week to shopping list</button>
        <button class="btn" onClick={() => openSheet({ type: 'confirm', title: 'Plan a new week?', text: 'This replaces the meals planned for this week with new suggestions based on your targets.', action: 'newWeek', label: 'Plan new week' })}>Plan a new week</button>
      </div>
      <div class="pstrip" role="tablist" aria-label="Days">
        {DAYS_SHORT.map((d: string, i: number) => (
          <button key={i} role="tab" aria-selected={UI.prepDay === i} aria-label={DAYS[i]} class={i === ti ? 'today' : undefined}
            onClick={() => { UI.prepDay = i; UI.prepScroll = 'smooth'; rerender(); }}>{d}<b>{dayDate(i).getDate()}</b></button>
        ))}
      </div>
      <div class="pweek" id="pweek" ref={row} onScroll={onScroll}>
        {S.prep.days!.map((items, i) => {
          const T = dayTarget(i), tot = dayTotals(items);
          return (
            <section key={i} class={'pday' + (i === ti ? ' today' : '')} role="tabpanel" aria-label={DAYS[i]}>
              <div class="pdhead"><h2>{DAYS[i]}</h2><span>{fmtShort(dayDate(i))}</span></div>
              <p class={'pcal' + (tot.kcal > T.kcal ? ' over' : '')}><b>{nf(tot.kcal)}</b> of {nf(T.kcal)} kcal<OverPill kcal={tot.kcal} target={T.kcal} /></p>
              <p class="mline">Protein {tot.p} g, fat {tot.f} g, carbs {tot.c} g</p>
              <div style={{ marginTop: '4px' }}>
                {items.map((it, j) => {
                  const m = getMeal(it.id); if (!m) return null;
                  const x = mealMacros(m, it.serv);
                  const serv = (delta: number) => { it.serv = Math.min(3, Math.max(0.5, it.serv + delta)); refresh(); };
                  return (
                    <div class="pitem" key={j}>
                      <span class="thumb" style={{ width: '56px', flexBasis: '56px' }}><MealImg m={m} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <button class="grow" onClick={() => openMealPage(m.id)}><span class="slotlbl">{SLOT_LABEL[it.slot]}</span><b>{m.name}</b><span class="mline">{nf(x.kcal)} kcal, {x.p} g protein</span></button>
                        <div class="serv">
                          <button onClick={() => serv(-0.5)} aria-label="Smaller portion"><Icon n="minus" size={16} /></button>
                          <span>{it.serv === 1 ? '1 portion' : it.serv + ' portions'}</span>
                          <button onClick={() => serv(0.5)} aria-label="Bigger portion"><Icon n="plus" size={16} /></button>
                        </div>
                      </div>
                      <button class="iconbtn sm" aria-label="Swap meal" onClick={() => pickMeal('Swap ' + SLOT_LABEL[it.slot].toLowerCase() + ' on ' + DAYS[i], it.slot, (id) => { it.id = id; it.serv = 1; })}><Icon n="swap" size={20} /></button>
                      <button class="iconbtn sm" aria-label="Remove meal" onClick={() => { items.splice(j, 1); refresh(); }}><Icon n="x" size={20} /></button>
                    </div>
                  );
                })}
                {items.length ? null : <p class="empty" style={{ padding: '8px 0' }}>No meals planned.</p>}
              </div>
              <div class="pfootrow">
                <button class="btn sm" onClick={() => pickMeal('Add a meal to ' + DAYS[i], null, (id) => { openSheet({ type: 'slot', day: i, id }); return true; })}>Add meal</button>
                <button class="btn sm" onClick={() => dayToList(i)}>Add day to list</button>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
