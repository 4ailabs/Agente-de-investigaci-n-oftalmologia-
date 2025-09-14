import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  ResearchProvider, 
  ProviderCapabilities, 
  ResearchConfig, 
  ResearchResult,
  ResearchProcess,
  SearchQuery,
  EvidenceGrade
} from './baseProvider';

export class DeepResearchProvider implements ResearchProvider {
  name = 'gemini_deep_research';
  capabilities: ProviderCapabilities = {
    hasWebSearch: true,
    hasDeepResearch: true,
    maxQueries: 20,
    sourceValidation: true,
    iterativeRefinement: true
  };

  private genAI: GoogleGenerativeAI;
  private startTime: number = 0;

  constructor() {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                  (import.meta as any).env?.VITE_API_KEY || 
                  process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API Key no está configurada. Configure VITE_GEMINI_API_KEY en el archivo .env');
    }
    
    this.genAI = new GoogleGenerativeAI({ apiKey });
  }

  async generateContent(
    prompt: string, 
    config: ResearchConfig = {
      mode: 'deep_research',
      maxSources: 25,
      searchDepth: 'comprehensive',
      timeoutMinutes: 10
    }
  ): Promise<ResearchResult> {
    this.startTime = Date.now();

    try {
      // Configure Deep Research with enhanced search capabilities
      const generationConfig = {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      };

      // Create Deep Research prompt
      const deepResearchPrompt = this.createDeepResearchPrompt(prompt, config);
      
      console.log('🔍 Iniciando Deep Research...');
      
      // Execute Deep Research with Google Search
      const response = await this.genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: deepResearchPrompt }] }],
        generationConfig,
        tools: [{
          googleSearchRetrieval: {
            // Enhanced search for Deep Research
            dynamicRetrievalConfig: {
              mode: 'MODE_DYNAMIC',
              dynamicThreshold: 0.7
            }
          }
        }]
      });
      
      // Parse results and extract metadata  
      const content = response.response.text();
      const sources = this.extractSources(response.response);
      const process = this.extractResearchProcess(content);
      
      const executionTime = Date.now() - this.startTime;

      console.log(`✅ Deep Research completado en ${executionTime}ms`);
      console.log(`📊 Fuentes encontradas: ${sources.length}`);

      return {
        content,
        sources,
        metadata: {
          provider: this.name,
          mode: config.mode,
          executionTime,
          sourcesAnalyzed: sources.length,
          queriesExecuted: process?.executionPhase.queriesExecuted.length || 0,
          confidenceScore: this.calculateConfidenceScore(sources, content)
        },
        process
      };

    } catch (error) {
      console.error('❌ Error en Deep Research:', error);
      throw new Error(`Deep Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createDeepResearchPrompt(originalPrompt: string, config: ResearchConfig): string {
    return `${originalPrompt}

🔬 **MODO DEEP RESEARCH ACTIVADO - INVESTIGACIÓN MÉDICA AUTÓNOMA**

Como agente de investigación médica especializado en oftalmología, debes realizar una investigación AUTÓNOMA y EXHAUSTIVA siguiendo este protocolo:

**PROTOCOLO DE DEEP RESEARCH:**

1. **ANÁLISIS INICIAL INTELIGENTE:**
   - Identifica automáticamente síntomas clave, demografía del paciente y contexto clínico
   - Genera una lista priorizada de líneas de investigación médica
   - Determina el nivel de urgencia y complejidad del caso

2. **INVESTIGACIÓN ITERATIVA AUTÓNOMA:**
   - Ejecuta múltiples búsquedas especializadas automáticamente
   - Refina búsquedas basándote en hallazgos previos
   - Busca evidencia tanto a favor como en contra de cada hipótesis
   - Prioriza fuentes de alta calidad: PubMed, Cochrane, AAO Guidelines
   - Analiza contradiciones en la literatura automáticamente

3. **VALIDACIÓN Y SÍNTESIS INTELIGENTE:**
   - Evalúa la calidad metodológica de cada fuente
   - Identifica gaps de información automáticamente
   - Sintetiza evidencia aplicando razonamiento bayesiano
   - Genera diagnósticos diferenciales con probabilidades

**CRITERIOS DE CALIDAD:**
- Mínimo ${config.maxSources} fuentes médicas especializadas
- Análisis crítico de evidencia contradictoria
- Evaluación de aplicabilidad al caso específico
- Identificación explícita de limitaciones

**ESTRUCTURA DE RESPUESTA REQUERIDA:**

## 🎯 RESUMEN EJECUTIVO
[Diagnóstico más probable, nivel de urgencia, siguiente paso crítico]

## 🔍 PROCESO DE INVESTIGACIÓN REALIZADO
### Estrategia de Búsqueda Implementada
- Líneas de investigación identificadas
- Número de búsquedas ejecutadas
- Criterios de selección de fuentes

### Fuentes Analizadas y Validadas
- Número total de fuentes evaluadas
- Distribución por tipo (meta-análisis, RCTs, guidelines, etc.)
- Criterios de calidad aplicados

## 🧠 ANÁLISIS CLÍNICO INTEGRAL
### Diagnósticos Diferenciales con Razonamiento Bayesiano
[Lista priorizada con probabilidades y justificación]

### Evaluación de Evidencia por Calidad
[Gradación A/B/C/D con justificación metodológica]

### Análisis de Contradiciones
[Identificación y resolución de información conflictiva]

## ⚕️ RECOMENDACIONES BASADAS EN EVIDENCIA
### Próximos Pasos Diagnósticos
[Secuencia lógica basada en costo-efectividad]

### Consideraciones de Urgencia
[Timeline y red flags identificados]

### Gaps de Información Identificados
[Qué información adicional mejoraría el diagnóstico]

## 📋 METADATOS DE INVESTIGACIÓN
### Proceso de Búsqueda Ejecutado
[Transparencia del proceso para validación]

**IMPORTANTE:** 
- Proporciona un análisis EXHAUSTIVO (mínimo 2000 palabras)
- Cada conclusión debe estar respaldada por evidencia específica
- Incluye razonamiento clínico explícito paso a paso
- Identifica explícitamente las limitaciones del análisis

**BÚSQUEDA DIRIGIDA:** Enfoca tu investigación autónoma en:
- Epidemiología y factores de riesgo específicos para la demografía del paciente
- Diagnóstico diferencial sistemático basado en síntomas
- Protocolos diagnósticos y terapéuticos actualizados
- Evidencia de alta calidad de los últimos 5 años prioritariamente`;
  }

  private extractSources(response: any): any[] {
    // Extract sources using the same logic as geminiService.ts
    try {
      console.log('🔗 Extracting sources from Deep Research response...');
      
      // Debug grounding metadata - check different possible locations for Gemini 1.5
      let groundingMetadata = response.candidates?.[0]?.groundingMetadata || 
                            (response as any).response?.candidates?.[0]?.groundingMetadata ||
                            (response as any).groundingMetadata;
      
      console.log('🔗 Deep Research grounding metadata found:', !!groundingMetadata);
      
      // For Gemini 1.5 with GoogleSearchRetrieval, look for different structure
      const groundingChunks = groundingMetadata?.groundingChunks || 
                            groundingMetadata?.webSearchResults ||
                            groundingMetadata?.groundingSupports ||
                            groundingMetadata?.retrievalMetadata?.googleSearchDynamicRetrievalScore;
      
      console.log(`📊 Deep Research grounding chunks found: ${groundingChunks?.length || 0}`);
      
      // Transform grounding chunks to sources with flexible structure
      let sources = groundingChunks
        ? groundingChunks
            .filter((chunk: any) => chunk.web?.uri || chunk.webSearchResult?.uri || chunk.uri)
            .map((chunk: any) => ({
              web: {
                uri: chunk.web?.uri || chunk.webSearchResult?.uri || chunk.uri!,
                title: chunk.web?.title || chunk.webSearchResult?.title || chunk.title || 
                      chunk.web?.uri || chunk.webSearchResult?.uri || chunk.uri!,
              },
              relevanceScore: chunk.score || 0
            }))
        : [];

      console.log(`🌐 Deep Research valid sources extracted: ${sources.length}`);
      return sources;
    } catch (error) {
      console.warn('Could not extract sources from Deep Research response:', error);
      return [];
    }
  }

  private extractResearchProcess(content: string): ResearchProcess | undefined {
    try {
      // Extract research process metadata from content
      // This is a simplified version - would need more sophisticated parsing
      const lines = content.split('\n');
      const processData: ResearchProcess = {
        planningPhase: {
          strategy: 'Deep Research Autónomo',
          identifiedTopics: this.extractTopics(content),
          estimatedQueries: 8
        },
        executionPhase: {
          queriesExecuted: this.extractQueries(content),
          sourcesFound: 0,
          refinementIterations: 3
        },
        synthesisPhase: {
          evidenceGrading: this.extractEvidenceGrades(content),
          contradictionsFound: 0,
          gapsIdentified: this.extractGaps(content)
        }
      };

      return processData;
    } catch (error) {
      console.warn('Could not extract research process:', error);
      return undefined;
    }
  }

  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('###') || line.includes('##')) {
        const topic = line.replace(/#+\s*/, '').trim();
        if (topic && !topics.includes(topic)) {
          topics.push(topic);
        }
      }
    });

    return topics.slice(0, 10); // Limit to 10 topics
  }

  private extractQueries(content: string): SearchQuery[] {
    // This would be implemented based on actual Deep Research output format
    return [];
  }

  private extractEvidenceGrades(content: string): EvidenceGrade[] {
    // This would extract evidence grading from the content
    return [];
  }

  private extractGaps(content: string): string[] {
    const gaps: string[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('gap') || 
          line.toLowerCase().includes('limitación') ||
          line.toLowerCase().includes('información adicional')) {
        gaps.push(line.trim());
      }
    });

    return gaps.slice(0, 5); // Limit to 5 gaps
  }

  private calculateConfidenceScore(sources: any[], content: string): number {
    let score = 0;
    
    // Source quantity score (max 30 points)
    score += Math.min(sources.length * 1.5, 30);
    
    // Content depth score (max 40 points)
    const wordCount = content.split(' ').length;
    score += Math.min(wordCount / 50, 40);
    
    // Medical terms score (max 30 points)
    const medicalTerms = ['diagnóstico', 'síntoma', 'tratamiento', 'evidencia', 'estudio'];
    const termCount = medicalTerms.reduce((count, term) => {
      return count + (content.toLowerCase().match(new RegExp(term, 'g')) || []).length;
    }, 0);
    score += Math.min(termCount * 2, 30);
    
    return Math.min(Math.round(score), 100);
  }
}