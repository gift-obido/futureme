# ProductPort — FutureMe (MVP PRD)

> **FutureMe** is a mobile-first body-transformation planner. It turns a short onboarding into a personalized workout + nutrition roadmap, shows users an inspiring picture of where they're headed, and gives them one clear thing to do every day.

**Status:** MVP · **Owner:** _you_ · **Last updated:** 2026-07-08

---

## 1. Overview & Vision

Most fitness apps overwhelm users with logging and choice. FutureMe does the opposite: it front-loads the emotional payoff ("here's your future self and the plan to get there") and then reduces each day to a single, followable mission. The intelligence *feels* like a coach; the interface stays minimal and premium.

**Product principles**
1. **Emotion first, then execution.** The hero is the transformation vision, not a spreadsheet.
2. **One decision per day.** "Today's Mission" removes guesswork.
3. **Consistency over precision.** Simple adherence beats obsessive tracking.
4. **The plan evolves.** Weekly check-ins refine it so it never goes stale.

---

## 2. Goals & Non-Goals (MVP)

**Goals**
- Complete onboarding → generated plan in under 3 minutes.
- Deliver all seven core features end-to-end with believable, deterministic "AI" output.
- Ship a premium, accessible (WCAG 2.1 AA), mobile-first experience with light + dark modes.
- Keep the codebase backend-free but *backend-ready*, so real AI and persistence can be added without a rewrite.

**Non-Goals (explicitly out of scope for MVP)**
- Real accounts, login, or cloud sync (localStorage only).
- Live LLM / vision / image-generation calls (mocked behind an interface).
- Photorealistic future-body generation.
- Barcode scanning or granular food logging.
- Social features, coaching marketplace, payments.

---

## 3. Target User

Motivated beginners-to-intermediates who want structure without complexity: they'll follow a good plan if it's handed to them clearly, but they abandon apps that demand heavy data entry. Primary device is a phone.

---

## 4. Locked Decisions (from discovery)

