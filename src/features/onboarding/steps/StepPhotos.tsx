import React from 'react';
import { Camera, Loader2, X, ShieldCheck } from 'lucide-react';

export type PhotoPos = 'front' | 'side' | 'back';
const POSITIONS: PhotoPos[] = ['front', 'side', 'back'];

interface StepPhotosProps {
  thumbs: Partial<Record<PhotoPos, string>>;
  saving: Partial<Record<PhotoPos, boolean>>;
  error?: string | null;
  onSelect: (pos: PhotoPos, file: File) => void;
  onRemove: (pos: PhotoPos) => void;
}

export const StepPhotos: React.FC<StepPhotosProps> = ({ thumbs, saving, error, onSelect, onRemove }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Optional, but they make your plan sharper. You can add these later too.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {POSITIONS.map((pos) => {
          const thumb = thumbs[pos];
          const isSaving = saving[pos];
          return (
            <div key={pos} className="flex flex-col items-center">
              <span className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">{pos} view</span>

              <label className="relative flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-hairline bg-accent/5 transition-colors hover:border-accent focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
                {thumb ? (
                  <img src={thumb} alt={`Your ${pos} baseline photo`} className="h-full w-full object-cover" />
                ) : isSaving ? (
                  <Loader2 className="h-6 w-6 animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <>
                    <Camera className="mb-1 h-6 w-6 text-muted" aria-hidden="true" />
                    <span className="text-[9px] font-semibold uppercase text-muted">Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  aria-label={`Upload ${pos} photo`}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onSelect(pos, file);
                    e.target.value = '';
                  }}
                />
              </label>

              {thumb && (
                <button
                  type="button"
                  onClick={() => onRemove(pos)}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-text"
                >
                  <X className="h-3 w-3" aria-hidden="true" /> Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-red-500">
          {error}
        </p>
      )}

      <div className="flex items-start gap-2 rounded-2xl bg-info p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed text-text">
          Your photos are encrypted and only used to build your personalized plan. Nothing leaves this device.
        </p>
      </div>
    </div>
  );
};
