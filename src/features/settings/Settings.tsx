import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Sun, Moon, Trash2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { clearAllPhotos } from '../../lib/storage';
import { Button, Card, Sheet } from '../../components/ui';
import { ProfileSettings } from './ProfileSettings';
import type { AppState } from '../../lib/domain/types';

type ThemeChoice = AppState['theme'];
const THEMES: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

const ThemePicker: React.FC = () => {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusTo = (i: number) => {
    const j = ((i % THEMES.length) + THEMES.length) % THEMES.length;
    setTheme(THEMES[j].value);
    refs.current[j]?.focus();
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); focusTo(i + 1); }
    else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); focusTo(i - 1); }
  };
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
      {THEMES.map((t, i) => {
        const checked = theme === t.value;
        return (
          <button
            key={t.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => setTheme(t.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={[
              'flex min-h-[44px] flex-col items-center gap-1 rounded-xl border py-3 transition-colors',
              checked ? 'border-accent bg-accent/5' : 'border-field hover:border-field-hover hover:bg-accent/5',
            ].join(' ')}
          >
            <t.Icon className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="text-sm font-semibold text-text">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const resetAll = useAppStore((s) => s.resetAll);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const doReset = async () => {
    setResetting(true);
    await clearAllPhotos();
    resetAll();
    navigate('/onboarding');
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-text">Settings</h1>
        <p className="mt-1 text-sm text-muted">Your profile, appearance, and data — all on this device.</p>
      </header>

      <ProfileSettings />

      <section aria-label="Appearance">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Appearance</h2>
        <Card padding="lg">
          <ThemePicker />
        </Card>
      </section>

      <section aria-label="Data">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Your data</h2>
        <Card padding="lg" className="space-y-3">
          <p className="text-sm text-muted">
            Everything lives locally — nothing leaves this device. Resetting starts you fresh from onboarding.
          </p>
          <Button variant="danger" onClick={() => setConfirmOpen(true)} leftIcon={<Trash2 className="h-4 w-4" />}>
            Reset app
          </Button>
        </Card>
      </section>

      <p className="pt-2 text-center text-xs text-muted">FutureMe · MVP</p>

      <Sheet
        open={confirmOpen}
        onClose={() => !resetting && setConfirmOpen(false)}
        title="Reset app?"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setConfirmOpen(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={doReset} disabled={resetting}>
              {resetting ? 'Resetting…' : 'Reset everything'}
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-600/10 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm text-text">
            This permanently clears your plan, logs, progress, photos, and streak. It can't be undone.
          </p>
        </div>
      </Sheet>
    </div>
  );
};
