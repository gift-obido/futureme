import React from 'react';

/** The FutureMe wordmark lockup — "Future" + "Me" in the power/taupe accent, both 600. */
export const Wordmark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`font-display text-2xl font-bold tracking-tight text-text ${className}`}>
    Future<span className="text-accent">Me</span>
  </span>
);
