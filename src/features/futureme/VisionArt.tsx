import React, { useId } from 'react';
import type { VisionRender, Goal } from '../../lib/domain/types';

const PALETTE_HEX: Record<VisionRender['palette'], string> = {
  sun: '#F9F095',
  pool: '#D6E6E4',
  power: '#7F7767',
};

// Future-physique proportions (half-widths, in a 200-wide viewBox). Non-anatomical
// on purpose — a stylised silhouette, never photoreal.
const SHAPE: Record<Goal, { sh: number; wa: number; hi: number }> = {
  lose_fat: { sh: 44, wa: 26, hi: 34 },
  build_muscle: { sh: 56, wa: 32, hi: 40 },
  recomposition: { sh: 50, wa: 28, hi: 36 },
  get_stronger: { sh: 58, wa: 34, hi: 42 },
  improve_fitness: { sh: 46, wa: 30, hi: 36 },
};

const silhouettePath = ({ sh, wa, hi }: { sh: number; wa: number; hi: number }): string => {
  const c = 100;
  return [
    `M ${c - sh} 72`,
    `C ${c - sh - 3} 94, ${c - wa - 8} 118, ${c - wa} 146`,
    `C ${c - wa + 1} 164, ${c - hi} 172, ${c - hi} 186`,
    `L ${c - hi + 7} 250`,
    `L ${c - 6} 250`,
    `L ${c - 5} 198`,
    `L ${c + 5} 198`,
    `L ${c + 6} 250`,
    `L ${c + hi - 7} 250`,
    `L ${c + hi} 186`,
    `C ${c + hi} 172, ${c + wa - 1} 164, ${c + wa} 146`,
    `C ${c + wa + 8} 118, ${c + sh + 3} 94, ${c + sh} 72`,
    'Z',
  ].join(' ');
};

/**
 * A stylised, non-photoreal "future physique" — an abstract silhouette over a
 * palette-tinted glow. Purely illustrative (decorative for AT, labelled via role).
 */
export const VisionArt: React.FC<{ vision: VisionRender; className?: string }> = ({ vision, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const accent = PALETTE_HEX[vision.palette];
  const shape = SHAPE[vision.goal] ?? SHAPE.improve_fitness;
  const d = silhouettePath(shape);

  return (
    <svg
      viewBox="0 0 200 280"
      className={`h-full w-full ${className}`}
      role="img"
      aria-label="An abstract, illustrative projection of your future physique."
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`fig-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.95" />
          <stop offset="1" stopColor="#5F594D" stopOpacity="0.92" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="45%" r="55%">
          <stop offset="0" stopColor={accent} stopOpacity="0.55" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Palette glow + abstract orbit rings */}
      <ellipse cx="100" cy="140" rx="92" ry="120" fill={`url(#glow-${uid})`} />
      <circle cx="100" cy="150" r="78" fill="none" stroke={accent} strokeOpacity="0.22" strokeWidth="1" />
      <circle cx="100" cy="150" r="60" fill="none" stroke={accent} strokeOpacity="0.16" strokeWidth="1" />

      {/* Figure — filled silhouette with a theme-aware edge for legibility */}
      <g className="stroke-text/20" strokeWidth="1.5" strokeLinejoin="round">
        <circle cx="100" cy="44" r="19" fill={`url(#fig-${uid})`} />
        <path d={d} fill={`url(#fig-${uid})`} />
      </g>

      {/* A small forward spark */}
      <path
        d="M150 60 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z"
        fill={accent}
        fillOpacity="0.9"
      />
    </svg>
  );
};
