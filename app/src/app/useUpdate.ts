import { useRegisterSW } from 'virtual:pwa-register/preact';

const CHECK_EVERY_MS = 5 * 60 * 1000;

// Caches left by the hand-written service worker of 0.17.x and earlier ("posilki-0.17.2" and so on).
const isLegacyCache = (k: string) => /^posilki-\d/.test(k);

/** Checks for a new version every 5 minutes and whenever the app comes back to the front. */
export function useUpdate(): (() => void) | null {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      const check = () => { if (navigator.onLine) reg.update().catch(() => undefined); };
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    },
    onNeedRefresh() {
      // Coming from 0.17.x: the old service worker is still in charge, so switch over straight away
      // instead of asking, and clear the old caches. Saved data in localStorage is not touched.
      if (__PREVIEW__ || !('caches' in window)) return;
      caches.keys().then((keys) => {
        const old = keys.filter(isLegacyCache);
        if (!old.length) return;
        Promise.all(old.map((k) => caches.delete(k))).then(() => updateServiceWorker(true));
      }).catch(() => undefined);
    },
  });
  return needRefresh ? () => updateServiceWorker(true) : null;
}
