import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field } from '../../../components/ui';
import { RadioGroup } from '../RadioGroup';
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, type OnboardingFormValues } from '../schema';

const numOrNaN = (v: string) => (v === '' ? NaN : Number(v));

export const StepBasics: React.FC = () => {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<OnboardingFormValues>();
  const units = watch('units');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">We tailor your targets to your biology. Everything stays on this device.</p>

      <Controller
        name="units"
        control={control}
        render={({ field }) => (
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Preferred units</span>
            <RadioGroup
              label="Preferred units"
              columns={2}
              variant="chip"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'metric', label: 'Metric · cm/kg' },
                { value: 'imperial', label: 'Imperial · ft/lb' },
              ]}
            />
          </div>
        )}
      />

      <Field label="Your name" placeholder="e.g. Alex" autoComplete="name" {...register('name')} error={errors.name?.message} />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Age"
          type="number"
          inputMode="numeric"
          placeholder="e.g. 28"
          {...register('age', { valueAsNumber: true })}
          error={errors.age?.message}
        />
        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Sex</span>
          <Controller
            name="sex"
            control={control}
            render={({ field }) => (
              <RadioGroup
                label="Sex"
                columns={2}
                variant="chip"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Height — canonical cm, displayed per unit */}
        <Controller
          name="heightCm"
          control={control}
          render={({ field, fieldState }) => {
            if (units === 'metric') {
              return (
                <Field
                  label="Height (cm)"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 175"
                  name={field.name}
                  value={Number.isFinite(field.value) ? field.value : ''}
                  onChange={(e) => field.onChange(numOrNaN(e.target.value))}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              );
            }
            const cm = Number.isFinite(field.value) ? field.value : 0;
            const { ft, in: inch } = cmToFtIn(cm);
            const inputCls =
              'min-h-[44px] w-full rounded-xl border border-field bg-transparent px-3 py-3 text-center text-text transition-colors placeholder:text-muted hover:border-field-hover hover:bg-accent/[0.04]';
            return (
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Height (ft / in)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    aria-label="Height, feet"
                    type="number"
                    inputMode="numeric"
                    placeholder="ft"
                    value={ft || ''}
                    onChange={(e) => field.onChange(ftInToCm(Number(e.target.value) || 0, inch))}
                    onBlur={field.onBlur}
                    className={inputCls}
                  />
                  <input
                    aria-label="Height, inches"
                    type="number"
                    inputMode="numeric"
                    placeholder="in"
                    value={inch || ''}
                    onChange={(e) => field.onChange(ftInToCm(ft, Number(e.target.value) || 0))}
                    onBlur={field.onBlur}
                    className={inputCls}
                  />
                </div>
                {fieldState.error && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-500">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            );
          }}
        />

        {/* Weight — canonical kg, displayed per unit */}
        <Controller
          name="weightKg"
          control={control}
          render={({ field, fieldState }) => {
            const isMetric = units === 'metric';
            const display = Number.isFinite(field.value) ? (isMetric ? field.value : kgToLb(field.value)) : '';
            return (
              <Field
                label={isMetric ? 'Weight (kg)' : 'Weight (lb)'}
                type="number"
                inputMode="numeric"
                placeholder={isMetric ? 'e.g. 75' : 'e.g. 165'}
                name={field.name}
                value={display}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') return field.onChange(NaN);
                  const n = Number(raw);
                  field.onChange(isMetric ? n : lbToKg(n));
                }}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            );
          }}
        />
      </div>
    </div>
  );
};
