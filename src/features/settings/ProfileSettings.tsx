import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Sparkles, Loader2 } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { useAI } from '../../lib/ai/AIProvider';
import { generateBundle } from '../../lib/ai/generateBundle';
import { Button, Card, Sheet } from '../../components/ui';
import { onboardingSchema, STEP_FIELDS, cmToFtIn, kgToLb, type OnboardingFormValues } from '../onboarding/schema';
import { StepBasics } from '../onboarding/steps/StepBasics';
import { StepGoal } from '../onboarding/steps/StepGoal';
import { StepLifestyle } from '../onboarding/steps/StepLifestyle';
import { StepNutrition } from '../onboarding/steps/StepNutrition';
import type { Goal, OnboardingProfile } from '../../lib/domain/types';

type Section = 'basic' | 'goals' | 'lifestyle' | 'nutrition';

const SECTIONS: { id: Section; title: string; fields: (keyof OnboardingFormValues)[]; Comp: React.FC }[] = [
  { id: 'basic', title: 'Basic information', fields: STEP_FIELDS[1], Comp: StepBasics },
  { id: 'goals', title: 'Your goals', fields: STEP_FIELDS[2], Comp: StepGoal },
  { id: 'lifestyle', title: 'Lifestyle', fields: STEP_FIELDS[3], Comp: StepLifestyle },
  { id: 'nutrition', title: 'Nutrition & health', fields: STEP_FIELDS[4], Comp: StepNutrition },
];

const GOAL_LABEL: Record<Goal, string> = {
  lose_fat: 'Lose Fat',
  build_muscle: 'Build Muscle',
  recomposition: 'Recomposition',
  get_stronger: 'Get Stronger',
  improve_fitness: 'Improve Fitness',
};
const ACTIVITY_LABEL: Record<string, string> = {
  sedentary: 'Sedentary',
  light: 'Lightly active',
  moderate: 'Moderately active',
  active: 'Highly active',
  very_active: 'Very active',
};
const LOCATION_LABEL: Record<string, string> = { gym: 'Gym', home: 'Home', both: 'Gym & home' };
const DIET_LABEL: Record<string, string> = {
  none: 'Standard',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  keto: 'Keto',
  halal: 'Halal',
  pescatarian: 'Pescatarian',
};
const SEX_LABEL: Record<string, string> = { male: 'Male', female: 'Female' };

const dispHeight = (o: OnboardingProfile) => {
  if (o.profile.units === 'imperial') {
    const { ft, in: inch } = cmToFtIn(o.profile.heightCm);
    return `${ft}′${inch}″`;
  }
  return `${o.profile.heightCm} cm`;
};
const dispWeight = (o: OnboardingProfile) =>
  o.profile.units === 'imperial' ? `${kgToLb(o.profile.weightKg)} lb` : `${o.profile.weightKg} kg`;

const summarize = (id: Section, o: OnboardingProfile): string => {
  switch (id) {
    case 'basic':
      return `${o.profile.age} · ${SEX_LABEL[o.profile.sex]} · ${dispHeight(o)} · ${dispWeight(o)}`;
    case 'goals':
      return o.goal.goals.map((g, i) => (i === 0 ? `${GOAL_LABEL[g]} (primary)` : GOAL_LABEL[g])).join(' · ');
    case 'lifestyle':
      return `${ACTIVITY_LABEL[o.lifestyle.activity]} · ${LOCATION_LABEL[o.lifestyle.location]} · ${o.lifestyle.daysPerWeek} days/wk`;
    case 'nutrition': {
      const bits = [DIET_LABEL[o.health.dietaryPreference] ?? o.health.dietaryPreference];
      if (o.health.allergies?.length) bits.push(`allergies: ${o.health.allergies.join(', ')}`);
      if (o.health.injuries?.length) bits.push(o.health.injuries.join(', '));
      return bits.join(' · ');
    }
  }
};

const onboardingToForm = (o: OnboardingProfile): OnboardingFormValues => ({
  units: o.profile.units,
  name: o.profile.name,
  age: o.profile.age,
  sex: o.profile.sex,
  heightCm: o.profile.heightCm,
  weightKg: o.profile.weightKg,
  goals: o.goal.goals,
  hasTargetDate: o.goal.targetDate != null,
  targetDate: o.goal.targetDate ?? '',
  activity: o.lifestyle.activity,
  location: o.lifestyle.location,
  daysPerWeek: o.lifestyle.daysPerWeek,
  dietaryPreference: o.health.dietaryPreference,
  allergies: o.health.allergies ?? [],
  injuries: (o.health.injuries ?? []).join(', '),
});

