import { CAT_LABEL, SLOT_LABEL } from '../data/fixed';
import { Badge, EmojiDot, Icon, MacroTable, MealImg, PageHead } from '../components/common';
import { ING, type IngLine, type Meal } from '../services/catalog';
import { getMeal, ingEmoji, isFav, itemLabel, liveNote, macrosOf, mealCats, mealSub, plainName, videoUrl } from '../services/logic';
import { inIosSafari } from '../services/share';
import { S } from '../services/state';
import { nf, todayIdx } from '../services/util';
import { addAsRecipe, mealToList, saveShared, shareMeal, shareRecipe, toggleFav } from '../app/actions';
import { openSheet, popPage, pushPage, rerender, toast, topOf } from '../app/ui';
import { draftFrom } from '../services/logic';

type MealP = ReturnType<typeof topOf<'meal'>>;
function pageIng(p: MealP, m: Meal): IngLine[] { return m.ing.map((x, i) => [x[0], p.grams[i]] as IngLine); }

function FavButton({ id }: { id: string }) {
  const fav = isFav(id);
  return <button class="iconbtn" aria-pressed={fav} aria-label={fav ? 'Remove from favorites' : 'Save to favorites'} onClick={() => toggleFav(id)}><Icon n="heart" size={24} fill={fav} /></button>;
}
function StoreLine({ store }: { store: string }) {
  return (
    <div class="storeline"><span class="small muted">Products from</span>
      <button class="storebtn" onClick={() => openSheet({ type: 'store', scope: 'meal' })}><Badge store={store} /><span>{store}</span><span class="chev"><Icon n="chev" size={18} /></span></button>
    </div>
  );
}
function IngList({ ing, label }: { ing: IngLine[]; label: (k: string) => string }) {
  return (
    <div class="rlist">{ing.map((r, i) => (
      <div class="ritem" key={i}><EmojiDot e={ingEmoji(r[0])} /><span class="grow"><b>{label(r[0])}</b><small>{nf(r[1])} {ING[r[0]].u}</small></span></div>
    ))}</div>
  );
}
function Steps({ steps }: { steps: string[] }) {
  return <section class="section"><h2>Instructions</h2><ol class="vsteps">{steps.map((s, i) => <li key={i}><span class="snum" aria-hidden="true">{i + 1}</span><p>{s}</p></li>)}</ol></section>;
}
function Video({ url }: { url: string }) {
  return <section class="section"><h2>Video</h2><a class="btn block watch" href={url} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">🎬</span>Watch</a></section>;
}
function PlanButtons({ share }: { share: preact.JSX.Element }) {
  return (
    <div class="btngrid">
      <button class="btn sm" onClick={() => { const p = topOf('meal'), m = getMeal(p.id)!; openSheet({ type: 'plan', id: p.id, day: todayIdx(), slot: m.types[0] }); }}>Add to plan</button>
      <button class="btn sm" onClick={() => openSheet({ type: 'coll', id: topOf('meal').id })}>Add to collection</button>
      {share}
    </div>
  );
}

function OwnRecipePage({ p, m }: { p: MealP; m: Meal }) {
  const ing = pageIng(p, m), x = macrosOf(ing), url = videoUrl(m.video || ''), steps = (m.steps || []).filter((s) => s.trim());
  return (
    <>
      <PageHead right={<FavButton id={m.id} />} onBack={popPage} />
      <MealImg m={m} />
      <div class="mhead"><span class="pill own">Your recipe</span><h1 style={{ marginTop: '8px' }}>{m.name}</h1></div>
      {m.desc && m.desc.trim() ? <p class="mdesc">{m.desc}</p> : null}
      {ing.length ? (
        <>
          <div id="mMacros"><MacroTable x={x} /></div><p class="mmeta" style={{ marginTop: 0 }}>For the whole recipe, about {nf(x.g)} g.</p>
          <button class="btn primary block" style={{ marginTop: '10px' }} onClick={() => mealToList(m, ing)}>Add ingredients to shopping list</button>
        </>
      ) : null}
      <PlanButtons share={<button class="btn sm" onClick={() => shareRecipe(m)}><Icon n="share" size={18} />Share</button>} />
      {ing.length ? (
        <section class="section" style={{ marginTop: '18px' }}><h2>Ingredients</h2><StoreLine store={p.store} /><IngList ing={ing} label={(k) => itemLabel(k, p.store, 'en')} /></section>
      ) : null}
      {steps.length ? <Steps steps={steps} /> : null}
      {url ? <Video url={url} /> : null}
      <div class="savebar"><button class="btn block" onClick={() => pushPage({ type: 'recipeEdit', draft: draftFrom(m) })}>Edit recipe</button></div>
    </>
  );
}

