import React, { useId, useRef } from 'react';
import { Check } from 'lucide-react';

export interface RadioOption<T extends string | number> {
  value: T;
  label: string;
  desc?: string;
  icon?: React.ReactNode;
}

interface RadioGroupProps<T extends string | number> {
  /** Accessible group name. */
  label: string;
  value: T | undefined;
  onChange: (value: T) => void;
  options: RadioOption<T>[];
  columns?: 1 | 2 | 3 | 5;
  /** 'card' = roomy with description; 'chip' = compact pill. Defaults by content. */
  variant?: 'card' | 'chip';
  /**
   * Treat the (chip) options as call-to-action buttons rather than passive
   * choices: their unselected state gets a high-contrast accent border so they
   * read as actionable, not as an unselected option. Used for the target-date
   * toggle (Let AI decide / Pick a date).
   */
  cta?: boolean;
  error?: string;
}

const COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  5: 'grid-cols-5',
};

/**
 * WAI-ARIA radiogroup: one tab stop, arrow keys move + select, Home/End jump.
 * Selection styling uses semantic tokens only (selected chip = sun + black text,
 * so no small text ever renders in sun/power).
 */
export function RadioGroup<T extends string | number>({
  label,
  value,
  onChange,
  options,
  columns = 1,
  variant,
  cta = false,
  error,
}: RadioGroupProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const errId = useId();
  const kind = variant ?? (options.some((o) => o.desc) ? 'card' : 'chip');
  const selectedIndex = options.findIndex((o) => o.value === value);

  const focusTo = (i: number) => {
    const n = options.length;
    const idx = ((i % n) + n) % n;
    onChange(options[idx].value);
    refs.current[idx]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        focusTo(idx + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        focusTo(idx - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusTo(0);
        break;
      case 'End':
        e.preventDefault();
        focusTo(options.length - 1);
        break;
    }
  };

  return (
    <div role="radiogroup" aria-label={label} aria-invalid={error ? true : undefined} aria-describedby={error ? errId : undefined}>
      <div className={`grid gap-2 ${COLS[columns]}`}>
        {options.map((opt, idx) => {
          const checked = opt.value === value;
          // Roving tabindex: the checked option (or the first, if none) is the tab stop.
          const tabIndex = checked || (selectedIndex === -1 && idx === 0) ? 0 : -1;

          if (kind === 'chip') {
            return (
              <button
                key={String(opt.value)}
                ref={(el) => { refs.current[idx] = el; }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={tabIndex}
                onClick={() => onChange(opt.value)}
                onKeyDown={(e) => onKeyDown(e, idx)}
                className={[
                  'min-h-[44px] rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
                  // Ascending emphasis. Options: STEPS-card hairline default → brighter
                  // border + surface lift on hover. CTA: high-contrast accent border so it
                  // reads as an actionable button. Selected: sun fill (strongest).
                  checked
                    ? 'border-transparent bg-highlight text-strength shadow-sm'
                    : cta
                      ? 'border-accent text-text hover:bg-accent/5'
                      : 'border-hairline text-text hover:border-field hover:bg-accent/5',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          }

          return (
            <button
              key={String(opt.value)}
              ref={(el) => { refs.current[idx] = el; }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={tabIndex}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => onKeyDown(e, idx)}
              className={[
                'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                // default = STEPS-card hairline · hover = brighter border + lift · selected = strongest (accent border + fill + check).
                checked ? 'border-accent bg-accent/10 shadow-sm' : 'border-hairline hover:border-field hover:bg-accent/5',
              ].join(' ')}
            >
              {opt.icon != null && (
                <span
                  className={[
                    'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                    checked ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-muted',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {opt.icon}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-text">{opt.label}</span>
                {opt.desc && <span className="block text-[11px] text-muted">{opt.desc}</span>}
              </span>
              {checked && <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {error && (
        <p id={errId} role="alert" className="mt-1 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
