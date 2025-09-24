import { 
  ResearchProvider, 
  ProviderFactory, 
  ResearchConfig, 
  ResearchResult 
} from './aiProviders/baseProvider';
import { DeepResearchProvider } from './aiProviders/deepResearchProvider';
import { ManualResearchProvider } from './aiProviders/manualProvider';
import { InvestigationState, ResearchStep } from '../types';
import { createResearchPlanPrompt, createExecuteStepPrompt } from '../constants';

// Tipos específicos para el orchestrator
export interface ResearchRequest {
  query: string;
  mode: 'manual' | 'deep_research' | 'hybrid' | 'auto';
  patientContext?: PatientContext;
  preferences?: UserPreferences;
}

export interface PatientContext {
  age?: number;
  sex?: 'M' | 'F';
  symptoms: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  urgency: 'routine' | 'urgent' | 'emergency';
}

export interface UserPreferences {
  preferredSources: string[];
  maxTimeMinutes: number;
  detailLevel: 'concise' | 'detailed' | 'exhaustive';
}

export class ResearchOrchestrator {
  private static instance: ResearchOrchestrator;
  private providers: Map<string, ResearchProvider> = new Map();

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): ResearchOrchestrator {
    if (!ResearchOrchestrator.instance) {
      ResearchOrchestrator.instance = new ResearchOrchestrator();
    }
    return ResearchOrchestrator.instance;
  }

  private initializeProviders() {
    // Register available providers
    try {
      const deepProvider = new DeepResearchProvider();
      const manualProvider = new ManualResearchProvider();

      this.providers.set(deepProvider.name, deepProvider);
      this.providers.set(manualProvider.name, manualProvider);

      ProviderFactory.registerProvider(deepProvider);
      ProviderFactory.registerProvider(manualProvider);

      console.log('Research providers initialized:', Array.from(this.providers.keys()));
    } catch (error) {
      console.error('Failed to initialize providers:', error);
    }
  }

  // Main entry point - intelligent mode selection
  async conductResearch(request: ResearchRequest): Promise<InvestigationState> {
    console.log(`🔬 Starting research with mode: ${request.mode}`);
    
    try {
      // Auto-select best mode if requested
      const selectedMode = request.mode === 'auto' 
        ? this.selectOptimalMode(request) 
        : request.mode;

      console.log(`📋 Selected research mode: ${selectedMode}`);

      switch (selectedMode) {
        case 'deep_research':
          return await this.conductDeepResearch(request);
        
        case 'manual':
          return await this.conductManualResearch(request);
        
        case 'hybrid':
          return await this.conductHybridResearch(request);
        
        default:
          throw new Error(`Unsupported research mode: ${selectedMode}`);
      }
    } catch (error) {
      console.error('Research failed:', error);
      throw error;
    }
  }

  // Deep Research - Single autonomous investigation
  private async conductDeepResearch(request: ResearchRequest): Promise<InvestigationState> {
    const provider = this.providers.get('gemini_deep_research');
    if (!provider) {
      throw new Error('Deep Research provider not available');
    }

    const config: ResearchConfig = {
      mode: 'deep_research',
      maxSources: 25,
      searchDepth: 'comprehensive',
      timeoutMinutes: request.preferences?.maxTimeMinutes || 10,
      medicalSpecialty: 'oftalmologia'
    };

    console.log('🤖 Executing Deep Research...');
    const startTime = Date.now();

    const result = await provider.generateContent(request.query, config);
    
    console.log(`✅ Deep Research completed in ${Date.now() - startTime}ms`);

    // Convert Deep Research result to InvestigationState format
    return this.convertDeepResearchToInvestigation(result, request.query);
  }

  // Manual Research - Traditional step-by-step (your current system)
  private async conductManualResearch(request: ResearchRequest): Promise<InvestigationState> {
    console.log('🎯 Executing Manual Research (traditional mode)...');
    
    // Use existing logic from your App.tsx
    const planPrompt = createResearchPlanPrompt(request.query);
    const provider = this.providers.get('gemini_manual');
    
    if (!provider) {
      throw new Error('Manual Research provider not available');
    }

    const planResult = await provider.generateContent(planPrompt);
    
    // Parse plan into steps (reuse your existing logic)
    const steps = this.parsePlanToSteps(planResult.content);

    return {
      originalQuery: request.query,
      plan: steps,
      currentStep: 0,
      isGenerating: false,
      error: null,
      finalReport: null,
      finalReportSources: null,
      isGeneratingReport: false,
      researchMetadata: {
        mode: 'manual',
        provider: 'gemini_manual',
        totalExecutionTime: planResult.metadata.executionTime
      }
    };
  }

  // Hybrid Research - Deep Research + Manual transparency
  private async conductHybridResearch(request: ResearchRequest): Promise<InvestigationState> {
    console.log('⚡ Executing Hybrid Research...');
    
    // First, do Deep Research
    const deepResult = await this.conductDeepResearch({
      ...request,
      mode: 'deep_research'
    });

    // Then, create manual steps for transparency
    const manualSteps = await this.createTransparencySteps(deepResult, request.query);

    // Combine results
    return {
      ...deepResult,
      plan: manualSteps,
      researchMetadata: {
        mode: 'hybrid',
        provider: 'gemini_deep_research',
        totalExecutionTime: deepResult.researchMetadata?.totalExecutionTime || 0,
        transparencySteps: manualSteps.length
      }
    };
  }

  // Intelligent mode selection based on case complexity
  private selectOptimalMode(request: ResearchRequest): 'manual' | 'deep_research' | 'hybrid' {
    const context = request.patientContext;
    
    if (!context) return 'hybrid'; // Safe default

    // Calculate complexity score
    let complexityScore = 0;
    
    // Age factor
    if (context.age && (context.age < 18 || context.age > 65)) complexityScore += 1;
    
    // Symptom count
    complexityScore += Math.min(context.symptoms.length, 3);
    
    // Explicit complexity
    switch (context.complexity) {
      case 'complex': complexityScore += 3; break;
      case 'moderate': complexityScore += 2; break;
      case 'simple': complexityScore += 1; break;
    }

    // Urgency factor
    switch (context.urgency) {
      case 'emergency': complexityScore += 2; break;
      case 'urgent': complexityScore += 1; break;
    }

    console.log(`📊 Complexity score: ${complexityScore}`);

    // Decision logic
    if (complexityScore >= 6) return 'deep_research';
    if (complexityScore <= 2) return 'manual';
    return 'hybrid';
  }

  // Convert Deep Research result to traditional investigation format
  private convertDeepResearchToInvestigation(
    result: ResearchResult, 
    originalQuery: string
  ): InvestigationState {
    // Create multiple steps to allow feedback on different aspects
    const deepResearchSteps: ResearchStep[] = [
      {
        id: 1,
        title: 'Análisis Inicial y Búsqueda de Evidencia',
        status: 'completed',
        result: 'Estrategia de búsqueda ejecutada con Google Search',
        prompt: 'Búsqueda de evidencia médica especializada',
        sources: result.sources?.slice(0, Math.ceil(result.sources.length / 3)) || []
      },
      {
        id: 2,
        title: 'Análisis Diferencial y Evaluación Clínica',
        status: 'completed',
        result: 'Análisis diferencial basado en evidencia encontrada',
        prompt: 'Evaluación de diagnósticos diferenciales',
        sources: result.sources?.slice(Math.ceil(result.sources.length / 3), Math.ceil(2 * result.sources.length / 3)) || []
      },
      {
        id: 3,
        title: 'Síntesis Final y Recomendaciones',
        status: 'completed',
        result: result.content,
        prompt: 'Síntesis clínica final con recomendaciones',
        sources: result.sources?.slice(Math.ceil(2 * result.sources.length / 3)) || []
      }
    ];

    return {
      originalQuery,
      plan: deepResearchSteps,
      currentStep: 3,
      isGenerating: false,
      error: null,
      finalReport: result.content, // Deep Research result IS the final report
      finalReportSources: result.sources,
      isGeneratingReport: false,
      researchMetadata: {
        mode: 'deep_research',
        provider: result.metadata.provider,
        totalExecutionTime: result.metadata.executionTime,
        sourcesAnalyzed: result.metadata.sourcesAnalyzed,
        queriesExecuted: result.metadata.queriesExecuted,
        confidenceScore: result.metadata.confidenceScore,
        deepResearchProcess: result.process
      }
    };
  }

  // Create transparency steps for hybrid mode
  private async createTransparencySteps(
    deepResult: InvestigationState,
    query: string
  ): Promise<ResearchStep[]> {
    if (!deepResult.researchMetadata?.deepResearchProcess) {
      // Fallback: create generic transparency steps
      return this.createGenericTransparencySteps(deepResult);
    }

    const process = deepResult.researchMetadata.deepResearchProcess;
    const steps: ResearchStep[] = [];

    // Step 1: Planning phase
    steps.push({
      id: 1,
      title: 'Planificación de Investigación Automática',
      status: 'completed',
      result: `**Estrategia Implementada:** ${process.planningPhase.strategy}

**Temas Identificados para Investigación:**
${process.planningPhase.identifiedTopics.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}

**Número de Consultas Estimadas:** ${process.planningPhase.estimatedQueries}`,
      prompt: 'Análisis automático del caso y planificación de estrategia de investigación',
      sources: []
    });

    // Step 2: Execution phase
    steps.push({
      id: 2,
      title: 'Ejecución de Búsquedas Especializadas',
      status: 'completed',
      result: `**Búsquedas Ejecutadas:** ${process.executionPhase.queriesExecuted.length}

**Fuentes Encontradas:** ${process.executionPhase.sourcesFound}

**Iteraciones de Refinamiento:** ${process.executionPhase.refinementIterations}

**Proceso Iterativo:** El sistema ejecutó múltiples búsquedas especializadas, refinando automáticamente las consultas basándose en los hallazgos de cada iteración.`,
      prompt: 'Ejecución automática de múltiples búsquedas especializadas iterativas',
      sources: deepResult.finalReportSources || []
    });

    // Step 3: Synthesis phase
    steps.push({
      id: 3,
      title: 'Síntesis y Análisis de Evidencia',
      status: 'completed',
      result: `**Evaluación de Evidencia:** ${process.synthesisPhase.evidenceGrading.length} fuentes graduadas por calidad

**Contradicciones Analizadas:** ${process.synthesisPhase.contradictionsFound}

**Gaps de Información Identificados:**
${process.synthesisPhase.gapsIdentified.map((gap, i) => `${i + 1}. ${gap}`).join('\n')}

**Síntesis Final:** El sistema analizó automáticamente la calidad de cada fuente, resolvió contradicciones en la literatura y sintetizó la evidencia aplicando razonamiento clínico bayesiano.`,
      prompt: 'Síntesis automática de evidencia con análisis crítico y resolución de contradicciones',
      sources: []
    });

    return steps;
  }

  private createGenericTransparencySteps(deepResult: InvestigationState): ResearchStep[] {
    return [
      {
        id: 1,
        title: 'Investigación Autónoma Completada',
        status: 'completed',
        result: deepResult.finalReport || 'Investigación completa realizada automáticamente',
        prompt: 'Deep Research ejecutado automáticamente',
        sources: deepResult.finalReportSources || []
      }
    ];
  }

  private parsePlanToSteps(planText: string): ResearchStep[] {
    // Reuse your existing logic from App.tsx with step limit
    const steps = planText
      .split('\n')
      .map(line => line.trim())
      .filter(line => /^\d+\./.test(line))
      .slice(0, 8) // Limit to maximum 8 steps
      .map((line, index) => ({
        id: index + 1,
        title: line.replace(/^\d+\.\s*/, ''),
        status: 'pending' as const,
        result: null,
        prompt: '',
        sources: null,
      }));

    // Ensure we have at least 4 steps for a meaningful investigation
    if (steps.length < 4) {
      console.warn(`Only ${steps.length} steps generated, this might be insufficient for a complete investigation`);
    }

    console.log(`Generated ${steps.length} investigation steps (max 8 allowed)`);
    return steps;
  }

  // Get provider statistics for UI
  getProviderStats() {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      capabilities: provider.capabilities,
      available: true
    }));
  }

  // Health check for providers
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        // Simple test query
        await provider.generateContent('test query', {
          mode: 'manual',
          maxSources: 1,
          searchDepth: 'basic',
          timeoutMinutes: 1
        });
        health[name] = true;
      } catch (error) {
        console.warn(`Provider ${name} health check failed:`, error);
        health[name] = false;
      }
    }

    return health;
  }
}

// Extend existing types
declare module '../types' {
  interface InvestigationState {
    researchMetadata?: {
      mode: string;
      provider: string;
      totalExecutionTime: number;
      sourcesAnalyzed?: number;
      queriesExecuted?: number;
      confidenceScore?: number;
      transparencySteps?: number;
      deepResearchProcess?: any;
    };
  }
}