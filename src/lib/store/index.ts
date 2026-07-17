import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppState,
  DailyLog,
  Goal,
  OnboardingProfile,
  PhysiqueAnalysis,
  PlanAdjustment,
  ProgressEntry,
  TransformationPlan,
  VisionRender,
  WeeklyCheckIn,
  WorkoutPlan,
} from '../domain/types';

const STORAGE_KEY = 'futureme:v1';
const SCHEMA_VERSION = 2 as const;

// ---------------------------------------------------------------------------
// Date + derivation helpers (pure)
// ---------------------------------------------------------------------------

/** UTC day key, matching how logs are stamped elsewhere. */
export const todayKey = (): string => new Date().toISOString().slice(0, 10);

const dayKey = (d: Date): string => d.toISOString().slice(0, 10);

const emptyLog = (date: string): DailyLog => ({
  date,
  workoutDone: false,
  caloriesConsumed: 0,
  proteinConsumed: 0,
  waterMl: 0,
  steps: 0,
  sleepHours: 0,
  adherence: 'miss',
});

/**
 * Suggested nutrition adherence from a day's log vs. the plan — a hint the UI
 * can offer. Adherence itself is a deliberate self-report (see setAdherence).
 */
export function suggestAdherence(log: DailyLog, plan?: TransformationPlan): DailyLog['adherence'] {
  if (!plan) return 'miss';
  const { calories, proteinG } = plan.nutrition;
  const calDiff = Math.abs(log.caloriesConsumed - calories);
  const proteinOk = log.proteinConsumed >= proteinG * 0.9;
  const proteinClose = log.proteinConsumed >= proteinG * 0.7;
  if (calDiff <= 150 && proteinOk) return 'hit';
  if (calDiff <= 350 || proteinClose) return 'partial';
  return 'miss';
}

/** A day "counts" toward the streak if the workout was done or nutrition landed. */
const isActiveDay = (log?: DailyLog): boolean =>
  !!log && (log.workoutDone || log.adherence === 'hit' || log.adherence === 'partial');

/**
 * Consecutive active days ending today (or yesterday if today isn't done yet).
 * Deterministic from logs, so recomputing is always safe / idempotent.
 */
