import { AIClient } from './AIClient';
import {
  Goal,
  OnboardingProfile,
  PhysiqueAnalysis,
  PhotoSet,
  UserProfile,
  TransformationPlan,
  VisionRender,
  WeeklyCheckIn,
  PlanAdjustment,
  WorkoutPlan,
  WorkoutSession,
  Exercise,
} from '../domain/types';

const GOAL_TEXT: Record<Goal, string> = {
  lose_fat: 'lose fat',
  build_muscle: 'build muscle',
  recomposition: 'recomposition',
  get_stronger: 'get stronger',
  improve_fitness: 'improve fitness',
};

// One accessory move per secondary goal — how additional goals "lightly influence"
// the session without changing the primary split. Keyed by [gym, home] variation.
const ACCESSORY: Record<Goal, { name: string; sets: number; reps: string; restSec: number; gym: string; home: string }> = {
  lose_fat: { name: 'Conditioning finisher', sets: 3, reps: '40s', restSec: 30, gym: 'Rower Intervals', home: 'Burpees' },
  build_muscle: { name: 'Hypertrophy pump', sets: 3, reps: '15 reps', restSec: 45, gym: 'Cable Fly', home: 'Slow Tempo Push-ups' },
  recomposition: { name: 'Tempo accessory', sets: 3, reps: '12 reps', restSec: 60, gym: 'Tempo Goblet Squat', home: 'Tempo Split Squat' },
  get_stronger: { name: 'Loaded carry', sets: 3, reps: '30m', restSec: 75, gym: 'Farmer Carry', home: 'Suitcase Carry (bag)' },
  improve_fitness: { name: 'Cardio finisher', sets: 3, reps: '45s', restSec: 30, gym: 'Assault Bike Intervals', home: 'Mountain Climbers' },
};

export class MvpMockAIClient implements AIClient {
  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async analyzePhotos(_input: PhotoSet | undefined, profile: UserProfile): Promise<PhysiqueAnalysis> {
    await this.delay(800);

    const bmi = profile.weightKg / Math.pow(profile.heightCm / 100, 2);
    let bodyType: PhysiqueAnalysis['bodyType'] = 'average';

    if (bmi < 19.5) {
      bodyType = 'lean';
    } else if (bmi >= 19.5 && bmi < 25) {
      bodyType = 'average';
    } else if (bmi >= 25 && bmi < 29) {
      bodyType = 'soft';
    } else {
      bodyType = 'soft'; // default or muscular based on active goals
    }

    // Customize bodyType if goal suggests muscular and activity is moderate+
    if (bmi >= 23 && bmi < 27 && profile.name.toLowerCase().includes('fit')) {
      bodyType = 'muscular';
    }

    const notes: string[] = [
      'Posture shows slight anterior pelvic tilt. Focus on core activation during standing movements.',
      'Symmetrical shoulder-to-hip ratio indicates good potential for building a V-taper silhouette.',
      'Core musculature is currently under-active. Planks and anti-rotational exercises should be prioritized.',
      'Qualitative visual check: No major joint misalignments observed. Ready for standard loading protocols.',
    ];

    return { bodyType, notes };
  }

