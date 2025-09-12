import { GoogleGenAI } from "@google/genai";
import { MedicalValidationService } from "../medicalValidation.js";

let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno.");
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

// Function to check source relevance based on content keywords
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
  
  // Filter sources that seem relevant to medical/ophthalmology content
  const relevantSources = sources.filter(source => {
    const sourceText = `${source.web.title} ${source.web.uri}`.toLowerCase();
    
    // Check if source is from medical domains
    const isMedicalDomain = [
      'pubmed', 'ncbi', 'medline', 'cochrane', 'uptodate', 'medscape', 
      'nejm', 'jama', 'thelancet', 'bmj', 'aao.org', 'who.int', 'cdc.gov',
      'mayoclinic', 'clevelandclinic', 'hopkinsmedicine', 'webmd',
      'medigraphic', 'scielo', 'elsevier', 'springer', 'nature.com',
      'ophthalmology', 'oftalmol', 'medical', 'medic', 'health', 'salud'
    ].some(domain => sourceText.includes(domain));
    
    // Check if source contains medical keywords
    const containsRelevantTerms = medicalKeywords.some(keyword => 
      sourceText.includes(keyword)
    );
    
    // Keep source if it's from medical domain OR contains relevant terms
    return isMedicalDomain || containsRelevantTerms;
  });
  
  // If filtering removed too many sources, keep at least the original ones
  // but limit to most relevant
  if (relevantSources.length === 0 && sources.length > 0) {
    console.warn('Source filtering removed all sources, keeping original sources');
    return sources.slice(0, 5); // Limit to first 5 sources
  }
  
  // Limit to maximum 8 sources for better UX
  return relevantSources.slice(0, 8);
};

export const generateContent = async (prompt: string, useSearch: boolean = false): Promise<GenerationResult> => {
  try {
    const genAI = getAI();
    
    // Log search configuration for debugging
    console.log(`🔍 Generating content with search: ${useSearch}`);
    
    const requestConfig = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        ...(useSearch && { config: { tools: [{googleSearch: {}}] } }),
    };
    
    console.log('🔧 Request config:', JSON.stringify(requestConfig, null, 2));
    
    const response = await genAI.models.generateContent(requestConfig);
    
    // FIX: Transform grounding chunks to match the application's Source type.
    // The API response may have chunks without a web uri, and the title is optional.
    // We filter for valid web sources and provide a fallback for the title to ensure type compatibility.
    // Debug grounding metadata
    console.log('📊 Response candidates:', response.candidates?.length || 0);
    console.log('🔗 Grounding metadata:', response.candidates?.[0]?.groundingMetadata);
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    console.log(`🔍 Raw grounding chunks found: ${groundingChunks?.length || 0}`);
    
    if (groundingChunks) {
      console.log('📋 Grounding chunks details:', groundingChunks.map(chunk => ({
        hasWeb: !!chunk.web,
        uri: chunk.web?.uri || 'NO_URI',
        title: chunk.web?.title || 'NO_TITLE'
      })));
    }
    
    let sources = groundingChunks
      ? groundingChunks
          .filter(chunk => chunk.web?.uri)
          .map(chunk => ({
            web: {
              uri: chunk.web!.uri!,
              title: chunk.web!.title || chunk.web!.uri!,
            },
          }))
      : null;

    console.log(`🌐 Valid web sources extracted: ${sources?.length || 0}`);
    if (sources) {
      console.log('🔗 Source URLs:', sources.map(s => s.web.uri));
    }

    // Filter sources for relevance to medical content
    if (sources && sources.length > 0) {
      sources = filterRelevantSources(sources, response.text, prompt);
      console.log(`🎯 Source filtering: ${groundingChunks?.length || 0} original -> ${sources?.length || 0} relevant`);
    } else if (useSearch) {
      console.warn('⚠️ WARNING: Search was enabled but no sources were found!');
      console.log('📝 Generated text preview:', response.text.substring(0, 200) + '...');
    }

    // Validar y mejorar fuentes SIEMPRE que existan fuentes
    let enhancedResult: GenerationResult = {
        text: response.text,
        sources,
    };

    // Aplicar validación médica a todas las fuentes, independientemente de si se usó búsqueda
    if (sources && sources.length > 0) {
        try {
            const validation = await MedicalValidationService.validateAndEnhanceSources(sources);
            enhancedResult = {
                text: response.text,
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
                text: response.text,
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
