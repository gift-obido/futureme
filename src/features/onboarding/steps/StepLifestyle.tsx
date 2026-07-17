import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { RadioGroup, type RadioOption } from '../RadioGroup';
import type { OnboardingFormValues } from '../schema';
import type { ActivityLevel, Location } from '../../../lib/domain/types';

const ACTIVITY: RadioOption<ActivityLevel>[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Desk job, little walking' },
  { value: 'light', label: 'Lightly active', desc: '1–3 light walks / week' },
  { value: 'moderate', label: 'Moderately active', desc: 'Active job or 3–5 workouts' },
  { value: 'active', label: 'Highly active', desc: 'Hard exercise 6–7 days / week' },
  { value: 'very_active', label: 'Very active', desc: 'Physical labour & athletics' },
];

const LOCATIONS: RadioOption<Location>[] = [
  { value: 'gym', label: 'Gym' },
  { value: 'home', label: 'Home' },
  { value: 'both', label: 'Both' },
];

const DAYS: RadioOption<number>[] = [2, 3, 4, 5, 6].map((d) => ({ value: d, label: String(d) }));

export const StepLifestyle: React.FC = () => {
  const { control } = useFormContext<OnboardingFormValues>();

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">We match training volume to your week.</p>

      <div>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Daily activity level</span>
        <Controller
          name="activity"
          control={control}
          render={({ field }) => (
            <RadioGroup label="Daily activity level" columns={1} variant="card" value={field.value} onChange={field.onChange} options={ACTIVITY} />
          )}
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Workout location</span>
        <Controller
          name="location"
          control={control}
          render={({ field }) => (
            <RadioGroup label="Workout location" columns={3} variant="chip" value={field.value} onChange={field.onChange} options={LOCATIONS} />
          )}
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Workout days per week</span>
        <Controller
          name="daysPerWeek"
          control={control}
          render={({ field }) => (
            <RadioGroup label="Workout days per week" columns={5} variant="chip" value={field.value} onChange={field.onChange} options={DAYS} />
          )}
        />
      </div>
    </div>
  );
};
