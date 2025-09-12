import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                  import.meta.env.VITE_API_KEY || 
                  process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("API Key no está configurada para transcripción de audio");
    }
    
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

export const transcribeAudio = async (audioBlob: Blob): Promise<TranscriptionResult> => {
  try {
    const genAI = getAI();
    
    // Convertir audio a base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Crear el modelo con capacidades de audio
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });

    // Crear el prompt para transcripción médica
    const prompt = `Transcribe the following audio recording of a medical consultation. 
    
    Instructions:
    - This is a medical consultation in Spanish
    - Focus on medical terminology and symptoms
    - Preserve medical abbreviations and technical terms
    - Maintain the structure of the conversation
    - If there are unclear parts, mark them as [inaudible]
    - Format the transcription in a clear, readable way
    - Include any numbers, measurements, or medical values mentioned
    - Preserve the chronological order of symptoms and findings
    
    Audio data: data:audio/webm;base64,${base64Audio}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const transcriptionText = response.text();

    // Calcular duración estimada (aproximada)
    const duration = audioBlob.size / 16000; // Estimación basada en tamaño

    return {
      text: transcriptionText,
      confidence: 0.85, // Gemini no proporciona confidence score directo
      language: 'es',
      duration: Math.round(duration)
    };

  } catch (error) {
    console.error('Error en transcripción de audio:', error);
    throw new Error(`Error al transcribir audio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Función alternativa usando Web Speech API (más rápida pero menos precisa)
export const transcribeAudioWithWebSpeech = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Reconocimiento de voz no soportado en este navegador'));
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'es-ES';
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
    };

    recognition.onend = () => {
      resolve(finalTranscript.trim());
    };

    recognition.onerror = (event: any) => {
      reject(new Error(`Error en reconocimiento de voz: ${event.error}`));
    };

    recognition.start();
  });
};

// Función para limpiar y formatear la transcripción
export const cleanTranscription = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .replace(/\n\s*\n/g, '\n') // Múltiples saltos de línea a uno solo
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
};

// Función para extraer información médica estructurada de la transcripción
export const extractMedicalInfo = async (transcription: string): Promise<{
  symptoms: string[];
  age?: string;
  sex?: string;
  duration?: string;
  previousConditions?: string[];
}> => {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    });

    const prompt = `Analiza la siguiente transcripción de una consulta médica oftalmológica y extrae la información estructurada:

Transcripción: "${transcription}"

Extrae y devuelve SOLO un JSON con la siguiente estructura:
{
  "symptoms": ["síntoma1", "síntoma2", "síntoma3"],
  "age": "edad si se menciona",
  "sex": "M/F si se menciona", 
  "duration": "duración de síntomas si se menciona",
  "previousConditions": ["condición1", "condición2"]
}

Si no se encuentra información para algún campo, omítelo del JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();

    // Intentar parsear el JSON
    try {
      const medicalInfo = JSON.parse(jsonText);
      return medicalInfo;
    } catch (parseError) {
      console.warn('Error al parsear JSON de información médica:', parseError);
      return {
        symptoms: [transcription], // Fallback a la transcripción completa
        age: undefined,
        sex: undefined,
        duration: undefined,
        previousConditions: []
      };
    }

  } catch (error) {
    console.error('Error al extraer información médica:', error);
    return {
      symptoms: [transcription], // Fallback a la transcripción completa
      age: undefined,
      sex: undefined,
      duration: undefined,
      previousConditions: []
    };
  }
};
