import { GoogleGenAI } from "@google/genai";
import { MedicalValidationService } from "../medicalValidation";

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

export const generateContent = async (prompt: string, useSearch: boolean = false): Promise<GenerationResult> => {
  try {
    const genAI = getAI();
    const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        ...(useSearch && { config: { tools: [{googleSearch: {}}] } }),
    });
    
    // FIX: Transform grounding chunks to match the application's Source type.
    // The API response may have chunks without a web uri, and the title is optional.
    // We filter for valid web sources and provide a fallback for the title to ensure type compatibility.
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
      ? groundingChunks
          .filter(chunk => chunk.web?.uri)
          .map(chunk => ({
            web: {
              uri: chunk.web!.uri!,
              title: chunk.web!.title || chunk.web!.uri!,
            },
          }))
      : null;

    // Validar y mejorar fuentes si se usó búsqueda
    let enhancedResult: GenerationResult = {
        text: response.text,
        sources,
    };

    if (useSearch && sources) {
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
