import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
const KEY = 'bof-theme';
const ORDER: ThemeMode[] = ['system', 'light', 'dark'];

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function systemDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Light/dark theme following the system, with a manual override persisted in localStorage. */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readMode);
  const [sysDark, setSysDark] = useState(systemDark);

  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSysDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const resolved: 'light' | 'dark' = mode === 'system' ? (sysDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const cycle = useCallback(() => {
    setMode((m) => {
      const next = ORDER[(ORDER.indexOf(m) + 1) % ORDER.length]!;
      try {
        if (next === 'system') localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, next);
      } catch {
        /* storage unavailable (private mode): theme still applies for this visit */
      }
      return next;
    });
  }, []);

  return { mode, resolved, cycle };
}
