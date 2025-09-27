import { GoogleGenerativeAI } from "@google/generative-ai";

let ai: GoogleGenerativeAI | null = null;

const getAI = (): GoogleGenerativeAI => {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                  import.meta.env.VITE_API_KEY || 
                  process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("API Key no está configurada para transcripción de audio");
    }
    
    ai = new GoogleGenerativeAI(apiKey);
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
    // Primero intentar con Web Speech API (más rápido y directo)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const transcription = await transcribeAudioWithWebSpeech();
        return {
          text: transcription,
          confidence: 0.8,
          language: 'es',
          duration: Math.round(audioBlob.size / 16000)
        };
      } catch (webSpeechError) {
        console.warn('Web Speech API falló, intentando con Gemini:', webSpeechError);
      }
    }

    // Fallback: Usar Gemini con el audio convertido a texto
    const genAI = getAI();
    
    // Convertir audio a base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Usar la API correcta de Gemini para audio
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });
    
    const response = await model.generateContent([
      {
        text: `Transcribe the following audio recording of a medical consultation in Spanish. Focus on medical terminology, symptoms, and clinical findings.`
      },
      {
        inlineData: {
          mimeType: 'audio/webm',
          data: base64Audio
        }
      }
    ]);

    const transcriptionText = response.response.text();

    // Calcular duración estimada
    const duration = Math.round(audioBlob.size / 16000);

    return {
      text: cleanTranscription(transcriptionText),
      confidence: 0.85,
      language: 'es',
      duration: duration
    };

  } catch (error) {
    console.error('Error en transcripción de audio:', error);
    
    // Si todo falla, devolver un mensaje de error pero no fallar completamente
    return {
      text: `[Error en transcripción: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, escriba la información manualmente.]`,
      confidence: 0,
      language: 'es',
      duration: 0
    };
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
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    let timeoutId: NodeJS.Timeout;

    recognition.onresult = (event: any) => {
      // Limpiar timeout cada vez que hay resultados
      clearTimeout(timeoutId);
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      
      // Configurar timeout para finalizar después de 3 segundos de silencio
      timeoutId = setTimeout(() => {
        recognition.stop();
      }, 3000);
    };

    recognition.onend = () => {
      clearTimeout(timeoutId);
      resolve(finalTranscript.trim());
    };

    recognition.onerror = (event: any) => {
      clearTimeout(timeoutId);
      reject(new Error(`Error en reconocimiento de voz: ${event.error}`));
    };

    recognition.onstart = () => {
      console.log('Reconocimiento de voz iniciado');
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
      model: 'gemini-1.5-pro',
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
