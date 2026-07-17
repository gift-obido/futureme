import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../lib/store';
import { CheckSquare, Dumbbell, Apple, LineChart, ClipboardCheck, Settings as SettingsIcon } from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import { Wordmark } from './Wordmark';

const NAV = [
  { to: '/today', label: 'Today', icon: CheckSquare },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/nutrition', label: 'Nutrition', icon: Apple },
  { to: '/progress', label: 'Progress', icon: LineChart },
] as const;

export const Layout: React.FC = () => {
  const onboarding = useAppStore((s) => s.onboarding);
  const navigate = useNavigate();
  const location = useLocation();

  // Gate the app behind onboarding.
  useEffect(() => {
    if (!onboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [onboarding, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-bg text-text md:flex">
      {/* Desktop side rail */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-hairline p-4 md:flex">
        <div className="px-2 py-3">
          <Wordmark />
        </div>
        <nav className="mt-4 flex flex-1 flex-col gap-1" aria-label="Primary">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive ? 'bg-accent/10 text-text' : 'text-muted hover:bg-accent/5 hover:text-text',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${isActive ? 'bg-highlight text-strength' : ''}`}>
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center justify-between border-t border-hairline pt-3">
          <NavLink
            to="/check-in"
            className={({ isActive }) =>
              [
                'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                isActive ? 'text-text' : 'text-muted hover:text-text',
              ].join(' ')
            }
          >
            <ClipboardCheck className="h-[18px] w-[18px]" aria-hidden="true" />
            Check-in
          </NavLink>
          <div className="flex items-center gap-1">
            <NavLink
              to="/settings"
              aria-label="Settings"
              className={({ isActive }) =>
                ['grid h-11 w-11 place-items-center rounded-full transition-colors', isActive ? 'text-text' : 'text-muted hover:bg-accent/10 hover:text-text'].join(' ')
              }
            >
              <SettingsIcon className="h-5 w-5" aria-hidden="true" />
            </NavLink>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hairline bg-bg/80 px-5 py-3 backdrop-blur md:hidden">
          <Wordmark />
          <div className="flex items-center gap-1">
            <NavLink
              to="/check-in"
              aria-label="Weekly check-in"
              className={({ isActive }) =>
                ['grid h-11 w-11 place-items-center rounded-full transition-colors', isActive ? 'text-text' : 'text-muted hover:bg-accent/10 hover:text-text'].join(' ')
              }
            >
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            </NavLink>
            <NavLink
              to="/settings"
              aria-label="Settings"
              className={({ isActive }) =>
                ['grid h-11 w-11 place-items-center rounded-full transition-colors', isActive ? 'text-text' : 'text-muted hover:bg-accent/10 hover:text-text'].join(' ')
              }
            >
              <SettingsIcon className="h-5 w-5" aria-hidden="true" />
            </NavLink>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-5 pb-28 pt-6 md:px-8 md:pb-10 md:pt-10">
          <div className="mx-auto w-full max-w-lg">
            {/* Subtle per-route enter transition (opacity-only under reduced motion). */}
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>

        {/* Mobile bottom tab bar */}
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-hairline bg-bg/95 px-2 backdrop-blur md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex min-h-[44px] min-w-[60px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-colors',
                  isActive ? 'text-text' : 'text-muted hover:text-text',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative grid h-8 w-8 place-items-center rounded-lg">
                    {isActive && (
                      <motion.span
                        layoutId="tabPill"
                        className="absolute inset-0 rounded-lg bg-highlight"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Icon className={`relative z-10 h-5 w-5 ${isActive ? 'text-strength' : ''}`} aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-medium tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};
