import { S } from '../services/state';

function systemDark(): boolean { try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } }
export function isDark(): boolean { return S.theme === 'dark' || (S.theme !== 'light' && systemDark()); }
export function applyTheme(): void {
  const root = document.documentElement;
  if (S.theme === 'light' || S.theme === 'dark') root.setAttribute('data-theme', S.theme); else root.removeAttribute('data-theme');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark() ? '#0F1411' : '#F1F3EE');
}
