import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import type { AppState } from './domain/types';

export type ThemeChoice = AppState['theme']; // 'light' | 'dark' | 'system'

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Resolve a theme choice to the concrete mode that should be applied right now. */
export function resolveTheme(choice: ThemeChoice): 'light' | 'dark' {
  if (choice === 'system') {
    return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches
      ? 'dark'
      : 'light';
  }
  return choice;
}

/**
 * Keeps the `.dark` class on <html> in sync with the persisted theme choice.
 * Defaults to the OS preference (`system`) and live-updates when the OS flips,
 * without requiring the user to re-open the app. Mount once, near the app root.
 */
export function useApplyTheme(): void {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const mql = window.matchMedia(DARK_QUERY);

    const apply = () => {
      root.classList.toggle('dark', resolveTheme(theme) === 'dark');
    };

    apply();

    // Only follow the OS while the user hasn't pinned a concrete choice.
    if (theme === 'system') {
      mql.addEventListener('change', apply);
      return () => mql.removeEventListener('change', apply);
    }
  }, [theme]);
}

/**
 * Reactive boolean for whether dark mode is currently applied. Watches the
 * `.dark` class on <html> (toggled by useApplyTheme) so consumers like charts,
 * which need concrete colour values rather than CSS vars, re-render on change.
 */
export function useResolvedDark(): boolean {
  const theme = useAppStore((s) => s.theme);
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains('dark'));
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, [theme]);
  return dark;
}
