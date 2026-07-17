import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Dumbbell, Timer, Trophy, Coffee } from 'lucide-react';
import { useAppStore, useTodayMission } from '../../lib/store';
import { Button, Card, CardThumb } from '../../components/ui';
import { slugify } from '../../assets/imageManifest';
import type { WorkoutSession } from '../../lib/domain/types';

const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;

const BackLink: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-text"
  >
    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Today
  </button>
);

/** Sticky rest countdown. Reduced-motion safe: the bar has no smooth animation. */
const RestTimer: React.FC<{ remaining: number; total: number; onSkip: () => void }> = ({ remaining, total, onSkip }) => (
  <div className="sticky top-2 z-20">
    <Card elevated padding="sm">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
          <Timer className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1" role="timer" aria-label={`Rest, ${remaining} seconds remaining`}>
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>Rest</span>
            <span className="stat text-text">{fmtClock(remaining)}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
              style={{ width: `${total > 0 ? (remaining / total) * 100 : 0}%` }}
            />
          </div>
        </div>
        <Button variant="ghost" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </Card>
  </div>
);

export const WorkoutPlanner: React.FC = () => {
  const navigate = useNavigate();
  const workout = useAppStore((s) => s.workout);
  const onboarding = useAppStore((s) => s.onboarding);
  const logToday = useAppStore((s) => s.logToday);
  const incrementStreak = useAppStore((s) => s.incrementStreak);
  const mission = useTodayMission();
  const workoutDone = mission.log.workoutDone;

  const session: WorkoutSession | undefined = workout?.sessions?.[0];

  const [done, setDone] = useState<boolean[][]>([]);
  const [rest, setRest] = useState<{ remaining: number; total: number } | null>(null);
  const [redoing, setRedoing] = useState(false);

  // (Re)initialise set-completion when the session changes.
  useEffect(() => {
    if (session) setDone(session.exercises.map((e) => Array(e.sets).fill(false)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Rest countdown.
  useEffect(() => {
    if (!rest) return;
    if (rest.remaining <= 0) {
      setRest(null);
      return;
    }
    const id = setTimeout(() => setRest((r) => (r ? { ...r, remaining: r.remaining - 1 } : null)), 1000);
    return () => clearTimeout(id);
  }, [rest]);

  // --- Rest day ---
  if (!session) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate('/today')} />
        <Card padding="lg" className="text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent">
            <Coffee className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold text-text">Rest day</h1>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            No session scheduled today. An easy walk and good sleep are today's work.
          </p>
          <Button variant="primary" className="mt-5" onClick={() => navigate('/today')}>
            Back to Today
          </Button>
        </Card>
      </div>
    );
  }

  const totalSets = session.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = done.flat().filter(Boolean).length;
  const location = onboarding?.lifestyle.location ?? 'gym';

  const toggleSet = (ei: number, si: number) => {
    const was = done[ei]?.[si];
    setDone((prev) => {
      const copy = prev.map((a) => a.slice());
      if (copy[ei]) copy[ei][si] = !was;
      return copy;
    });
    if (!was) {
      const r = session.exercises[ei].restSec;
      setRest({ remaining: r, total: r });
    }
  };

  const complete = () => {
    logToday({ workoutDone: true });
    incrementStreak();
    navigate('/today');
  };

  // --- All-complete state (today's workout already logged) ---
  if (workoutDone && !redoing) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate('/today')} />
        <Card padding="lg" info className="text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-highlight text-strength">
            <Trophy className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold text-text">Workout complete</h1>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            You finished <span className="font-semibold text-text">{session.title}</span>. Recovery is where the gains land.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button variant="primary" fullWidth onClick={() => navigate('/today')}>
              Back to Today
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setRedoing(true)}>
              Redo workout
            </Button>
          </div>
        </Card>

        <SessionMeta session={session} location={location} />
        <ul className="space-y-3">
          {session.exercises.map((ex, i) => (
            <li key={i}>
              <ExerciseRow name={ex.name} meta={`${ex.sets} × ${ex.reps} · rest ${ex.restSec}s`} variation={ex.variation} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // --- Runner ---
  const allDone = doneSets === totalSets;

  return (
    <div className="space-y-4">
      <BackLink onClick={() => navigate('/today')} />

      <header>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Today's training</p>
        <h1 className="mt-0.5 font-display text-2xl font-bold text-text">{session.title}</h1>
      </header>

      <SessionMeta session={session} location={location} />

      {/* Set progress */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted">
          <span>Sets completed</span>
          <span className="stat text-text">
            {doneSets} / {totalSets}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-hairline">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%` }}
          />
        </div>
      </div>

      {rest && <RestTimer remaining={rest.remaining} total={rest.total} onSkip={() => setRest(null)} />}

      {/* Exercises with per-set check-off */}
      <ul className="space-y-3">
        {session.exercises.map((ex, ei) => (
          <li key={ei}>
            <Card padding="md">
              {/* Horizontal row, equal p-5 all sides. The thumbnail (right) is the
                  height-defining square; the left column spans that height and
                  anchors title/meta to the top edge and the set chips to the bottom. */}
              <div className="flex items-stretch gap-4">
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-text">{ex.name}</h2>
                      <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-text">
                        {ex.variation}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <span className="stat font-semibold text-text">
                        {ex.sets} × {ex.reps}
                      </span>
                      <span aria-hidden="true">·</span>
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" /> rest {ex.restSec}s
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2" role="group" aria-label={`${ex.name} sets`}>
                    {Array.from({ length: ex.sets }).map((_, si) => {
                      const isDone = done[ei]?.[si] ?? false;
                      return (
                        <button
                          key={si}
                          type="button"
                          onClick={() => toggleSet(ei, si)}
                          aria-pressed={isDone}
                          aria-label={`${ex.name}, set ${si + 1}${isDone ? ', completed' : ''}`}
                          className={[
                            'grid h-11 min-w-[3rem] place-items-center rounded-xl border px-3 text-sm font-semibold transition-colors',
                            isDone
                              ? 'border-transparent bg-highlight text-strength'
                              : 'border-field text-text hover:border-field-hover hover:bg-accent/5',
                          ].join(' ')}
                        >
                          {isDone ? <Check className="h-4 w-4" aria-hidden="true" /> : si + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="aspect-square w-1/4 max-w-[160px] shrink-0 self-start overflow-hidden rounded-2xl">
                  <CardThumb size="fill" imageKey={`exercises/${slugify(ex.name)}`} alt={ex.name} />
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Button
        variant="highlight"
        size="lg"
        fullWidth
        onClick={complete}
        leftIcon={<Check className="h-4 w-4" />}
      >
        {allDone ? 'Finish workout' : 'Complete workout'}
      </Button>
    </div>
  );
};

const SessionMeta: React.FC<{ session: WorkoutSession; location: string }> = ({ session, location }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
    <span className="stat inline-flex items-center gap-1.5">
      <Clock className="h-4 w-4" aria-hidden="true" /> ~{session.estimatedMinutes} min
    </span>
    <span className="stat inline-flex items-center gap-1.5">
      <Dumbbell className="h-4 w-4" aria-hidden="true" /> {session.exercises.length} exercises
    </span>
    <span className="inline-flex items-center gap-1.5 capitalize">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" /> {location} variation
    </span>
  </div>
);

const ExerciseRow: React.FC<{ name: string; meta: string; variation: string }> = ({ name, meta, variation }) => (
  <Card padding="md">
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-text">{name}</h2>
          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-text">
            {variation}
          </span>
        </div>
        <p className="stat mt-0.5 text-sm text-muted">{meta}</p>
      </div>
      <CardThumb imageKey={`exercises/${slugify(name)}`} alt={name} />
    </div>
  </Card>
);
