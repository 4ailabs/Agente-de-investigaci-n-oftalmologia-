import { GoogleGenAI } from "@google/genai";
import { EnhancedPatientData, OphthalmologySymptoms, RedFlags, DataQuality } from "../types/enhancedDataTypes";

let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                  import.meta.env.VITE_API_KEY || 
                  process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("API Key no está configurada para extracción de datos médicos");
    }
    
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export class MedicalDataExtractionService {
  
  /**
   * Extrae datos médicos estructurados de texto libre
   */
  static async extractStructuredData(text: string): Promise<Partial<EnhancedPatientData>> {
    try {
      const genAI = getAI();
      
      const prompt = `Analiza el siguiente texto de consulta oftalmológica y extrae información médica estructurada.

TEXTO DE CONSULTA:
"${text}"

Extrae y devuelve SOLO un JSON válido con la siguiente estructura (omite campos que no se encuentren):

{
  "age": número,
  "sex": "M" | "F" | "Otros",
  "occupation": "string opcional",
  "systemicDiseases": ["enfermedad1", "enfermedad2"],
  "currentMedications": [
    {
      "name": "nombre del medicamento",
      "dosage": "dosis",
      "frequency": "frecuencia",
      "indication": "indicación opcional"
    }
  ],
  "allergies": [
    {
      "substance": "sustancia",
      "reaction": "tipo de reacción",
      "severity": "Leve" | "Moderada" | "Severa"
    }
  ],
  "symptoms": {
    "mainSymptom": {
      "description": "descripción del síntoma principal",
      "duration": "duración",
      "laterality": "OD" | "OI" | "Ambos",
      "severity": número 1-10,
      "pattern": "Agudo" | "Subagudo" | "Crónico" | "Recurrente"
    },
    "associatedSymptoms": {
      "pain": {
        "present": boolean,
        "location": "Periorbitario" | "Retrobulbar" | "Frontal" | "Temporal" | "Otros",
        "type": "Punzante" | "Sordo" | "Ardiente" | "Pulsátil" | "Otros",
        "intensity": número 1-10
      },
      "photophobia": boolean,
      "tearing": "Normal" | "Excesivo" | "Disminuido",
      "discharge": {
        "present": boolean,
        "type": "Acuosa" | "Mucosa" | "Purulenta" | "Sangre",
        "color": "Clara" | "Amarilla" | "Verde" | "Roja" | "Otros",
        "consistency": "Líquida" | "Espesa" | "Crustosa"
      },
      "visualDisturbance": {
        "blur": {
          "present": boolean,
          "type": "Gradual" | "Súbita" | "Intermittente",
          "laterality": "OD" | "OI" | "Ambos",
          "distance": "Lejana" | "Cercana" | "Ambas"
        },
        "distortion": boolean,
        "colorVision": "Normal" | "Alterada" | "No evaluada",
        "nightVision": "Normal" | "Dificultad" | "No evaluada"
      },
      "photopsias": boolean,
      "scotomas": boolean,
      "diplopia": "Monocular" | "Binocular" | "Ninguna"
    }
  },
  "chiefComplaint": "queja principal",
  "historyOfPresentIllness": "historia de la enfermedad actual"
}

INSTRUCCIONES:
- Si no encuentras información para un campo, omítelo del JSON
- Para síntomas, usa "present": false si no se mencionan
- Para severidad, usa escala 1-10 basada en descripciones
- Para duración, extrae tiempo específico si está disponible
- Mantén la estructura JSON válida
- No agregues campos adicionales`;

      const response = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      });

      const jsonText = response.response.text();
      
      try {
        const extractedData = JSON.parse(jsonText);
        return extractedData;
      } catch (parseError) {
        console.error('Error parsing extracted data:', parseError);
        return {};
      }

    } catch (error) {
      console.error('Error in medical data extraction:', error);
      return {};
    }
  }

  /**
   * Detecta red flags médicos en el texto
   */
  static async detectRedFlags(text: string): Promise<RedFlags> {
    try {
      const genAI = getAI();
      
      const prompt = `Analiza el siguiente texto de consulta oftalmológica y detecta red flags (signos de alarma) que requieren atención urgente.

TEXTO DE CONSULTA:
"${text}"

Devuelve SOLO un JSON con la siguiente estructura:

{
  "acuteVisionLoss": boolean,
  "severePain": boolean,
  "trauma": boolean,
  "flashes": boolean,
  "floaters": boolean,
  "diplopia": boolean,
  "headache": boolean,
  "nausea": boolean,
  "vomiting": boolean,
  "fever": boolean,
  "rash": boolean,
  "other": ["otro signo de alarma específico"]
}

CRITERIOS PARA RED FLAGS:
- acuteVisionLoss: Pérdida súbita de visión
- severePain: Dolor severo (8-10/10)
- trauma: Trauma ocular reciente
- flashes: Destellos de luz nuevos
- floaters: Moscas volantes nuevas o aumentadas
- diplopia: Visión doble
- headache: Cefalea severa
- nausea/vomiting: Náuseas/vómitos
- fever: Fiebre
- rash: Erupción cutánea
- other: Otros signos de alarma específicos`;

      const response = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 512,
        }
      });

      const jsonText = response.response.text();
      
      try {
        const redFlags = JSON.parse(jsonText);
        return redFlags;
      } catch (parseError) {
        console.error('Error parsing red flags:', parseError);
        return {
          acuteVisionLoss: false,
          severePain: false,
          trauma: false,
          flashes: false,
          floaters: false,
          diplopia: false,
          headache: false,
          nausea: false,
          vomiting: false,
          fever: false,
          rash: false,
          other: []
        };
      }

    } catch (error) {
      console.error('Error detecting red flags:', error);
      return {
        acuteVisionLoss: false,
        severePain: false,
        trauma: false,
        flashes: false,
        floaters: false,
        diplopia: false,
        headache: false,
        nausea: false,
        vomiting: false,
        fever: false,
        rash: false,
        other: []
      };
    }
  }

  /**
   * Valida la calidad de los datos médicos
   */
  static validateDataQuality(data: Partial<EnhancedPatientData>): DataQuality {
    const missingFields: string[] = [];
    const inconsistencies: string[] = [];
    const suggestions: string[] = [];

    // Verificar campos obligatorios
    if (!data.age) missingFields.push('Edad');
    if (!data.sex) missingFields.push('Sexo');
    if (!data.symptoms?.mainSymptom?.description) missingFields.push('Síntoma principal');

    // Verificar coherencia de datos
    if (data.age && (data.age < 0 || data.age > 120)) {
      inconsistencies.push('Edad fuera del rango válido');
    }

    if (data.symptoms?.mainSymptom?.severity && 
        (data.symptoms.mainSymptom.severity < 1 || data.symptoms.mainSymptom.severity > 10)) {
      inconsistencies.push('Severidad del síntoma fuera del rango 1-10');
    }

    // Generar sugerencias
    if (data.symptoms?.mainSymptom?.description && !data.symptoms.associatedSymptoms) {
      suggestions.push('Considera agregar síntomas asociados');
    }

    if (data.symptoms?.mainSymptom?.description && !data.symptoms.mainSymptom.duration) {
      suggestions.push('Agrega la duración del síntoma principal');
    }

    if (data.systemicDiseases && data.systemicDiseases.length === 0) {
      suggestions.push('Considera agregar antecedentes médicos sistémicos');
    }

    // Calcular puntuaciones de calidad
    const totalFields = 10; // Campos principales a verificar
    const completedFields = totalFields - missingFields.length;
    const completeness = (completedFields / totalFields) * 100;

    const consistency = inconsistencies.length === 0 ? 100 : Math.max(0, 100 - (inconsistencies.length * 20));

    const medicalValidity = Math.min(completeness, consistency);

    return {
      completeness: Math.round(completeness),
      consistency: Math.round(consistency),
      medicalValidity: Math.round(medicalValidity),
      missingFields,
      inconsistencies,
      suggestions
    };
  }

  /**
   * Genera sugerencias de campos faltantes
   */
  static generateFieldSuggestions(data: Partial<EnhancedPatientData>): string[] {
    const suggestions: string[] = [];

    if (!data.symptoms?.associatedSymptoms?.pain?.present) {
      suggestions.push('¿El paciente tiene dolor ocular?');
    }

    if (!data.symptoms?.associatedSymptoms?.photophobia) {
      suggestions.push('¿Hay fotofobia (sensibilidad a la luz)?');
    }

    if (!data.symptoms?.associatedSymptoms?.visualDisturbance?.blur?.present) {
      suggestions.push('¿Hay visión borrosa?');
    }

    if (!data.currentMedications || data.currentMedications.length === 0) {
      suggestions.push('¿Qué medicamentos toma actualmente?');
    }

    if (!data.allergies || data.allergies.length === 0) {
      suggestions.push('¿Tiene alergias medicamentosas?');
    }

    return suggestions;
  }

  /**
   * Extrae información de transcripción de audio
   */
  static async extractFromAudioTranscription(transcription: string): Promise<{
    structuredData: Partial<EnhancedPatientData>;
    redFlags: RedFlags;
    quality: DataQuality;
  }> {
    const structuredData = await this.extractStructuredData(transcription);
    const redFlags = await this.detectRedFlags(transcription);
    const quality = this.validateDataQuality(structuredData);

    return {
      structuredData,
      redFlags,
      quality
    };
  }
}
