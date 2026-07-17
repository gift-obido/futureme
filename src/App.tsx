import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AIProvider } from './lib/ai/AIProvider';
import { Layout } from './components/Layout';
import { useApplyTheme } from './lib/theme';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { FutureMeHero } from './features/futureme/FutureMeHero';
import { TodayMission } from './features/today/TodayMission';
import { WorkoutPlanner } from './features/workout/WorkoutPlanner';
import { NutritionTargets } from './features/nutrition/NutritionTargets';
import { ProgressTracker } from './features/progress/ProgressTracker';
import { WeeklyCheckIn } from './features/checkin/WeeklyCheckIn';
import { Settings } from './features/settings/Settings';
import { KitchenSink } from './features/kitchensink/KitchenSink';

function App() {
  // Keep <html>.dark in sync with the persisted theme choice on every route.
  useApplyTheme();

  return (
    <AIProvider>
      {/* reducedMotion="user" auto-disables transform/layout animations (keeping
          opacity) when the OS prefers reduced motion — belt-and-braces with the
          per-component useReducedMotion checks. */}
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Routes>
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/kitchen-sink" element={<KitchenSink />} />

            <Route element={<Layout />}>
              <Route path="/" element={<FutureMeHero />} />
              <Route path="/today" element={<TodayMission />} />
              <Route path="/workout" element={<WorkoutPlanner />} />
              <Route path="/nutrition" element={<NutritionTargets />} />
              <Route path="/progress" element={<ProgressTracker />} />
              <Route path="/check-in" element={<WeeklyCheckIn />} />
              <Route path="/settings" element={<Settings />} />

              {/* Fallback routing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MotionConfig>
    </AIProvider>
  );
}

export default App;
