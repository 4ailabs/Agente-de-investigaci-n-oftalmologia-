import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY no está configurada en las variables de entorno.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export interface GenerationResult {
    text: string;
    sources: { web: { uri: string; title: string; } }[] | null;
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

    return {
        text: response.text,
        sources,
    };

  } catch (error) {
    console.error("Error al generar contenido:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return {
        text: `Ocurrió un error: ${errorMessage}`,
        sources: null,
    };
  }
};
