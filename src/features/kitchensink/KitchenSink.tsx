import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Droplet, Flame, ArrowLeft } from 'lucide-react';
import {
  Button,
  Card,
  Field,
  ProgressRing,
  StatTile,
  Stepper,
  Sheet,
  ThemeToggle,
} from '../../components/ui';

const PALETTE = [
  { name: 'power', className: 'bg-power' },
  { name: 'sun', className: 'bg-sun' },
  { name: 'pool', className: 'bg-pool' },
  { name: 'neutral', className: 'bg-neutral' },
  { name: 'strength', className: 'bg-strength' },
];

const SEMANTIC = [
  { name: 'bg', className: 'bg-bg' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'elevated', className: 'bg-elevated' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'highlight', className: 'bg-highlight' },
  { name: 'info', className: 'bg-info' },
];

type DemoForm = { name: string; email: string };

/** Every design-system component in one place. Rendered twice by KitchenSink. */
const Showcase: React.FC = () => {
  const [water, setWater] = useState(1500);
  const [sheetOpen, setSheetOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DemoForm>({ mode: 'onTouched' });

  return (
    <div className="space-y-6 bg-bg text-text">
      {/* Typography */}
      <section className="space-y-2">
        <h2 className="font-display text-3xl font-bold">Display / Plus Jakarta Sans 600</h2>
        <p className="text-sm text-text">Body copy in Plus Jakarta Sans 400 — primary text on the current surface.</p>
        <p className="text-sm text-muted">Muted secondary text (never sun/power).</p>
        <p className="stat text-2xl font-bold">1,234.5 <span className="text-sm text-muted">tabular</span></p>
      </section>

      {/* Buttons */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="highlight">Highlight</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="highlight" size="lg" leftIcon={<Flame className="h-4 w-4" />}>Large</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        <Button variant="primary" fullWidth>Full width</Button>
      </section>

      {/* Cards */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Cards</h3>
        <Card><p className="text-sm text-text">Surface card</p></Card>
        <Card elevated><p className="text-sm text-text">Elevated card</p></Card>
        <Card info><p className="text-sm text-text">Info panel</p></Card>
      </section>

      {/* Field (react-hook-form wired) */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Fields</h3>
        <form onSubmit={handleSubmit(() => {})} className="space-y-3" noValidate>
          <Field label="Your name" placeholder="e.g. Alex" hint="As it appears on your plan." {...register('name', { required: 'Name is required' })} error={errors.name?.message} />
          <Field label="Email" type="email" placeholder="you@example.com" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
          <Button variant="accent" type="submit">Validate</Button>
        </form>
      </section>

      {/* Progress rings */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Progress rings</h3>
        <div className="flex items-center gap-4">
          <ProgressRing value={72} label="Daily progress" />
          <ProgressRing value={40} tone="highlight" label="Streak" />
        </div>
      </section>

      {/* Stat tiles */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Stat tiles</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Calories" value="2,120" unit="kcal" sub="of 2,120 target" />
          <StatTile label="Water" value="1,500" unit="ml" sub="of 2,750 ml" icon={<Droplet className="h-4 w-4" />} />
        </div>
      </section>

      {/* Stepper */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Stepper</h3>
        <Stepper
          label="Water intake"
          value={water}
          onChange={setWater}
          min={0}
          max={4000}
          step={250}
          unit="ml"
          format={(v) => v.toLocaleString()}
        />
      </section>

      {/* Sheet */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Sheet / Modal</h3>
        <Button variant="primary" onClick={() => setSheetOpen(true)}>Open sheet</Button>
        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Log today's intake"
          footer={<Button variant="highlight" fullWidth onClick={() => setSheetOpen(false)}>Save</Button>}
        >
          <div className="space-y-3">
            <Field label="Calories" type="number" placeholder="e.g. 2100" />
            <p className="text-sm text-muted">Focus is trapped here; Escape or the backdrop closes it.</p>
          </div>
        </Sheet>
      </section>

      {/* Swatches */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Palette</h3>
        <div className="grid grid-cols-5 gap-2">
          {PALETTE.map((s) => (
            <div key={s.name} className="text-center">
              <div className={`${s.className} h-10 w-full rounded-lg border border-hairline`} />
              <span className="mt-1 block text-[10px] text-muted">{s.name}</span>
            </div>
          ))}
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Semantic</h3>
        <div className="grid grid-cols-6 gap-2">
          {SEMANTIC.map((s) => (
            <div key={s.name} className="text-center">
              <div className={`${s.className} h-10 w-full rounded-lg border border-hairline`} />
              <span className="mt-1 block text-[10px] text-muted">{s.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export const KitchenSink: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-bg/80 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link to="/" aria-label="Back to app" className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-accent/10 hover:text-text">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-xl font-bold">Kitchen Sink</h1>
        </div>
        <ThemeToggle />
      </header>

      <main>
        <p className="px-5 pt-4 text-sm text-muted">
          Global theme follows the toggle above. The two panels below are force-pinned to light and dark to verify both at once.
        </p>

        <div className="grid gap-px bg-hairline md:grid-cols-2">
          <div className="theme-light bg-bg p-5 text-text">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Light</p>
            <Showcase />
          </div>
          <div className="theme-dark bg-bg p-5 text-text">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Dark</p>
            <Showcase />
          </div>
        </div>
      </main>
    </div>
  );
};
