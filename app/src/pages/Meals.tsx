import { CATS, TYPES } from '../data/fixed';
import { Icon, MealCard } from '../components/common';
import { ING, MEALS, type Meal } from '../services/catalog';
import { hasCats, isFav, newDraft } from '../services/logic';
import { S } from '../services/state';
import { openMealPage, pasteRecipe } from '../app/actions';
import { UI, pushPage, rerender } from '../app/ui';

const FILTERS = [['all', 'All'], ['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snack', 'Snacks'], ['favs', 'Favorites'], ['mine', 'Recipes']];

function mealMatches(m: Meal): boolean {
  const q = UI.q.trim().toLowerCase(), f = UI.filter;
  if (f === 'favs' && !isFav(m.id)) return false;
  if (f === 'mine' && !m.custom) return false;
  if (TYPES.indexOf(f) > -1 && m.types.indexOf(f) < 0) return false;
  if (!hasCats(m, UI.cats)) return false;
  if (!q) return true;
  const hay = (m.name + ' ' + (m.pl || '') + ' ' + m.ing.map((x) => { const i = ING[x[0]]; return i ? i.pl + ' ' + i.en : ''; }).join(' ')).toLowerCase();
  return hay.indexOf(q) > -1;
}

function Results() {
  // Your own recipes come first, newest on top, then the catalog.
  const arr = (S.library.recipes.slice().reverse() as Meal[]).concat(MEALS).filter(mealMatches);
  if (!arr.length) {
    return <p class="empty">{UI.filter === 'favs' && !UI.cats.length ? 'No favorites yet. Tap the heart on any meal page to save it here.'
      : UI.filter === 'mine' && !UI.cats.length ? 'No recipes yet. Tap New recipe to write your own, or open any meal and tap Add as recipe.'
        : UI.cats.length ? 'No meals have all of those categories. Try removing one.' : 'No meals match. Try another word, like chicken or kurczak.'}</p>;
  }
  const shown = arr.slice(0, UI.limit);
  return (
    <>
      <p class="rcount">{arr.length}{arr.length === 1 ? ' meal' : ' meals'}</p>
      <div class="grid">{shown.map((m) => <MealCard key={m.id} m={m} onOpen={openMealPage} />)}</div>
      {arr.length > shown.length ? (
        <button class="btn block" style={{ marginTop: '14px' }} onClick={() => { UI.limit += 40; rerender(); }}>Show more ({arr.length - shown.length} left)</button>
      ) : null}
    </>
  );
}

export function RecipeButtons() {
  return (
    <div class="libbtns">
      <button class="btn primary" onClick={() => pushPage({ type: 'recipeEdit', draft: newDraft() })}><Icon n="plus" size={18} />New recipe</button>
      <button class="btn" onClick={pasteRecipe}>Paste recipe</button>
    </div>
  );
}

export function Meals() {
  return (
    <>
      <RecipeButtons />
      <input id="mealSearch" class="field" type="search" placeholder="Search meals or ingredients" aria-label="Search meals" value={UI.q}
        onInput={(e) => { UI.q = (e.currentTarget as HTMLInputElement).value; UI.limit = 40; rerender(); }} />
      <div class="chips" style={{ marginTop: '12px' }} role="group" aria-label="Meal type">
        {FILTERS.map((f) => <button key={f[0]} class="chip" aria-pressed={UI.filter === f[0]} onClick={() => { UI.filter = f[0]; UI.limit = 40; rerender(); }}>{f[1]}</button>)}
      </div>
      <div class="catshead"><span>Categories</span>{UI.cats.length ? <button class="linkbtn" onClick={() => { UI.cats = []; UI.limit = 40; rerender(); }}>Clear</button> : null}</div>
      <div class="chips cats" role="group" aria-label="Categories">
        {CATS.map((c: string[]) => {
          const on = UI.cats.indexOf(c[0]) > -1;
          return (
            <button key={c[0]} class="chip" aria-pressed={on} onClick={() => {
              const i = UI.cats.indexOf(c[0]); if (i > -1) UI.cats.splice(i, 1); else UI.cats.push(c[0]); UI.limit = 40; rerender();
            }}>{on ? <Icon n="check" size={16} /> : null}{c[1]}</button>
          );
        })}
      </div>
      <div id="mealResults"><Results /></div>
    </>
  );
}
