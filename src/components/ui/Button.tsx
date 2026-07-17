import React, { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type ButtonVariant = 'primary' | 'accent' | 'highlight' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children?: React.ReactNode;
  /** Optional icon rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Optional icon rendered after the label. */
  rightIcon?: React.ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
  'transition-colors select-none disabled:opacity-50 disabled:pointer-events-none';

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-[44px] px-5 text-sm',
  lg: 'min-h-[52px] px-6 text-base',
};

const variants: Record<ButtonVariant, string> = {
  // Inverts across themes: near-black fill in light, off-white fill in dark.
  // Label uses --bg so it always contrasts the fill.
  primary: 'bg-text text-bg hover:opacity-90 shadow-sm',
  // Power outline. Label stays --text (power fails as small text), border is power.
  accent: 'bg-transparent text-text border-2 border-accent hover:bg-accent/10',
  // Sun fill with black text — the same in both themes (sun kept for emphasis).
  highlight: 'bg-highlight text-strength hover:bg-highlight/90 shadow-sm',
  // Low-emphasis, transparent.
  ghost: 'bg-transparent text-text hover:bg-accent/10',
  // Destructive. red-600 keeps white text at AA (~5.2:1).
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, leftIcon, rightIcon, className = '', children, type, disabled, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled}
      // Gentle press feedback; auto-disabled under prefers-reduced-motion via MotionConfig.
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={[base, sizes[size], variants[variant], fullWidth ? 'w-full' : '', className].join(' ')}
      {...props}
    >
      {leftIcon != null && <span aria-hidden="true" className="inline-flex shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon != null && <span aria-hidden="true" className="inline-flex shrink-0">{rightIcon}</span>}
    </motion.button>
  );
});
