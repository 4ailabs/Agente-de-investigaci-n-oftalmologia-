// Base provider interface for AI research services
export interface ResearchProvider {
  name: string;
  capabilities: ProviderCapabilities;
  generateContent(prompt: string, config?: ResearchConfig): Promise<ResearchResult>;
}

export interface ProviderCapabilities {
  hasWebSearch: boolean;
  hasDeepResearch: boolean;
  maxQueries: number;
  sourceValidation: boolean;
  iterativeRefinement: boolean;
}

export interface ResearchConfig {
  mode: 'manual' | 'deep_research' | 'hybrid';
  maxSources: number;
  searchDepth: 'basic' | 'comprehensive';
  timeoutMinutes: number;
  medicalSpecialty?: string;
}

export interface ResearchResult {
  content: string;
  sources: Source[];
  metadata: ResearchMetadata;
  process?: ResearchProcess; // Para transparencia
  enhancedSources?: any[]; // Enhanced medical sources
  qualityMetrics?: any; // Quality metrics from medical sources
  sourcesBreakdown?: any; // Sources breakdown by type
}

export interface ResearchMetadata {
  provider: string;
  mode: string;
  executionTime: number;
  sourcesAnalyzed: number;
  queriesExecuted: number;
  confidenceScore: number;
}

export interface ResearchProcess {
  planningPhase: {
    strategy: string;
    identifiedTopics: string[];
    estimatedQueries: number;
  };
  executionPhase: {
    queriesExecuted: SearchQuery[];
    sourcesFound: number;
    refinementIterations: number;
  };
  synthesisPhase: {
    evidenceGrading: EvidenceGrade[];
    contradictionsFound: number;
    gapsIdentified: string[];
  };
}

export interface SearchQuery {
  query: string;
  timestamp: Date;
  resultsCount: number;
  relevanceScore: number;
}

export interface EvidenceGrade {
  source: string;
  grade: 'A' | 'B' | 'C' | 'D';
  reasoning: string;
}

export interface Source {
  web: {
    uri: string;
    title: string;
    snippet?: string;
  };
  relevanceScore?: number;
  evidenceGrade?: string;
}

// Factory para crear providers
export class ProviderFactory {
  private static providers: Map<string, ResearchProvider> = new Map();

  static registerProvider(provider: ResearchProvider) {
    this.providers.set(provider.name, provider);
  }

  static getProvider(name: string): ResearchProvider | null {
    return this.providers.get(name) || null;
  }

  static getAvailableProviders(): ResearchProvider[] {
    return Array.from(this.providers.values());
  }

  static getBestProvider(requirements: Partial<ProviderCapabilities>): ResearchProvider | null {
    const providers = Array.from(this.providers.values());
    
    // Score providers based on requirements
    const scoredProviders = providers.map(provider => {
      let score = 0;
      if (requirements.hasWebSearch && provider.capabilities.hasWebSearch) score += 3;
      if (requirements.hasDeepResearch && provider.capabilities.hasDeepResearch) score += 5;
      if (requirements.sourceValidation && provider.capabilities.sourceValidation) score += 2;
      if (requirements.iterativeRefinement && provider.capabilities.iterativeRefinement) score += 4;
      
      return { provider, score };
    });

    scoredProviders.sort((a, b) => b.score - a.score);
    return scoredProviders[0]?.provider || null;
  }
}