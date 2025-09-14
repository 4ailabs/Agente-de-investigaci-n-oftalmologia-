import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  MedicalImageAnalysis, 
  ImageAnalysisResult, 
  MedicalImageType, 
  ImageFindings,
  ImageAnalysisConfig,
  FundusFindings,
  OCTFindings,
  AngiographyFindings,
  AnteriorSegmentFindings,
  UltrasoundFindings,
  VisualFieldFindings,
  CorneaFindings,
  PathologyFinding
} from '../types/medicalImageTypes';

// Configuración de la API
const getAI = (): GoogleGenerativeAI | null => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY no está configurada. El análisis de imágenes no estará disponible.');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

export class MedicalImageAnalysisService {
  private static instance: MedicalImageAnalysisService;
  private genAI: GoogleGenerativeAI;

  private constructor() {
    const ai = getAI();
    if (!ai) {
      throw new Error('GoogleGenerativeAI no está disponible. Verifica la configuración de VITE_GEMINI_API_KEY');
    }
    this.genAI = ai;
  }

  public static getInstance(): MedicalImageAnalysisService {
    if (!MedicalImageAnalysisService.instance) {
      try {
        MedicalImageAnalysisService.instance = new MedicalImageAnalysisService();
      } catch (error) {
        console.error('Error creando instancia de MedicalImageAnalysisService:', error);
        throw error;
      }
    }
    return MedicalImageAnalysisService.instance;
  }

  /**
   * Análisis simplificado de imagen (similar al servicio externo)
   * Retorna texto estructurado en markdown
   */
  async analyzeImageSimple(
    imageFile: File,
    imageType: MedicalImageType = 'other'
  ): Promise<string> {
    try {
      console.log(`Iniciando análisis simplificado de imagen tipo: ${imageType}`);

      // Convertir imagen a base64
      const imageBase64 = await this.fileToBase64(imageFile);
      
      // Configurar modelo con system instruction
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
        systemInstruction: `Eres un asistente de IA altamente especializado en oftalmología. Tu tarea es analizar imágenes médicas proporcionadas por profesionales de la salud.

Tu análisis debe ser:
- **Estructurado:** Usa markdown con encabezados claros (p. ej., "Observaciones", "Posibles Hallazgos", "Descargo de Responsabilidad").
- **Detallado:** Describe las estructuras anatómicas visibles y cualquier posible anomalía, patología o signo de enfermedad.
- **Contextual:** Relaciona los hallazgos con condiciones oftalmológicas comunes.
- **Cauteloso:** Enmarca los posibles hallazgos como posibilidades, no como diagnósticos definitivos. Incluye siempre un descargo de responsabilidad.

Si la imagen proporcionada es de baja calidad o no parece ser una imagen oftalmológica reconocible, indica claramente esta limitación y evita proporcionar un análisis clínico detallado.`
      });

