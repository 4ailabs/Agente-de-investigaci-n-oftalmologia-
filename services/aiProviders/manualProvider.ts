import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  ResearchProvider, 
  ProviderCapabilities, 
  ResearchConfig, 
  ResearchResult 
} from './baseProvider';

// Este es el provider que encapsula tu sistema actual
export class ManualResearchProvider implements ResearchProvider {
  name = 'gemini_manual';
  capabilities: ProviderCapabilities = {
    hasWebSearch: true,
    hasDeepResearch: false,
    maxQueries: 6, // Basado en tus 6 pasos actuales
    sourceValidation: true,
    iterativeRefinement: false
  };

  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                  (import.meta as any).env?.VITE_API_KEY || 
                  process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API Key no está configurada. Configure VITE_GEMINI_API_KEY en el archivo .env');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(
    prompt: string, 
    config: ResearchConfig = {
      mode: 'manual',
      maxSources: 15,
      searchDepth: 'basic',
      timeoutMinutes: 5
    }
  ): Promise<ResearchResult> {
    const startTime = Date.now();

    try {
      // Use your existing logic from geminiService.ts
      const generationConfig = {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      };
      
      const useSearch = config.searchDepth === 'comprehensive';
      
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig,
        ...(useSearch && { tools: [{
          googleSearchRetrieval: {}
        }] })
      });
      
      const response = await model.generateContent(prompt);
      const content = response.response.text();
      const sources = this.extractSources(response.response);

      const executionTime = Date.now() - startTime;

      return {
        content,
        sources,
        metadata: {
          provider: this.name,
          mode: config.mode,
          executionTime,
          sourcesAnalyzed: sources.length,
          queriesExecuted: 1, // Manual mode = 1 query per step
          confidenceScore: this.calculateConfidenceScore(sources, content)
        }
      };

    } catch (error) {
      console.error('Error en Manual Research:', error);
      throw new Error(`Manual Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractSources(response: any): any[] {
    // Reuse existing source extraction logic from geminiService.ts
    try {
      // Debug grounding metadata - check different possible locations for Gemini 1.5
      let groundingMetadata = response.candidates?.[0]?.groundingMetadata || 
                            (response as any).response?.candidates?.[0]?.groundingMetadata ||
                            (response as any).groundingMetadata;
      
      // For Gemini 1.5 with GoogleSearchRetrieval, look for different structure
      const groundingChunks = groundingMetadata?.groundingChunks || 
                            groundingMetadata?.webSearchResults ||
                            groundingMetadata?.groundingSupports ||
                            groundingMetadata?.retrievalMetadata?.googleSearchDynamicRetrievalScore;
      
      // Transform grounding chunks to sources with flexible structure
      let sources = groundingChunks && Array.isArray(groundingChunks)
        ? groundingChunks
            .filter((chunk: any) => chunk.web?.uri || chunk.webSearchResult?.uri || chunk.uri)
            .map((chunk: any) => ({
              web: {
                uri: chunk.web?.uri || chunk.webSearchResult?.uri || chunk.uri!,
                title: chunk.web?.title || chunk.webSearchResult?.title || chunk.title || 
                      chunk.web?.uri || chunk.webSearchResult?.uri || chunk.uri!,
              }
            }))
        : [];

      return sources;
    } catch (error) {
      console.warn('Could not extract sources from manual response:', error);
      return [];
    }
  }

  private calculateConfidenceScore(sources: any[], content: string): number {
    // Simple confidence calculation for manual mode
    let score = 50; // Base score
    
    score += Math.min(sources.length * 2, 30); // Source bonus
    score += content.length > 1000 ? 20 : 0; // Length bonus
    
    return Math.min(score, 100);
  }
}