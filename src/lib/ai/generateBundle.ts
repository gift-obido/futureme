import type { AIClient } from './AIClient';
import type {
  OnboardingProfile,
  PhysiqueAnalysis,
  TransformationPlan,
  VisionRender,
  WorkoutPlan,
} from '../domain/types';

export interface PlanBundle {
  analysis: PhysiqueAnalysis;
  plan: TransformationPlan;
  workout: WorkoutPlan;
  vision: VisionRender;
}

/**
 * Runs the full (mocked) AI pipeline for a profile — the same sequence and
 * ordering as onboarding — so a profile edit regenerates an identical, coherent
 * bundle. `generateWorkoutSessions` is a mock-only extension of the AIClient.
 */
export async function generateBundle(ai: AIClient, profile: OnboardingProfile): Promise<PlanBundle> {
  const analysis = await ai.analyzePhotos(profile.photos, profile.profile);
  const plan = await ai.generatePlan(profile, analysis);
  const genWorkout = (ai as unknown as {
    generateWorkoutSessions?: (p: OnboardingProfile) => WorkoutPlan;
  }).generateWorkoutSessions;
  const workout: WorkoutPlan = genWorkout ? genWorkout(profile) : { sessions: [] };
  const vision = await ai.generateVision(profile, analysis);
  return { analysis, plan, workout, vision };
}
