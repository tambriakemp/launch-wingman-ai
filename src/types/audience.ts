// Audience data type used across funnel components
export interface AudienceData {
  niche: string;
  targetAudience: string;
  primaryPainPoint: string;
  desiredOutcome: string;
  problemStatement: string;
  // Extended Value Equation fields
  painSymptoms?: string[];
  mainObjections?: string;
  likelihoodElements?: Array<{ type: string; content: string }>;
  timeEffortElements?: Array<{ type: string; content: string }>;
}
