import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Camera, X, ImageOff } from 'lucide-react';
import { useAppStore, todayKey } from '../../lib/store';
import { getPhotoUrl, revokePhotoUrl, savePhoto, PhotoStorageError } from '../../lib/storage';
import { Button, Card, ProgressRing, Sheet, Field } from '../../components/ui';
import { WeightChart, type WeightPoint } from './WeightChart';
import type { Goal, PhotoRef } from '../../lib/domain/types';

const MS_WEEK = 7 * 24 * 3600 * 1000;
const MS_DAY = 24 * 3600 * 1000;

const kgToLb = (kg: number) => kg / 0.45359237;
const lbToKg = (lb: number) => lb * 0.45359237;
const cmToIn = (cm: number) => cm / 2.54;
const inToCm = (i: number) => i * 2.54;

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Expected end weight from goal + timeline — used for the "vs target" trend. */
function targetWeightKg(goal: Goal, startKg: number, weeks: number): number {
  switch (goal) {
    case 'lose_fat':
      return startKg * (1 - 0.007 * weeks);
    case 'build_muscle':
      return startKg * (1 + 0.0025 * weeks);
    case 'get_stronger':
      return startKg * (1 + 0.002 * weeks);
    default:
      return startKg; // recomposition / improve_fitness
  }
}

const MEASURES = [
  { key: 'waist', label: 'Waist' },
  { key: 'chest', label: 'Chest' },
  { key: 'arms', label: 'Arms' },
] as const;

const Metric: React.FC<{ label: string; value: React.ReactNode; unit?: string; sub?: string }> = ({ label, value, unit, sub }) => (
  <Card padding="sm" className="min-w-0 text-center">
    <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
    <p className="stat mt-1 text-lg font-bold leading-none text-text">
      {value}
      {unit && <span className="text-xs font-medium text-muted"> {unit}</span>}
    </p>
    {sub && <p className="stat mt-1 break-words text-[10px] leading-tight text-muted">{sub}</p>}
  </Card>
);

