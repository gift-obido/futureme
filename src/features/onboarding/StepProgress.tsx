import React from 'react';

interface StepProgressProps {
  current: number; // 1-indexed
  total: number;
  title: string;
}

/** Segmented step indicator + "Step X of N · Title", exposed as a progressbar. */
export const StepProgress: React.FC<StepProgressProps> = ({ current, total, title }) => {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Step {current} of {total}
        </span>
        <span className="text-xs font-medium text-muted">{title}</span>
      </div>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-label="Onboarding progress"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuetext={`Step ${current} of ${total}: ${title}`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={[
              'h-1.5 flex-1 rounded-full transition-colors',
              i < current ? 'bg-accent' : 'bg-hairline',
            ].join(' ')}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="sr-only">{pct}% complete</span>
    </div>
  );
};
