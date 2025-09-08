export type StepStatus = 'pending' | 'in-progress' | 'completed' | 'error';

export interface Source {
  web: {
    uri: string;
    title: string;
  };
}

export interface ResearchStep {
  id: number;
  title: string;
  status: StepStatus;
  result: string | null;
  prompt: string;
  sources: Source[] | null;
}

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