const formToOnboarding = (v: OnboardingFormValues, base: OnboardingProfile): OnboardingProfile => ({
  profile: {
    id: base.profile.id,
    name: v.name,
    age: v.age,
    sex: v.sex,
    heightCm: v.heightCm,
    weightKg: v.weightKg,
    units: v.units,
  },
  goal: { goals: v.goals, targetDate: v.hasTargetDate && v.targetDate ? v.targetDate : null },
  lifestyle: { activity: v.activity, location: v.location, daysPerWeek: v.daysPerWeek },
  health: {
    dietaryPreference: v.dietaryPreference,
    allergies: v.allergies ?? [],
    injuries: v.injuries ? v.injuries.split(',').map((s) => s.trim()).filter(Boolean) : [],
  },
  photos: base.photos,
});

/** Fields that require re-running the plan (per GLOBAL CONVENTIONS + targetDate → timeline). */
const planAffectingChanged = (a: OnboardingProfile, b: OnboardingProfile): boolean =>
  a.profile.age !== b.profile.age ||
  a.profile.sex !== b.profile.sex ||
  a.profile.heightCm !== b.profile.heightCm ||
  a.profile.weightKg !== b.profile.weightKg ||
  a.lifestyle.activity !== b.lifestyle.activity ||
  a.lifestyle.daysPerWeek !== b.lifestyle.daysPerWeek ||
  a.lifestyle.location !== b.lifestyle.location ||
  a.goal.targetDate !== b.goal.targetDate ||
  JSON.stringify(a.goal.goals) !== JSON.stringify(b.goal.goals);

export const ProfileSettings: React.FC = () => {
  const onboarding = useAppStore((s) => s.onboarding);
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const setPlanBundle = useAppStore((s) => s.setPlanBundle);
  const ai = useAI();

  const methods = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onTouched',
    defaultValues: onboarding ? onboardingToForm(onboarding) : undefined,
  });

  const [editing, setEditing] = useState<Section | null>(null);
  const [mode, setMode] = useState<'edit' | 'confirm'>('edit');
  const [pending, setPending] = useState<OnboardingProfile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (!onboarding) return null;

  const active = SECTIONS.find((s) => s.id === editing);

  const openSection = (id: Section) => {
    methods.reset(onboardingToForm(onboarding));
    setSaveError('');
    setMode('edit');
    setEditing(id);
  };
  const close = () => {
    if (generating) return;
    setEditing(null);
    setMode('edit');
    setPending(null);
  };

  const onSave = async () => {
    if (!active) return;
    const valid = await methods.trigger(active.fields); // guard invalid form
    if (!valid) return;
    const next = formToOnboarding(methods.getValues(), onboarding);
    if (planAffectingChanged(onboarding, next)) {
      setPending(next);
      setMode('confirm');
    } else {
      setOnboarding(next); // non-plan change (e.g. name / units / diet) — no regen
      close();
    }
  };

  const onConfirm = async () => {
    if (!pending) return;
    setGenerating(true);
    setSaveError('');
    try {
      const bundle = await generateBundle(ai, pending);
      setOnboarding(pending);
      setPlanBundle(bundle.analysis, bundle.plan, bundle.workout, bundle.vision);
      setGenerating(false);
      setEditing(null);
      setMode('edit');
      setPending(null);
    } catch (e) {
      console.error(e);
      setGenerating(false);
      setSaveError('Could not update your plan. Please try again.');
    }
  };

  return (
    <FormProvider {...methods}>
      <section aria-label="Profile and plan">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Profile &amp; plan</h2>
        <div className="space-y-3">
          {SECTIONS.map(({ id, title }) => (
            <Card key={id} padding="md">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">{title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{summarize(id, onboarding)}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => openSection(id)}
                  aria-label={`Edit ${title.toLowerCase()}`}
                  leftIcon={<Pencil className="h-4 w-4" />}
                >
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Sheet
        open={editing !== null}
        onClose={close}
        title={mode === 'confirm' ? 'Update your plan?' : (active?.title ?? '')}
        footer={
          mode === 'edit' ? (
            <div className="flex gap-2">
              <Button variant="ghost" fullWidth onClick={close}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth onClick={onSave}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" fullWidth onClick={() => setMode('edit')} disabled={generating}>
                Back
              </Button>
              <Button variant="highlight" fullWidth onClick={onConfirm} disabled={generating}>
                {generating ? 'Updating…' : 'Update plan'}
              </Button>
            </div>
          )
        }
      >
        {mode === 'edit' && active ? (
          <active.Comp />
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-sm text-text">
                These changes affect your plan. We'll regenerate your workouts, macros, and FutureMe vision to
                match — this keeps everything consistent.
              </p>
            </div>
            <div className="sr-only" role="status" aria-live="polite">
              {generating ? 'Updating your plan…' : ''}
            </div>
            {generating && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Updating your
                plan…
              </p>
            )}
            {saveError && (
              <p role="alert" className="text-sm font-medium text-red-500">
                {saveError}
              </p>
            )}
          </div>
        )}
      </Sheet>
    </FormProvider>
  );
};
