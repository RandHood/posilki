import { render } from 'preact';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import './styles/global.css';
import { App } from './app/App';
import { openFromHash } from './app/actions';
import { applyTheme } from './app/theme';
import { UI, rerender, toast } from './app/ui';
import { CATALOG, fetchCatalog, fetchProducts, loadCachedCatalog, loadCachedProducts } from './services/catalog';
import { MOVED, S, clearMoved, load, save } from './services/state';

load();
loadCachedCatalog();
loadCachedProducts();
applyTheme();

// Redraw with new meals or prices only when nothing is open on top, so nothing jumps under your finger.
const quiet = () => !UI.stack.length && !UI.sheet && !UI.panel && S.onboarded;
let started = false;
function start(): void {
  if (started) return; started = true;
  render(<App />, document.getElementById('app')!);
  if (S.onboarded) save();
  openFromHash();
  if (MOVED && S.onboarded) {
    toast(MOVED.country ? 'Iceland isn’t available for now because no Icelandic store’s products can be checked online. The app is set to Poland and ' + MOVED.to + '.'
      : MOVED.from + ' was removed because its products can’t be checked online. Your store is now ' + MOVED.to + '.');
    clearMoved();
  }
}
fetchProducts().then((changed) => { if (changed && started && quiet()) rerender(); }).catch(() => undefined);
if (CATALOG.loaded) {
  start();
  // Pick up new meals in the background.
  fetchCatalog().then((changed) => { if (changed && quiet()) rerender(); }).catch(() => undefined);
} else {
  // First run: wait briefly for the full catalog, then start with whatever is there.
  fetchCatalog().then(start, start);
  setTimeout(start, 4000);
}

window.addEventListener('hashchange', openFromHash);
window.addEventListener('pagehide', save);
try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.theme === 'system') applyTheme(); }); } catch { /* old Safari */ }
try { navigator.storage?.persist?.(); } catch { /* not supported */ }
