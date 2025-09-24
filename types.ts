export type StepStatus = 'pending' | 'in-progress' | 'completed' | 'error';

export interface Source {
  web: {
    uri: string;
    title: string;
  };
}

export interface StepFeedback {
  stepId: number;
  observations: string;
  additionalData: string;
  clinicalFindings: string;
  recommendations: string;
  confidence: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface ResearchStep {
  id: number;
  title: string;
  status: StepStatus;
  result: string | null;
  prompt: string;
  sources: Source[] | null;
  feedback?: StepFeedback;
  imageAnalysis?: any[];
}

// Re-export medical image types (commented out until file exists)
// export * from './medicalImageTypes';

export interface InvestigationState {
  originalQuery: string;
  plan: ResearchStep[];
  currentStep: number;
  isGenerating: boolean;
  error: string | null;
  finalReport: string | null;
  finalReportSources: Source[] | null;
  isGeneratingReport: boolean;
  generationError?: {
    type: 'retryable' | 'permanent';
    message: string;
    originalError: string;
  };
  enhancedSources?: any[];
  qualityMetrics?: {
    averageQuality: number;
    highQualityCount: number;
    openAccessCount: number;
    recentPublications: number;
  };
  sourcesBreakdown?: {
    pubmed: number;
    google: number;
    cochrane: number;
    clinical_trials: number;
    other: number;
  };
}