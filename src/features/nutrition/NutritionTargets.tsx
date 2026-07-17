import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Beef, Droplet, CheckCircle2, CircleDashed, XCircle, Check, Minus, X } from 'lucide-react';
import { useAppStore, useTodayMission } from '../../lib/store';
import { Button, Card, StatTile, Stepper } from '../../components/ui';
import type { DailyLog } from '../../lib/domain/types';

type Adherence = DailyLog['adherence'];

const ADHERENCE: { value: Adherence; label: string; Icon: typeof CheckCircle2; tone: string }[] = [
  { value: 'hit', label: 'Hit', Icon: CheckCircle2, tone: 'text-emerald-500' },
  { value: 'partial', label: 'Partial', Icon: CircleDashed, tone: 'text-amber-500' },
  { value: 'miss', label: 'Miss', Icon: XCircle, tone: 'text-red-500' },
];

/** Accessible radiogroup — icon + label carry meaning, never colour alone. */
const AdherenceSelector: React.FC<{ value?: Adherence; onChange: (v: Adherence) => void }> = ({ value, onChange }) => {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = ADHERENCE.findIndex((o) => o.value === value);
  const focusTo = (i: number) => {
    const n = ADHERENCE.length;
    const j = ((i % n) + n) % n;
    onChange(ADHERENCE[j].value);
    refs.current[j]?.focus();
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); focusTo(i + 1); }
    else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); focusTo(i - 1); }
  };
  return (
    <div role="radiogroup" aria-label="Today's nutrition adherence" className="grid grid-cols-3 gap-2">
      {ADHERENCE.map((o, i) => {
        const checked = o.value === value;
        const tabIndex = checked || (selected === -1 && i === 0) ? 0 : -1;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={tabIndex}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={[
              'flex min-h-[44px] flex-col items-center gap-1 rounded-xl border py-3 transition-colors',
              checked ? 'border-accent bg-accent/5' : 'border-field hover:border-field-hover hover:bg-accent/5',
            ].join(' ')}
          >
            <o.Icon className={`h-6 w-6 ${o.tone}`} aria-hidden="true" />
            <span className="text-sm font-semibold text-text">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const QuickLogRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  remaining: string;
  value: number;
  step: number;
  max: number;
  unit: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}> = ({ icon, label, remaining, value, step, max, unit, format = (v) => String(v), onChange }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text">{label}</p>
        <p className="stat text-xs text-muted">{remaining}</p>
      </div>
    </div>
    <Stepper label={label} value={value} onChange={onChange} min={0} max={max} step={step} unit={unit} format={format} />
  </div>
);

const MARKER: Record<Adherence, { Icon: typeof Check; tone: string }> = {
  hit: { Icon: Check, tone: 'text-emerald-500' },
  partial: { Icon: Minus, tone: 'text-amber-500' },
  miss: { Icon: X, tone: 'text-red-500' },
};

export const NutritionTargets: React.FC = () => {
  const navigate = useNavigate();
  const mission = useTodayMission();
  const logs = useAppStore((s) => s.logs);
  const logToday = useAppStore((s) => s.logToday);
  const setAdherence = useAppStore((s) => s.setAdherence);
  const incrementStreak = useAppStore((s) => s.incrementStreak);
  const resetStreakIfMissed = useAppStore((s) => s.resetStreakIfMissed);
  const carbsG = useAppStore((s) => s.plan?.nutrition.carbsG ?? 0);
  const fatG = useAppStore((s) => s.plan?.nutrition.fatG ?? 0);

  useEffect(() => {
    resetStreakIfMissed();
  }, [resetStreakIfMissed]);

  if (!mission.hasPlan) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Flame className="h-9 w-9 text-accent" aria-hidden="true" />
        <p className="text-sm text-muted">Complete onboarding to see your nutrition targets.</p>
        <Button variant="primary" onClick={() => navigate('/onboarding')}>Build my plan</Button>
      </div>
    );
  }

  const { targets, log, caloriesRemaining, proteinRemaining } = mission;
  const todayLogged = logs.some((l) => l.date === mission.date);

  const pickAdherence = (v: Adherence) => {
    setAdherence(v);
    incrementStreak();
  };

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const l = logs.find((x) => x.date === key);
    return {
      key,
      letter: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      status: l ? l.adherence : null,
    };
  });

  const remainingLabel = (n: number, unit: string) => (n >= 0 ? `${Math.abs(n).toLocaleString()} ${unit} left` : `${Math.abs(n).toLocaleString()} ${unit} over`);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-text">Nutrition</h1>
        <p className="mt-1 text-sm text-muted">Consistency over precision — log lightly, hit your targets.</p>
      </header>

      {/* Daily targets */}
      <section aria-label="Daily targets" className="space-y-3">
        <Card padding="lg">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Daily calorie target</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="stat text-4xl font-bold leading-none text-text">{targets.calories.toLocaleString()}</span>
            <span className="text-base font-medium text-muted">kcal</span>
          </p>
        </Card>
        {/* Protein+Carbs and Fat+Water as two-up rows; collapse to one column on small phones. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatTile label="Protein" value={targets.proteinG} unit="g" imageKey="nutrition/protein" imageSize="sm" />
          <StatTile label="Carbs" value={carbsG} unit="g" imageKey="nutrition/carbs" imageSize="sm" />
          <StatTile label="Fat" value={fatG} unit="g" imageKey="nutrition/fat" imageSize="sm" />
          <StatTile label="Water" value={targets.waterMl.toLocaleString()} unit="ml" imageKey="nutrition/water" imageSize="sm" />
        </div>
      </section>

      {/* Adherence self-report */}
      <section aria-label="Daily adherence">
        <Card padding="lg">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">How did today go?</p>
          <p className="mb-3 mt-0.5 text-sm text-muted">One tap — no gram-by-gram logging.</p>
          <AdherenceSelector value={todayLogged ? log.adherence : undefined} onChange={pickAdherence} />
        </Card>
      </section>

      {/* Optional quick log */}
      <section aria-label="Quick log">
        <Card padding="lg" className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Quick log (optional)</p>
            <p className="mt-0.5 text-sm text-muted">Updates today's remaining totals.</p>
          </div>
          <QuickLogRow
            icon={<Flame className="h-5 w-5" />}
            label="Calories"
            remaining={remainingLabel(caloriesRemaining, 'kcal')}
            value={log.caloriesConsumed}
            step={100}
            max={Math.max(targets.calories * 2, 4000)}
            unit="kcal"
            format={(v) => v.toLocaleString()}
            onChange={(v) => logToday({ caloriesConsumed: v })}
          />
          <QuickLogRow
            icon={<Beef className="h-5 w-5" />}
            label="Protein"
            remaining={remainingLabel(proteinRemaining, 'g')}
            value={log.proteinConsumed}
            step={10}
            max={Math.max(targets.proteinG * 2, 300)}
            unit="g"
            onChange={(v) => logToday({ proteinConsumed: v })}
          />
          <QuickLogRow
            icon={<Droplet className="h-5 w-5" />}
            label="Water"
            remaining={`${log.waterMl.toLocaleString()} / ${targets.waterMl.toLocaleString()} ml`}
            value={log.waterMl}
            step={250}
            max={Math.max(targets.waterMl * 2, 4000)}
            unit="ml"
            format={(v) => v.toLocaleString()}
            onChange={(v) => logToday({ waterMl: v })}
          />
        </Card>
      </section>

      {/* Consistency strip */}
      <section aria-label="This week's consistency">
        <Card padding="md">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">This week</p>
          <ul className="flex items-center justify-between gap-1">
            {week.map((d) => {
              const m = d.status ? MARKER[d.status] : null;
              return (
                <li key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-lg border border-hairline"
                    aria-label={`${d.key}: ${d.status ?? 'no log'}`}
                    title={`${d.key}: ${d.status ?? 'no log'}`}
                  >
                    {m ? (
                      <m.Icon className={`h-4 w-4 ${m.tone}`} aria-hidden="true" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted/40" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-[10px] font-medium text-muted">{d.letter}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
};
