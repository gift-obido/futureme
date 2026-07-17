import { z } from 'zod';

// Single source of truth for the wizard form. Height/weight are stored CANONICAL
// (cm / kg); the UI converts to imperial for display only.
export const onboardingSchema = z
  .object({
    units: z.enum(['metric', 'imperial']),
    name: z.string().min(2, 'Please enter your name (at least 2 characters).').max(40, 'That name is too long.'),
    age: z
      .number({ error: 'Enter your age.' })
      .int('Use a whole number.')
      .min(14, 'You must be at least 14.')
      .max(100, 'Enter a valid age.'),
    sex: z.enum(['male', 'female']),
    heightCm: z
      .number({ error: 'Enter your height.' })
      .min(90, 'Enter a valid height.')
      .max(250, 'Enter a valid height.'),
    weightKg: z
      .number({ error: 'Enter your weight.' })
      .min(30, 'Enter a valid weight.')
      .max(300, 'Enter a valid weight.'),

    // Ordered, 1–3. The first is the primary goal (drives the plan).
    goals: z
      .array(z.enum(['lose_fat', 'build_muscle', 'recomposition', 'get_stronger', 'improve_fitness']))
      .min(1, 'Pick at least one goal.')
      .max(3, 'Pick up to 3 goals.'),
    hasTargetDate: z.boolean(),
    targetDate: z.string().optional(),

    activity: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    location: z.enum(['gym', 'home', 'both']),
    daysPerWeek: z.number().min(2).max(6),

    dietaryPreference: z.string().min(1, 'Choose a dietary preference.'),
    allergies: z.array(z.string()).optional(),
    injuries: z.string().max(200, 'Please keep this brief.').optional(),
  })
  .refine((d) => !d.hasTargetDate || (typeof d.targetDate === 'string' && d.targetDate.length > 0), {
    message: 'Pick a target date or choose "Let AI decide".',
    path: ['targetDate'],
  });

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

/** Fields validated when leaving each step (1-indexed). Step 5 (photos) is optional. */
export const STEP_FIELDS: Record<number, (keyof OnboardingFormValues)[]> = {
  1: ['units', 'name', 'age', 'sex', 'heightCm', 'weightKg'],
  2: ['goals', 'hasTargetDate', 'targetDate'],
  3: ['activity', 'location', 'daysPerWeek'],
  4: ['dietaryPreference', 'allergies', 'injuries'],
  5: [],
};

export const STEP_TITLES = [
  'Basic information',
  'Your goal',
  'Lifestyle',
  'Nutrition & health',
  'Progress photos',
] as const;

export const TOTAL_STEPS = STEP_TITLES.length;

// ---------------------------------------------------------------------------
// Unit conversions (display only — canonical stays metric)
// ---------------------------------------------------------------------------

export const cmToFtIn = (cm: number): { ft: number; in: number } => {
  const totalIn = cm / 2.54;
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round(totalIn - ft * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return { ft, in: inch };
};

export const ftInToCm = (ft: number, inch: number): number => Math.round((ft * 12 + inch) * 2.54);

export const kgToLb = (kg: number): number => Math.round(kg / 0.45359237);

export const lbToKg = (lb: number): number => Math.round(lb * 0.45359237 * 10) / 10;
