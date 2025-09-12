import { GoogleGenAI } from "@google/genai";
import { MedicalValidationService } from "../medicalValidation.js";

// Sistema de caché inteligente para búsquedas
interface SearchCache {
  query: string;
  timestamp: Date;
  results: GenerationResult;
  relevanceScore: number;
  medicalKeywords: string[];
  expiresAt: Date;
}

// Configuración del caché
const CACHE_EXPIRY_HOURS = 24;
const MAX_CACHE_SIZE = 100;
const searchCache = new Map<string, SearchCache>();

// Sistema de scoring de relevancia mejorado
interface RelevanceMetrics {
  symptomMatch: number;
  anatomicalRelevance: number;
  sourceAuthority: number;
  recencyScore: number;
  totalScore: number;
}

// Sistema híbrido Pro/Flash
interface ModelSelection {
  model: 'gemini-1.5-pro' | 'gemini-1.5-flash';
  reason: string;
  confidence: number;
}

// Clasificador inteligente para selección de modelo
class MedicalModelClassifier {
  private static medicalKeywords = [
    // Síntomas oculares
    'dolor ocular', 'visión borrosa', 'pérdida de visión', 'fotofobia', 'diplopía',
    'escotoma', 'miodesopsias', 'halos', 'distorsión visual', 'cefalea',
    
    // Enfermedades oftalmológicas
    'glaucoma', 'catarata', 'retinopatía', 'macular', 'desprendimiento', 'retina',
    'uveítis', 'conjuntivitis', 'queratitis', 'blefaritis', 'estrabismo',
    
    // Términos médicos complejos
    'diagnóstico diferencial', 'fisiopatología', 'etiología', 'patogénesis',
    'tratamiento', 'pronóstico', 'complicaciones', 'seguimiento',
    
    // Análisis clínico
    'análisis', 'evaluación', 'examen', 'exploración', 'hallazgos',
    'signos', 'síntomas', 'historia clínica', 'antecedentes'
  ];

  private static complexTasks = [
    'reporte final', 'análisis diferencial', 'plan de investigación',
    'evaluación clínica', 'diagnóstico', 'tratamiento recomendado'
  ];

  static classify(prompt: string, context?: string): ModelSelection {
    const fullText = `${prompt} ${context || ''}`.toLowerCase();
    
    // Contar palabras médicas
    const medicalWordCount = this.medicalKeywords.filter(keyword => 
      fullText.includes(keyword.toLowerCase())
    ).length;

    // Detectar tareas complejas
    const hasComplexTask = this.complexTasks.some(task => 
      fullText.includes(task.toLowerCase())
    );

    // Detectar longitud del prompt (prompts largos = más complejos)
    const isLongPrompt = prompt.length > 500;

    // Detectar si es reporte final o análisis profundo
    const isDeepAnalysis = fullText.includes('reporte') || 
                          fullText.includes('análisis') ||
                          fullText.includes('evaluación') ||
                          fullText.includes('diagnóstico diferencial');

    // Calcular score de complejidad médica
    const medicalComplexityScore = (
      medicalWordCount * 0.4 +
      (hasComplexTask ? 3 : 0) * 0.3 +
      (isLongPrompt ? 2 : 0) * 0.2 +
      (isDeepAnalysis ? 3 : 0) * 0.1
    );

    // Decisión basada en score
    if (medicalComplexityScore >= 2.5) {
      return {
        model: 'gemini-1.5-pro',
        reason: `Análisis médico complejo (score: ${medicalComplexityScore.toFixed(1)})`,
        confidence: Math.min(0.9, medicalComplexityScore / 5)
      };
    } else {
      return {
        model: 'gemini-1.5-flash',
        reason: `Tarea médica simple (score: ${medicalComplexityScore.toFixed(1)})`,
        confidence: Math.min(0.9, (5 - medicalComplexityScore) / 5)
      };
    }
  }
}

