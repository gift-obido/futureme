import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Apple, Dumbbell, Activity, Zap, Heart, Check } from 'lucide-react';
import { Field } from '../../../components/ui';
import { RadioGroup } from '../RadioGroup';
import type { OnboardingFormValues } from '../schema';
import type { Goal } from '../../../lib/domain/types';

const GOALS: { value: Goal; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'lose_fat', label: 'Lose Fat', desc: 'Calorie deficit & fat loss', icon: <Apple className="h-5 w-5" /> },
  { value: 'build_muscle', label: 'Build Muscle', desc: 'Hypertrophy & muscle mass', icon: <Dumbbell className="h-5 w-5" /> },
  { value: 'recomposition', label: 'Recomposition', desc: 'Lose fat & build muscle at once', icon: <Activity className="h-5 w-5" /> },
  { value: 'get_stronger', label: 'Get Stronger', desc: 'Heavy compounds, lower reps', icon: <Zap className="h-5 w-5" /> },
  { value: 'improve_fitness', label: 'Improve Fitness', desc: 'Endurance & heart-rate capacity', icon: <Heart className="h-5 w-5" /> },
];

const MAX = 3;
const todayISO = () => new Date().toISOString().slice(0, 10);

/** Multi-select (1–3). Tap order = priority; the first pick is the primary goal. */
const GoalMultiSelect: React.FC<{ value: Goal[]; onChange: (v: Goal[]) => void; error?: string }> = ({ value, onChange, error }) => {
  const atMax = value.length >= MAX;
  const toggle = (g: Goal) => {
    if (value.includes(g)) onChange(value.filter((x) => x !== g));
    else if (!atMax) onChange([...value, g]);
  };
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Your goals</span>
      <p className="mb-2 text-sm text-muted">
        Choose 1–3. Your first pick is the <span className="font-semibold text-text">primary</span> goal — it drives your plan.
      </p>
      <div role="group" aria-label="Goals, choose 1 to 3" className="grid grid-cols-1 gap-2" aria-describedby={error ? 'goals-error' : undefined}>
        {GOALS.map((g) => {
          const idx = value.indexOf(g.value);
          const selected = idx !== -1;
          const isPrimary = idx === 0;
          const disabled = !selected && atMax;
          return (
            <button
              key={g.value}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => toggle(g.value)}
              className={[
                'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                // default = STEPS-card hairline · hover = brighter border + lift · selected = strongest (accent border + fill + check).
                selected ? 'border-accent bg-accent/10 shadow-sm' : 'border-hairline hover:border-field hover:bg-accent/5',
                disabled ? 'opacity-40' : '',
              ].join(' ')}
            >
              <span
                className={['grid h-9 w-9 shrink-0 place-items-center rounded-lg', selected ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-muted'].join(' ')}
                aria-hidden="true"
              >
                {g.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-text">{g.label}</span>
                  {isPrimary && (
                    <span className="rounded-full bg-highlight px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-strength">
                      Primary
                    </span>
                  )}
                </span>
                <span className="block text-[11px] text-muted">{g.desc}</span>
              </span>
              {selected && <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {atMax && <p className="mt-1.5 text-xs text-muted">Pick up to 3 — deselect one to change.</p>}
      {error && (
        <p id="goals-error" role="alert" className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export const StepGoal: React.FC = () => {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<OnboardingFormValues>();
  const hasTargetDate = watch('hasTargetDate');

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">Your training split and macros align with your primary goal.</p>

      <Controller
        name="goals"
        control={control}
        render={({ field }) => (
          <GoalMultiSelect value={field.value ?? []} onChange={field.onChange} error={errors.goals?.message} />
        )}
      />

      <div>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Do you have a target date?</span>
        <RadioGroup
          label="Do you have a target date?"
          columns={2}
          variant="chip"
          cta
          value={hasTargetDate ? 'date' : 'ai'}
          onChange={(v) => {
            const wantsDate = v === 'date';
            setValue('hasTargetDate', wantsDate, { shouldValidate: true });
            if (!wantsDate) setValue('targetDate', '', { shouldValidate: true });
          }}
          options={[
            { value: 'ai', label: 'Let AI decide' },
            { value: 'date', label: 'Pick a date' },
          ]}
        />
      </div>

      {hasTargetDate && (
        <Field
          label="Target date"
          type="date"
          min={todayISO()}
          {...register('targetDate')}
          error={errors.targetDate?.message}
        />
      )}
    </div>
  );
};
