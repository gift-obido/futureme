import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use the elevated surface token (for modals, stacked cards, info panels). */
  elevated?: boolean;
  /** Padding preset. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Render as an info panel (pool / dimmed-pool background). */
  info?: boolean;
}

const pad = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { elevated, info, padding = 'md', className = '', children, ...props },
  ref,
) {
  const surface = info ? 'bg-info' : elevated ? 'bg-elevated' : 'bg-surface';
  return (
    <div
      ref={ref}
      className={[
        surface,
        'text-text rounded-2xl border border-hairline',
        elevated ? 'shadow-lg' : 'shadow-sm',
        pad[padding],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
});
