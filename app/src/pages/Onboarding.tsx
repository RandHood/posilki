import { useEffect, useRef } from 'preact/hooks';
import { COUNTRIES, COUNTRY_ORDER } from '../data/fixed';
import { Badge, Icon } from '../components/common';
import { newWeek } from '../services/logic';
import { S, save } from '../services/state';
import { storesFor } from '../services/util';
import { openFromHash } from '../app/actions';
import { UI, rerender, toast } from '../app/ui';
import { applyTheme } from '../app/theme';

const TOTAL = 4;

function Head({ n, title, sub }: { n: number; title: string; sub?: string }) {
  return (
    <>
      {n > 1 ? <div class="pagehead"><button class="back" aria-label="Back" onClick={() => { UI.ob.step = Math.max(1, UI.ob.step - 1); rerender(); }}><Icon n="back" size={22} /></button></div> : null}
      <div class="obhead"><p class="obstep">Step {n} of {TOTAL}</p><h1 style={{ marginTop: '8px' }}>{title}</h1>{sub ? <p>{sub}</p> : null}</div>
    </>
  );
}

function next(): void { if (UI.ob.step === 1 && !UI.ob.name.trim()) return; UI.ob.step++; rerender(); }

export function Onboarding() {
  const ob = UI.ob, nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ob.step === 1) setTimeout(() => nameRef.current?.focus(), 50); }, [ob.step]);

  if (ob.step === 1) {
    return (
      <>
        <Head n={1} title="What should we call you?" sub="Your name stays on this phone." />
        <div class="obbody"><input ref={nameRef} id="obName" class="field big" autocomplete="given-name" placeholder="Your name" aria-label="Your name" value={ob.name}
          onInput={(e) => { ob.name = (e.currentTarget as HTMLInputElement).value; rerender(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') next(); }} /></div>
        <div class="obfoot"><button class="btn primary block" disabled={!ob.name.trim()} onClick={next}>Continue</button></div>
      </>
    );
  }
  if (ob.step === 2) {
    const opts: [string, string, string, preact.JSX.Element][] = [
      ['system', 'System', 'Match your iPhone’s setting', <span class="swatch"><i /><i /></span>],
      ['light', 'Light', 'Always light', <span class="swatch light" />],
      ['dark', 'Dark', 'Always dark', <span class="swatch dark" />],
    ];
    return (
      <>
        <Head n={2} title="How should it look?" sub="You can change this later in Settings." />
        <div class="obbody">{opts.map((o) => (
          <button key={o[0]} class="themeopt" aria-pressed={S.theme === o[0]} onClick={() => { S.theme = o[0] as typeof S.theme; applyTheme(); rerender(); }}>
            {o[3]}<span><b>{o[1]}</b><small>{o[2]}</small></span>
          </button>
        ))}</div>
        <div class="obfoot"><button class="btn primary block" onClick={next}>Continue</button></div>
      </>
    );
  }
  if (ob.step === 3) {
    return (
      <>
        <Head n={3} title="Where do you shop?" sub="This decides which stores and products you see." />
        <div class="obbody">{COUNTRY_ORDER.map((cc: string) => {
          const c = COUNTRIES[cc];
          return <button key={cc} class="country" aria-pressed={ob.country === cc} onClick={() => { ob.country = cc; ob.step = 4; rerender(); }}><span class="flag" aria-hidden="true">{c.flag}</span>{c.name}</button>;
        })}</div>
      </>
    );
  }
  return (
    <>
      <Head n={4} title="Pick your usual store" sub="Meals use its products by default. You can change it any time in Settings." />
      <div class="obbody">{storesFor(ob.country).map((s) => (
        <button key={s} class="storebtn" onClick={() => {
          S.profile = { name: ob.name.trim(), country: ob.country, store: s };
          S.onboarded = true; S.createdAt = Date.now(); newWeek(); save(); rerender(); window.scrollTo(0, 0);
          toast('Welcome, ' + S.profile.name + '. Your first week is planned.');
          openFromHash();
        }}><Badge store={s} lg /><span class="grow">{s}</span><span class="chev"><Icon n="chev" size={20} /></span></button>
      ))}</div>
    </>
  );
}
