// FutureMe data model — canonical storage is METRIC; display converts.
// These are the persisted shapes, exactly per the PRD §9 data model.

export type Sex = 'male' | 'female';
export type Units = 'metric' | 'imperial';
export type Goal = 'lose_fat' | 'build_muscle' | 'recomposition' | 'get_stronger' | 'improve_fitness';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Location = 'gym' | 'home' | 'both';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  units: Units; // display preference only
}

export interface GoalConfig {
  /**
   * Ordered goals, length 1–3. The FIRST is the PRIMARY goal and drives all plan
   * formula outputs (calorie direction, macros, training split). Additional goals
   * are stored, surfaced in the summary, and lightly influence accessory choices.
   */
  goals: Goal[];
  targetDate: string | null; // ISO date, or null = "let AI decide"
}

export interface Lifestyle {
  activity: ActivityLevel;
  location: Location;
  daysPerWeek: number; // 2–6
}

export interface NutritionHealth {
  dietaryPreference: string; // e.g. 'none' | 'vegetarian' | 'vegan' | 'halal' | 'keto' | ...
  allergies?: string[];
  injuries?: string[];
}

export interface PhotoRef {
  key: string; // IndexedDB key, not the blob
  capturedAt: string;
}

export interface PhotoSet {
  front: PhotoRef;
  side: PhotoRef;
  back: PhotoRef;
}

export interface OnboardingProfile {
  profile: UserProfile;
  goal: GoalConfig;
  lifestyle: Lifestyle;
  health: NutritionHealth;
  photos?: PhotoSet;
}

export interface PhysiqueAnalysis {
  // qualitative only
  bodyType: 'lean' | 'average' | 'soft' | 'muscular';
  notes: string[];
}

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface Milestone {
  week: number;
  label: string;
}

export interface TransformationPlan {
  createdAt: string;
  timelineWeeks: number;
  summary: string;
  nutrition: MacroTargets & { waterMl: number };
  workoutFrequency: number; // sessions/week
  recovery: string[];
  milestones: Milestone[];
  dailyGoals: { stepGoal: number; sleepHours: number };
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  variation: 'gym' | 'home';
}

export interface WorkoutSession {
  id: string;
  day: string;
  title: string;
  estimatedMinutes: number;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  sessions: WorkoutSession[];
}

export interface VisionRender {
  // params for the stylized illustration
  bodyType: PhysiqueAnalysis['bodyType'];
  goal: Goal;
  palette: 'sun' | 'pool' | 'power';
  caption: string; // "illustrative projection" framing
}

export interface DailyLog {
  date: string; // ISO date (YYYY-MM-DD)
  workoutDone: boolean;
  caloriesConsumed: number;
  proteinConsumed: number;
  waterMl: number;
  steps: number;
  sleepHours: number;
  adherence: 'hit' | 'partial' | 'miss';
}

export interface ProgressEntry {
  date: string; // ISO date
  weightKg: number;
  measurements?: Record<string, number>;
  photo?: PhotoRef;
}

export interface WeeklyCheckIn {
  weekOf: string;
  weightKg: number;
  photo?: PhotoRef;
  energy: 1 | 2 | 3 | 4 | 5;
  hunger: 1 | 2 | 3 | 4 | 5;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface PlanAdjustment {
  changedAt: string;
  changes: string[];
  newPlan: TransformationPlan;
}

export interface AppState {
  schemaVersion: 2;
  onboarding?: OnboardingProfile;
  analysis?: PhysiqueAnalysis;
  plan?: TransformationPlan;
  workout?: WorkoutPlan;
  vision?: VisionRender;
  streak: number;
  logs: DailyLog[];
  progress: ProgressEntry[];
  checkIns: WeeklyCheckIn[];
  theme: 'light' | 'dark' | 'system';
}
