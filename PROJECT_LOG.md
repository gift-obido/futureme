# FutureMe — Project Log & Handoff

> Mobile-first body-transformation planner. Turns a short onboarding into a personalized
> workout + nutrition roadmap, shows an inspiring "future self," and reduces each day to one
> clear mission. **No backend, no accounts.** All "AI" is mocked behind a typed interface.

**Status:** MVP feature-complete & verified · **Last updated:** 2026-07-16
**Full product spec:** [prd_docs/FutureMe.md](prd_docs/FutureMe.md)

---

## 1. Quick start

```bash
npm install
npm run dev        # Vite dev server → http://localhost:5173
npm run build      # tsc -b && vite build  (production bundle)
npm run lint       # oxlint
```

Key routes: `/onboarding` · `/` (hero) · `/today` · `/workout` · `/nutrition` · `/progress` ·
`/check-in` · `/settings` · `/kitchen-sink` (design-system reference).

There is no CI/test suite yet. Verification so far has been done by **driving the running app in
headless Chrome via puppeteer-core** (see §7).

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Language / framework | TypeScript, **React 19** |
| Build | **Vite 8** |
| Styling | **Tailwind CSS 3.4** (`darkMode: 'class'`) + semantic CSS-variable tokens |
| Routing | **React Router 7** |
| State | **Zustand 5** + `persist` (localStorage) |
| Photos | **IndexedDB** via `idb-keyval` |
| Forms | **react-hook-form** + **zod 4** |
| Charts | **Recharts 3** |
| Animation | **Framer Motion** (reduced-motion aware) |
| Icons | **lucide-react** |
| Fonts | **Fraunces** (display) + **Inter** (body), self-hosted via Fontsource |

---

## 3. Architecture (the important seams)

### AI seam — everything "smart" goes through one interface
- `src/lib/ai/AIClient.ts` — the interface (`analyzePhotos`, `generatePlan`, `generateVision`, `adjustPlan`).
- `src/lib/ai/MvpMockAIClient.ts` — mock implementation (formulas from PRD §9 + realistic delays; also a
  non-interface `generateWorkoutSessions`).
- `src/lib/ai/AIProvider.tsx` — React context; **the only place that constructs the client**. Consume via `useAI()`.
- **Callers:** `OnboardingWizard` (analyze→plan→workout→vision) and `WeeklyCheckIn` (adjustPlan). Never call a client directly.

### Store — `src/lib/store/index.ts` (`useAppStore`)
- Zustand + `persist`, localStorage key **`futureme:v1`**, `version: 2` (schemaVersion), with a **migrations map** keyed by schema version. NB: the migrations block is declared **before** `create()` so `migrate` (run synchronously during rehydration) doesn't hit a TDZ.
- `partialize` persists **data only** — never functions, never blobs.
- **Actions:** `setOnboarding`, `setPlanBundle(analysis, plan, workout, vision)`, `logToday(partial)`,
  `setAdherence(hit|partial|miss)`, `addProgress(entry)`, `addCheckIn(checkIn, adjustment)`,
  `incrementStreak()`, `resetStreakIfMissed()`, `setTheme`, `resetAll()`.
- **Selectors / helpers:** `useTodayMission()` (+ pure `deriveTodayMission` / `selectTodayMission`),
  `suggestAdherence(log, plan)`, `todayKey()`.

### Storage — `src/lib/storage/index.ts` (photos, IndexedDB)
- `savePhoto(file) → PhotoRef`, `getPhotoUrl(ref) → objectURL|null`, `deletePhoto(ref)`,
  `revokePhotoUrl(url)`, `clearAllPhotos()`, `PhotoStorageError`.
- The store holds **only `PhotoRef` keys** (`photo:<uuid>`); blobs live in IndexedDB.

### Theme — `src/lib/theme.ts`
- `useApplyTheme()` (mounted once in `App`) syncs `.dark` on `<html>` from the persisted choice + `prefers-color-scheme`.
- `useResolvedDark()` — reactive boolean for components that need concrete colors (charts).
- `ThemeToggle` cycles system→light→dark; `Settings` has an explicit picker.

### App shell — `src/components/Layout.tsx`
- Responsive: **bottom tab bar on mobile / side rail on desktop** (Today · Workout · Nutrition · Progress).
- Header/side-rail also link to **Check-in** and **Settings**. Redirects to `/onboarding` until onboarding exists.
- `/onboarding` and `/kitchen-sink` render **outside** Layout.