let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    // For Vite frontend, environment variables need VITE_ prefix
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                  (import.meta as any).env?.VITE_API_KEY || 
                  process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("API Key no está configurada. Configure VITE_GEMINI_API_KEY en el archivo .env");
    }
    
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export interface GenerationResult {
    text: string;
    sources: { web: { uri: string; title: string; } }[] | null;
    quality?: {
        overallQuality: 'high' | 'medium' | 'low';
        highQualityCount: number;
        mediumQualityCount: number;
        lowQualityCount: number;
        recommendations: string[];
    };
    contradictions?: {
        hasConflicts: boolean;
        conflicts: any[];
        resolution: string;
        confidence: 'high' | 'medium' | 'low';
    };
    disclaimers?: string;
}

// Sistema de manejo de caché inteligente
const getCachedResult = (query: string, medicalKeywords: string[]): SearchCache | null => {
  const cacheKey = generateCacheKey(query, medicalKeywords);
  const cached = searchCache.get(cacheKey);
  
  if (cached && cached.expiresAt > new Date()) {
    console.log('🎯 Using cached search result');
    return cached;
  }
  
  if (cached) {
    searchCache.delete(cacheKey);
  }
  
  return null;
};

const setCachedResult = (query: string, medicalKeywords: string[], result: GenerationResult, relevanceScore: number) => {
  const cacheKey = generateCacheKey(query, medicalKeywords);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_EXPIRY_HOURS);
  
  // Limpiar caché si está lleno
  if (searchCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = Array.from(searchCache.keys())[0];
    searchCache.delete(oldestKey);
  }
  
  searchCache.set(cacheKey, {
    query,
    timestamp: new Date(),
    results: result,
    relevanceScore,
    medicalKeywords,
    expiresAt
  });
};

const generateCacheKey = (query: string, keywords: string[]): string => {
  return `${query.toLowerCase()}-${keywords.sort().join(',').toLowerCase()}`;
};

// Sistema de scoring de relevancia mejorado
const calculateSourceRelevance = (source: { web: { uri: string; title: string; } }, prompt: string, generatedText: string): RelevanceMetrics => {
  const sourceText = `${source.web.title} ${source.web.uri}`.toLowerCase();
  const combinedText = `${generatedText} ${prompt}`.toLowerCase();
  
  // 1. Coincidencia con síntomas específicos (30%)
  const symptomKeywords = ['dolor', 'vision', 'borrosa', 'ceguera', 'diplopia', 'fotofobia', 'lagrimeo', 'enrojecimiento', 'pain', 'blur', 'blindness', 'double', 'light', 'tear', 'red'];
  const symptomMatches = symptomKeywords.filter(keyword => 
    combinedText.includes(keyword) && sourceText.includes(keyword)
  ).length;
  const symptomMatch = Math.min(symptomMatches / 5, 1) * 0.3;
  
  // 2. Relevancia anatómica (25%)
  const anatomicalKeywords = ['retina', 'cornea', 'iris', 'pupila', 'cristalino', 'vitreo', 'optic', 'macula', 'conjuntiva', 'choroid'];
  const anatomicalMatches = anatomicalKeywords.filter(keyword => 
    combinedText.includes(keyword) && sourceText.includes(keyword)
  ).length;
  const anatomicalRelevance = Math.min(anatomicalMatches / 4, 1) * 0.25;
  
  // 3. Autoridad de fuente (25%)
  const highAuthorityDomains = ['pubmed', 'ncbi', 'cochrane', 'aao.org', 'nejm', 'jama', 'thelancet'];
  const mediumAuthorityDomains = ['medscape', 'uptodate', 'mayoclinic', 'clevelandclinic'];
  
  let sourceAuthority = 0;
  if (highAuthorityDomains.some(domain => sourceText.includes(domain))) {
    sourceAuthority = 1 * 0.25;
  } else if (mediumAuthorityDomains.some(domain => sourceText.includes(domain))) {
    sourceAuthority = 0.7 * 0.25;
  } else if (sourceText.includes('medical') || sourceText.includes('medic') || sourceText.includes('health')) {
    sourceAuthority = 0.5 * 0.25;
  } else {
    sourceAuthority = 0.2 * 0.25;
  }
  
  // 4. Score de recencia (20%) - basado en palabras clave de actualidad
  const recencyKeywords = ['2024', '2023', '2022', 'recent', 'latest', 'new', 'current', 'updated'];
  const recencyMatches = recencyKeywords.filter(keyword => sourceText.includes(keyword)).length;
  const recencyScore = Math.min(recencyMatches / 3, 1) * 0.2;
  
  const totalScore = symptomMatch + anatomicalRelevance + sourceAuthority + recencyScore;
  
  return {
    symptomMatch: Math.round(symptomMatch * 1000) / 10, // Convert to percentage
    anatomicalRelevance: Math.round(anatomicalRelevance * 1000) / 10,
    sourceAuthority: Math.round(sourceAuthority * 1000) / 10,
    recencyScore: Math.round(recencyScore * 1000) / 10,
    totalScore: Math.round(totalScore * 1000) / 10
  };
};

