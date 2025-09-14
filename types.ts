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
  imageAnalysis?: MedicalImageAnalysis[];
}

// Re-export medical image types
export * from './medicalImageTypes';

export interface InvestigationState {
  originalQuery: string;
  plan: ResearchStep[];
  currentStep: number;
  isGenerating: boolean;
  error: string | null;
  finalReport: string | null;
  finalReportSources: Source[] | null;
  isGeneratingReport: boolean;
}