      // Analizar imagen
      const result = await model.generateContent([
        `Analiza esta imagen oftalmológica (tipo: ${imageType}) y proporciona un informe estructurado.`,
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageFile.type
          }
        }
      ]);

      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Error en análisis simplificado de imagen:', error);
      if (error instanceof Error && error.message.includes('429')) {
        throw new Error('Cuota de API excedida. Has alcanzado el límite de requests por día. Intenta mañana o actualiza tu plan de Gemini API.');
      }
      throw new Error(`Error en análisis de imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Analiza una imagen médica oftalmológica (método completo estructurado)
   */
  async analyzeImage(
    imageFile: File, 
    imageType: MedicalImageType,
    config: Partial<ImageAnalysisConfig> = {}
  ): Promise<MedicalImageAnalysis> {
    try {
      console.log(`Iniciando análisis de imagen tipo: ${imageType}`);

      // Convertir imagen a base64
      const imageBase64 = await this.fileToBase64(imageFile);
      
      // Crear prompt específico para el tipo de imagen
      const prompt = this.createAnalysisPrompt(imageType, config);
      
      // Configurar modelo con capacidades de visión (usando modelo más reciente)
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp', // Modelo más reciente y avanzado
        generationConfig: {
          temperature: 0.3, // Aumentado para mejor creatividad en análisis
          topK: 40, // Aumentado para mejor diversidad
          topP: 0.95, // Optimizado para análisis médico
          maxOutputTokens: 4096,
        },
        systemInstruction: `Eres un asistente de IA altamente especializado en oftalmología. Tu tarea es analizar imágenes médicas proporcionadas por profesionales de la salud.

Tu análisis debe ser:
- **Estructurado:** Usa markdown con encabezados claros (p. ej., "Observaciones", "Posibles Hallazgos", "Descargo de Responsabilidad").
- **Detallado:** Describe las estructuras anatómicas visibles y cualquier posible anomalía, patología o signo de enfermedad.
- **Contextual:** Relaciona los hallazgos con condiciones oftalmológicas comunes.
- **Cauteloso:** Enmarca los posibles hallazgos como posibilidades, no como diagnósticos definitivos. Incluye siempre un descargo de responsabilidad.

Si la imagen proporcionada es de baja calidad o no parece ser una imagen oftalmológica reconocible, indica claramente esta limitación y evita proporcionar un análisis clínico detallado.`
      });

      // Analizar imagen
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageFile.type
          }
        }
      ]);

      const response = await result.response;
      const analysisText = response.text();

      // Parsear resultado
      const analysisResult = this.parseAnalysisResult(analysisText, imageType);
      
      // Crear resultado final
      const analysis: MedicalImageAnalysis = {
        id: Math.random().toString(36).substr(2, 9),
        imageType,
        findings: analysisResult.findings,
        analysis: analysisResult,
        recommendations: analysisResult.recommendations,
        confidence: analysisResult.confidence,
        timestamp: new Date().toISOString(),
        imageUrl: URL.createObjectURL(imageFile)
      };

      console.log('Análisis de imagen completado:', analysis);
      return analysis;

    } catch (error) {
      console.error('Error analizando imagen médica:', error);
      
      // Manejar error de cuota excedida
      if (error instanceof Error && error.message.includes('429')) {
        throw new Error('Cuota de API excedida. Has alcanzado el límite de 50 requests por día. Intenta mañana o actualiza tu plan de Gemini API.');
      }
      
      // Manejar otros errores
      throw new Error(`Error en análisis de imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Analiza múltiples imágenes de una vez
   */
  async analyzeMultipleImages(
    images: { file: File; type: MedicalImageType; config?: Partial<ImageAnalysisConfig> }[]
  ): Promise<MedicalImageAnalysis[]> {
    const analyses: MedicalImageAnalysis[] = [];
    
    for (const { file, type, config } of images) {
      try {
        const analysis = await this.analyzeImage(file, type, config);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Error analizando imagen ${file.name}:`, error);
        // Continuar con las demás imágenes
      }
    }
    
    return analyses;
  }

  /**
   * Crea prompt específico para cada tipo de imagen
   */
  private createAnalysisPrompt(imageType: MedicalImageType, config: Partial<ImageAnalysisConfig>): string {
    const basePrompt = `Eres un oftalmólogo experto especializado en análisis de imágenes médicas. Analiza la siguiente imagen oftalmológica y proporciona un análisis detallado y estructurado.

IMPORTANTE:
- NO uses emojis en ninguna parte del análisis
- Proporciona un análisis EXHAUSTIVO y profesional
- Cada hallazgo debe estar respaldado por evidencia visual específica
- Usa terminología médica precisa y estándar
- Mantén un enfoque clínico objetivo y basado en evidencia

ESTRUCTURA DE RESPUESTA REQUERIDA:
Proporciona SOLO un JSON válido con la siguiente estructura:`;

    switch (imageType) {
      case 'fundus':
        return basePrompt + this.getFundusPrompt(config);
      case 'oct':
        return basePrompt + this.getOCTPrompt(config);
      case 'angiography':
        return basePrompt + this.getAngiographyPrompt(config);
      case 'anterior_segment':
        return basePrompt + this.getAnteriorSegmentPrompt(config);
      case 'ultrasound':
        return basePrompt + this.getUltrasoundPrompt(config);
      case 'visual_field':
        return basePrompt + this.getVisualFieldPrompt(config);
      case 'cornea':
        return basePrompt + this.getCorneaPrompt(config);
      default:
        return basePrompt + this.getGenericPrompt(config);
    }
  }

  private getFundusPrompt(config: Partial<ImageAnalysisConfig>): string {
    return `
{
  "imageType": "fundus",
  "findings": {
    "quality": "excellent" | "good" | "fair" | "poor",
    "artifacts": ["lista de artefactos encontrados"],
    "laterality": "OD" | "OI" | "both" | "unknown",
    "fundus": {
      "opticNerve": {
        "appearance": "normal" | "pale" | "swollen" | "cupped" | "atrophic",
        "cupDiscRatio": {
          "OD": número o null,
          "OI": número o null
        },
        "margins": "sharp" | "blurred" | "irregular",
        "color": "normal" | "pale" | "hyperemic"
      },
      "macula": {
        "appearance": "normal" | "edematous" | "atrophic" | "scarred",
        "fovealReflex": "present" | "absent" | "irregular",
        "drusen": "none" | "few" | "many" | "confluent",
        "hemorrhages": "none" | "few" | "many",
        "exudates": "none" | "few" | "many"
      },
      "vessels": {
        "arteries": {
          "caliber": "normal" | "narrowed" | "dilated",
          "tortuosity": "normal" | "increased" | "decreased",
          "crossings": "normal" | "abnormal"
        },
        "veins": {
          "caliber": "normal" | "narrowed" | "dilated",
          "tortuosity": "normal" | "increased" | "decreased"
        },
        "occlusions": ["lista de oclusiones encontradas"]
      },
      "periphery": {
        "tears": "none" | "present",
        "detachments": "none" | "present",
        "lattice": "none" | "present",
        "pigment": "normal" | "increased" | "decreased"
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"]
        }
      ]
    }
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA FONDO DE OJO:
- Evalúa la calidad de la imagen y identifica artefactos
- Analiza el nervio óptico: apariencia, relación copa/disco, márgenes, color
- Examina la mácula: apariencia, reflejo foveal, drusen, hemorragias, exudados
- Evalúa los vasos retinianos: calibre, tortuosidad, oclusiones
- Revisa la periferia: desgarros, desprendimientos, lattice, pigmento
- Identifica patologías específicas con ubicación y severidad
- Proporciona recomendaciones clínicas basadas en los hallazgos`;
  }

  private getOCTPrompt(config: Partial<ImageAnalysisConfig>): string {
    return `
{
  "imageType": "oct",
  "findings": {
    "quality": "excellent" | "good" | "fair" | "poor",
    "artifacts": ["lista de artefactos encontrados"],
    "laterality": "OD" | "OI" | "both" | "unknown",
    "oct": {
      "scanType": "macular" | "optic_nerve" | "peripheral" | "full_thickness",
      "layers": {
        "rpe": "intact" | "disrupted" | "atrophic",
        "ellipsoid": "intact" | "disrupted" | "atrophic",
        "outerNuclei": "intact" | "disrupted" | "atrophic",
        "innerNuclei": "intact" | "disrupted" | "atrophic",
        "ganglion": "intact" | "disrupted" | "atrophic"
      },
      "thickness": {
        "central": número en micrones o null,
        "average": número en micrones o null,
        "minimum": número en micrones o null
      },
      "fluid": {
        "intraretinal": "none" | "mild" | "moderate" | "severe",
        "subretinal": "none" | "mild" | "moderate" | "severe",
        "subRPE": "none" | "mild" | "moderate" | "severe"
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"]
        }
      ]
    }
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA OCT:
- Identifica el tipo de escaneo OCT realizado
- Evalúa la integridad de cada capa retiniana
- Mide espesores cuando sea posible
- Identifica presencia y severidad de fluido
- Busca patologías específicas de OCT
- Proporciona recomendaciones basadas en hallazgos estructurales`;
  }

  private getAngiographyPrompt(config: Partial<ImageAnalysisConfig>): string {
    return `
{
  "imageType": "angiography",
  "findings": {
    "quality": "excellent" | "good" | "fair" | "poor",
    "artifacts": ["lista de artefactos encontrados"],
    "laterality": "OD" | "OI" | "both" | "unknown",
    "angiography": {
      "type": "fluorescein" | "icg" | "oct_angiography",
      "timing": {
        "armToRetina": número en segundos o null,
        "arteriovenous": número en segundos o null,
        "venous": número en segundos o null,
        "late": número en segundos o null
      },
      "leakage": {
        "present": boolean,
        "location": ["ubicaciones específicas"],
        "severity": "mild" | "moderate" | "severe"
      },
      "blockage": {
        "present": boolean,
        "location": ["ubicaciones específicas"],
        "type": "filling_defect" | "capillary_nonperfusion" | "vessel_occlusion"
      },
      "staining": {
        "present": boolean,
        "location": ["ubicaciones específicas"],
        "pattern": "diffuse" | "focal" | "linear"
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"]
        }
      ]
    }
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA ANGIOGRAFÍA:
- Identifica el tipo de angiografía (fluoresceína, ICG, OCT-A)
- Evalúa los tiempos de tránsito cuando sea posible
- Busca patrones de fuga, bloqueo y tinción
- Identifica áreas de no perfusión
- Evalúa la integridad vascular
- Proporciona recomendaciones basadas en hallazgos vasculares`;
  }

  private getAnteriorSegmentPrompt(config: Partial<ImageAnalysisConfig>): string {
    return `
{
  "imageType": "anterior_segment",
  "findings": {
    "quality": "excellent" | "good" | "fair" | "poor",
    "artifacts": ["lista de artefactos encontrados"],
    "laterality": "OD" | "OI" | "both" | "unknown",
    "anteriorSegment": {
      "cornea": {
        "clarity": "clear" | "hazy" | "opaque",
        "epithelium": "intact" | "defect" | "edema",
        "stroma": "clear" | "hazy" | "scarred",
        "endothelium": "intact" | "guttata" | "decompensated"
      },
      "anteriorChamber": {
        "depth": "normal" | "shallow" | "deep",
        "cells": "none" | "few" | "many",
        "flare": "none" | "mild" | "moderate" | "severe"
      },
      "iris": {
        "color": "normal" | "heterochromia" | "atrophic",
        "structure": "normal" | "atrophic" | "neovascular",
        "rubeosis": "none" | "mild" | "moderate" | "severe"
      },
      "pupil": {
        "size": "normal" | "small" | "large" | "irregular",
        "reactivity": "normal" | "sluggish" | "nonreactive",
        "shape": "round" | "irregular" | "keyhole"
      },
      "lens": {
        "clarity": "clear" | "cataract" | "opaque",
        "position": "normal" | "subluxated" | "dislocated",
        "type": "nuclear" | "cortical" | "posterior_subcapsular" | "mixed"
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"]
        }
      ]
    }
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA SEGMENTO ANTERIOR:
- Evalúa la claridad y estructura de la córnea
- Analiza la profundidad y contenido de la cámara anterior
- Examina el iris y busca neovascularización
- Evalúa el tamaño, forma y reactividad pupilar
- Analiza el cristalino y su posición
- Identifica patologías del segmento anterior
- Proporciona recomendaciones específicas`;
  }

  private getUltrasoundPrompt(config: Partial<ImageAnalysisConfig>): string {
    return `
{
  "imageType": "ultrasound",
  "findings": {
    "quality": "excellent" | "good" | "fair" | "poor",
    "artifacts": ["lista de artefactos encontrados"],
    "laterality": "OD" | "OI" | "both" | "unknown",
    "ultrasound": {
      "scanType": "a_scan" | "b_scan" | "doppler",
      "vitreous": {
        "clarity": "clear" | "hazy" | "opaque",
        "detachment": "none" | "partial" | "complete",
        "hemorrhage": "none" | "mild" | "moderate" | "severe"
      },
      "retina": {
        "attached": boolean,
        "thickness": "normal" | "thickened" | "thinned",
        "detachment": "none" | "partial" | "complete"
      },
      "choroid": {
        "thickness": "normal" | "thickened" | "thinned",
        "detachment": "none" | "partial" | "complete"
      },
      "orbit": {
        "muscles": "normal" | "thickened" | "atrophic",
        "opticNerve": "normal" | "thickened" | "atrophic",
        "foreignBodies": "none" | "present"
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"]
        }
      ]
    }
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA ECOGRAFÍA:
- Identifica el tipo de escaneo (A-scan, B-scan, Doppler)
- Evalúa el vítreo: claridad, desprendimiento, hemorragia
- Analiza la retina: adherencia, espesor, desprendimiento
- Examina la coroides: espesor, desprendimiento
- Evalúa la órbita: músculos, nervio óptico, cuerpos extraños
- Proporciona recomendaciones basadas en hallazgos ecográficos`;
  }

  private getVisualFieldPrompt(config: Partial<ImageAnalysisConfig>): string {
    return `
{
  "imageType": "visual_field",
  "findings": {
    "quality": "excellent" | "good" | "fair" | "poor",
    "artifacts": ["lista de artefactos encontrados"],
    "laterality": "OD" | "OI" | "both" | "unknown",
    "visualField": {
      "testType": "humphrey" | "goldmann" | "octopus" | "other",
      "reliability": "excellent" | "good" | "fair" | "poor",
      "meanDeviation": número en dB o null,
      "patternStandardDeviation": número en dB o null,
      "defects": {
        "central": "none" | "mild" | "moderate" | "severe",
        "peripheral": "none" | "mild" | "moderate" | "severe",
        "arcuate": "none" | "present",
        "nasal": "none" | "mild" | "moderate" | "severe"
      },
      "blindSpot": {
        "enlarged": boolean,
        "shifted": boolean
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"]
        }
      ]
    }
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA CAMPO VISUAL:
- Identifica el tipo de prueba realizada
- Evalúa la confiabilidad del examen
- Analiza los valores de desviación media y estándar
- Identifica patrones de defectos específicos
- Evalúa el punto ciego
- Proporciona recomendaciones basadas en hallazgos funcionales`;
  }

  private getCorneaPrompt(config: Partial<ImageAnalysisConfig>): string {
    return `
{
  "imageType": "cornea",
  "findings": {
    "quality": "excellent" | "good" | "fair" | "poor",
    "artifacts": ["lista de artefactos encontrados"],
    "laterality": "OD" | "OI" | "both" | "unknown",
    "cornea": {
      "keratometry": {
        "k1": número en dioptrías o null,
        "k2": número en dioptrías o null,
        "axis": número en grados o null
      },
      "pachymetry": {
        "central": número en micrones o null,
        "thinnest": número en micrones o null,
        "location": "ubicación del punto más delgado"
      },
      "elevation": {
        "anterior": "normal" | "elevated" | "depressed",
        "posterior": "normal" | "elevated" | "depressed"
      },
      "regularity": {
        "surface": "regular" | "irregular",
        "astigmatism": "with_the_rule" | "against_the_rule" | "oblique"
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"]
        }
      ]
    }
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA TOPOGRAFÍA CORNEAL:
- Analiza los valores de queratometría cuando estén disponibles
- Evalúa la paquimetría central y periférica
- Identifica elevaciones y depresiones
- Evalúa la regularidad de la superficie
- Analiza el astigmatismo corneal
- Proporciona recomendaciones basadas en hallazgos topográficos`;
  }

  private getGenericPrompt(config: Partial<ImageAnalysisConfig>): string {
    return `
{
  "imageType": "other",
  "findings": {
    "quality": "excellent" | "good" | "fair" | "poor",
    "artifacts": ["lista de artefactos encontrados"],
    "laterality": "OD" | "OI" | "both" | "unknown",
    "pathology": [
      {
        "type": "tipo de patología",
        "location": "ubicación específica",
        "severity": "mild" | "moderate" | "severe",
        "description": "descripción detallada",
        "confidence": número entre 0 y 1,
        "differential": ["diagnósticos diferenciales"]
      }
    ]
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES GENERALES:
- Evalúa la calidad general de la imagen
- Identifica artefactos que puedan afectar la interpretación
- Busca patologías específicas
- Proporciona recomendaciones clínicas apropiadas`;
  }

  /**
   * Convierte archivo a base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remover el prefijo data:image/...;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Parsea el resultado del análisis de la IA
   */
  private parseAnalysisResult(text: string, imageType: MedicalImageType): ImageAnalysisResult {
    try {
      // Buscar JSON en el texto de respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const jsonText = jsonMatch[0];
      const parsed = JSON.parse(jsonText);

      // Validar estructura básica
      if (!parsed.findings || !parsed.confidence || !parsed.recommendations) {
        throw new Error('Estructura de respuesta inválida');
      }

      return {
        imageType: parsed.imageType || imageType,
        findings: parsed.findings as ImageFindings,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        timestamp: parsed.timestamp || new Date().toISOString()
      };

    } catch (error) {
      console.error('Error parseando resultado de análisis:', error);
      
      // Crear resultado de fallback
      return {
        imageType,
        findings: {
          quality: 'poor',
          artifacts: ['Error en análisis'],
          laterality: 'unknown'
        },
        confidence: 0,
        recommendations: ['Error en análisis de imagen. Revisar calidad y formato.'],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtiene tipos de imagen soportados
   */
  getSupportedImageTypes(): MedicalImageType[] {
    return [
      'fundus',
      'oct',
      'angiography',
      'anterior_segment',
      'ultrasound',
      'visual_field',
      'cornea',
      'other'
    ];
  }

  /**
   * Valida si un archivo es una imagen válida
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no soportado. Use JPG, PNG, GIF o WebP.'
      };
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      return {
        valid: false,
        error: 'Archivo demasiado grande. Máximo 10MB.'
      };
    }

    return { valid: true };
  }
}
