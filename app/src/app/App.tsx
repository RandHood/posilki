import { useEffect, useRef } from 'preact/hooks';
import { Icon, UpdateButton } from '../components/common';
import { openShopCount, ensurePrep, plainName } from '../services/logic';
import { S } from '../services/state';
import { initial } from '../services/util';
import { Home } from '../pages/Home';
import { Meals } from '../pages/Meals';
import { Prep } from '../pages/Prep';
import { Library, LibSection } from '../pages/Library';
import { Shopping } from '../pages/Shopping';
import { Onboarding } from '../pages/Onboarding';
import { Panel } from '../pages/Panel';
import { Settings } from '../pages/Settings';
import { MealPage, SharedPage } from '../pages/MealPage';
import { IngPick, RecipeEdit } from '../pages/Recipes';
import { Sheets } from '../pages/Sheets';
import { goTab, handleImportFile } from './actions';
import { applyTheme } from './theme';
import { UI, closeNotice, closePanel, closeSheet, openPanel, popPage, rerender, setUpdateNow, top, useAppRender } from './ui';
import { useUpdate } from './useUpdate';

const TABS = [['home', 'Home'], ['meals', 'Meals'], ['prep', 'Prep'], ['library', 'Library'], ['shopping', 'Shopping']];
const TITLES: Record<string, string> = { home: 'Home', meals: 'Meals', library: 'Library', prep: 'Prep', shopping: 'Shopping' };

function Top() {
  const day = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  return (
    <header id="top">
      <div class="top">
        <h1><small class="eyebrow">{day}</small>{TITLES[UI.tab]}</h1>
        <span class="topend">
          <UpdateButton />
          <button class="avatar" onClick={openPanel} aria-label="Open menu">{initial(S.profile.name)}</button>
        </span>
      </div>
    </header>
  );
}

function Tabs() {
  const n = openShopCount();
  return (
    <nav id="tabs" aria-label="Sections">
      {TABS.map((t) => (
        <button key={t[0]} aria-current={UI.tab === t[0] ? 'page' : 'false'} onClick={() => goTab(t[0])}>
          <Icon n={t[0]} /><span>{t[1]}</span>{t[0] === 'shopping' && n ? <i class="badge">{n}</i> : null}
        </button>
      ))}
    </nav>
  );
}

function View() {
  if (UI.tab === 'home') return <Home />;
  if (UI.tab === 'meals') return <Meals />;
  if (UI.tab === 'library') return <Library />;
  if (UI.tab === 'prep') return <Prep />;
  return <Shopping />;
}

function Overlay({ onImport }: { onImport: () => void }) {
  const p = top();
  let body = null;
  if (p) {
    if (p.type === 'settings') body = <Settings onImport={onImport} />;
    else if (p.type === 'lib') body = <LibSection />;
    else if (p.type === 'meal') body = <MealPage />;
    else if (p.type === 'recipeEdit') body = <RecipeEdit />;
    else if (p.type === 'ingPick') body = <IngPick />;
    else if (p.type === 'shared') body = <SharedPage />;
  }
  return (
    <div id="overlay" role="dialog" aria-modal="true" class={p ? 'open' : ''}>
      {p ? <div class="wrap" key={UI.stack.length} style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom,0px))' }}>{body}</div> : null}
    </div>
  );
}

function Notice() {
  const n = UI.notice;
  let inner = null;
  if (n) {
    const names = n.keys.map((k) => plainName(k, S.shopping.lang)), one = n.keys.length === 1;
    const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
    inner = (
      <div class="nbox"><span class="nicon" aria-hidden="true">⚠️</span>
        <div class="grow">
          <b>Added to your list, but {n.keys.length}{one ? ' item isn’t' : ' items aren’t'} sold at {n.store}</b>
          <p>{list}{one ? ' is' : ' are'} on your list by {one ? 'its usual name' : 'their usual names'}, so you can pick {one ? 'it' : 'them'} up somewhere else.</p>
          <button class="linkbtn" onClick={() => { closeNotice(); goTab('shopping'); }}>Open shopping list</button>
        </div>
        <button class="iconbtn sm" onClick={closeNotice} aria-label="Close"><Icon n="x" size={18} /></button>
      </div>
    );
  }
  return <div id="notice" role="alert" class={UI.noticeShow ? 'show' : ''}>{inner}</div>;
}

const DROPDOWNS: [string, 'storeOpen' | 'countryOpen' | 'langOpen' | 'sortOpen'][] = [['storeDd', 'storeOpen'], ['countryDd', 'countryOpen'], ['langDd', 'langOpen'], ['sortDd', 'sortOpen']];

export function App() {
  useAppRender();
  setUpdateNow(useUpdate());
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Tapping anywhere outside an open dropdown closes it.
    const onClick = (e: MouseEvent) => {
      const dd = (e.target as Element).closest?.('[data-dd]')?.getAttribute('data-dd');
      let changed = false;
      DROPDOWNS.forEach(([id, key]) => { if (UI[key] && id !== dd) { UI[key] = false; changed = true; } });
      if (changed) rerender();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (UI.sheet) closeSheet(); else if (UI.panel) closePanel(); else if (UI.stack.length) popPage();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  applyTheme();
  const locked = !!(UI.stack.length || UI.sheet || UI.panel);
  useEffect(() => { document.body.classList.toggle('noscroll', locked); }, [locked]);

  const onImport = () => { const f = file.current; if (f) { f.value = ''; f.click(); } };

  if (S.onboarded) ensurePrep();
  return (
    <>
      {S.onboarded ? (
        <div id="appRoot">
          <div class="wrap"><Top /><main id="view"><View /></main></div>
          <Tabs />
        </div>
      ) : <div id="onboard"><Onboarding /></div>}
      <Overlay onImport={onImport} />
      <Panel />
      <Sheets />
      <div id="toast" role="status" aria-live="polite" class={UI.toastShow ? 'show' : ''}>{UI.toast}</div>
      <Notice />
      <input ref={file} id="importFile" type="file" accept=".json,application/json" class="hidden"
        onChange={(e) => { const f = (e.currentTarget as HTMLInputElement).files?.[0]; if (f) handleImportFile(f); }} />
    </>
  );
}