// Extracción de palabras clave médicas para caché inteligente
const extractMedicalKeywords = (prompt: string): string[] => {
  const text = prompt.toLowerCase();
  const allMedicalTerms = [
    // Síntomas oftalmológicos
    'dolor', 'vision', 'borrosa', 'ceguera', 'diplopia', 'fotofobia', 'lagrimeo', 'enrojecimiento',
    'pain', 'blur', 'blindness', 'double', 'light', 'tear', 'red',
    // Anatomía ocular
    'retina', 'cornea', 'iris', 'pupila', 'cristalino', 'vitreo', 'optic', 'macula', 'conjuntiva',
    // Condiciones oftalmológicas
    'glaucoma', 'catarata', 'macular', 'diabetic', 'retinopathy', 'uveitis', 'keratitis',
    // Términos médicos generales
    'diagnosis', 'treatment', 'therapy', 'surgery', 'medication', 'symptom'
  ];
  
  return allMedicalTerms.filter(term => text.includes(term));
};

// Function to check source relevance based on content keywords (MEJORADA)
const filterRelevantSources = (sources: { web: { uri: string; title: string; } }[] | null, generatedText: string, originalPrompt: string): { web: { uri: string; title: string; } }[] | null => {
  if (!sources || sources.length === 0) return sources;
  
  // Extract key medical terms from both the generated content and prompt
  const combinedText = `${generatedText} ${originalPrompt}`.toLowerCase();
  
  // Medical terms that should be present in relevant sources
  const medicalKeywords = [
    // Extract ophthalmology terms
    'oftalmol', 'ocular', 'retina', 'cornea', 'glaucoma', 'catarata', 'macular', 'vision', 'eye',
    'conjuntiva', 'iris', 'pupila', 'cristalino', 'vitreo', 'optic', 'visual',
    // Common symptoms
    'dolor', 'vision', 'ceguera', 'diplopia', 'fotofobia', 'lagrimeo', 'enrojecimiento',
    // Medical specialties and conditions
    'diagnost', 'tratamiento', 'patolog', 'sindrome', 'enfermedad', 'medic', 'clinic',
    'patient', 'symptom', 'diagnosis', 'treatment', 'disease', 'condition'
  ];
  
  // Check if text contains medical content
  const containsMedicalTerms = medicalKeywords.some(keyword => 
    combinedText.includes(keyword)
  );
  
  if (!containsMedicalTerms) {
    console.warn('Generated content may not be medical in nature, keeping all sources');
    return sources;
  }
  
  // Calcular relevancia para cada fuente y filtrar por score
  const sourcesWithRelevance = sources.map(source => {
    const relevanceMetrics = calculateSourceRelevance(source, originalPrompt, generatedText);
    return {
      source,
      relevanceMetrics
    };
  });
  
  // Filtrar fuentes con score mínimo y ordenar por relevancia
  const relevantSources = sourcesWithRelevance
    .filter(item => item.relevanceMetrics.totalScore >= 15) // Mínimo 15% de relevancia
    .sort((a, b) => b.relevanceMetrics.totalScore - a.relevanceMetrics.totalScore)
    .map(item => item.source);
  
  // If filtering removed too many sources, keep at least the original ones
  // but limit to most relevant
  if (relevantSources.length === 0 && sources.length > 0) {
    console.warn('Source filtering removed all sources, keeping original sources');
    return sources.slice(0, 5); // Limit to first 5 sources
  }
  
  // Limit to maximum 8 sources for better UX
  return relevantSources.slice(0, 8);
};

