import React from 'react';
import { getCardImage } from '../../assets/imageManifest';

export type CardThumbSize = 'sm' | 'md' | 'fill';

export interface CardThumbProps {
  /** Manifest key, e.g. "today/streak" or "exercises/barbell-back-squat". */
  imageKey: string;
  /** Overrides the manifest alt (used for exercises: alt = exercise name). */
  alt?: string;
  /** Size tier: 'sm' for half-width (two-up) cards, 'md' for full-width cards. */
  size?: CardThumbSize;
  className?: string;
}

// The thumb scales with its card so it reads as ~a quarter of the card width and
// NEVER forces the card wider: small (two-up) cards use 'sm', full-width use 'md'.
// 'fill' fills a parent-controlled box (used where the CARD sizes the square —
// e.g. the workout card's ~quarter-width, height-defining thumbnail).
// Square + object-cover + rounded-2xl are constant across sizes.
const SIZE: Record<CardThumbSize, { cls: string; px?: number }> = {
  sm: { cls: 'h-14 w-14 sm:h-16 sm:w-16', px: 56 }, // 56 → 64
  md: { cls: 'h-[88px] w-[88px] sm:h-24 sm:w-24', px: 88 }, // 88 → 96
  fill: { cls: 'h-full w-full' }, // parent sets the box (e.g. aspect-square w-1/4)
};

/**
 * The single reusable card image. Falls back to the shared placeholder when a
 * key's file is missing — identical geometry, never a broken-image glyph. Place
 * inside a padded Card; the card padding is the inset and a flex `gap` the
 * separation from text.
 */
export const CardThumb: React.FC<CardThumbProps> = ({ imageKey, alt, size = 'md', className = '' }) => {
  const img = getCardImage(imageKey, alt);
  const s = SIZE[size];
  return (
    <img
      src={img.src}
      alt={img.alt}
      loading="lazy"
      width={s.px}
      height={s.px}
      className={`${s.cls} shrink-0 rounded-2xl object-cover ${className}`}
    />
  );
};
