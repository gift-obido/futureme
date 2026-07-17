import {
  OnboardingProfile,
  PhysiqueAnalysis,
  PhotoSet,
  UserProfile,
  TransformationPlan,
  VisionRender,
  WeeklyCheckIn,
  PlanAdjustment,
} from '../domain/types';

export interface AIClient {
  analyzePhotos(input: PhotoSet | undefined, profile: UserProfile): Promise<PhysiqueAnalysis>;
  generatePlan(profile: OnboardingProfile, analysis: PhysiqueAnalysis): Promise<TransformationPlan>;
  generateVision(profile: OnboardingProfile, analysis: PhysiqueAnalysis): Promise<VisionRender>;
  adjustPlan(current: TransformationPlan, checkIn: WeeklyCheckIn): Promise<PlanAdjustment>;
}
