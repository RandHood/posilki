import { SLOT_LABEL } from '../data/fixed';
import { MealCard, MealRow, OverPill } from '../components/common';
import type { Meal } from '../services/catalog';
import { backupDue, currentSlot, dayTarget, dayTotals, getMeal, slotBudget, suggestions } from '../services/logic';
import { S } from '../services/state';
import { fmtDate, nf, todayIdx } from '../services/util';
import { doExport, goTab, openMealPage } from '../app/actions';
import { UI, rerender } from '../app/ui';
import { Icon } from '../components/common';

function greeting(): string { const h = new Date().getHours(); return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

export function Home() {
  const ti = todayIdx(), T = dayTarget(ti), items = S.prep.days![ti], tot = dayTotals(items), slot = UI.sugSlot || currentSlot();
  const sug = suggestions(slot, 4, UI.shuffle), B = slotBudget(slot);
  const favs = S.library.favorites.map(getMeal).filter(Boolean).slice(0, 4) as Meal[];
  const over = tot.kcal > T.kcal;
  return (
    <>
      <p class="greet">{greeting()}, {S.profile.name}.</p>
      {backupDue() ? (
        <div class="notice">
          <div><h3>Time for a backup</h3><p class="small muted" style={{ marginTop: '4px' }}>
            {S.lastBackup ? 'Your last backup was on ' + fmtDate(S.lastBackup) + '.' : 'You haven’t saved a backup yet.'} Save one to iCloud Drive so you can restore on a new phone.</p></div>
          <button class="btn sm primary" onClick={doExport}>Export backup</button>
        </div>
      ) : null}
      <section class="hblock">
        <div class="blockhead"><h2>Suggested for {SLOT_LABEL[slot].toLowerCase()}</h2>
          <button class="linkbtn" onClick={() => { UI.shuffle++; rerender(); }}><Icon n="swap" size={18} /><span>Shuffle</span></button></div>
        <div class="chips" style={{ marginTop: '10px' }} role="group" aria-label="Meal">
          {['breakfast', 'lunch', 'snack', 'dinner'].map((t) => (
            <button key={t} class="chip" aria-pressed={slot === t} onClick={() => { UI.sugSlot = t; UI.shuffle = 0; rerender(); }}>{SLOT_LABEL[t]}</button>
          ))}
        </div>
        <p class="small muted" style={{ marginTop: '6px' }}>
          {B.eaten ? 'You’ve had ' + nf(B.eaten.kcal) + ' kcal today, so these fit about ' + nf(B.kcal) + ' kcal.' : 'Picks that fit about ' + nf(B.kcal) + ' kcal of your ' + nf(T.kcal) + ' kcal day.'} They change every day and learn from your favorites and what you cook.</p>
        <div class="grid">{sug.map((m) => <MealCard key={m.id} m={m} onOpen={openMealPage} />)}</div>
      </section>
      <section class="hblock today-card">
        <div class="blockhead"><h2>Today’s plan</h2><button class="linkbtn" onClick={() => goTab('prep')}>Open Prep</button></div>
        <p class={'pcal' + (over ? ' over' : '')} style={{ marginTop: '6px' }}><b>{nf(tot.kcal)}</b> of {nf(T.kcal)} kcal planned<OverPill kcal={tot.kcal} target={T.kcal} /></p>
        <div class={'bar' + (over ? ' over' : '')}><i style={{ width: Math.min(100, tot.kcal / T.kcal * 100) + '%' }} /></div>
        <p class="mline" style={{ marginTop: '6px' }}>Protein {tot.p} of {T.p} g, fat {tot.f} of {T.f} g, carbs {tot.c} of {T.c} g</p>
        <div style={{ marginTop: '6px' }}>
          {items.length ? items.map((it, j) => {
            const m = getMeal(it.id); if (!m) return null;
            return <MealRow key={j} m={m} extra={SLOT_LABEL[it.slot] + (it.serv !== 1 ? ', ' + it.serv + ' portions' : '')} serv={it.serv} onOpen={openMealPage} />;
          }) : <p class="empty">Nothing planned today. Add meals from Prep or any meal page.</p>}
        </div>
      </section>
      {favs.length ? (
        <section class="hblock"><h2>Your favorites</h2><div class="grid">{favs.map((m) => <MealCard key={m.id} m={m} onOpen={openMealPage} />)}</div></section>
      ) : null}
    </>
  );
}
