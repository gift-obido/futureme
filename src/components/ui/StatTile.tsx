import React from 'react';
import { Card } from './Card';
import { CardThumb, type CardThumbSize } from './CardThumb';

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  /** Small unit shown after the value, e.g. "kcal", "g". */
  unit?: string;
  /** Secondary line, e.g. "of 2,750 ml". */
  sub?: string;
  icon?: React.ReactNode;
  /** When set, renders the shared card image (right) instead of the small icon. */
  imageKey?: string;
  /** Thumb size tier when imageKey is set (default 'md'; use 'sm' in two-up rows). */
  imageSize?: CardThumbSize;
  className?: string;
}

/** Compact metric tile: label, large tabular value, optional unit / sub / icon-or-image. */
export const StatTile: React.FC<StatTileProps> = ({ label, value, unit, sub, icon, imageKey, imageSize = 'md', className = '' }) => (
  <Card padding="md" className={className}>
    <div className={`flex gap-3 ${imageKey ? 'items-center' : 'items-start justify-between'}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="stat text-2xl font-bold leading-none text-text">{value}</span>
          {unit && <span className="text-sm font-medium text-muted">{unit}</span>}
        </p>
        {sub && <p className="stat mt-1 text-xs text-muted">{sub}</p>}
      </div>
      {imageKey ? (
        <CardThumb imageKey={imageKey} size={imageSize} />
      ) : (
        icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
            {icon}
          </span>
        )
      )}
    </div>
  </Card>
);
