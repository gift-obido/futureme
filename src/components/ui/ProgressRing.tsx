import React from 'react';

export interface ProgressRingProps {
  /** Progress 0–100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: 'accent' | 'highlight';
  /** Accessible label, e.g. "Daily progress". */
  label?: string;
  /** Centre content (defaults to the rounded percentage). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * SVG progress ring. The arc animates via a CSS transition that is disabled
 * under `prefers-reduced-motion` (motion-reduce:transition-none).
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 96,
  strokeWidth = 8,
  tone = 'accent',
  label = 'Progress',
  children,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const strokeClass = tone === 'highlight' ? 'stroke-highlight' : 'stroke-accent';

  return (
    <div
      className={`relative inline-grid place-items-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          className="stroke-hairline"
          fill="none"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className={`${strokeClass} transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none`}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children ?? <span className="stat text-lg font-bold text-text">{Math.round(clamped)}%</span>}
      </div>
    </div>
  );
};
