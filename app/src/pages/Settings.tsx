import { useState } from 'preact/hooks';
import { COUNTRIES, COUNTRY_ORDER, DAYS } from '../data/fixed';
import { Badge, Dropdown, Icon, PageHead } from '../components/common';
import { CATALOG, LIVE, MEALS } from '../services/catalog';
import { tKcal } from '../services/logic';
import { S, type Target, save, saveSoon } from '../services/state';
import { clone, fmtDate, parseIso, storesFor, todayIdx } from '../services/util';
import { doExport } from '../app/actions';
import { UI, openSheet, popPage, rerender, toast } from '../app/ui';
import { ThemeSeg } from './Panel';

// Calories on its own row, then protein, fat and carbs side by side. Typing calories changes carbs so the numbers add up.
function TargetRow({ t, f, label, unit, max }: { t: Target; f: 'kcal' | 'p' | 'f' | 'c'; label: string; unit: string; max: number }) {
  const [typing, setTyping] = useState<string | null>(null);
  const val = f === 'kcal' ? tKcal(t) : t[f];
  return (
    <label class={'trow' + (f === 'kcal' ? ' kcal' : '')}>
      <span>{label}</span>
      <span class="tval">
        <input type="number" inputMode="numeric" min="0" max={max} value={typing ?? String(val)}
          onFocus={() => setTyping(String(val))}
          onBlur={() => { setTyping(null); rerender(); }}
          onInput={(e) => {
            const raw = (e.currentTarget as HTMLInputElement).value; setTyping(raw);
            let n = parseInt(raw, 10); n = isNaN(n) || n < 0 ? 0 : n;
            if (f === 'kcal') t.c = Math.max(0, Math.round((n - 4 * t.p - 9 * t.f) / 4)); else t[f] = n;
            saveSoon(); rerender();
          }} />
        <small>{unit}</small>
      </span>
    </label>
  );
}
function TargetBlock({ t }: { t: Target }) {
  return (
    <div class="tlist">
      <TargetRow t={t} f="kcal" label="Calories" unit="kcal" max={6000} />
      <TargetRow t={t} f="p" label="Protein" unit="g" max={400} />
      <TargetRow t={t} f="f" label="Fat" unit="g" max={300} />
      <TargetRow t={t} f="c" label="Carbs" unit="g" max={800} />
    </div>
  );
}

function CountryDropdown() {
  const cc = S.profile.country, c = (cc && COUNTRIES[cc]) || { flag: '', name: 'Choose a country' };
  return (
    <Dropdown id="countryDd" open={UI.countryOpen} label="Country" button={
      <button class="storedd" aria-expanded={UI.countryOpen} aria-controls="countryDd" onClick={() => { UI.countryOpen = !UI.countryOpen; rerender(); }}>
        <span class="flag" aria-hidden="true">{c.flag}</span><span class="grow"><span>{c.name}</span></span><span class="chev"><Icon n="chev" size={18} /></span>
      </button>}>
      {COUNTRY_ORDER.map((k: string) => {
        const x = COUNTRIES[k], on = k === cc;
        return (
          <button key={k} role="radio" aria-checked={on} tabIndex={UI.countryOpen ? undefined : -1} onClick={() => {
            UI.countryOpen = false;
            if (k === S.profile.country) { rerender(); return; }
            S.profile.country = k; if (storesFor(k).indexOf(S.profile.store!) < 0) S.profile.store = storesFor(k)[0];
            save(); rerender(); toast('Default store set to ' + S.profile.store + '. You can change it below.');
          }}><span class="flag" aria-hidden="true">{x.flag}</span><span class="grow">{x.name}</span>{on ? <span class="check"><Icon n="check" size={18} /></span> : null}</button>
        );
      })}
    </Dropdown>
  );
}

export function Settings({ onImport }: { onImport: () => void }) {
  const ti = todayIdx();
  return (
    <>
      <PageHead title="Settings" onBack={popPage} />
      <section class="section"><h2>Profile</h2>
        <label class="lbl" for="setName">Name</label>
        <input id="setName" class="field" autocomplete="given-name" defaultValue={S.profile.name}
          onInput={(e) => { const v = (e.currentTarget as HTMLInputElement).value.trim(); if (v) { S.profile.name = v; saveSoon(); rerender(); } }} />
        <span class="lbl">Country</span><CountryDropdown />
        <span class="lbl">Default store</span>
        <button class="storebtn" onClick={() => openSheet({ type: 'store', scope: 'default' })}><Badge store={S.profile.store} /><span class="grow">{S.profile.store}</span><span class="chev"><Icon n="chev" size={20} /></span></button>
        <p class="note">Used everywhere in the app. Changing the store on a meal page only changes that page.</p>
      </section>
      <section class="section"><h2>Appearance</h2><ThemeSeg /></section>
      <section class="section"><h2>Daily targets</h2>
        <div class="seg" role="group" aria-label="Target mode">
          {([['same', 'Same every day'], ['days', 'Different per day']] as const).map((o) => (
            <button key={o[0]} aria-pressed={S.targets.mode === o[0]} onClick={() => {
              if (o[0] === S.targets.mode) return;
              if (o[0] === 'days') S.targets.days = S.targets.days.map(() => clone(S.targets.same));
              S.targets.mode = o[0]; save(); rerender();
            }}>{o[1]}</button>
          ))}
        </div>
        <div style={{ marginTop: '14px' }}>
          {S.targets.mode === 'same' ? <TargetBlock t={S.targets.same} /> : (
            <>
              {S.targets.days.map((t, i) => (
                <div class="dayblock" key={i}><h3>{DAYS[i]}{i === ti ? <> <span class="small muted" style={{ fontWeight: 400 }}>(today)</span></> : null}</h3><TargetBlock t={t} /></div>
              ))}
              <div class="btnrow"><button class="btn sm" onClick={() => { const m = S.targets.days[0]; S.targets.days = DAYS.map(() => clone(m)); save(); rerender(); toast('Monday copied to every day'); }}>Copy Monday to all days</button></div>
            </>
          )}
        </div>
        <p class="note" style={{ marginTop: '12px' }}>Change protein, fat or carbs and calories follow. Change calories and carbs adjust to match. Calories are 4 × protein + 4 × carbs + 9 × fat. Tap Plan a new week in Prep to plan around new targets.</p>
      </section>
      <section class="section"><h2>Backup</h2>
        <p class="muted">{S.lastBackup ? 'Last backup: ' + fmtDate(S.lastBackup) + '.' : 'No backup saved yet.'}</p>
        <p class="note">Export saves one file with everything in the app. In the share sheet, choose Save to Files, then iCloud Drive. To restore, import that file on any phone.</p>
        <div class="btnrow"><button class="btn primary" onClick={doExport}>Export backup</button><button class="btn" onClick={onImport}>Import backup</button></div>
      </section>
      <section class="section"><h2>About</h2>
        <p class="muted">Posiłki {__APP_VERSION__}{__PREVIEW__ ? ' preview' : ''}. {MEALS.length} meals in the catalog{CATALOG.updated ? ', updated ' + fmtDate(parseIso(CATALOG.updated).getTime()) : ''}. {LIVE.updated ? 'Store products were last checked ' + fmtDate(parseIso(LIVE.updated).getTime()) + '. ' : ''}Your data is stored on this phone, so open the app from its Home Screen icon.</p>
      </section>
    </>
  );
}
