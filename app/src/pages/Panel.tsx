import { useEffect, useState } from 'preact/hooks';
import { COUNTRIES } from '../data/fixed';
import { Badge, Dropdown, Icon } from '../components/common';
import { S, save } from '../services/state';
import { initial, storesFor } from '../services/util';
import { UI, closePanel, pushPage, rerender, toast } from '../app/ui';
import { applyTheme } from '../app/theme';

export function ThemeSeg() {
  return (
    <div class="seg" role="group" aria-label="Appearance">
      {[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map((o) => (
        <button key={o[0]} aria-pressed={S.theme === o[0]} onClick={() => { S.theme = o[0] as typeof S.theme; save(); applyTheme(); rerender(); }}>{o[1]}</button>
      ))}
    </div>
  );
}

// The side panel slides in from the right; it stays drawn while it slides out again.
export function Panel() {
  const [mounted, setMounted] = useState(UI.panel);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (UI.panel) {
      setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 340);
    return () => clearTimeout(t);
  }, [UI.panel]);

  const c = COUNTRIES[S.profile.country || ''] || { name: '', flag: '' }, cur = S.profile.store;
  return (
    <div id="panelRoot" class={shown && UI.panel ? 'open' : ''}>
      {mounted ? (
        <>
          <div class="scrim" onClick={closePanel} />
          <aside class="panel" aria-label="Menu">
            <div class="me">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span class="avatar lg" aria-hidden="true">{initial(S.profile.name)}</span>
                <button class="iconbtn" onClick={closePanel} aria-label="Close menu"><Icon n="x" /></button>
              </div>
              <h2>{S.profile.name}</h2><div class="line"><span aria-hidden="true">{c.flag}</span>{c.name}</div>
            </div>
            <Dropdown id="storeDd" open={UI.storeOpen} label="Default store" button={
              <button class="storedd prow" aria-expanded={UI.storeOpen} aria-controls="storeDd" onClick={() => { UI.storeOpen = !UI.storeOpen; rerender(); }}>
                <Badge store={cur} /><span class="grow"><small>Default store</small><span>{cur || ''}</span></span><span class="chev"><Icon n="chev" size={18} /></span>
              </button>}>
              {storesFor(S.profile.country).map((st) => {
                const on = st === cur;
                return (
                  <button key={st} role="radio" aria-checked={on} tabIndex={UI.storeOpen ? undefined : -1} onClick={() => {
                    if (st !== S.profile.store) { S.profile.store = st; save(); toast('Default store: ' + st); }
                    UI.storeOpen = false; rerender();
                  }}><Badge store={st} /><span class="grow">{st}</span>{on ? <span class="check"><Icon n="check" size={18} /></span> : null}</button>
                );
              })}
            </Dropdown>
            <div class="pthemes"><p>Appearance</p><ThemeSeg /></div>
            <button class="prow" onClick={() => { UI.countryOpen = false; pushPage({ type: 'settings' }); }}><Icon n="gear" /><span class="grow">Settings</span><span class="chev"><Icon n="chev" size={20} /></span></button>
            <div class="pfoot">Posiłki {__APP_VERSION__}{__PREVIEW__ ? ' preview' : ''}</div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