export const generateContent = async (prompt: string, useSearch: boolean = false, context?: string): Promise<GenerationResult> => {
  try {
    const genAI = getAI();
    
    // Clasificar y seleccionar modelo híbrido
    const modelSelection = MedicalModelClassifier.classify(prompt, context);
    
    console.log(`🤖 Modelo seleccionado: ${modelSelection.model}`);
    console.log(`📊 Razón: ${modelSelection.reason}`);
    console.log(`🎯 Confianza: ${(modelSelection.confidence * 100).toFixed(1)}%`);
    
    // Extraer palabras clave médicas del prompt para caché
    const medicalKeywords = extractMedicalKeywords(prompt);
    
    // Verificar caché si se usa búsqueda (incluyendo modelo en la clave)
    if (useSearch) {
      const cacheKey = `${modelSelection.model}_${prompt}`;
      const cachedResult = getCachedResult(cacheKey, medicalKeywords);
      if (cachedResult) {
        console.log('🎯 Returning cached search result with relevance score:', cachedResult.relevanceScore);
        return cachedResult.results;
      }
    }
    
    // Log search configuration for debugging
    console.log(`Generating content with search: ${useSearch} using ${modelSelection.model}`);
    console.log('Medical keywords extracted:', medicalKeywords);
    
    console.log('Using search:', useSearch);
    
    // Configuración optimizada según el modelo seleccionado
    const generationConfig = modelSelection.model === 'gemini-1.5-pro' ? {
      temperature: 0.05, // Muy baja temperatura para máxima precisión médica
      topK: 20,
      topP: 0.9,
      maxOutputTokens: 16384, // Mayor capacidad para análisis complejos
    } : {
      temperature: 0.1, // Baja temperatura para respuestas médicas precisas
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192, // Capacidad estándar para tareas simples
    };

    // Use the correct method for Gemini 1.5 with search capabilities
    const response = await genAI.models.generateContent({
        model: modelSelection.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        ...(useSearch && { tools: [{
            googleSearchRetrieval: {
                dynamicRetrievalConfig: {
                    mode: "MODE_DYNAMIC",
                    dynamicThreshold: 0.7
                }
            }
        }] })
    } as any);
    
    // Debug response structure
    console.log('Full response structure:', JSON.stringify(response, null, 2));
    console.log('Response candidates:', response.candidates?.length || 0);
    
    // Get text content - handle both possible response formats
    const responseText = (response as any).text || (response as any).response?.text() || response.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('📝 Response text preview:', responseText?.substring(0, 200) + '...');
    
    // Debug grounding metadata - check different possible locations for Gemini 1.5
    let groundingMetadata = response.candidates?.[0]?.groundingMetadata || 
                          (response as any).response?.candidates?.[0]?.groundingMetadata ||
                          (response as any).groundingMetadata;
    
    console.log('🔗 Grounding metadata:', JSON.stringify(groundingMetadata, null, 2));
    
    // For Gemini 1.5 with GoogleSearchRetrieval, look for different structure
    const groundingChunks = groundingMetadata?.groundingChunks || 
                          groundingMetadata?.webSearchResults ||
                          groundingMetadata?.groundingSupports ||
                          groundingMetadata?.retrievalMetadata?.googleSearchDynamicRetrievalScore;
    
    console.log(`Raw grounding chunks found: ${groundingChunks?.length || 0}`);
    
    if (groundingChunks) {
      console.log('Grounding chunks details:', groundingChunks.map((chunk: any) => ({
        hasWeb: !!(chunk.web || chunk.webSearchResult),
        uri: chunk.web?.uri || chunk.webSearchResult?.uri || chunk.uri || 'NO_URI',
        title: chunk.web?.title || chunk.webSearchResult?.title || chunk.title || 'NO_TITLE'
      })));
    }
    
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
          }))
      : null;

    console.log(`🌐 Valid web sources extracted: ${sources?.length || 0}`);
    if (sources) {
      console.log('🔗 Source URLs:', sources.map((s: any) => s.web.uri));
      console.log('🔗 Source details:', sources.map((s: any) => ({
        title: s.web.title,
        uri: s.web.uri
      })));
    } else {
      console.warn('⚠️ No sources found! This might indicate search is not working properly.');
    }

    // Filter sources for relevance to medical content
    if (sources && sources.length > 0) {
      sources = filterRelevantSources(sources, responseText, prompt);
      console.log(`Source filtering: ${groundingChunks?.length || 0} original -> ${sources?.length || 0} relevant`);
    } else if (useSearch) {
      console.warn('WARNING: Search was enabled but no sources were found!');
      console.log('📝 Generated text preview:', responseText?.substring(0, 200) + '...');
    }

    // Validar y mejorar fuentes SIEMPRE que existan fuentes
    let enhancedResult: GenerationResult = {
        text: responseText,
        sources,
    };

    // Aplicar validación médica a todas las fuentes, independientemente de si se usó búsqueda
    if (sources && sources.length > 0) {
        try {
            const validation = await MedicalValidationService.validateAndEnhanceSources(sources);
            enhancedResult = {
                text: responseText,
                sources: validation.validatedSources,
                quality: {
                    overallQuality: validation.quality.length > 0 ? 
                        validation.quality.filter(q => q.level === 'high').length >= validation.quality.length * 0.7 ? 'high' :
                        validation.quality.filter(q => q.level === 'high' || q.level === 'medium').length >= validation.quality.length * 0.5 ? 'medium' : 'low'
                        : 'low',
                    highQualityCount: validation.quality.filter(q => q.level === 'high').length,
                    mediumQualityCount: validation.quality.filter(q => q.level === 'medium').length,
                    lowQualityCount: validation.quality.filter(q => q.level === 'low').length,
                    recommendations: validation.quality.filter(q => q.level === 'low').length > 0 ? 
                        [`Se encontraron ${validation.quality.filter(q => q.level === 'low').length} fuentes de baja calidad. Se recomienda buscar evidencia adicional.`] : []
                },
                contradictions: validation.contradictions,
                disclaimers: validation.disclaimers
            };
        } catch (validationError) {
            console.warn("Error en validación de fuentes, usando fuentes sin validar:", validationError);
            // En caso de error en validación, mantener las fuentes originales pero con advertencia
            enhancedResult = {
                text: responseText,
                sources: sources,
                quality: {
                    overallQuality: 'low',
                    highQualityCount: 0,
                    mediumQualityCount: 0,
                    lowQualityCount: sources.length,
                    recommendations: ['Error en validación de fuentes. Se recomienda verificación manual.']
                },
                contradictions: { hasConflicts: false, conflicts: [], resolution: '', confidence: 'low' },
                disclaimers: '⚠️ ADVERTENCIA: Las fuentes no pudieron ser validadas automáticamente. Se recomienda verificación manual.'
            };
        }
    }

    // Guardar en caché si se usó búsqueda y hay fuentes válidas
    if (useSearch && enhancedResult.sources && enhancedResult.sources.length > 0) {
      const averageRelevanceScore = enhancedResult.sources.length * 20; // Score estimado basado en cantidad de fuentes
      setCachedResult(prompt, medicalKeywords, enhancedResult, averageRelevanceScore);
      console.log('💾 Search result cached for future use');
    }

    return enhancedResult;

  } catch (error) {
    console.error("Error al generar contenido:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return {
        text: `Ocurrió un error: ${errorMessage}`,
        sources: null,
    };
  }
};
