import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import type { ThemeChoice } from '../../lib/theme';

const ORDER: ThemeChoice[] = ['system', 'light', 'dark'];

const META: Record<ThemeChoice, { label: string; Icon: typeof Sun }> = {
  system: { label: 'System', Icon: Monitor },
  light: { label: 'Light', Icon: Sun },
  dark: { label: 'Dark', Icon: Moon },
};

interface ThemeToggleProps {
  className?: string;
}

/**
 * Cycles theme choice system → light → dark. The icon + accessible label always
 * describe the *current* choice; the tooltip/announcement names what comes next.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const { label, Icon } = META[theme];
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Theme: ${label} — switch to ${META[next].label}`}
      aria-label={`Theme: ${label}. Activate to switch to ${META[next].label}.`}
      className={
        'inline-flex h-11 w-11 items-center justify-center rounded-full text-accent ' +
        'transition-colors hover:bg-accent/10 ' +
        className
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
};