function computeStreak(logs: DailyLog[]): number {
  const byDate = new Map(logs.map((l) => [l.date, l] as const));
  const cursor = new Date();
  if (!isActiveDay(byDate.get(dayKey(cursor)))) {
    // Today not completed yet — don't break a streak that ran through yesterday.
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  while (isActiveDay(byDate.get(dayKey(cursor)))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

const upsertLog = (logs: DailyLog[], next: DailyLog): DailyLog[] => {
  const i = logs.findIndex((l) => l.date === next.date);
  if (i < 0) return [...logs, next];
  const copy = logs.slice();
  copy[i] = next;
  return copy;
};

const byDateAsc = <T extends { date: string }>(a: T, b: T) =>
  new Date(a.date).getTime() - new Date(b.date).getTime();

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const DEFAULT_STATE: AppState = {
  schemaVersion: SCHEMA_VERSION,
  onboarding: undefined,
  analysis: undefined,
  plan: undefined,
  workout: undefined,
  vision: undefined,
  streak: 0,
  logs: [],
  progress: [],
  checkIns: [],
  theme: 'system',
};

export interface AppActions {
  setOnboarding: (onboarding: OnboardingProfile) => void;
  /** Store the full AI output bundle in one commit. */
  setPlanBundle: (
    analysis: PhysiqueAnalysis,
    plan: TransformationPlan,
    workout: WorkoutPlan,
    vision: VisionRender,
  ) => void;
  /** Upsert today's log with a partial patch (adherence is set separately). */
  logToday: (partial: Partial<Omit<DailyLog, 'date' | 'adherence'>>) => void;
  /** Self-report today's nutrition adherence (hit / partial / miss). */
  setAdherence: (adherence: DailyLog['adherence']) => void;
  addProgress: (entry: ProgressEntry) => void;
  /** Append a weekly check-in and apply its plan adjustment. */
  addCheckIn: (checkIn: WeeklyCheckIn, adjustment: PlanAdjustment) => void;
  /** Recompute the streak from logs (call after completing today's mission). */
  incrementStreak: () => void;
  /** Zero the streak if a qualifying day was missed. */
  resetStreakIfMissed: () => void;
  setTheme: (theme: AppState['theme']) => void;
  resetAll: () => void;
}

export type AppStore = AppState & AppActions;

// ---------------------------------------------------------------------------
// Migrations — map keyed by target schemaVersion. migrations[N] upgrades state
// from version N-1 to N. Declared BEFORE the store so `migrate` (which persist
// runs synchronously during create()) can reach them without a TDZ error.
// ---------------------------------------------------------------------------

type PersistedShape = Record<string, unknown>;

const migrations: Record<number, (state: PersistedShape) => PersistedShape> = {
  // v0 (or unversioned legacy) → v1: normalise/backfill required fields.
  1: (state) => ({
    ...state,
    schemaVersion: 1,
    streak: (state.streak as number) ?? 0,
    logs: (state.logs as AppState['logs']) ?? [],
    progress: (state.progress as AppState['progress']) ?? [],
    checkIns: (state.checkIns as AppState['checkIns']) ?? [],
    theme: (state.theme as AppState['theme']) ?? 'system',
  }),
  // v1 → v2: GoalConfig.goal (single) → goals[] (ordered, primary first).
  2: (state) => {
    const onboarding = state.onboarding as
      | { goal?: { goal?: Goal; goals?: Goal[]; targetDate?: string | null } }
      | undefined;
    let migratedOnboarding = onboarding;
    if (onboarding?.goal && onboarding.goal.goals == null && onboarding.goal.goal != null) {
      migratedOnboarding = {
        ...onboarding,
        goal: { goals: [onboarding.goal.goal], targetDate: onboarding.goal.targetDate ?? null },
      };
    }
    return { ...state, schemaVersion: 2, onboarding: migratedOnboarding };
  },
};

function runMigrations(persisted: unknown, fromVersion: number): AppStore {
  let state = (persisted ?? {}) as PersistedShape;
  for (let v = fromVersion + 1; v <= SCHEMA_VERSION; v++) {
    const step = migrations[v];
    if (step) state = step(state);
  }
  return state as unknown as AppStore;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setOnboarding: (onboarding) => set({ onboarding }),

      setPlanBundle: (analysis, plan, workout, vision) => set({ analysis, plan, workout, vision }),

      logToday: (partial) => {
        const { logs } = get();
        const date = todayKey();
        const base = logs.find((l) => l.date === date) ?? emptyLog(date);
        set({ logs: upsertLog(logs, { ...base, ...partial }) });
      },

      setAdherence: (adherence) => {
        const { logs } = get();
        const date = todayKey();
        const base = logs.find((l) => l.date === date) ?? emptyLog(date);
        set({ logs: upsertLog(logs, { ...base, adherence }) });
      },

      addProgress: (entry) => set({ progress: [...get().progress, entry].sort(byDateAsc) }),

      addCheckIn: (checkIn, adjustment) => {
        const state = get();
        const checkIns = [...state.checkIns, checkIn].sort(
          (a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime(),
        );
        // A check-in also produces a progress point (weight + optional photo).
        const progress = [
          ...state.progress,
          { date: checkIn.weekOf, weightKg: checkIn.weightKg, photo: checkIn.photo } as ProgressEntry,
        ].sort(byDateAsc);
        set({ checkIns, progress, plan: adjustment.newPlan });
      },

      incrementStreak: () => set({ streak: computeStreak(get().logs) }),

      resetStreakIfMissed: () => {
        const recomputed = computeStreak(get().logs);
        if (recomputed < get().streak) set({ streak: recomputed });
      },

      setTheme: (theme) => set({ theme }),

      resetAll: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Persist only data (never functions/blobs — photos live in IndexedDB as refs).
      partialize: (s): AppState => ({
        schemaVersion: s.schemaVersion,
        onboarding: s.onboarding,
        analysis: s.analysis,
        plan: s.plan,
        workout: s.workout,
        vision: s.vision,
        streak: s.streak,
        logs: s.logs,
        progress: s.progress,
        checkIns: s.checkIns,
        theme: s.theme,
      }),
      migrate: (persisted, version) => runMigrations(persisted, version),
    },
  ),
);

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export interface TodayMission {
  date: string;
  hasPlan: boolean;
  log: DailyLog;
  targets: {
    calories: number;
    proteinG: number;
    waterMl: number;
    stepGoal: number;
    sleepHours: number;
  };
  /** target − consumed (may be negative when over budget). */
  caloriesRemaining: number;
  proteinRemaining: number;
  /** 0–100 overall daily completion across workout/water/steps/sleep. */
  ringPct: number;
  adherence: DailyLog['adherence'];
  streak: number;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Pure derivation — usable in tests and via `selectTodayMission(state)`. */
export function deriveTodayMission(
  plan: TransformationPlan | undefined,
  logs: DailyLog[],
  streak: number,
): TodayMission {
  const date = todayKey();
  const log = logs.find((l) => l.date === date) ?? emptyLog(date);
  const targets = {
    calories: plan?.nutrition.calories ?? 0,
    proteinG: plan?.nutrition.proteinG ?? 0,
    waterMl: plan?.nutrition.waterMl ?? 0,
    stepGoal: plan?.dailyGoals.stepGoal ?? 0,
    sleepHours: plan?.dailyGoals.sleepHours ?? 0,
  };

  const parts = plan
    ? [
        log.workoutDone ? 1 : 0,
        targets.waterMl ? clamp01(log.waterMl / targets.waterMl) : 0,
        targets.stepGoal ? clamp01(log.steps / targets.stepGoal) : 0,
        targets.sleepHours ? clamp01(log.sleepHours / targets.sleepHours) : 0,
      ]
    : [];
  const ringPct = parts.length
    ? Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100)
    : 0;

  return {
    date,
    hasPlan: !!plan,
    log,
    targets,
    caloriesRemaining: targets.calories - log.caloriesConsumed,
    proteinRemaining: targets.proteinG - log.proteinConsumed,
    ringPct,
    adherence: log.adherence,
    streak,
  };
}

export const selectTodayMission = (state: AppStore): TodayMission =>
  deriveTodayMission(state.plan, state.logs, state.streak);

/**
 * Today's mission, derived. Subscribes to primitives and memoises the derived
 * object so components don't re-render on unrelated state changes.
 */
export function useTodayMission(): TodayMission {
  const plan = useAppStore((s) => s.plan);
  const logs = useAppStore((s) => s.logs);
  const streak = useAppStore((s) => s.streak);
  return useMemo(() => deriveTodayMission(plan, logs, streak), [plan, logs, streak]);
}
