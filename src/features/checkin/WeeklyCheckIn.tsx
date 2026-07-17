import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Camera, X, Check, Loader2, ArrowRight } from 'lucide-react';
import { useAppStore, todayKey } from '../../lib/store';
import { useAI } from '../../lib/ai/AIProvider';
import { savePhoto, PhotoStorageError } from '../../lib/storage';
import { Button, Card, Field } from '../../components/ui';
import type { WeeklyCheckIn as CheckInType, PlanAdjustment, PhotoRef } from '../../lib/domain/types';

const lbToKg = (lb: number) => lb * 0.45359237;
type Rating = 1 | 2 | 3 | 4 | 5;

/** Accessible 1–5 rating as a radiogroup (roving tabindex + arrow keys). */
const RatingGroup: React.FC<{
  label: string;
  low: string;
  high: string;
  value: Rating;
  onChange: (v: Rating) => void;
}> = ({ label, low, high, value, onChange }) => {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusTo = (i: number) => {
    const j = ((i % 5) + 5) % 5;
    onChange((j + 1) as Rating);
    refs.current[j]?.focus();
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (['ArrowRight', 'ArrowUp'].includes(e.key)) { e.preventDefault(); focusTo(i + 1); }
    else if (['ArrowLeft', 'ArrowDown'].includes(e.key)) { e.preventDefault(); focusTo(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusTo(0); }
    else if (e.key === 'End') { e.preventDefault(); focusTo(4); }
  };
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n, i) => {
          const checked = value === n;
          return (
            <button
              key={n}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${label}: ${n} of 5`}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(n as Rating)}
              onKeyDown={(e) => onKey(e, i)}
              className={[
                'stat min-h-[44px] rounded-xl border text-base font-bold transition-colors',
                checked ? 'border-transparent bg-highlight text-strength' : 'border-field text-text hover:border-field-hover hover:bg-accent/5',
              ].join(' ')}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>1 · {low}</span>
        <span>5 · {high}</span>
      </div>
    </div>
  );
};

export const WeeklyCheckIn: React.FC = () => {
  const navigate = useNavigate();
  const ai = useAI();
  const plan = useAppStore((s) => s.plan);
  const onboarding = useAppStore((s) => s.onboarding);
  const addCheckIn = useAppStore((s) => s.addCheckIn);

  const [weight, setWeight] = useState('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [energy, setEnergy] = useState<Rating>(3);
  const [hunger, setHunger] = useState<Rating>(3);
  const [difficulty, setDifficulty] = useState<Rating>(3);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'form' | 'analyzing' | 'result'>('form');
  const [adjustment, setAdjustment] = useState<PlanAdjustment | null>(null);
  const [announce, setAnnounce] = useState('');

  const resultRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (phase === 'result') resultRef.current?.focus();
  }, [phase]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  if (!plan || !onboarding) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-sm text-muted">Complete onboarding before checking in.</p>
        <Button variant="primary" onClick={() => navigate('/onboarding')}>Build my plan</Button>
      </div>
    );
  }

  const units = onboarding.profile.units;
  const unit = units === 'imperial' ? 'lb' : 'kg';

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPhotoBlob(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const submit = async () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      setError('Enter your current weight to continue.');
      return;
    }
    setError('');
    setPhase('analyzing');
    setAnnounce('Analyzing your check-in and adjusting your plan…');

    const weightKg = units === 'imperial' ? Math.round(lbToKg(w) * 10) / 10 : w;

    let photo: PhotoRef | undefined;
    if (photoBlob) {
      try {
        photo = await savePhoto(photoBlob);
      } catch (err) {
        if (!(err instanceof PhotoStorageError)) throw err;
        console.warn(err.message);
      }
    }

    const checkIn: CheckInType = { weekOf: todayKey(), weightKg, photo, energy, hunger, difficulty };

    try {
      const result = await ai.adjustPlan(plan, checkIn);
      addCheckIn(checkIn, result);
      setAdjustment(result);
      setPhase('result');
      setAnnounce(`Plan updated. ${result.changes.length} ${result.changes.length === 1 ? 'change' : 'changes'} applied.`);
    } catch (e) {
      console.error(e);
      setPhase('form');
      setError('Something went wrong adjusting your plan. Please try again.');
    }
  };

  // Live regions shared across phases.
  const live = (
    <>
      <div className="sr-only" role="status" aria-live="polite">{announce}</div>
      <div className="sr-only" role="alert" aria-live="assertive">{error}</div>
    </>
  );

  if (phase === 'analyzing') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        {live}
        <Loader2 className="h-9 w-9 animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Adjusting your plan</h1>
          <p className="mt-1 text-sm text-muted">Reading your week and fine-tuning the numbers…</p>
        </div>
      </div>
    );
  }

  if (phase === 'result' && adjustment) {
    return (
      <div className="space-y-6">
        {live}
        <header className="text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-text">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" /> Plan updated
          </span>
          <h1 ref={resultRef} tabIndex={-1} className="font-display text-3xl font-bold text-text outline-none">
            What changed and why
          </h1>
        </header>

        <Card padding="lg">
          <ul className="space-y-3">
            {adjustment.changes.map((change, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-highlight text-strength">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-text">{change}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card padding="md" info>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Updated daily target</span>
            <span className="stat text-lg font-bold text-text">
              {adjustment.newPlan.nutrition.calories.toLocaleString()} <span className="text-sm font-medium text-muted">kcal</span>
            </span>
          </div>
        </Card>

        <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/today')} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Back to Today
        </Button>
      </div>
    );
  }

  // Form
  return (
    <div className="space-y-6">
      {live}
      <header>
        <h1 className="font-display text-2xl font-bold text-text">Weekly check-in</h1>
        <p className="mt-1 text-sm text-muted">A quick pulse so your plan can adapt to how you actually feel.</p>
      </header>

      <Card padding="lg" className="space-y-4">
        <Field
          label={`Current weight (${unit})`}
          type="number"
          inputMode="decimal"
          placeholder={units === 'imperial' ? 'e.g. 163' : 'e.g. 74.0'}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          error={error || undefined}
        />

        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Progress photo (optional)</span>
          {preview ? (
            <div className="flex items-center gap-3">
              <img src={preview} alt="Selected progress photo" className="h-20 w-16 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(preview);
                  setPreview(null);
                  setPhotoBlob(null);
                }}
                className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-text"
              >
                <X className="h-4 w-4" aria-hidden="true" /> Remove
              </button>
            </div>
          ) : (
            <label className="flex h-20 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-hairline text-muted hover:border-accent focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
              <Camera className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-semibold">Add this week's photo</span>
              <input type="file" accept="image/*" aria-label="Add progress photo" className="sr-only" onChange={pickPhoto} />
            </label>
          )}
        </div>
      </Card>

      <Card padding="lg" className="space-y-5">
        <RatingGroup label="Energy level" low="Drained" high="Energized" value={energy} onChange={setEnergy} />
        <RatingGroup label="Hunger" low="Satisfied" high="Ravenous" value={hunger} onChange={setHunger} />
        <RatingGroup label="Workout difficulty" low="Easy" high="Brutal" value={difficulty} onChange={setDifficulty} />
      </Card>

      <Button variant="primary" size="lg" fullWidth onClick={submit} leftIcon={<Sparkles className="h-4 w-4" />}>
        Analyze &amp; adjust plan
      </Button>
    </div>
  );
};