---

## 4. Design system & conventions

**UI components:** `src/components/ui/` → `Button` (variants: primary/accent/highlight/ghost/danger, motion press),
`Card`, `Field` (RHF-wired), `ProgressRing`, `StatTile`, `Stepper`, `Sheet` (accessible modal/focus-trap),
`ThemeToggle`.

**Tokens** (`tailwind.config.js` + `src/styles/globals.css`):
- **Semantic, CSS-var driven, flip in dark:** `bg, surface, elevated, text, muted, hairline, accent, highlight, info, ring`.
- **Raw palette (fixed):** `power #7F7767 · sun #F9F095 · pool #D6E6E4 · neutral #F4F3EB · strength #000`.
- `font-display` = Fraunces, `font-sans` = Inter. `.stat` = tabular numerals (use on all numbers).

**Non-negotiable rules (all enforced & audited):**
- **Never** sun/power as small text. `sun` = fill with **black** text; `power` = large text/borders/secondary UI only.
- ≥44px tap targets; **status by icon + text/shape, never color alone**; one `<h1>` per screen; landmarks; `aria-live`
  for async results + step/validation changes; visible 2px focus ring (global `:focus-visible`).
- **Reduced-motion:** global `<MotionConfig reducedMotion="user">` in `App` + per-component `useReducedMotion` /
  `motion-reduce:` classes. Loading sequence, rings, rest timer, transitions all have static fallbacks.
- WCAG 2.1 AA verified across **all screens in light AND dark** (see §7).

---

## 5. Feature status — all built & verified

| Screen | Route | Notes |
|---|---|---|
| Onboarding wizard | `/onboarding` | 5 steps + loading sequence tied to real `useAI()` completions → hero |
| Meet Your FutureMe | `/` | current photo + stylized `VisionArt` SVG, evocative summary, stat blocks, CTA |
| Today's Mission | `/today` | `useTodayMission`; streak+ring, workout tile, calorie/protein deep-links, water/steps/sleep steppers; weekly check-in reminder |
| Workout runner | `/workout` | set check-off, reduced-motion rest timer, Complete → streak/today; rest-day + all-complete states |
| Nutrition | `/nutrition` | macro target cards, hit/partial/miss selector, quick-log steppers, 7-day strip |
| Progress | `/progress` | accessible Recharts weight chart (title/desc/data-table), photo gallery, measurements, transformation %, add-entry Sheet |
| Weekly Check-In | `/check-in` | weight + photo + 1–5 rating radiogroups → `adjustPlan` → "what changed and why" (aria-live) |
| Settings | `/settings` | theme picker + **Reset app** (clears store + IndexedDB → onboarding) |
| Kitchen Sink | `/kitchen-sink` | design-system reference, both themes side-by-side |

---

## 6. Key decisions & gotchas (read before changing things)

- **Adherence is a manual self-report** (`setAdherence`), not auto-derived. `logToday` does **not** touch adherence.
  A day counts toward the **streak** if `workoutDone` **or** adherence is hit/partial. `suggestAdherence` exists as an optional hint.