export function MealPage() {
  const p = topOf('meal'), m = getMeal(p.id);
  if (!m) return <><PageHead onBack={popPage} /><p class="empty">This meal was deleted.</p></>;
  if (m.custom) return <OwnRecipePage p={p} m={m} />;
  const ing = pageIng(p, m), x = macrosOf(ing), steps = m.steps || [];
  const ytName = m.name;
  const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ytName + ' recipe');
  const cats = mealCats({ id: m.id, types: m.types, mins: m.mins, tags: m.tags, custom: m.custom, base: m.base, ing, name: m.name });
  return (
    <>
      <PageHead right={<FavButton id={m.id} />} onBack={popPage} />
      <MealImg m={m} />
      <div class="mhead"><h1>{m.name}</h1>{mealSub(m) ? <p class="pl">{mealSub(m)}</p> : null}</div>
      <p class="mdesc">{m.desc}</p>
      <p class="mmeta">{m.types.map((t) => SLOT_LABEL[t]).join(', ')}, about {m.mins} min. Suggested portion: 1 serving, about <span id="mGrams">{nf(x.g)}</span> g.</p>
      <div class="pills" id="mCats">{cats.map((c) => <span class="pill" key={c}>{CAT_LABEL[c]}</span>)}</div>
      <div id="mMacros"><MacroTable x={x} /></div>
      <button class="btn primary block" style={{ marginTop: '10px' }} onClick={() => mealToList(m, ing)}>Add ingredients to shopping list</button>
      <PlanButtons share={<button class="btn sm" onClick={() => shareMeal(m)}>Share</button>} />
      <button class="btn block addrecipe" onClick={() => addAsRecipe(m, p.store)}><Icon n="plus" size={18} />Add as recipe</button>
      <section class="section" style={{ marginTop: '18px' }}><h2>Ingredients</h2>
        <StoreLine store={p.store} />
        <p class="note">{p.store !== S.profile.store ? 'Only this page uses ' + p.store + '. Your default store is still ' + S.profile.store + '. ' : ''}{liveNote(p.store)}</p>
        <IngList ing={ing} label={(k) => itemLabel(k, p.store, 'en')} />
        <p class="note">Want different amounts? Add it as a recipe and edit it.</p>
      </section>
      <section class="section">
        <button class="recipebtn" aria-expanded={p.open} onClick={() => { p.open = !p.open; rerender(); }}>
          <h2>Recipe</h2><span class="small muted">{steps.length} steps <span class="chev" style={{ display: 'inline-block', verticalAlign: 'middle' }}><Icon n="chev" size={18} /></span></span>
        </button>
        {p.open ? <ol class="steps">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol> : null}
        <a class="video" href={yt} target="_blank" rel="noopener noreferrer">
          <span class="vthumb"><MealImg m={m} /><span class="play"><i><Icon n="play" size={18} fill /></i></span></span>
          <span><b>Watch it made on YouTube</b><small>Opens English recipe videos for {ytName.toLowerCase()}</small></span>
        </a>
      </section>
    </>
  );
}

export function SharedPage() {
  const p = topOf('shared'), r = p.rec, x = macrosOf(r.ing), url = videoUrl(r.video), safari = inIosSafari();
  const copy = () => {
    try {
      navigator.clipboard.writeText(p.link).then(() => { p.copied = true; rerender(); }, () => toast('Couldn’t copy. Copy the link from your message instead.'));
    } catch { toast('Couldn’t copy. Copy the link from your message instead.'); }
  };
  const save = safari ? (p.copied ? (
    <>
      <div class="copied"><b>Link copied</b><p>Open Posiłki from your home screen, go to Library, then Recipes, and tap Paste recipe.</p></div>
      {S.onboarded ? <button class="linkbtn" onClick={() => saveShared(r)}>Save it here in Safari instead</button> : null}
    </>
  ) : (
    <>
      <button class="btn primary block" onClick={copy}>Save to my Posiłki app</button>
      <p class="small muted note">Don’t have the app yet? Tap Safari’s Share button, then Add to Home Screen.</p>
    </>
  )) : <button class="btn primary block" onClick={() => saveShared(r)}>Save to my recipes</button>;
  return (
    <>
      <PageHead onBack={popPage} />
      <MealImg m={{ id: 's-' + r.name, style: 'plate', types: [], ing: r.ing, name: r.name }} />
      <div class="mhead"><span class="pill shared">Shared with you</span><h1 style={{ marginTop: '8px' }}>{r.name}</h1></div>
      {r.desc ? <p class="mdesc">{r.desc}</p> : null}
      {r.ing.length ? (
        <>
          <MacroTable x={x} /><p class="mmeta" style={{ marginTop: 0 }}>For the whole recipe, about {nf(x.g)} g.</p>
          <section class="section" style={{ marginTop: '18px' }}><h2>Ingredients</h2><IngList ing={r.ing} label={(k) => plainName(k, 'en')} /></section>
        </>
      ) : null}
      {r.steps.length ? <Steps steps={r.steps} /> : null}
      {url ? <Video url={url} /> : null}
      <div class="savebar">{save}</div>
    </>
  );
}

