import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Dumbbell,
  Droplet,
  Footprints,
  Moon,
  Check,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';
import { useAppStore, useTodayMission } from '../../lib/store';
import { Button, Card, CardThumb, ProgressRing, Stepper } from '../../components/ui';

const clampPct = (v: number, goal: number) => (goal > 0 ? Math.min(100, Math.round((v / goal) * 100)) : 0);

/** A daily goal that logs quick increments in place (water / steps / sleep). */
const GoalTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  goal: number;
  unit: string;
  step: number;
  max: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}> = ({ icon, label, value, goal, unit, step, max, format = (v) => String(v), onChange }) => (
  <Card padding="md">
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="stat text-sm text-muted">
            Goal {format(goal)} {unit}
          </p>
        </div>
      </div>
      <Stepper label={label} value={value} onChange={onChange} min={0} max={max} step={step} unit={unit} format={format} />
    </div>
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-hairline" aria-hidden="true">
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${clampPct(value, goal)}%` }} />
    </div>
  </Card>
);

/** A read-only stat that deep-links to its feature; keyboard-operable. */
const NavStat: React.FC<{
  imageKey: string;
  label: string;
  value: string;
  unit: string;
  sub: string;
  onClick: () => void;
  ariaLabel: string;
}> = ({ imageKey, label, value, unit, sub, onClick, ariaLabel }) => (
  <motion.button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    whileTap={{ scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    className="w-full rounded-2xl border border-hairline bg-surface p-5 text-left shadow-sm transition-colors hover:bg-accent/5"
  >
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="stat text-2xl font-bold leading-none text-text">{value}</span>
          <span className="text-sm font-medium text-muted">{unit}</span>
        </p>
        <p className="stat mt-1 text-xs text-muted">{sub}</p>
      </div>
      <CardThumb imageKey={imageKey} size="sm" />
    </div>
  </motion.button>
);

export const TodayMission: React.FC = () => {
  const navigate = useNavigate();
  const mission = useTodayMission();
  const workout = useAppStore((s) => s.workout);
  const plan = useAppStore((s) => s.plan);
  const checkIns = useAppStore((s) => s.checkIns);
  const logToday = useAppStore((s) => s.logToday);
  const incrementStreak = useAppStore((s) => s.incrementStreak);
  const resetStreakIfMissed = useAppStore((s) => s.resetStreakIfMissed);

  // On open, drop the streak if a qualifying day was missed.
  useEffect(() => {
    resetStreakIfMissed();
  }, [resetStreakIfMissed]);

  // Celebrate when the streak ticks up (auto-muted under reduced motion).
  const streakValue = mission.streak;
  const prevStreak = useRef(streakValue);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (streakValue > prevStreak.current) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 700);
      prevStreak.current = streakValue;
      return () => clearTimeout(t);
    }
    prevStreak.current = streakValue;
  }, [streakValue]);

  // First-day / no-plan empty state.
  if (!mission.hasPlan) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Flame className="h-9 w-9 text-accent" aria-hidden="true" />
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Your plan is waiting</h1>
          <p className="mt-1 text-sm text-muted">A 2-minute onboarding unlocks today's mission.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/onboarding')}>
          Build my plan
        </Button>
      </div>
    );
  }

  const { log, targets, caloriesRemaining, proteinRemaining, ringPct, streak } = mission;
  const session = workout?.sessions?.[0];
  const workoutDone = log.workoutDone;

  const commit = (patch: Parameters<typeof logToday>[0]) => {
    logToday(patch);
    incrementStreak();
  };

  const calOver = caloriesRemaining < 0;
  const proOver = proteinRemaining < 0;

  // Gentle weekly check-in nudge once ~7 days have passed since the last one
  // (or since the plan was created if none yet).
  const lastCheckIn = checkIns.length ? checkIns[checkIns.length - 1].weekOf : plan?.createdAt.slice(0, 10);
  const daysSinceCheckIn = lastCheckIn
    ? Math.floor((Date.now() - new Date(lastCheckIn).getTime()) / (24 * 3600 * 1000))
    : 0;
  const checkInDue = daysSinceCheckIn >= 7;

  return (
    <div className="space-y-5">
      <h1 className="sr-only">Today's mission</h1>

      {checkInDue && (
        <Card padding="md" info>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text">Weekly check-in ready</p>
              <p className="text-xs text-muted">It's been {daysSinceCheckIn} days — a 1-minute check keeps your plan sharp.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/check-in')}
              aria-label="Start weekly check-in"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-accent transition-colors hover:bg-accent/10"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </Card>
      )}

      {/* Streak + daily progress ring */}
      <Card padding="lg">
        <div className="flex items-center gap-4">
          <CardThumb imageKey="today/streak" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
              <motion.span animate={celebrate ? { scale: [1, 1.4, 1], rotate: [0, -12, 12, 0] } : {}} transition={{ duration: 0.6 }}>
                <Flame className="h-4 w-4 fill-orange-500 text-orange-500" aria-hidden="true" />
              </motion.span>
              Consistency streak
            </p>
            <p className="mt-1 stat text-4xl font-bold leading-none text-text">
              <motion.span className="inline-block" animate={celebrate ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.5 }}>
                {streak}
              </motion.span>{' '}
              <span className="text-lg font-semibold text-muted">{streak === 1 ? 'day' : 'days'}</span>
            </p>
            <p className="mt-2 max-w-[190px] text-xs leading-relaxed text-muted">
              {streak > 0 ? 'Keep it alive — finish today’s mission.' : 'Start your streak by completing today.'}
            </p>
          </div>
          <ProgressRing value={ringPct} label="Today’s progress" size={92}>
            <div className="text-center">
              <span className="stat block text-lg font-bold text-text">{ringPct}%</span>
              <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted">done</span>
            </div>
          </ProgressRing>
        </div>
      </Card>

      {/* Today's workout */}
      <Card padding="lg" info>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Today's training</p>
            <h2 className="mt-0.5 font-display text-xl font-bold text-text">{session ? session.title : 'Rest & recover'}</h2>
          </div>
          {session && (
            <button
              type="button"
              onClick={() => commit({ workoutDone: !workoutDone })}
              aria-pressed={workoutDone}
              aria-label={workoutDone ? 'Mark workout not done' : 'Mark workout complete'}
              className={[
                'grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors',
                workoutDone ? 'border-transparent bg-highlight text-strength' : 'border-field text-muted hover:border-field-hover hover:bg-accent/10',
              ].join(' ')}
            >
              <Check className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {session ? (
          <>
            <p className="mt-2 text-sm text-text/80">
              {workoutDone ? (
                <span className="inline-flex items-center gap-1 font-semibold text-text">
                  <Check className="h-4 w-4 text-accent" aria-hidden="true" /> Completed — nice work.
                </span>
              ) : (
                <>A {session.estimatedMinutes}-min session · {session.exercises.length} exercises.</>
              )}
            </p>
            <Button
              variant="primary"
              fullWidth
              className="mt-4"
              onClick={() => navigate('/workout')}
              leftIcon={<Dumbbell className="h-4 w-4" />}
            >
              {workoutDone ? 'Review workout' : 'Start workout'}
            </Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">No session today — an active recovery walk is encouraged.</p>
        )}
      </Card>

      {/* Nutrition (deep-link to /nutrition) — two-up, collapses to one column on small phones */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NavStat
          imageKey="today/calories"
          label="Calories"
          value={Math.abs(caloriesRemaining).toLocaleString()}
          unit={calOver ? 'kcal over' : 'kcal left'}
          sub={`of ${targets.calories.toLocaleString()} target`}
          onClick={() => navigate('/nutrition')}
          ariaLabel="Log calories in Nutrition"
        />
        <NavStat
          imageKey="today/protein"
          label="Protein"
          value={String(Math.abs(proteinRemaining))}
          unit={proOver ? 'g over' : 'g left'}
          sub={`of ${targets.proteinG} g target`}
          onClick={() => navigate('/nutrition')}
          ariaLabel="Log protein in Nutrition"
        />
      </div>

      {/* Daily goals — tap to log */}
      <div className="space-y-3">
        <GoalTile
          icon={<Droplet className="h-5 w-5" />}
          label="Water"
          value={log.waterMl}
          goal={targets.waterMl}
          unit="ml"
          step={250}
          max={Math.max(targets.waterMl * 2, 4000)}
          format={(v) => v.toLocaleString()}
          onChange={(v) => commit({ waterMl: v })}
        />
        <GoalTile
          icon={<Footprints className="h-5 w-5" />}
          label="Steps"
          value={log.steps}
          goal={targets.stepGoal}
          unit=""
          step={1000}
          max={Math.max(targets.stepGoal * 2, 20000)}
          format={(v) => v.toLocaleString()}
          onChange={(v) => commit({ steps: v })}
        />
        <GoalTile
          icon={<Moon className="h-5 w-5" />}
          label="Sleep"
          value={log.sleepHours}
          goal={targets.sleepHours}
          unit="h"
          step={0.5}
          max={14}
          format={(v) => String(v)}
          onChange={(v) => commit({ sleepHours: v })}
        />
      </div>
    </div>
  );
};
