import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export type TickStatus = 'pending' | 'active' | 'done';
export interface Tick {
  label: string;
  status: TickStatus;
}

/** Animated, sequentially-resolving checklist. Reduced motion → instant checks. */
export const LoadingSequence: React.FC<{ ticks: Tick[]; headingRef?: React.Ref<HTMLHeadingElement> }> = ({
  ticks,
  headingRef,
}) => {
  const reduce = useReducedMotion();
  const active = ticks.find((t) => t.status === 'active');
  const done = ticks.every((t) => t.status === 'done');

  return (
    <div className="flex min-h-[70vh] flex-col justify-center py-10 text-center">
      <div className="mx-auto mb-6 grid h-12 w-12 place-items-center">
        {!done && <Loader2 className="h-8 w-8 animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />}
        {done && <Check className="h-8 w-8 text-accent" aria-hidden="true" />}
      </div>

      <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-bold text-text outline-none">
        Building your FutureMe
      </h1>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
        Your coach is turning your answers into a personalised roadmap.
      </p>

      <ul className="mx-auto mt-8 w-full max-w-xs space-y-3 text-left" aria-label="Plan generation progress">
        {ticks.map((t, i) => (
          <li
            key={t.label}
            className={`flex items-center gap-3 transition-opacity duration-300 ${
              t.status === 'pending' ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <span
              className={[
                'grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold',
                t.status === 'done'
                  ? 'border-transparent bg-highlight text-strength'
                  : t.status === 'active'
                    ? 'border-accent text-accent'
                    : 'border-hairline text-muted',
              ].join(' ')}
            >
              {t.status === 'done' ? (
                <motion.span
                  initial={reduce ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: reduce ? 0 : 0.2 }}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                </motion.span>
              ) : t.status === 'active' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <span aria-hidden="true">{i + 1}</span>
              )}
            </span>
            <span className="text-sm font-medium text-text">{t.label}</span>
            <span className="sr-only">
              {t.status === 'done' ? '— complete' : t.status === 'active' ? '— in progress' : '— pending'}
            </span>
          </li>
        ))}
      </ul>

      {/* Politely announce the current stage to screen readers. */}
      <div className="sr-only" role="status" aria-live="polite">
        {done ? 'Your plan is ready.' : active ? active.label : ''}
      </div>
    </div>
  );
};
