import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Accessible name, e.g. "Water intake". */
  label: string;
  /** Rendered after the value, e.g. "ml". */
  unit?: string;
  /** Formats the numeric value for display (e.g. thousands separators). */
  format?: (v: number) => string;
}

/** Accessible −/+ numeric stepper with 44px targets and bound-aware disabling. */
export const Stepper: React.FC<StepperProps> = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  label,
  unit,
  format = (v) => String(v),
}) => {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const dec = () => onChange(clamp(value - step));
  const inc = () => onChange(clamp(value + step));

  const btn =
    'grid h-11 w-11 place-items-center rounded-full border border-hairline text-text ' +
    'transition-colors hover:bg-accent/10 disabled:opacity-40 disabled:pointer-events-none';

  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label={label}>
      <button type="button" onClick={dec} disabled={value <= min} aria-label={`Decrease ${label}`} className={btn}>
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span aria-live="polite" className="stat min-w-[3ch] text-center text-base font-semibold text-text">
        {format(value)}
        {unit && <span className="ml-0.5 text-sm font-medium text-muted">{unit}</span>}
      </span>
      <button type="button" onClick={inc} disabled={value >= max} aria-label={`Increase ${label}`} className={btn}>
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};
