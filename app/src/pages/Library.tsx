import { Dropdown, Icon, MealRow, PageHead } from '../components/common';
import type { Meal } from '../services/catalog';
import { getMeal, mealMacros } from '../services/logic';
import { S, save } from '../services/state';
import { openMealPage } from '../app/actions';
import { UI, openSheet, popPage, pushPage, rerender, topOf } from '../app/ui';
import { RecipeButtons } from './Meals';

const LIB = [
  ['favorites', 'Favorites', 'Meals and recipes you’ve hearted.'],
  ['recipes', 'Recipes', 'Your own recipes. You can edit these.'],
  ['collections', 'Collections', 'Groups you name yourself, like “Quick dinners”.'],
] as const;

// Lists keep the order things were added in, so newest first is that order reversed.
const SORTS = [['new', 'Newest first'], ['old', 'Oldest first'], ['az', 'A to Z'], ['kcalUp', 'Calories, low to high'], ['kcalDown', 'Calories, high to low']];
function sortsFor(sec: string) { return sec === 'collections' ? SORTS.slice(0, 3) : SORTS; }
function sortList<T>(sec: string, arr: T[], name: (x: T) => string, kcal: (x: T) => number): T[] {
  const by = S.libSort[sec] || 'new', out = arr.map((x, i) => ({ x, i }));
  out.sort((a, b) => {
    if (by === 'old') return a.i - b.i;
    if (by === 'az') return name(a.x).localeCompare(name(b.x), 'en', { sensitivity: 'base' });
    if (by === 'kcalUp') return kcal(a.x) - kcal(b.x);
    if (by === 'kcalDown') return kcal(b.x) - kcal(a.x);
    return b.i - a.i;
  });
  return out.map((o) => o.x);
}

function SortBar({ sec, n, noun }: { sec: string; n: number; noun: string }) {
  const cur = S.libSort[sec] || 'new', label = SORTS.filter((s) => s[0] === cur)[0][1];
  return (
    <div class="sortbar">
      <span class="small muted">{n} {noun}{n === 1 ? '' : 's'}</span>
      <Dropdown id="sortDd" open={UI.sortOpen} label="Sort by" wrapClass="sortdd" button={
        <button class="sortbtn" aria-expanded={UI.sortOpen} aria-controls="sortDd" aria-label={'Sort: ' + label} onClick={() => { UI.sortOpen = !UI.sortOpen; rerender(); }}>
          <Icon n="sort" size={18} /><span>{label}</span>
        </button>}>
        {sortsFor(sec).map((s) => {
          const on = s[0] === cur;
          return (
            <button key={s[0]} role="radio" aria-checked={on} tabIndex={UI.sortOpen ? undefined : -1}
              onClick={() => { S.libSort[sec] = s[0]; UI.sortOpen = false; save(); rerender(); }}>
              <span class="grow">{s[1]}</span>{on ? <span class="check"><Icon n="check" size={18} /></span> : null}
            </button>
          );
        })}
      </Dropdown>
    </div>
  );
}

export function Library() {
  return (
    <>
      {LIB.map((r) => (
        <button key={r[0]} class="librow" onClick={() => pushPage({ type: 'lib', sec: r[0] })}>
          <span class="grow"><h3>{r[1]}</h3><span class="small muted">{r[2]}</span></span>
          <span class="count">{S.library[r[0]].length}</span><span class="chev"><Icon n="chev" size={20} /></span>
        </button>
      ))}
    </>
  );
}

export function LibSection() {
  const p = topOf('lib'), L = S.library, sec = p.sec, title = LIB.filter((r) => r[0] === sec)[0][1];
  const mName = (m: Meal) => m.name, mKcal = (m: Meal) => mealMacros(m).kcal;
  let body = null;
  if (sec === 'favorites') {
    const f = sortList('favorites', L.favorites.map(getMeal).filter(Boolean) as Meal[], mName, mKcal);
    body = f.length ? <><SortBar sec="favorites" n={f.length} noun="favorite" />{f.map((m) => <MealRow key={m.id} m={m} extra={m.custom ? 'Your recipe' : ''} onOpen={openMealPage} />)}</>
      : <p class="empty">No favorites yet. Tap the heart on any meal or recipe to save it here.</p>;
  } else if (sec === 'recipes') {
    const r = sortList('recipes', L.recipes as Meal[], mName, mKcal);
    body = <><RecipeButtons />{r.length ? <><SortBar sec="recipes" n={r.length} noun="recipe" />{r.map((m) => <MealRow key={m.id} m={m} onOpen={openMealPage} />)}</>
      : <p class="empty">No recipes yet. Tap New recipe to write your own, or open any meal and tap Add as recipe.</p>}</>;
  } else if (sec === 'collections') {
    if (p.cid) {
      const col = L.collections.filter((c) => c.id === p.cid)[0];
      if (!col) return <><PageHead title="Collection" onBack={popPage} /><p class="empty">This collection was deleted.</p></>;
      const ms = col.ids.map(getMeal).filter(Boolean) as Meal[];
      return (
        <>
          <PageHead title={col.name} onBack={popPage} />
          {ms.length ? ms.map((m) => <MealRow key={m.id} m={m} onOpen={openMealPage} />) : <p class="empty">No meals in this collection yet. Use Add to collection on any meal page.</p>}
          <div class="btnrow"><button class="btn sm danger" onClick={() => openSheet({ type: 'confirm', title: 'Delete “' + col.name + '”?', text: 'The meals and recipes in it stay where they are. Only the collection goes.', action: 'deleteCollection', label: 'Delete collection', id: col.id })}>Delete collection</button></div>
        </>
      );
    }
    const c = sortList('collections', L.collections, (x) => x.name, () => 0);
    body = (
      <>
        <button class="btn primary block libnew" onClick={() => openSheet({ type: 'name', title: 'New collection', placeholder: 'e.g. Quick dinners', action: 'newCollection', value: '' })}><Icon n="plus" size={18} />New collection</button>
        {c.length ? <><SortBar sec="collections" n={c.length} noun="collection" />{c.map((x) => (
          <button key={x.id} class="librow" onClick={() => pushPage({ type: 'lib', sec: 'collections', cid: x.id })}>
            <span class="grow"><h3>{x.name}</h3></span><span class="count">{x.ids.length}</span><span class="chev"><Icon n="chev" size={20} /></span>
          </button>
        ))}</> : <p class="empty">No collections yet.</p>}
      </>
    );
  }
  return <><PageHead title={title} onBack={popPage} />{body}</>;
}