  async generatePlan(profile: OnboardingProfile, _analysis: PhysiqueAnalysis): Promise<TransformationPlan> {
    await this.delay(1200);

    const { age, sex, heightCm, weightKg } = profile.profile;
    const { activity, daysPerWeek } = profile.lifestyle;
    const { goals, targetDate } = profile.goal;
    const goal = goals[0]; // PRIMARY goal drives calorie direction, macros, timeline
    const secondaryGoals = goals.slice(1);

    // 1. BMR Calculation (Mifflin-St Jeor)
    let bmr = 0;
    if (sex === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    // 2. TDEE multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const tdee = bmr * activityMultipliers[activity];

    // 3. Calorie Adjustments
    let calorieTarget = tdee;
    let proteinMultiplier = 1.8; // g/kg

    switch (goal) {
      case 'lose_fat':
        calorieTarget = tdee * 0.8; // -20% deficit
        proteinMultiplier = 2.1;
        break;
      case 'build_muscle':
        calorieTarget = tdee * 1.1; // +10% surplus
        proteinMultiplier = 2.0;
        break;
      case 'recomposition':
        calorieTarget = tdee * 0.95; // -5% deficit
        proteinMultiplier = 2.0;
        break;
      case 'get_stronger':
        calorieTarget = tdee * 1.07; // +7% surplus
        proteinMultiplier = 1.8;
        break;
      case 'improve_fitness':
      default:
        calorieTarget = tdee; // Maintenance
        proteinMultiplier = 1.6;
        break;
    }

    calorieTarget = Math.round(calorieTarget);

    // 4. Macro targets
    const proteinG = Math.round(weightKg * proteinMultiplier);
    const fatG = Math.round(weightKg * 0.9);
    const carbsG = Math.round(Math.max(50, (calorieTarget - (proteinG * 4 + fatG * 9)) / 4));

    // Re-adjust calories based on rounded macros
    const targetCalories = proteinG * 4 + fatG * 9 + carbsG * 4;

    const waterMl = Math.round((weightKg * 35) / 250) * 250; // rounded to nearest cup/250ml

    // 5. Steps & Sleep Goals
    let stepGoal = 10000;
    if (activity === 'sedentary' || activity === 'light') {
      stepGoal = 8000;
    } else if (activity === 'active' || activity === 'very_active') {
      stepGoal = 12000;
    }

    const sleepHours = 8;

    // 6. Timeline Calculation
    let timelineWeeks = 12;
    if (targetDate) {
      const now = new Date();
      const target = new Date(targetDate);
      const diffTime = Math.abs(target.getTime() - now.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      timelineWeeks = Math.max(4, Math.min(52, Math.round(diffDays / 7)));
    } else {
      switch (goal) {
        case 'lose_fat':
          timelineWeeks = 12;
          break;
        case 'build_muscle':
        case 'recomposition':
          timelineWeeks = 16;
          break;
        case 'improve_fitness':
          timelineWeeks = 8;
          break;
        default:
          timelineWeeks = 12;
          break;
      }
    }

    // 7. Milestones
    const milestones = [
      { week: 1, label: 'Establish routine, measure base weights, adjust to nutritional target.' },
      { week: Math.round(timelineWeeks * 0.25), label: 'First qualitative changes visible. Neuromuscular strength adaptation complete.' },
      { week: Math.round(timelineWeeks * 0.5), label: 'Mid-way check-in. Energy levels stabilizing, metabolic adaptations active.' },
      { week: Math.round(timelineWeeks * 0.75), label: 'Core transformation established. Performance metrics showing consistent progression.' },
      { week: timelineWeeks, label: 'Final target milestone reached. Body composition and habits fully locked in.' },
    ];

    const recovery = [
      'Incorporate 10-15 minutes of dynamic mobility work before every workout.',
      'Maintain a consistent sleep window: wake and sleep at similar times even on weekends.',
      'Active recovery walking (20-30 mins) recommended on non-training days.',
      'Hydrate immediately upon waking. Target at least 500ml water before caffeine.',
    ];

    const secondaryText = secondaryGoals.length
      ? ` while also working toward ${secondaryGoals.map((g) => GOAL_TEXT[g]).join(' and ')}`
      : '';
    const summary = `Built around your primary goal to ${GOAL_TEXT[goal]}${secondaryText}, over a ${timelineWeeks}-week timeline. Your daily metabolic target is ${targetCalories} kcal, supported by ${proteinG}g protein/day to sustain lean mass, a ${stepGoal.toLocaleString()}-step goal, and ${daysPerWeek} training sessions per week.`;

    return {
      createdAt: new Date().toISOString(),
      timelineWeeks,
      summary,
      nutrition: {
        calories: targetCalories,
        proteinG,
        carbsG,
        fatG,
        waterMl,
      },
      workoutFrequency: daysPerWeek,
      recovery,
      milestones,
      dailyGoals: {
        stepGoal,
        sleepHours,
      },
    };
  }

  async generateVision(profile: OnboardingProfile, analysis: PhysiqueAnalysis): Promise<VisionRender> {
    await this.delay(800);

    const goal = profile.goal.goals[0]; // primary goal drives the vision
    const bodyType = analysis.bodyType;

    let palette: VisionRender['palette'] = 'pool';
    if (goal === 'build_muscle' || goal === 'get_stronger') {
      palette = 'power';
    } else if (goal === 'improve_fitness') {
      palette = 'sun';
    } else if (goal === 'lose_fat') {
      palette = 'pool';
    } else {
      palette = 'power';
    }

    const timeline = profile.goal.targetDate ? 'your target date' : 'the next 12-16 weeks';
    const caption = `Illustrative projection of your future physique if nutrition and training goals are adhered to for ${timeline}. Results vary by individual consistency and baseline.`;

    return {
      bodyType,
      goal,
      palette,
      caption,
    };
  }

  async adjustPlan(current: TransformationPlan, checkIn: WeeklyCheckIn): Promise<PlanAdjustment> {
    await this.delay(1000);

    const changes: string[] = [];
    const newPlan = JSON.parse(JSON.stringify(current)) as TransformationPlan;

    // Adjustment rule 1: Stalled weight on a fat loss target
    // If hunger is low (<=2) and weight didn't decrease, nudge calories down
    if (checkIn.hunger <= 2 && checkIn.difficulty <= 3) {
      const calorieAdjustment = Math.round(newPlan.nutrition.calories * 0.95);
      changes.push(
        `Calorie target decreased by 5% (to ${calorieAdjustment} kcal) to overcome metabolic adaptation, based on your low hunger levels (${checkIn.hunger}/5) and consistent recovery.`
      );
      newPlan.nutrition.calories = calorieAdjustment;
      // recalculate carbs with new calories
      const proteinCal = newPlan.nutrition.proteinG * 4;
      const fatCal = newPlan.nutrition.fatG * 9;
      newPlan.nutrition.carbsG = Math.round(Math.max(50, (calorieAdjustment - (proteinCal + fatCal)) / 4));
    }

    // Adjustment rule 2: High difficulty ratings (>=4)
    if (checkIn.difficulty >= 4) {
      changes.push(
        `High physical fatigue detected (${checkIn.difficulty}/5). Added dedicated recovery protocols and suggested a 10% reduction in set volumes for the upcoming week to prevent overtraining.`
      );
      if (!newPlan.recovery.some((r) => r.includes('Fatigue protocol'))) {
        newPlan.recovery.unshift('Fatigue protocol: Reduce all workout sets by 1 active set this week.');
      }
    }

    // Adjustment rule 3: Low energy (<=2)
    if (checkIn.energy <= 2) {
      changes.push(
        `Lower sleep or daily energy noted (${checkIn.energy}/5). Sleep goal increased to 8.5 hours to optimize central nervous system recovery.`
      );
      newPlan.dailyGoals.sleepHours = 8.5;
    }

    if (changes.length === 0) {
      changes.push(
        'Consistency check: Adherence and progress are on target. Current calorie levels and workout programs remain unchanged for this cycle.'
      );
    }

    return {
      changedAt: new Date().toISOString(),
      changes,
      newPlan,
    };
  }

  // Generates the daily workout session structures
  generateWorkoutSessions(profile: OnboardingProfile): WorkoutPlan {
    const goal = profile.goal.goals[0]; // PRIMARY goal drives the split
    const secondaryGoals = profile.goal.goals.slice(1);
    const { location, daysPerWeek } = profile.lifestyle;

    const sessions: WorkoutSession[] = [];

    // Helper to generate exercise items
    const createExercise = (name: string, sets: number, reps: string, restSec: number, gymMove: string, homeMove: string): Exercise => {
      const isHome = location === 'home';
      const finalName = name ? (isHome ? homeMove : gymMove) : (isHome ? homeMove : gymMove);
      return {
        name: finalName,
        sets,
        reps,
        restSec,
        variation: isHome ? 'home' : 'gym',
      };
    };

    for (let i = 1; i <= daysPerWeek; i++) {
      let title = `Workout Session ${i}`;
      let exercises: Exercise[] = [];
      let estimatedMinutes = 45;

      if (goal === 'lose_fat' || goal === 'improve_fitness') {
        title = `Session ${i}: Full Body Conditioning`;
        estimatedMinutes = 40;
        exercises = [
          createExercise('Squats', 3, '12-15 reps', 60, 'Barbell Back Squat', 'Bodyweight Prisoner Squat'),
          createExercise('Chest Press', 3, '10-12 reps', 60, 'Dumbbell Bench Press', 'Decline Push-ups'),
          createExercise('Rowing', 3, '12 reps', 60, 'Seated Cable Row', 'Dumbbell Row / Band Row'),
          createExercise('Shoulder Press', 3, '12 reps', 60, 'Standing DB Overhead Press', 'Pike Push-ups'),
          createExercise('Core Work', 3, '45s hold', 45, 'Weighted Cable Crunch', 'Plank with Shoulder Taps'),
        ];
      } else if (goal === 'build_muscle' || goal === 'get_stronger') {
        const isSplitUpper = i % 2 === 1;
        title = isSplitUpper ? `Session ${i}: Upper Body Focus` : `Session ${i}: Lower Body Focus`;
        estimatedMinutes = 55;

        if (isSplitUpper) {
          exercises = [
            createExercise('Heavy Press', 4, '6-8 reps', 90, 'Barbell Bench Press', 'Weighted Push-ups (Pack)'),
            createExercise('Vertical Pull', 4, '8-10 reps', 90, 'Pull-ups or Lat Pulldown', 'Resistance Band Door Lat Pulls'),
            createExercise('Shoulder Builder', 3, '10-12 reps', 75, 'Seated Dumbbell Shoulder Press', 'Pike Press / Band Lateral Raise'),
            createExercise('Horizontal Row', 3, '10 reps', 75, 'T-Bar Chest Row', 'Dumbbell Single-arm Row'),
            createExercise('Arm Finish', 2, '12-15 reps', 60, 'Barbell Bicep Curls', 'Band Hammer Curls'),
          ];
        } else {
          exercises = [
            createExercise('Heavy Squat', 4, '6-8 reps', 90, 'Barbell Back Squat', 'Goblet Squat (Heavy Bag)'),
            createExercise('Posterior Chain', 4, '8-10 reps', 90, 'Barbell Romanian Deadlift', 'Single-Leg RDL (Dumbbell)'),
            createExercise('Quad Burn', 3, '12 reps', 75, 'Leg Press or Dumbbell Lunges', 'Walking Lunges'),
            createExercise('Calf Raise', 3, '15 reps', 60, 'Standing Calf Raise Machine', 'Single-leg Bodyweight Calf Raise'),
            createExercise('Core Strength', 3, '15 reps', 60, 'Hanging Knee Raise', 'Lying Leg Raises'),
          ];
        }
      } else {
        // Recomposition / default
        title = `Session ${i}: Full Body Strength & Core`;
        exercises = [
          createExercise('Leg Compound', 3, '8-10 reps', 75, 'Leg Press / Goblet Squat', 'Goblet Squats'),
          createExercise('Chest Compound', 3, '8-10 reps', 75, 'Incline Dumbbell Bench Press', 'Push-ups'),
          createExercise('Back Compound', 3, '10 reps', 75, 'Chest-Supported Row', 'Resistance Band Pull-aparts'),
          createExercise('Posterior Chain', 3, '10 reps', 75, 'Dumbbell Romanian Deadlift', 'Single-leg Glute Bridges'),
          createExercise('Core Focus', 3, '12 reps', 60, 'Ab Wheel Rollouts', 'Deadbugs'),
        ];
      }

      // Secondary goals lightly influence the session: one accessory move each.
      for (const sg of secondaryGoals) {
        const acc = ACCESSORY[sg];
        exercises.push(createExercise(acc.name, acc.sets, acc.reps, acc.restSec, acc.gym, acc.home));
        estimatedMinutes += 5;
      }

      sessions.push({
        id: `sess-${i}`,
        day: `Workout ${i}`,
        title,
        estimatedMinutes,
        exercises,
      });
    }

    return { sessions };
  }
}
