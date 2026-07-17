import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

import { Button, Card } from '../../components/ui';
import { Wordmark } from '../../components/Wordmark';
import { useAppStore } from '../../lib/store';
import { useAI } from '../../lib/ai/AIProvider';
import { savePhoto, deletePhoto, revokePhotoUrl, PhotoStorageError } from '../../lib/storage';
import type { OnboardingProfile, PhotoRef, UserProfile, WorkoutPlan } from '../../lib/domain/types';

import { onboardingSchema, STEP_FIELDS, STEP_TITLES, TOTAL_STEPS, type OnboardingFormValues } from './schema';
import { StepProgress } from './StepProgress';
import { LoadingSequence, type TickStatus } from './LoadingSequence';
import { StepBasics } from './steps/StepBasics';
import { StepGoal } from './steps/StepGoal';
import { StepLifestyle } from './steps/StepLifestyle';
import { StepNutrition } from './steps/StepNutrition';
import { StepPhotos, type PhotoPos } from './steps/StepPhotos';

const TICK_LABELS = [
  'Analyzing your body…',
  'Understanding your physique',
  'Calculating calorie needs',
  'Creating your workout plan',
  'Building your nutrition strategy',
  'Preparing your FutureMe',
];

const DEFAULTS: OnboardingFormValues = {
  units: 'metric',
  name: '',
  age: undefined as unknown as number,
  sex: 'male',
  heightCm: 175,
  weightKg: 75,
  goals: ['lose_fat'],
  hasTargetDate: false,
  targetDate: '',
  activity: 'moderate',
  location: 'both',
  daysPerWeek: 4,
  dietaryPreference: 'none',
  allergies: [],
  injuries: '',
};

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const ai = useAI();
  const reduce = useReducedMotion();
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const setPlanBundle = useAppStore((s) => s.setPlanBundle);

  const methods = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onTouched',
    defaultValues: DEFAULTS,
  });

  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<'form' | 'loading'>('form');
  const [announce, setAnnounce] = useState('');
  const [formError, setFormError] = useState('');

  // Photos are refs (IndexedDB), kept outside the zod form.
  const [photos, setPhotos] = useState<Partial<Record<PhotoPos, PhotoRef>>>({});
  const [thumbs, setThumbs] = useState<Partial<Record<PhotoPos, string>>>({});
  const [savingPhotos, setSavingPhotos] = useState<Partial<Record<PhotoPos, boolean>>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [tickStatuses, setTickStatuses] = useState<TickStatus[]>(TICK_LABELS.map(() => 'pending'));

  const headingRef = useRef<HTMLHeadingElement>(null);
  const loadingHeadingRef = useRef<HTMLHeadingElement>(null);
  const direction = useRef(1);

  const stepTitle = STEP_TITLES[step - 1];

  // Move focus to the heading on each step / phase change (SR reads the new context).
  useEffect(() => {
    if (phase === 'form') headingRef.current?.focus();
    else loadingHeadingRef.current?.focus();
  }, [step, phase]);

  // Revoke thumbnail object URLs on unmount.
  useEffect(() => {
    return () => Object.values(thumbs).forEach((u) => revokePhotoUrl(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Photos ----
  const onSelectPhoto = useCallback(
    async (pos: PhotoPos, file: File) => {
      setPhotoError(null);
      setSavingPhotos((s) => ({ ...s, [pos]: true }));
      try {
        const ref = await savePhoto(file);
        setPhotos((prev) => {
          const old = prev[pos];
          if (old) deletePhoto(old);
          return { ...prev, [pos]: ref };
        });
        setThumbs((prev) => {
          if (prev[pos]) revokePhotoUrl(prev[pos]);
          return { ...prev, [pos]: URL.createObjectURL(file) };
        });
      } catch (e) {
        setPhotoError(e instanceof PhotoStorageError ? e.message : 'Could not save that photo.');
      } finally {
        setSavingPhotos((s) => ({ ...s, [pos]: false }));
      }
    },
    [],
  );

  const onRemovePhoto = useCallback((pos: PhotoPos) => {
    setPhotos((prev) => {
      if (prev[pos]) deletePhoto(prev[pos]);
      const next = { ...prev };
      delete next[pos];
      return next;
    });
    setThumbs((prev) => {
      revokePhotoUrl(prev[pos]);
      const next = { ...prev };
      delete next[pos];
      return next;
    });
  }, []);

  // ---- Navigation ----
  const goTo = (next: number) => {
    direction.current = next > step ? 1 : -1;
    setFormError('');
    setStep(next);
    setAnnounce(`Step ${next} of ${TOTAL_STEPS}: ${STEP_TITLES[next - 1]}`);
  };

  const handleNext = async () => {
    const valid = await methods.trigger(STEP_FIELDS[step]);
    if (valid) {
      goTo(step + 1);
      return;
    }
    setFormError('Please fix the highlighted fields to continue.');
    const firstInvalid = STEP_FIELDS[step].find((f) => methods.formState.errors[f]);
    if (firstInvalid) {
      const el = document.querySelector<HTMLElement>(`[name="${firstInvalid}"]`);
      el?.focus();
    }
  };

  const handleBack = () => goTo(Math.max(1, step - 1));

  // ---- Loading pipeline (each tick resolves as its useAI() call completes) ----
  const setTick = (i: number, status: TickStatus) =>
    setTickStatuses((prev) => prev.map((s, idx) => (idx === i ? status : s)));
  const beat = () => new Promise((r) => setTimeout(r, reduce ? 0 : 400));

  const runPlan = async (values: OnboardingFormValues) => {
    setPhase('loading');
    setAnnounce('Building your plan.');

    const userProfile: UserProfile = {
      id: crypto.randomUUID(),
      name: values.name,
      age: values.age,
      sex: values.sex,
      heightCm: values.heightCm,
      weightKg: values.weightKg,
      units: values.units,
    };
    const photoSet =
      photos.front && photos.side && photos.back
        ? { front: photos.front, side: photos.side, back: photos.back }
        : undefined;

    const onboardingProfile: OnboardingProfile = {
      profile: userProfile,
      goal: { goals: values.goals, targetDate: values.hasTargetDate && values.targetDate ? values.targetDate : null },
      lifestyle: { activity: values.activity, location: values.location, daysPerWeek: values.daysPerWeek },
      health: {
        dietaryPreference: values.dietaryPreference,
        allergies: values.allergies ?? [],
        injuries: values.injuries ? values.injuries.split(',').map((s) => s.trim()).filter(Boolean) : [],
      },
      photos: photoSet,
    };

    try {
      setTick(0, 'active');
      const analysis = await ai.analyzePhotos(onboardingProfile.photos, userProfile);
      setTick(0, 'done');
      await beat();
      setTick(1, 'done');

      setTick(2, 'active');
      const plan = await ai.generatePlan(onboardingProfile, analysis);
      setTick(2, 'done');

      setTick(3, 'active');
      const genWorkout = (ai as unknown as {
        generateWorkoutSessions?: (p: OnboardingProfile) => WorkoutPlan;
      }).generateWorkoutSessions;
      const workout: WorkoutPlan = genWorkout ? genWorkout(onboardingProfile) : { sessions: [] };
      await beat();
      setTick(3, 'done');

      setTick(4, 'active');
      await beat();
      setTick(4, 'done');

      setTick(5, 'active');
      const vision = await ai.generateVision(onboardingProfile, analysis);
      setTick(5, 'done');
      await beat();

      setOnboarding(onboardingProfile);
      setPlanBundle(analysis, plan, workout, vision);
      navigate('/');
    } catch (e) {
      console.error(e);
      setPhase('form');
      setFormError('Something went wrong building your plan. Please try again.');
      setTickStatuses(TICK_LABELS.map(() => 'pending'));
    }
  };

  const stepVariants = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 24 * direction.current },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 * direction.current },
      };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg p-4 md:gap-9">
      {/* Wordmark sits ABOVE and OUTSIDE the card — a sibling on the page background,
          shared across every step so placement can't drift. */}
      <Wordmark />
      <Card elevated padding="lg" className="w-full max-w-md">
        {/* Live regions */}
        <div className="sr-only" role="status" aria-live="polite">{announce}</div>
        <div className="sr-only" role="alert" aria-live="assertive">{formError}</div>

        {phase === 'loading' ? (
          <LoadingSequence
            headingRef={loadingHeadingRef}
            ticks={TICK_LABELS.map((label, i) => ({ label, status: tickStatuses[i] }))}
          />
        ) : (
          <FormProvider {...methods}>
            <div className="mb-6">
              <StepProgress current={step} total={TOTAL_STEPS} title={stepTitle} />
            </div>

            <h1 ref={headingRef} tabIndex={-1} className="mb-3 font-display text-2xl font-bold text-text outline-none">
              {stepTitle}
            </h1>

            {formError && (
              <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500">{formError}</p>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={stepVariants.initial}
                animate={stepVariants.animate}
                exit={stepVariants.exit}
                transition={{ duration: reduce ? 0 : 0.22 }}
              >
                {step === 1 && <StepBasics />}
                {step === 2 && <StepGoal />}
                {step === 3 && <StepLifestyle />}
                {step === 4 && <StepNutrition />}
                {step === 5 && (
                  <StepPhotos
                    thumbs={thumbs}
                    saving={savingPhotos}
                    error={photoError}
                    onSelect={onSelectPhoto}
                    onRemove={onRemovePhoto}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-center gap-3 border-t border-hairline pt-5">
              {step > 1 && (
                <Button variant="ghost" onClick={handleBack} aria-label="Go back to the previous step" leftIcon={<ChevronLeft className="h-4 w-4" />}>
                  Back
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button variant="primary" fullWidth onClick={handleNext} rightIcon={<ChevronRight className="h-4 w-4" />}>
                  Continue
                </Button>
              ) : (
                <Button
                  variant="highlight"
                  fullWidth
                  onClick={methods.handleSubmit(runPlan)}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Create My Plan
                </Button>
              )}
            </div>
          </FormProvider>
        )}
      </Card>
    </main>
  );
};