- **"Today's workout" = `workout.sessions[0]`** (keeps Today's tile and `/workout` in sync). Rest-day = plan has no session;
  all-complete = today's `workoutDone`. There is **no weekday calendar** yet (optional enhancement — would need a shared `todaysSession` selector used by both screens).
- **Canonical storage is metric**; convert for display (height cm↔ft/in, weight kg↔lb, measurements cm↔in). Units are a display preference.
- **Photos:** store keeps refs only; `OnboardingProfile.photos` is set **only when all three** (front/side/back) are present (PRD `PhotoSet` requires all three; partial sets are dropped from the profile but still saved to IndexedDB).
- **Tailwind config edits require a dev-server restart** (JIT won't pick up new tokens live).
- **Grid/flex overflow:** grid items default to `min-width:auto`; add `min-w-0` to prevent horizontal overflow (bit us on Progress metrics).
- **Recharts:** wrap the chart in an `overflow-hidden` container (its tooltip wrapper causes phantom horizontal scroll), and mark the SVG `aria-hidden` with a data-table fallback for accessibility.

---

## 7. How to re-verify (no test suite yet)

Verification is done by driving the running app in headless Chrome. There is **no `chromium-cli` or Playwright**;
use `puppeteer-core` pointed at the system Chrome:

- Executable: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Install `puppeteer-core` in a scratch dir (not the repo) and script against `http://localhost:5173`.

Gotchas when scripting:
- **Contrast audit** must composite alpha layers (semi-transparent backgrounds) before computing ratio, else false failures.
- **Controlled number inputs** drop characters under fast synthetic typing — set the value via the native
  `HTMLInputElement` value setter + dispatch an `input` event, instead of `.type()`.
- Theme can be forced deterministically by setting `state.theme` in the `futureme:v1` localStorage entry, then reloading.

What has been verified: full onboarding→app flow; every feature's interactions & store writes; **a11y audit
18/18 (9 screens × 2 themes)** — contrast, tap targets, landmarks, one-h1, alt, aria-live, reduced-motion,
keyboard/focus; no console errors anywhere; no blobs in localStorage; Reset clears store + IndexedDB;
`npm run build` succeeds.

---

## 8. Open items / suggested next steps

- **Tests:** add Vitest + RTL for the mock engine formulas (`MvpMockAIClient`) and the store (selectors, streak, adherence, migrations).
- **Perf:** build warns the JS chunk >500 kB (~280 kB gzip, mostly Recharts). Consider `React.lazy` code-splitting the Progress and Kitchen-Sink routes.
- **Weekly schedule:** replace `sessions[0]` with a real weekday schedule (training days + rest days) via a shared selector, if desired.
- **Post-MVP (per PRD §12):** real accounts/sync, real Claude-powered plan generation & check-in reasoning, real photo vision, opt-in image generation for the vision.

---

## 9. File tree (`src/`)

```
src/
├─ main.tsx, App.tsx                     # entry; router + <MotionConfig> + useApplyTheme
├─ styles/globals.css                    # tokens (:root/.dark), base a11y (44px, focus), .stat
├─ components/
│  ├─ Layout.tsx                         # responsive shell (side rail / bottom tabs), route transitions
│  └─ ui/  Button, Card, Field, StatTile, Stepper, ProgressRing, Sheet, ThemeToggle, index.ts
├─ features/
│  ├─ onboarding/  OnboardingWizard, schema.ts, StepProgress, LoadingSequence, RadioGroup, ChipsInput,
│  │               steps/{StepBasics,StepGoal,StepLifestyle,StepNutrition,StepPhotos}
│  ├─ futureme/    FutureMeHero, VisionArt
│  ├─ today/       TodayMission
│  ├─ workout/     WorkoutPlanner
│  ├─ nutrition/   NutritionTargets
│  ├─ progress/    ProgressTracker, WeightChart
│  ├─ checkin/     WeeklyCheckIn
│  ├─ settings/    Settings
│  └─ kitchensink/ KitchenSink
└─ lib/
   ├─ domain/types.ts                    # PRD data model (canonical shapes)
   ├─ store/index.ts                     # Zustand + persist, actions, selectors, migrations
   ├─ storage/index.ts                   # IndexedDB photos (savePhoto/getPhotoUrl/clearAllPhotos)
   ├─ ai/  AIClient.ts, MvpMockAIClient.ts, AIProvider.tsx
   └─ theme.ts                           # useApplyTheme, useResolvedDark, resolveTheme
```

---

## 10. Changelog

- **2026-07-16** — **Cosmetic: onboarding option-state hierarchy + workout card rebuild.** Selectable
  onboarding options (goal cards + RadioGroup chip/card toggles like Metric/Imperial, Male/Female) now
  use the **exact STEPS-card `border-hairline`** as their flat default, with three ascending states:
  default (hairline) → hover (`border-field` + `bg-accent/5` lift) → selected (`border-accent` +
  `bg-accent/10` + check, strongest); the global focus ring is untouched. `RadioGroup` gained a `cta`
  prop: the target-date toggle (`Let AI decide` / `Pick a date`) now renders its unselected chip with a
  high-contrast `border-accent` so **"Pick a date" reads as a button, not an unselected option**
  (accent border ≥3:1 in both themes vs the faint hairline option default). Workout exercise cards were
  **restructured**: `Card` is now a `flex items-stretch` row with equal `p-5`; the thumbnail is a
  `CardThumb size="fill"` inside an `aspect-square w-1/4 max-w-[160px] self-start` box on the right
  (~a quarter width, height-defining, right inset = card padding), and the left column is
  `flex-col justify-between` so title+badge+meta anchor to the image's top edge and the set-chips anchor
  to its bottom edge — flush top and bottom, identical rhythm across every card, no dead space. New
  CardThumb `fill` size fills a parent-controlled box. No store/AIClient change; light + dark verified
  (45/45 puppeteer assertions), no console errors.
- **2026-07-16** — **Cosmetic pass: size-responsive thumbs, restored two-up pairs, workout centering,
  visible dark borders.** `<CardThumb>` gained a `size` prop (`sm` 56→64px / `md` 88→96px) so the
  image now **scales relative to its card** instead of forcing a fixed width (superseded the old
  "same fixed size everywhere" rule that had widened half-cards into full-width stacks); square /
  object-cover / rounded-2xl are constant per tier. `StatTile` forwards `imageSize`. **Today** Calories+Protein
  and **Nutrition** Protein/Carbs + Fat/Water are back **side-by-side** (`grid sm:grid-cols-2`, collapse
  to 1-col below 640px) with `sm` thumbs on the right; the calorie hero stays full-width, no image.
  **Workout** exercise cards use `items-center` with the set-pills moved below the row, so the text block
  is vertically centered against the thumbnail (no bottom dead space). **Dark-mode input/toggle borders:**
  new `--field` / `--field-hover` tokens (dark `#7A756B` → `#A8A196`; light `#D6D1C2` → `#B0A998`) raise the
  default border to a perceptible hairline (**3.21:1** on the card, ≥3:1 AA) while keeping 4 distinct states
  (default → hover lift → sun focus ring → selected fill); applied to Field, ChipsInput, RadioGroup,
  StepGoal, StepBasics ft/in, Settings & adherence toggles, workout set-pills, progress measure inputs.
  Light mode unaffected; no store/migration/AIClient change; 23/23 puppeteer assertions pass, no console errors.
- **2026-07-15** — **Card images via `<CardThumb>` + filename-driven manifest**. New
  `src/assets/imageManifest.ts` (`import.meta.glob` eager, `slugify`, typed key→{src,alt,isPlaceholder},
  console.warn of placeholder keys) and `components/ui/CardThumb` (fixed 88px square, rounded-2xl,
  object-cover, shared `placeholder.jpg` fallback). Wired into Today (streak LEFT; calories/protein
  RIGHT — now full-width rows), Nutrition (protein/carbs/fat/water RIGHT — full-width rows), Workout
  (every exercise card RIGHT). Add a correctly-named JPEG in `src/assets/images/{today,nutrition,exercises}/`
  and it auto-replaces the placeholder with no code edits. No store/migration change.
- **2026-07-15** — **Editable profile in Settings**. New `ProfileSettings` adds a "Profile & plan"
  section with 4 editable cards (Basic / Goals / Lifestyle / Nutrition & health) that reuse the
  onboarding step components + zod in edit Sheets. Saving a **plan-affecting** field (goals, weight,
  height, age, sex, activity, days/week, location, targetDate) shows a confirm → re-runs the full AI
  pipeline via new `lib/ai/generateBundle.ts` (`analyze→plan→workout→vision`) and persists; non-plan
  edits (name/units/diet) save without regeneration. In-flight state disables save + shows a spinner;
  invalid forms are blocked. **No migration** (no persisted-shape change; schemaVersion stays 2).
- **2026-07-14** — Goals are now **multi-select (1–3)**. `GoalConfig.goal: Goal` → `goals: Goal[]`
  (first = primary, drives all formula outputs; secondaries surface in the summary + add one accessory
  exercise each). schemaVersion **1 → 2** with a migration (`{goal}` → `{goals:[goal]}`); onboarding
  StepGoal is a toggle-button multi-select with a Primary tag and max-3 disabling. Fixed a migration
  TDZ (migrations block moved above `create()`).
- **2026-07-14** — Final polish: Framer Motion micro-interactions (button press, route transitions, sliding tab
  pill, streak celebration; all reduced-motion aware), Settings screen + Reset app (clears store + IndexedDB),
  copy/tabular polish, removed dead Vite-template files. Production build passes.
- **Earlier** — Full a11y + theming audit (18/18, fixes: summary/chip 44px targets, `<main>` landmarks) ·
  all 7 features + hero + responsive shell rebuilt on the design system · data layer (types/store/storage) ·
  design system (tokens, UI components, theming, kitchen-sink). App was already scaffolded at session start;
  everything was rebuilt/verified from there.
```