| Decision | Choice | Implication |
|---|---|---|
| AI execution | **Mock now, real later** | All AI behind a typed `AIClient`; `MockAIClient` uses formulas. |
| Backend / data | **Frontend-only prototype** | Zustand + `localStorage`; **photos in IndexedDB** (localStorage ~5 MB quota can't hold base64 images). |
| Platform | **Mobile-first**, scales up | Design at 390px first; enhance for tablet/desktop. |
| FutureMe Vision | **Stylized projection** | Illustrative render driven by goal + body type; framed as illustrative, not a guarantee. |
| Photo analysis | **Qualitative** | Visible body type / proportions / posture — never a body-fat %. |
| Units | Metric **and** imperial | Toggle in onboarding; store canonical metric, display either. |
| Type | Fraunces (display/serif) + Inter (body) | Serif for emotional headlines, sans for data + reading. |

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Type-safe data model + AI seam. |
| Framework | **React 18** | Requested. |
| Build tool | **Vite** | Fast, ideal for a frontend-only SPA. |
| Styling | **Tailwind CSS** | Requested; drives the design-token system + dark mode via `class`. |
| Routing | **React Router** | Multi-screen flow. |
| State | **Zustand** (+ `persist` middleware) | Minimal global store, localStorage persistence out of the box. |
| Photo storage | **IndexedDB** via `idb-keyval` | Large binary photos, outside the localStorage quota. |
| Forms | **react-hook-form** + **zod** | Robust multi-step onboarding + schema validation. |
| Charts | **Recharts** | Progress weight/adherence charts. |
| Animation | **Framer Motion** | Loading sequence + delightful, `prefers-reduced-motion`-aware transitions. |
| Icons | **lucide-react** | Clean, consistent line icons. |
| Fonts | **Fraunces** + **Inter** (self-hosted via Fontsource) | Premium serif/sans pairing, offline-safe. |
| Testing (optional) | Vitest + React Testing Library | Cover the mock engine + onboarding validation. |

---

## 6. Architecture

### 6.1 The AI seam (the most important abstraction)

Everything "smart" goes through one interface so the mock can be swapped for real Claude/image calls later with zero UI changes.

```ts
export interface AIClient {
  analyzePhotos(input: PhotoSet, profile: UserProfile): Promise<PhysiqueAnalysis>;
  generatePlan(profile: OnboardingProfile, analysis: PhysiqueAnalysis): Promise<TransformationPlan>;
  generateVision(profile: OnboardingProfile, analysis: PhysiqueAnalysis): Promise<VisionRender>;
  adjustPlan(current: TransformationPlan, checkIn: WeeklyCheckIn): Promise<PlanAdjustment>;
}
```

- **MvpMockAIClient** implements all four using the formulas in §9 with small realistic delays (to justify the loading sequence).
- A future **ClaudeAIClient** (text/vision) + image-model client implements the same interface. UI depends only on `AIClient`, injected via a small `AIProvider` context.

### 6.2 Storage strategy

- **Structured state** (profile, plan, logs, check-ins) → Zustand `persist` → `localStorage` under a single versioned key (`futureme:v1`).
- **Photos** (onboarding + progress) → **IndexedDB**; the store holds only string keys/refs, never base64 blobs.
- A `migrations` map keyed by schema version guards against shape changes.

### 6.3 Screen map (routes)

```
/onboarding        → multi-step wizard + loading sequence
/                  → Meet Your FutureMe (hero) — first stop after onboarding
/today             → Today's Mission dashboard (daily home)
/workout           → Workout Planner (session runner)
/nutrition         → Nutrition Targets
/progress          → Progress Tracker
/check-in          → Weekly Check-In
```

A persistent bottom tab bar (mobile) / side rail (desktop) covers Today, Workout, Nutrition, Progress.

---

## 7. Design System

### 7.1 Color roles

Canonical palette:

| Token | Hex | Name |
|---|---|---|
| `power` | `#7F7767` | muted taupe/brown |
| `sun` | `#F9F095` | pale yellow |
| `pool` | `#D6E6E4` | ice/mint blue |
| `neutral` | `#F4F3EB` | warm off-white |
| `strength` | `#000000` | black |

**Light mode**
- Background: `neutral`; elevated cards: white / `pool` for info panels.
- Body text & headings: `strength` (near-black `#151412` acceptable for softer body copy).
- Primary accent / brand: `power` — **large text, borders, secondary UI only** (see contrast note).
- Highlight / CTA fills, streaks, achievements: `sun` **as a fill with black text**.

**Dark mode** (warm, not pure-black, to avoid OLED smear + glare)
- Base surface: `#141310`; elevated: `#211F19`; hairlines: `#33302A`.
- Text: `neutral` off-white (high contrast, low harshness).
- Accents: `power` works as-is; `sun` and `pool` used **sparingly and dimmed** to avoid glare.

Implement via CSS variables + Tailwind `darkMode: 'class'`; theme choice persisted and defaulting to `prefers-color-scheme`.

### 7.2 Typography

- **Fraunces** — hero/emotional headlines, section titles, big numbers on the vision screen. Optical size + slight softness gives the premium feel.
- **Inter** — body, forms, data, labels, buttons. Tabular numerals for stats.
- Scale (mobile): display 40/32, h1 28, h2 22, h3 18, body 16, caption 13. Generous line-height (1.5 body), tight tracking on display.

### 7.3 Accessibility commitments (WCAG 2.1 AA)

- **Contrast:** 4.5:1 for body text, 3:1 for large text/UI. **Never** use `sun` or `power` as small text on light backgrounds (both fail) — use black for body; reserve `power` for ≥24px/large-bold and `sun` as a black-on-yellow fill.
- **Keyboard:** every flow (incl. the onboarding wizard and workout runner) fully operable by keyboard; visible 2px focus ring with offset.
- **Motion:** honor `prefers-reduced-motion` — the loading sequence and transitions degrade to instant/opacity-only.
- **Forms:** programmatic labels, inline errors announced via `aria-live`, step progress exposed to SR.
- **Targets:** ≥44×44px tap targets; status never conveyed by color alone (icon + text).
- **Semantics:** landmark regions, one `h1` per screen, alt text on photos/illustrations.

---

## 8. Feature Specs

### 8.0 Onboarding (pre-plan)

Multi-step wizard, one concept per screen, progress indicator, back/skip where noted.

1. **Basic Information** — Name, Age, Sex, Height, Weight (+ metric/imperial toggle).
2. **Goal** — one of: Lose Fat · Build Muscle · Recomposition · Get Stronger · Improve Fitness. Then a **single** follow-up: *Do you have a target date?* → **Let AI decide** or **Pick a date**.
3. **Lifestyle** — Activity level (Sedentary→Very active), Workout location (Gym / Home / Both), Days/week available (2–6).
4. **Nutrition & Health** — Dietary preference; Food allergies (optional); Injuries/limitations (optional).
5. **Photos** — Upload Front / Side / Back. Copy: *"Your photos are encrypted and only used to build your personalized plan."* (MVP: stored locally in IndexedDB; no upload leaves the device.)
6. **Create My Plan** CTA → **loading sequence** with sequential ticks:
   `Analyzing your body… ✓  Understanding your physique ✓  Calculating calorie needs ✓  Creating your workout plan ✓  Building your nutrition strategy ✓  Preparing your FutureMe ✓`
   Backed by real `AIClient` calls (mocked), then routes to **Meet Your FutureMe**.

### 8.1 Meet Your FutureMe (Hero)

Current photo · **FutureMe Vision** (stylized illustrative projection driven by goal + body type) · transformation summary · target timeline · daily calorie target · protein target · workout frequency · primary CTA **Start My Transformation** → `/today`. Carries an "illustrative projection" microcopy line.

### 8.2 AI Transformation Planner

Generates and stores: workout plan, daily calorie target, macros, weekly schedule, recovery recommendations, weekly milestones. Runs automatically after onboarding; re-runs on check-in adjustments.

### 8.3 Today's Mission Dashboard (daily home)

Today's workout · calories remaining · protein remaining · water goal · step goal · sleep goal · daily progress ring · current streak. Tapping any tile deep-links to the relevant feature. Simple tap-to-complete for water/steps/sleep/workout.

### 8.4 Workout Planner

Exercise list · sets & reps · rest periods · estimated duration · Home/Gym variation (from onboarding) · **Complete Workout** button. A lightweight session runner: check off sets, rest timer, mark complete → updates streak + today's progress.

### 8.5 Nutrition Targets

Daily calorie target · protein · carbs · fat · water goal · simple daily adherence tracking (hit / partial / miss, not gram-by-gram logging).

### 8.6 Progress Tracker

Weight progress (chart) · progress photos · body measurements (optional) · workout consistency · nutrition adherence · transformation progress % (derived from time-elapsed + adherence + weight trend vs. target).

### 8.7 Weekly Check-In

Weekly weight update · progress photo upload · energy rating · hunger rating · workout difficulty rating · **automatic AI plan adjustments** (via `adjustPlan`, mocked): e.g., stalled weight + low hunger → small calorie nudge; high difficulty → deload suggestion. Surfaces a plain-language "what changed and why."

---

## 9. Data Model

Canonical storage is **metric**; display converts. All entities below are the persisted shapes.

```ts
type Sex = 'male' | 'female';
type Units = 'metric' | 'imperial';
type Goal = 'lose_fat' | 'build_muscle' | 'recomposition' | 'get_stronger' | 'improve_fitness';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Location = 'gym' | 'home' | 'both';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  units: Units;              // display preference only
}

interface GoalConfig {
  goal: Goal;
  targetDate: string | null; // ISO date, or null = "let AI decide"
}

interface Lifestyle {
  activity: ActivityLevel;
  location: Location;
  daysPerWeek: number;       // 2–6
}

interface NutritionHealth {
  dietaryPreference: string;      // e.g. 'none' | 'vegetarian' | 'vegan' | 'halal' | 'keto' | ...
  allergies?: string[];
  injuries?: string[];
}

interface PhotoRef { key: string; capturedAt: string; } // IndexedDB key, not the blob
interface PhotoSet { front: PhotoRef; side: PhotoRef; back: PhotoRef; }

interface OnboardingProfile {
  profile: UserProfile;
  goal: GoalConfig;
  lifestyle: Lifestyle;
  health: NutritionHealth;
  photos?: PhotoSet;
}

interface PhysiqueAnalysis {          // qualitative only
  bodyType: 'lean' | 'average' | 'soft' | 'muscular';
  notes: string[];
}

interface MacroTargets { calories: number; proteinG: number; carbsG: number; fatG: number; }

interface Milestone { week: number; label: string; }

interface TransformationPlan {
  createdAt: string;
  timelineWeeks: number;
  summary: string;
  nutrition: MacroTargets & { waterMl: number };
  workoutFrequency: number;           // sessions/week
  recovery: string[];
  milestones: Milestone[];
  dailyGoals: { stepGoal: number; sleepHours: number };
}

interface Exercise {
  name: string; sets: number; reps: string; restSec: number;
  variation: 'gym' | 'home';
}
interface WorkoutSession {
  id: string; day: string; title: string;
  estimatedMinutes: number; exercises: Exercise[];
}
interface WorkoutPlan { sessions: WorkoutSession[]; }

interface VisionRender {               // params for the stylized illustration
  bodyType: PhysiqueAnalysis['bodyType'];
  goal: Goal;
  palette: 'sun' | 'pool' | 'power';
  caption: string;                     // "illustrative projection" framing
}

interface DailyLog {
  date: string;                        // ISO date
  workoutDone: boolean;
  caloriesConsumed: number;
  proteinConsumed: number;
  waterMl: number; steps: number; sleepHours: number;
  adherence: 'hit' | 'partial' | 'miss';
}

interface ProgressEntry {
  date: string; weightKg: number;
  measurements?: Record<string, number>;
  photo?: PhotoRef;
}

interface WeeklyCheckIn {
  weekOf: string; weightKg: number; photo?: PhotoRef;
  energy: 1|2|3|4|5; hunger: 1|2|3|4|5; difficulty: 1|2|3|4|5;
}
interface PlanAdjustment {
  changedAt: string; changes: string[]; newPlan: TransformationPlan;
}

interface AppState {
  schemaVersion: 1;
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
```

### 9.1 Mock engine formulas (so output is believable)

- **BMR (Mifflin-St Jeor):** male `10·kg + 6.25·cm − 5·age + 5`; female `… − 161`.
- **TDEE = BMR × activity:** sedentary 1.2 · light 1.375 · moderate 1.55 · active 1.725 · very_active 1.9.
- **Calorie target by goal:** lose_fat −20% · build_muscle +10% · recomposition −5% · get_stronger +7% · improve_fitness ±0.
- **Protein (g/kg):** lose_fat 2.1 · build_muscle 2.0 · recomposition 2.0 · get_stronger 1.8 · improve_fitness 1.6.
- **Fat:** ~0.9 g/kg. **Carbs:** remaining calories ÷ 4.
- **Water:** `35 ml × kg` (rounded). **Steps:** 8k (sedentary/light) → 10k (active+). **Sleep:** 7–9h.
- **Timeline (when "let AI decide"):** fat loss ≈ 0.7% bodyweight/week to target; muscle/strength default 12–16 weeks; fitness 8 weeks.
- **Workout template** chosen by `goal × daysPerWeek × location` (e.g., build_muscle+4d → upper/lower ×2; get_stronger → compound, lower reps; lose_fat → full-body + conditioning). Home variations swap barbell/machine moves for bodyweight/band equivalents.
- **Check-in adjustment rules (mock):** weight stalled 2+ weeks & hunger ≤2 → −5% calories; difficulty ≥4 two weeks → insert deload; energy ≤2 → +sleep emphasis + small carb bump.

---

## 10. Success Metrics (lightweight)

- Onboarding completion rate; time-to-plan < 3 min.
- % of days a mission is opened; 7-day streak rate.
- Weekly check-in completion.
- (Qualitative) users describe the FutureMe hero as motivating.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| localStorage quota overflow from photos | Photos in IndexedDB; only refs in localStorage. |
| Mock plans feel fake | Real formulas + realistic timing + plain-language rationale. |
| Body-image sensitivity of the vision | Stylized (non-photoreal) + "illustrative projection" framing; no clinical numbers. |
| Palette contrast failures | Enforce color-role rules (§7.3); never `sun`/`power` as small text. |
| Rework when real AI lands | Single `AIClient` seam isolates all AI. |

---

## 12. Post-MVP

Real accounts + cloud sync · Claude-powered plan generation & check-in reasoning · real photo vision · real (opt-in, consent-gated) image generation for the vision · food logging · reminders/notifications · export/share.
