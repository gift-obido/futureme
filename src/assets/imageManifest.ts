import placeholder from './images/placeholder.jpg';

/** kebab-case slug — the filename for a key must match this exactly. */
export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Vite only bundles imported assets, so eagerly glob every correctly-named file
// in the image folders. Drop a matching file in and it's auto-picked up — no code
// edits. (`*/*` excludes the root-level placeholder.jpg.)
const files = import.meta.glob('./images/*/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const fileFor = (key: string): string | undefined => {
  for (const [path, url] of Object.entries(files)) {
    const rel = path.replace(/^\.\/images\//, '').replace(/\.(jpe?g|png|webp)$/i, '');
    if (rel === key) return url;
  }
  return undefined;
};

export interface CardImage {
  /** Resolved asset URL — the real file if present, else the shared placeholder. */
  src: string;
  alt: string;
  isPlaceholder: boolean;
}

// Fixed keys (Today + Nutrition) → required alt text.
const STATIC_ALTS: Record<string, string> = {
  'today/streak': 'Daily consistency streak',
  'today/calories': 'Calorie balance',
  'today/protein': 'Protein-rich foods',
  'nutrition/protein': 'Protein-rich foods',
  'nutrition/carbs': 'Carbohydrate foods',
  'nutrition/fat': 'Healthy fats',
  'nutrition/water': 'A glass of water',
};

/**
 * Every exercise name the current plan can produce (all goal splits × gym/home
 * variations + secondary-goal accessories). Keep in sync with MvpMockAIClient.
 * The image key for an exercise is `exercises/${slugify(name)}`.
 */
export const EXERCISE_NAMES: string[] = [
  // Full-body conditioning (lose_fat / improve_fitness)
  'Barbell Back Squat', 'Bodyweight Prisoner Squat', 'Dumbbell Bench Press', 'Decline Push-ups',
  'Seated Cable Row', 'Dumbbell Row / Band Row', 'Standing DB Overhead Press', 'Pike Push-ups',
  'Weighted Cable Crunch', 'Plank with Shoulder Taps',
  // Upper body (build_muscle / get_stronger)
  'Barbell Bench Press', 'Weighted Push-ups (Pack)', 'Pull-ups or Lat Pulldown',
  'Resistance Band Door Lat Pulls', 'Seated Dumbbell Shoulder Press', 'Pike Press / Band Lateral Raise',
  'T-Bar Chest Row', 'Dumbbell Single-arm Row', 'Barbell Bicep Curls', 'Band Hammer Curls',
  // Lower body (build_muscle / get_stronger)
  'Goblet Squat (Heavy Bag)', 'Barbell Romanian Deadlift', 'Single-Leg RDL (Dumbbell)',
  'Leg Press or Dumbbell Lunges', 'Walking Lunges', 'Standing Calf Raise Machine',
  'Single-leg Bodyweight Calf Raise', 'Hanging Knee Raise', 'Lying Leg Raises',
  // Recomposition / default full body
  'Leg Press / Goblet Squat', 'Goblet Squats', 'Incline Dumbbell Bench Press', 'Push-ups',
  'Chest-Supported Row', 'Resistance Band Pull-aparts', 'Dumbbell Romanian Deadlift',
  'Single-leg Glute Bridges', 'Ab Wheel Rollouts', 'Deadbugs',
  // Secondary-goal accessories
  'Rower Intervals', 'Burpees', 'Cable Fly', 'Slow Tempo Push-ups', 'Tempo Goblet Squat',
  'Tempo Split Squat', 'Farmer Carry', 'Suitcase Carry (bag)', 'Assault Bike Intervals',
  'Mountain Climbers',
];

const buildManifest = (): Record<string, CardImage> => {
  const m: Record<string, CardImage> = {};
  const add = (key: string, alt: string) => {
    const url = fileFor(key);
    m[key] = { src: url ?? placeholder, alt, isPlaceholder: !url };
  };
  for (const [key, alt] of Object.entries(STATIC_ALTS)) add(key, alt);
  for (const name of EXERCISE_NAMES) add(`exercises/${slugify(name)}`, name);
  return m;
};

export const imageManifest: Record<string, CardImage> = buildManifest();

// Dev aid: list every key still on the shared placeholder so files can be added by name.
const onPlaceholder = Object.keys(imageManifest).filter((k) => imageManifest[k].isPlaceholder);
if (onPlaceholder.length) {
  console.warn(
    `[images] ${onPlaceholder.length} card image(s) still using placeholder — add JPEGs named:\n` +
      onPlaceholder.map((k) => `  src/assets/images/${k}.jpg`).join('\n'),
  );
}

/**
 * Resolve a manifest key to its image. `altOverride` wins (used for exercises so
 * alt is always the exercise name); unknown keys fall back to the placeholder.
 */
export const getCardImage = (key: string, altOverride?: string): CardImage => {
  const entry = imageManifest[key];
  if (entry) return altOverride ? { ...entry, alt: altOverride } : entry;
  return { src: placeholder, alt: altOverride ?? 'FutureMe', isPlaceholder: true };
};