export const ProgressTracker: React.FC = () => {
  const navigate = useNavigate();
  const onboarding = useAppStore((s) => s.onboarding);
  const plan = useAppStore((s) => s.plan);
  const progress = useAppStore((s) => s.progress);
  const logs = useAppStore((s) => s.logs);
  const addProgress = useAppStore((s) => s.addProgress);

  // Photo gallery (IndexedDB)
  const [gallery, setGallery] = useState<{ key: string; url: string; label: string }[]>([]);
  useEffect(() => {
    let active = true;
    const created: string[] = [];
    (async () => {
      const items: { ref: PhotoRef; label: string }[] = [];
      if (onboarding?.photos?.front) items.push({ ref: onboarding.photos.front, label: 'Start' });
      progress.forEach((p) => {
        if (p.photo) items.push({ ref: p.photo, label: fmtDate(p.date) });
      });
      const out: { key: string; url: string; label: string }[] = [];
      for (const it of items) {
        const url = await getPhotoUrl(it.ref);
        if (url) {
          created.push(url);
          out.push({ key: it.ref.key, url, label: it.label });
        }
      }
      if (active) setGallery(out);
      else out.forEach((o) => revokePhotoUrl(o.url));
    })();
    return () => {
      active = false;
      created.forEach(revokePhotoUrl);
    };
  }, [progress, onboarding]);

  // Add-entry sheet
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [measures, setMeasures] = useState<Record<string, string>>({});
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!onboarding || !plan) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-sm text-muted">Complete onboarding to track progress.</p>
        <Button variant="primary" onClick={() => navigate('/onboarding')}>Build my plan</Button>
      </div>
    );
  }

  const units = onboarding.profile.units;
  const unit = units === 'imperial' ? 'lb' : 'kg';
  const toDisplay = (kg: number) => (units === 'imperial' ? Math.round(kgToLb(kg)) : Math.round(kg * 10) / 10);
  const measureUnit = units === 'imperial' ? 'in' : 'cm';
  const toMeasureDisplay = (cm: number) => (units === 'imperial' ? Math.round(cmToIn(cm) * 10) / 10 : cm);

  const startKg = onboarding.profile.weightKg;
  const createdAt = new Date(plan.createdAt);
  const now = Date.now();
  const weeksElapsed = Math.max(0, (now - createdAt.getTime()) / MS_WEEK);
  const timeElapsed = plan.timelineWeeks > 0 ? Math.min(1, weeksElapsed / plan.timelineWeeks) : 0;
  const elapsedDays = Math.max(1, Math.floor((now - createdAt.getTime()) / MS_DAY) + 1);
  const weekNo = Math.min(plan.timelineWeeks, Math.floor(weeksElapsed) + 1);

  const hits = logs.filter((l) => l.adherence === 'hit').length;
  const partials = logs.filter((l) => l.adherence === 'partial').length;
  const adherenceScore = Math.min(1, (hits + 0.5 * partials) / elapsedDays);
  const adherencePct = Math.round(adherenceScore * 100);

  const workoutsDone = logs.filter((l) => l.workoutDone).length;
  const expectedWorkouts = Math.max(1, Math.round(plan.workoutFrequency * Math.max(1, Math.ceil(weeksElapsed))));
  const consistencyPct = Math.min(100, Math.round((workoutsDone / expectedWorkouts) * 100));

  const latestKg = progress.length ? progress[progress.length - 1].weightKg : startKg;
  const tgtKg = targetWeightKg(onboarding.goal.goals[0], startKg, plan.timelineWeeks);
  const weightTrend =
    Math.abs(startKg - tgtKg) >= 0.5 ? Math.max(0, Math.min(1, (startKg - latestKg) / (startKg - tgtKg))) : null;

  const transformation = Math.round(
    100 *
      (weightTrend != null
        ? 0.35 * timeElapsed + 0.35 * adherenceScore + 0.3 * weightTrend
        : 0.5 * timeElapsed + 0.5 * adherenceScore),
  );

  // Weight chart points (start + entries), de-duped by date
  const byDate = new Map<string, number>();
  byDate.set(plan.createdAt.slice(0, 10), startKg);
  progress.forEach((p) => byDate.set(p.date, p.weightKg));
  const points: WeightPoint[] = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, kg]) => ({ date, label: fmtDate(date), weight: toDisplay(kg) }));

  const deltaDisplay = Math.round((toDisplay(latestKg) - toDisplay(startKg)) * 10) / 10;
  const deltaLabel =
    deltaDisplay === 0 ? 'no change yet' : `${deltaDisplay > 0 ? '+' : ''}${deltaDisplay} ${unit} vs start`;

  const latestMeasure = [...progress].reverse().find((p) => p.measurements && Object.keys(p.measurements).length)?.measurements;

  const resetSheet = () => {
    if (preview) URL.revokeObjectURL(preview);
    setWeight('');
    setMeasures({});
    setPhotoBlob(null);
    setPreview(null);
    setError('');
    setSaving(false);
  };
  const closeSheet = () => {
    setOpen(false);
    resetSheet();
  };

  const handlePickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPhotoBlob(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const save = async () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      setError('Enter a valid weight.');
      return;
    }
    setSaving(true);
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

    const m: Record<string, number> = {};
    for (const { key } of MEASURES) {
      const v = parseFloat(measures[key] ?? '');
      if (v > 0) m[key] = units === 'imperial' ? Math.round(inToCm(v) * 10) / 10 : v;
    }

    addProgress({
      date: todayKey(),
      weightKg,
      photo,
      measurements: Object.keys(m).length ? m : undefined,
    });
    closeSheet();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Progress</h1>
          <p className="mt-1 text-sm text-muted">Consistency compounds — here's how it's adding up.</p>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Add
        </Button>
      </header>

      {/* Transformation progress */}
      <Card padding="lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Transformation progress</p>
            <p className="stat mt-1 text-sm font-semibold text-text">
              Week {weekNo} of {plan.timelineWeeks}
            </p>
            <p className="mt-2 max-w-[190px] text-xs leading-relaxed text-muted">
              Blends time elapsed, your adherence, and weight trend vs. target.
            </p>
          </div>
          <ProgressRing value={transformation} label="Transformation progress" size={104}>
            <div className="text-center">
              <span className="stat block text-2xl font-bold text-text">{transformation}%</span>
            </div>
          </ProgressRing>
        </div>
      </Card>

      {/* Derived summaries */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Workouts" value={workoutsDone} sub={`${consistencyPct}% of plan`} />
        <Metric label="Adherence" value={`${adherencePct}%`} sub={`${hits} hit · ${partials} part`} />
        <Metric label="Weight" value={toDisplay(latestKg)} unit={unit} sub={deltaLabel} />
      </div>

      {/* Weight chart */}
      <Card padding="lg">
        {points.length >= 2 ? (
          <WeightChart points={points} unit={unit} target={toDisplay(tgtKg)} />
        ) : (
          <div className="py-8 text-center">
            <h2 className="font-display text-lg font-semibold text-text">Weight over time</h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
              Add a couple of weigh-ins to see your trend line take shape.
            </p>
          </div>
        )}
      </Card>

      {/* Progress photos */}
      <section aria-label="Progress photos">
        <h2 className="mb-3 font-display text-lg font-semibold text-text">Progress photos</h2>
        {gallery.length ? (
          <ul className="flex snap-x gap-3 overflow-x-auto pb-1">
            {gallery.map((g) => (
              <li key={g.key} className="w-28 shrink-0 snap-start">
                <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-hairline bg-surface">
                  <img src={g.url} alt={`Progress photo — ${g.label}`} className="h-full w-full object-cover" />
                </div>
                <p className="mt-1 text-center text-[11px] font-medium text-muted">{g.label}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Card padding="lg" className="flex flex-col items-center gap-2 text-center text-muted">
            <ImageOff className="h-6 w-6" aria-hidden="true" />
            <p className="text-sm">No photos yet — add one with a progress entry.</p>
          </Card>
        )}
      </section>

      {/* Latest measurements */}
      {latestMeasure && (
        <section aria-label="Body measurements">
          <h2 className="mb-3 font-display text-lg font-semibold text-text">Measurements</h2>
          <Card padding="md">
            <dl className="grid grid-cols-3 gap-3">
              {MEASURES.filter((m) => latestMeasure[m.key] != null).map((m) => (
                <div key={m.key} className="text-center">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{m.label}</dt>
                  <dd className="stat mt-1 text-lg font-bold text-text">
                    {toMeasureDisplay(latestMeasure[m.key])}
                    <span className="text-xs font-medium text-muted"> {measureUnit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>
      )}

      {/* Add-entry flow */}
      <Sheet
        open={open}
        onClose={closeSheet}
        title="Add progress entry"
        footer={
          <Button variant="highlight" fullWidth onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save entry'}
          </Button>
        }
      >
        <div className="space-y-4">
          <Field
            label={`Weight (${unit})`}
            type="number"
            inputMode="decimal"
            placeholder={units === 'imperial' ? 'e.g. 165' : 'e.g. 74.5'}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            error={error || undefined}
          />

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Photo (optional)</span>
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
                <span className="text-sm font-semibold">Add a photo</span>
                <input type="file" accept="image/*" aria-label="Add progress photo" className="sr-only" onChange={handlePickPhoto} />
              </label>
            )}
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              Measurements ({measureUnit}, optional)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {MEASURES.map((m) => (
                <input
                  key={m.key}
                  type="number"
                  inputMode="decimal"
                  aria-label={`${m.label} (${measureUnit})`}
                  placeholder={m.label}
                  value={measures[m.key] ?? ''}
                  onChange={(e) => setMeasures((prev) => ({ ...prev, [m.key]: e.target.value }))}
                  className="min-h-[44px] w-full rounded-xl border border-field bg-transparent px-3 py-2 text-center text-text transition-colors placeholder:text-muted hover:border-field-hover hover:bg-accent/[0.04]"
                />
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
