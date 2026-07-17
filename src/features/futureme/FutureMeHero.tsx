import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Flame, Beef, Dumbbell, ArrowRight, ImageOff } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { getPhotoUrl, revokePhotoUrl } from '../../lib/storage';
import { Button, StatTile } from '../../components/ui';
import { VisionArt } from './VisionArt';
import type { Goal } from '../../lib/domain/types';

const EVOCATIVE: Record<Goal, (weeks: number) => string> = {
  lose_fat: (w) => `A leaner, lighter you — ${w} weeks from today.`,
  build_muscle: (w) => `More size, more strength, built over ${w} weeks.`,
  recomposition: (w) => `Less fat, more muscle — recomposed in ${w} weeks.`,
  get_stronger: (w) => `Noticeably stronger, ${w} weeks from now.`,
  improve_fitness: (w) => `Fitter, with more everyday energy, in ${w} weeks.`,
};

const PanelLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mb-2 block text-center text-[10px] font-bold uppercase tracking-wider text-muted">{children}</span>
);

export const FutureMeHero: React.FC = () => {
  const navigate = useNavigate();
  const onboarding = useAppStore((s) => s.onboarding);
  const plan = useAppStore((s) => s.plan);
  const vision = useAppStore((s) => s.vision);
  const [frontUrl, setFrontUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let active = true;
    (async () => {
      url = await getPhotoUrl(onboarding?.photos?.front);
      if (active) setFrontUrl(url);
    })();
    return () => {
      active = false;
      revokePhotoUrl(url);
    };
  }, [onboarding]);

  if (!onboarding || !plan || !vision) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Sparkles className="mb-4 h-9 w-9 animate-pulse text-accent motion-reduce:animate-none" aria-hidden="true" />
        <p className="text-sm text-muted">Preparing your blueprint…</p>
      </div>
    );
  }

  const { name } = onboarding.profile;
  const goal = onboarding.goal.goals[0]; // primary goal leads the hero copy
  const summary = EVOCATIVE[goal](plan.timelineWeeks);

  return (
    <div className="mx-auto max-w-md space-y-10">
      {/* Header */}
      <header className="text-center">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-text">
          <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          Blueprint locked in
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-text">Meet Your FutureMe</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Welcome, {name}. Here's the physique you're building toward.
        </p>
      </header>

      {/* Now vs FutureMe, side by side */}
      <section aria-label="Your current physique and future projection">
        <div className="grid grid-cols-2 gap-3">
          <figure className="m-0">
            <PanelLabel>Now</PanelLabel>
            <div className="aspect-[3/4] overflow-hidden rounded-3xl border border-hairline bg-surface">
              {frontUrl ? (
                <img src={frontUrl} alt="Your current front photo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
                  <ImageOff className="h-6 w-6" aria-hidden="true" />
                  <span className="px-2 text-center text-[11px]">No baseline photo</span>
                </div>
              )}
            </div>
          </figure>

          <figure className="m-0">
            <PanelLabel>Your FutureMe</PanelLabel>
            <div className="aspect-[3/4] overflow-hidden rounded-3xl border border-hairline bg-surface">
              <VisionArt vision={vision} />
            </div>
          </figure>
        </div>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">An illustrative projection, not a guarantee.</p>
      </section>

      {/* Evocative summary */}
      <p className="text-balance px-2 text-center font-display text-2xl font-semibold leading-snug text-text">{summary}</p>

      {/* Target stat blocks */}
      <section aria-label="Your targets" className="grid grid-cols-2 gap-3">
        <StatTile label="Timeline" value={plan.timelineWeeks} unit="wks" icon={<Calendar className="h-4 w-4" />} />
        <StatTile
          label="Daily calories"
          value={plan.nutrition.calories.toLocaleString()}
          unit="kcal"
          icon={<Flame className="h-4 w-4" />}
        />
        <StatTile label="Protein / day" value={plan.nutrition.proteinG} unit="g" icon={<Beef className="h-4 w-4" />} />
        <StatTile
          label="Training"
          value={plan.workoutFrequency}
          unit="× / wk"
          icon={<Dumbbell className="h-4 w-4" />}
        />
      </section>

      {/* CTA */}
      <Button
        variant="highlight"
        size="lg"
        fullWidth
        onClick={() => navigate('/today')}
        rightIcon={<ArrowRight className="h-4 w-4" />}
      >
        Start My Transformation
      </Button>
    </div>
  );
};
