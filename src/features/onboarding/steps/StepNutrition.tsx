import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field } from '../../../components/ui';
import { RadioGroup, type RadioOption } from '../RadioGroup';
import { ChipsInput } from '../ChipsInput';
import type { OnboardingFormValues } from '../schema';

const DIETS: RadioOption<string>[] = [
  { value: 'none', label: 'Standard' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'halal', label: 'Halal' },
  { value: 'pescatarian', label: 'Pescatarian' },
];

export const StepNutrition: React.FC = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<OnboardingFormValues>();

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">We adapt around your diet and any limitations.</p>

      <div>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Dietary preference</span>
        <Controller
          name="dietaryPreference"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Dietary preference"
              columns={3}
              variant="chip"
              value={field.value}
              onChange={field.onChange}
              options={DIETS}
              error={errors.dietaryPreference?.message}
            />
          )}
        />
      </div>

      <Controller
        name="allergies"
        control={control}
        render={({ field }) => (
          <ChipsInput
            label="Food allergies (optional)"
            value={field.value ?? []}
            onChange={field.onChange}
            placeholder="e.g. Peanuts — press Enter"
            hint="Add each allergy and press Enter."
          />
        )}
      />

      <Field
        label="Injuries / limitations (optional)"
        placeholder="e.g. Lower-back pain, knee arthritis"
        {...register('injuries')}
        error={errors.injuries?.message}
      />
    </div>
  );
};
