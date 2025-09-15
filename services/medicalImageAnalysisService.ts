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
   * Detección automática del tipo de imagen oftalmológica
   */
  async detectImageType(imageFile: File): Promise<MedicalImageType> {
    try {
      console.log('Iniciando detección automática de tipo de imagen');

      const imageBase64 = await this.fileToBase64(imageFile);
      
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.1, // Baja temperatura para mayor precisión
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 512,
        },
        systemInstruction: `Eres un experto en análisis de imágenes oftalmológicas. Tu tarea es identificar automáticamente el tipo de imagen médica oftalmológica.

IMPORTANTE: Responde ÚNICAMENTE con una de estas opciones:
- "fundus" - Fondo de ojo (retina, nervio óptico, mácula)
- "oct" - Tomografía de coherencia óptica (cortes transversales)
- "angiography" - Angiografía (fluoresceína, ICG, OCT-A)
- "anterior_segment" - Segmento anterior (córnea, iris, cristalino)
- "ultrasound" - Ecografía ocular (A-scan, B-scan)
- "visual_field" - Campo visual (Humphrey, Goldmann, Octopus)
- "cornea" - Topografía corneal (queratometría, paquimetría)
- "other" - Otros tipos de imágenes oftalmológicas

Analiza la imagen y responde con UNA SOLA PALABRA del tipo detectado.`
      });

      const result = await model.generateContent([
        'Identifica el tipo de imagen oftalmológica. Responde con una sola palabra:',
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageFile.type
          }
        }
      ]);

      const response = await result.response;
      const detectedType = response.text().trim().toLowerCase();
      
      // Validar tipo detectado
      const validTypes: MedicalImageType[] = ['fundus', 'oct', 'angiography', 'anterior_segment', 'ultrasound', 'visual_field', 'cornea', 'other'];
      const finalType = validTypes.includes(detectedType as MedicalImageType) ? detectedType as MedicalImageType : 'other';
      
      console.log(`Tipo de imagen detectado: ${finalType}`);
      return finalType;

    } catch (error) {
      console.error('Error en detección de tipo de imagen:', error);
      return 'other'; // Fallback a tipo genérico
    }
  }

  /**
   * Análisis avanzado de calidad de imagen
   */
  async analyzeImageQuality(imageFile: File): Promise<{
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    resolution: number; // píxeles por milímetro estimado
    contrast: number; // 0-1
    sharpness: number; // 0-1
    artifacts: string[];
    recommendations: string[];
  }> {
    try {
      const imageBase64 = await this.fileToBase64(imageFile);
      
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.2,
          topK: 30,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
        systemInstruction: `Eres un experto en análisis de calidad de imágenes médicas oftalmológicas. Evalúa la calidad técnica de la imagen.

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido en este formato:
{
  "overall": "excellent" | "good" | "fair" | "poor",
  "resolution": número_estimado_píxeles_por_mm,
  "contrast": número_0_a_1,
  "sharpness": número_0_a_1,
  "artifacts": ["lista de artefactos encontrados"],
  "recommendations": ["recomendaciones para mejorar calidad"]
}

Evalúa:
- Resolución: estima píxeles por milímetro
- Contraste: 0=sin contraste, 1=contraste perfecto
- Nitidez: 0=completamente borrosa, 1=perfectamente nítida
- Artefactos: movimientos, reflexiones, ruido, etc.
- Recomendaciones: cómo mejorar la imagen`
      });

      const result = await model.generateContent([
        'Evalúa la calidad técnica de esta imagen oftalmológica:',
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageFile.type
          }
        }
      ]);

      const response = await result.response;
      const qualityText = response.text();
      
      // Parsear JSON de calidad
      const jsonMatch = qualityText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const qualityData = JSON.parse(jsonMatch[0]);
        return {
          overall: qualityData.overall || 'fair',
          resolution: qualityData.resolution || 0,
          contrast: Math.max(0, Math.min(1, qualityData.contrast || 0.5)),
          sharpness: Math.max(0, Math.min(1, qualityData.sharpness || 0.5)),
          artifacts: Array.isArray(qualityData.artifacts) ? qualityData.artifacts : [],
          recommendations: Array.isArray(qualityData.recommendations) ? qualityData.recommendations : []
        };
      }

      // Fallback si no se puede parsear
      return {
        overall: 'fair',
        resolution: 0,
        contrast: 0.5,
        sharpness: 0.5,
        artifacts: ['Error en análisis de calidad'],
        recommendations: ['Revisar calidad de imagen']
      };

    } catch (error) {
      console.error('Error en análisis de calidad:', error);
      return {
        overall: 'poor',
        resolution: 0,
        contrast: 0,
        sharpness: 0,
        artifacts: ['Error en análisis'],
        recommendations: ['Error en evaluación de calidad']
      };
    }
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

      // Detectar tipo automáticamente si no se especifica
      const detectedType = imageType === 'other' ? await this.detectImageType(imageFile) : imageType;
      console.log(`Tipo detectado: ${detectedType}`);

      // Convertir imagen a base64
      const imageBase64 = await this.fileToBase64(imageFile);
      
      // Analizar calidad de imagen
      const qualityAnalysis = await this.analyzeImageQuality(imageFile);
      
      // Configurar modelo con system instruction mejorada
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 6144, // Aumentado para análisis más detallado
        },
        systemInstruction: `Eres un oftalmólogo experto con más de 20 años de experiencia en análisis de imágenes médicas oftalmológicas. Tu tarea es proporcionar un análisis exhaustivo y profesional de imágenes médicas.

IMPORTANTE: SIEMPRE responde en ESPAÑOL. Todos los análisis, descripciones y recomendaciones deben estar en español.

Tu análisis debe ser:
- **Estructurado:** Usa markdown con encabezados claros en español
- **Exhaustivo:** Proporciona análisis detallado de todas las estructuras anatómicas visibles
- **Contextual:** Relaciona hallazgos con condiciones oftalmológicas usando terminología médica precisa
- **Cuantitativo:** Incluye mediciones cuando sea posible (espesores, diámetros, ángulos)
- **Diferencial:** Proporciona diagnósticos diferenciales basados en hallazgos
- **Pronóstico:** Incluye consideraciones pronósticas cuando sea apropiado
- **Terapéutico:** Sugiere opciones de tratamiento basadas en hallazgos
- **Cauteloso:** Enmarca hallazgos como posibilidades, no diagnósticos definitivos

ESTRUCTURA REQUERIDA:
1. **RESUMEN EJECUTIVO** - Hallazgos principales en 2-3 líneas
2. **CALIDAD DE IMAGEN** - Evaluación técnica detallada
3. **ANÁLISIS ANATÓMICO** - Estructura por estructura
4. **HALLAZGOS PATOLÓGICOS** - Anomalías identificadas
5. **MEDICIONES CUANTITATIVAS** - Datos objetivos cuando sea posible
6. **DIAGNÓSTICOS DIFERENCIALES** - Lista priorizada
7. **RECOMENDACIONES CLÍNICAS** - Próximos pasos
8. **CONSIDERACIONES PRONÓSTICAS** - Evolución esperada
9. **DESCARGO DE RESPONSABILIDAD** - Limitaciones del análisis

Si la imagen es de baja calidad o no es oftalmológica reconocible, indica claramente esta limitación.`
      });

      // Crear prompt mejorado con información de calidad
      const enhancedPrompt = `Analiza esta imagen oftalmológica de tipo ${detectedType} con la siguiente información de calidad:

**CALIDAD DE IMAGEN:**
- Calidad general: ${qualityAnalysis.overall}
- Resolución estimada: ${qualityAnalysis.resolution} píxeles/mm
- Contraste: ${(qualityAnalysis.contrast * 100).toFixed(1)}%
- Nitidez: ${(qualityAnalysis.sharpness * 100).toFixed(1)}%
- Artefactos detectados: ${qualityAnalysis.artifacts.join(', ') || 'Ninguno'}

Proporciona un análisis exhaustivo y estructurado en ESPAÑOL:`;

      // Analizar imagen
      const result = await model.generateContent([
        enhancedPrompt,
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
   * Extrae mediciones automáticas de la imagen
   */
  async extractMeasurements(imageFile: File, imageType: MedicalImageType): Promise<{
    measurements: { [key: string]: number | string }[];
    units: string[];
    confidence: number;
  }> {
    try {
      const imageBase64 = await this.fileToBase64(imageFile);
      
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.1, // Muy baja para mediciones precisas
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
        systemInstruction: `Eres un experto en mediciones oftalmológicas. Extrae mediciones cuantitativas de la imagen.

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido:
{
  "measurements": [
    {
      "parameter": "nombre del parámetro",
      "value": número,
      "unit": "unidad de medida",
      "location": "ubicación en la imagen",
      "confidence": número_0_a_1
    }
  ],
  "units": ["lista de unidades utilizadas"],
  "confidence": número_0_a_1
}

Para ${imageType}, busca:
- Espesores retinianos (micrones)
- Diámetros de vasos (micrones)
- Ángulos (grados)
- Distancias (micrones)
- Áreas (mm²)
- Relaciones (ratios)

Sé preciso y conservador en las estimaciones.`
      });

      const result = await model.generateContent([
        `Extrae mediciones cuantitativas de esta imagen de tipo ${imageType}:`,
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageFile.type
          }
        }
      ]);

      const response = await result.response;
      const measurementsText = response.text();
      
      const jsonMatch = measurementsText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        measurements: [],
        units: [],
        confidence: 0
      };

    } catch (error) {
      console.error('Error extrayendo mediciones:', error);
      return {
        measurements: [],
        units: [],
        confidence: 0
      };
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
      console.log(`Iniciando análisis avanzado de imagen tipo: ${imageType}`);

      // Detectar tipo automáticamente si no se especifica
      const detectedType = imageType === 'other' ? await this.detectImageType(imageFile) : imageType;
      console.log(`Tipo detectado: ${detectedType}`);

      // Convertir imagen a base64
      const imageBase64 = await this.fileToBase64(imageFile);
      
      // Análisis paralelo de calidad y mediciones
      const [qualityAnalysis, measurements] = await Promise.all([
        this.analyzeImageQuality(imageFile),
        this.extractMeasurements(imageFile, detectedType)
      ]);
      
      // Crear prompt específico mejorado para el tipo de imagen
      const prompt = this.createEnhancedAnalysisPrompt(detectedType, config, qualityAnalysis, measurements);
      
      // Configurar modelo con capacidades de visión avanzadas
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.25, // Optimizado para análisis médico preciso
          topK: 35,
          topP: 0.92,
          maxOutputTokens: 8192, // Aumentado para análisis más exhaustivo
        },
        systemInstruction: `Eres un oftalmólogo experto con más de 25 años de experiencia en análisis de imágenes médicas oftalmológicas. Tu especialidad incluye:

- Análisis de fondo de ojo y patologías retinianas
- Interpretación de OCT y angiografías
- Evaluación de segmento anterior y córnea
- Análisis de campos visuales y ecografías
- Diagnóstico diferencial oftalmológico
- Medicina basada en evidencia

IMPORTANTE: SIEMPRE responde en ESPAÑOL. Todos los análisis, descripciones y recomendaciones deben estar en español.

Tu análisis debe ser:
- **Estructurado:** Usa markdown con encabezados claros en español
- **Exhaustivo:** Proporciona análisis detallado de todas las estructuras anatómicas visibles
- **Contextual:** Relaciona hallazgos con condiciones oftalmológicas usando terminología médica precisa
- **Cuantitativo:** Incluye mediciones cuando sea posible (espesores, diámetros, ángulos)
- **Diferencial:** Proporciona diagnósticos diferenciales basados en hallazgos
- **Pronóstico:** Incluye consideraciones pronósticas cuando sea apropiado
- **Terapéutico:** Sugiere opciones de tratamiento basadas en hallazgos
- **Cauteloso:** Enmarca hallazgos como posibilidades, no diagnósticos definitivos

ESTRUCTURA REQUERIDA:
1. **RESUMEN EJECUTIVO** - Hallazgos principales en 2-3 líneas
2. **CALIDAD DE IMAGEN** - Evaluación técnica detallada
3. **ANÁLISIS ANATÓMICO** - Estructura por estructura
4. **HALLAZGOS PATOLÓGICOS** - Anomalías identificadas
5. **MEDICIONES CUANTITATIVAS** - Datos objetivos cuando sea posible
6. **DIAGNÓSTICOS DIFERENCIALES** - Lista priorizada
7. **RECOMENDACIONES CLÍNICAS** - Próximos pasos
8. **CONSIDERACIONES PRONÓSTICAS** - Evolución esperada
9. **DESCARGO DE RESPONSABILIDAD** - Limitaciones del análisis

Si la imagen es de baja calidad o no es oftalmológica reconocible, indica claramente esta limitación.`
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
      const analysisResult = this.parseAnalysisResult(analysisText, detectedType);
      
      // Crear resultado final con información adicional
      const analysis: MedicalImageAnalysis = {
        id: Math.random().toString(36).substr(2, 9),
        imageType: detectedType,
        findings: analysisResult.findings,
        analysis: analysisResult,
        recommendations: analysisResult.recommendations,
        confidence: analysisResult.confidence,
        timestamp: new Date().toISOString(),
        imageUrl: URL.createObjectURL(imageFile),
        // Agregar información adicional
        qualityAnalysis,
        measurements: measurements.measurements,
        detectedType
      } as any; // Cast temporal para agregar propiedades

      console.log('Análisis avanzado de imagen completado:', analysis);
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
   * Crea prompt mejorado con información de calidad y mediciones
   */
  private createEnhancedAnalysisPrompt(
    imageType: MedicalImageType, 
    config: Partial<ImageAnalysisConfig>,
    qualityAnalysis: any,
    measurements: any
  ): string {
    const basePrompt = `Eres un oftalmólogo experto especializado en análisis de imágenes médicas. Analiza la siguiente imagen oftalmológica y proporciona un análisis detallado y estructurado.

INFORMACIÓN DE CALIDAD DE IMAGEN:
- Calidad general: ${qualityAnalysis.overall}
- Resolución estimada: ${qualityAnalysis.resolution} píxeles/mm
- Contraste: ${(qualityAnalysis.contrast * 100).toFixed(1)}%
- Nitidez: ${(qualityAnalysis.sharpness * 100).toFixed(1)}%
- Artefactos detectados: ${qualityAnalysis.artifacts.join(', ') || 'Ninguno'}
- Recomendaciones de calidad: ${qualityAnalysis.recommendations.join(', ') || 'Ninguna'}

MEDICIONES EXTRAÍDAS:
${measurements.measurements.length > 0 ? 
  measurements.measurements.map((m: any) => `- ${m.parameter}: ${m.value} ${m.unit} (${m.location})`).join('\n') : 
  'No se pudieron extraer mediciones cuantitativas'}

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL
- NO uses emojis en ninguna parte del análisis
- Proporciona un análisis EXHAUSTIVO y profesional
- Cada hallazgo debe estar respaldado por evidencia visual específica
- Usa terminología médica precisa y estándar en español
- Mantén un enfoque clínico objetivo y basado en evidencia
- Incluye mediciones cuantitativas cuando sea posible
- Proporciona diagnósticos diferenciales detallados
- Sugiere opciones de tratamiento basadas en hallazgos

ESTRUCTURA DE RESPUESTA REQUERIDA:
Proporciona SOLO un JSON válido con la siguiente estructura (todos los campos en español):`;

    switch (imageType) {
      case 'fundus':
        return basePrompt + this.getEnhancedFundusPrompt(config);
      case 'oct':
        return basePrompt + this.getEnhancedOCTPrompt(config);
      case 'angiography':
        return basePrompt + this.getEnhancedAngiographyPrompt(config);
      case 'anterior_segment':
        return basePrompt + this.getEnhancedAnteriorSegmentPrompt(config);
      case 'ultrasound':
        return basePrompt + this.getEnhancedUltrasoundPrompt(config);
      case 'visual_field':
        return basePrompt + this.getEnhancedVisualFieldPrompt(config);
      case 'cornea':
        return basePrompt + this.getEnhancedCorneaPrompt(config);
      default:
        return basePrompt + this.getEnhancedGenericPrompt(config);
    }
  }

  /**
   * Crea prompt específico para cada tipo de imagen
   */
  private createAnalysisPrompt(imageType: MedicalImageType, config: Partial<ImageAnalysisConfig>): string {
    const basePrompt = `Eres un oftalmólogo experto especializado en análisis de imágenes médicas. Analiza la siguiente imagen oftalmológica y proporciona un análisis detallado y estructurado.

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL
- NO uses emojis en ninguna parte del análisis
- Proporciona un análisis EXHAUSTIVO y profesional
- Cada hallazgo debe estar respaldado por evidencia visual específica
- Usa terminología médica precisa y estándar en español
- Mantén un enfoque clínico objetivo y basado en evidencia

ESTRUCTURA DE RESPUESTA REQUERIDA:
Proporciona SOLO un JSON válido con la siguiente estructura (todos los campos en español):`;

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

  private getEnhancedFundusPrompt(config: Partial<ImageAnalysisConfig>): string {
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
        "color": "normal" | "pale" | "hyperemic",
        "measurements": {
          "discDiameter": número en micrones o null,
          "cupDiameter": número en micrones o null,
          "rimWidth": número en micrones o null
        }
      },
      "macula": {
        "appearance": "normal" | "edematous" | "atrophic" | "scarred",
        "fovealReflex": "present" | "absent" | "irregular",
        "drusen": "none" | "few" | "many" | "confluent",
        "hemorrhages": "none" | "few" | "many",
        "exudates": "none" | "few" | "many",
        "measurements": {
          "fovealThickness": número en micrones o null,
          "macularVolume": número en mm³ o null,
          "centralSubfieldThickness": número en micrones o null
        }
      },
      "vessels": {
        "arteries": {
          "caliber": "normal" | "narrowed" | "dilated",
          "tortuosity": "normal" | "increased" | "decreased",
          "crossings": "normal" | "abnormal",
          "measurements": {
            "arterioVenousRatio": número o null,
            "arteryDiameter": número en micrones o null
          }
        },
        "veins": {
          "caliber": "normal" | "narrowed" | "dilated",
          "tortuosity": "normal" | "increased" | "decreased",
          "measurements": {
            "veinDiameter": número en micrones o null
          }
        },
        "occlusions": ["lista de oclusiones encontradas"]
      },
      "periphery": {
        "tears": "none" | "present",
        "detachments": "none" | "present",
        "lattice": "none" | "present",
        "pigment": "normal" | "increased" | "decreased",
        "measurements": {
          "peripheralThickness": número en micrones o null
        }
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"],
          "measurements": {
            "size": número en micrones o mm²,
            "area": número en mm² o null
          }
        }
      ]
    }
  },
  "measurements": [
    {
      "parameter": "nombre del parámetro medido",
      "value": número,
      "unit": "unidad de medida",
      "location": "ubicación en la imagen",
      "confidence": número entre 0 y 1
    }
  ],
  "differentialDiagnosis": [
    {
      "condition": "nombre de la condición",
      "probability": número entre 0 y 1,
      "evidence": "evidencia que apoya este diagnóstico",
      "nextSteps": "próximos pasos para confirmar"
    }
  ],
  "treatmentOptions": [
    {
      "intervention": "nombre de la intervención",
      "urgency": "urgent" | "routine" | "follow_up",
      "rationale": "justificación basada en hallazgos"
    }
  ],
  "prognosis": {
    "visual": "excellent" | "good" | "fair" | "poor",
    "stability": "stable" | "progressive" | "improving",
    "factors": ["factores que influyen en el pronóstico"]
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "followUp": {
    "timing": "inmediato" | "1_semana" | "1_mes" | "3_meses" | "6_meses" | "1_año",
    "studies": ["estudios adicionales recomendados"]
  },
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA FONDO DE OJO MEJORADO:
- Evalúa la calidad de la imagen y identifica artefactos específicos
- Analiza el nervio óptico con mediciones cuantitativas cuando sea posible
- Examina la mácula con análisis de espesor y volumen
- Evalúa los vasos retinianos con mediciones de calibre y relaciones
- Revisa la periferia con evaluación de espesor
- Identifica patologías con mediciones de tamaño y área
- Proporciona diagnósticos diferenciales con probabilidades
- Sugiere opciones de tratamiento basadas en hallazgos
- Incluye consideraciones pronósticas
- Especifica timing de seguimiento y estudios adicionales`;
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

  private getEnhancedOCTPrompt(config: Partial<ImageAnalysisConfig>): string {
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
        "minimum": número en micrones o null,
        "maximum": número en micrones o null,
        "temporal": número en micrones o null,
        "nasal": número en micrones o null,
        "superior": número en micrones o null,
        "inferior": número en micrones o null
      },
      "fluid": {
        "intraretinal": "none" | "mild" | "moderate" | "severe",
        "subretinal": "none" | "mild" | "moderate" | "severe",
        "subRPE": "none" | "mild" | "moderate" | "severe",
        "measurements": {
          "intraretinalVolume": número en mm³ o null,
          "subretinalVolume": número en mm³ o null,
          "subRPEVolume": número en mm³ o null
        }
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"],
          "measurements": {
            "thickness": número en micrones o null,
            "area": número en mm² o null,
            "volume": número en mm³ o null
          }
        }
      ]
    }
  },
  "measurements": [
    {
      "parameter": "nombre del parámetro medido",
      "value": número,
      "unit": "unidad de medida",
      "location": "ubicación en la imagen",
      "confidence": número entre 0 y 1
    }
  ],
  "differentialDiagnosis": [
    {
      "condition": "nombre de la condición",
      "probability": número entre 0 y 1,
      "evidence": "evidencia que apoya este diagnóstico",
      "nextSteps": "próximos pasos para confirmar"
    }
  ],
  "treatmentOptions": [
    {
      "intervention": "nombre de la intervención",
      "urgency": "urgent" | "routine" | "follow_up",
      "rationale": "justificación basada en hallazgos"
    }
  ],
  "prognosis": {
    "visual": "excellent" | "good" | "fair" | "poor",
    "stability": "stable" | "progressive" | "improving",
    "factors": ["factores que influyen en el pronóstico"]
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "followUp": {
    "timing": "inmediato" | "1_semana" | "1_mes" | "3_meses" | "6_meses" | "1_año",
    "studies": ["estudios adicionales recomendados"]
  },
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA OCT MEJORADO:
- Identifica el tipo de escaneo OCT realizado
- Evalúa la integridad de cada capa retiniana con mediciones
- Mide espesores en múltiples cuadrantes
- Identifica presencia y volumen de fluido
- Busca patologías específicas con mediciones cuantitativas
- Proporciona diagnósticos diferenciales con probabilidades
- Sugiere opciones de tratamiento basadas en hallazgos estructurales
- Incluye consideraciones pronósticas
- Especifica timing de seguimiento y estudios adicionales`;
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

  private getEnhancedAngiographyPrompt(config: Partial<ImageAnalysisConfig>): string {
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
        "severity": "mild" | "moderate" | "severe",
        "measurements": {
          "area": número en mm² o null,
          "intensity": número de 0 a 1 o null
        }
      },
      "blockage": {
        "present": boolean,
        "location": ["ubicaciones específicas"],
        "type": "filling_defect" | "capillary_nonperfusion" | "vessel_occlusion",
        "measurements": {
          "area": número en mm² o null,
          "severity": número de 0 a 1 o null
        }
      },
      "staining": {
        "present": boolean,
        "location": ["ubicaciones específicas"],
        "pattern": "diffuse" | "focal" | "linear",
        "measurements": {
          "area": número en mm² o null,
          "intensity": número de 0 a 1 o null
        }
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"],
          "measurements": {
            "area": número en mm² o null,
            "perfusion": número de 0 a 1 o null
          }
        }
      ]
    }
  },
  "measurements": [
    {
      "parameter": "nombre del parámetro medido",
      "value": número,
      "unit": "unidad de medida",
      "location": "ubicación en la imagen",
      "confidence": número entre 0 y 1
    }
  ],
  "differentialDiagnosis": [
    {
      "condition": "nombre de la condición",
      "probability": número entre 0 y 1,
      "evidence": "evidencia que apoya este diagnóstico",
      "nextSteps": "próximos pasos para confirmar"
    }
  ],
  "treatmentOptions": [
    {
      "intervention": "nombre de la intervención",
      "urgency": "urgent" | "routine" | "follow_up",
      "rationale": "justificación basada en hallazgos"
    }
  ],
  "prognosis": {
    "visual": "excellent" | "good" | "fair" | "poor",
    "stability": "stable" | "progressive" | "improving",
    "factors": ["factores que influyen en el pronóstico"]
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "followUp": {
    "timing": "inmediato" | "1_semana" | "1_mes" | "3_meses" | "6_meses" | "1_año",
    "studies": ["estudios adicionales recomendados"]
  },
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA ANGIOGRAFÍA MEJORADA:
- Identifica el tipo de angiografía con mediciones de timing
- Evalúa patrones de fuga con mediciones de área e intensidad
- Busca bloqueos con mediciones de área y severidad
- Identifica tinción con mediciones cuantitativas
- Proporciona diagnósticos diferenciales con probabilidades
- Sugiere opciones de tratamiento basadas en hallazgos vasculares
- Incluye consideraciones pronósticas
- Especifica timing de seguimiento y estudios adicionales`;
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

  private getEnhancedAnteriorSegmentPrompt(config: Partial<ImageAnalysisConfig>): string {
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
        "endothelium": "intact" | "guttata" | "decompensated",
        "measurements": {
          "thickness": número en micrones o null,
          "diameter": número en mm o null,
          "curvature": número en dioptrías o null
        }
      },
      "anteriorChamber": {
        "depth": "normal" | "shallow" | "deep",
        "cells": "none" | "few" | "many",
        "flare": "none" | "mild" | "moderate" | "severe",
        "measurements": {
          "depth": número en mm o null,
          "volume": número en mm³ o null
        }
      },
      "iris": {
        "color": "normal" | "heterochromia" | "atrophic",
        "structure": "normal" | "atrophic" | "neovascular",
        "rubeosis": "none" | "mild" | "moderate" | "severe",
        "measurements": {
          "thickness": número en micrones o null,
          "pupilDistance": número en mm o null
        }
      },
      "pupil": {
        "size": "normal" | "small" | "large" | "irregular",
        "reactivity": "normal" | "sluggish" | "nonreactive",
        "shape": "round" | "irregular" | "keyhole",
        "measurements": {
          "diameter": número en mm o null,
          "area": número en mm² o null
        }
      },
      "lens": {
        "clarity": "clear" | "cataract" | "opaque",
        "position": "normal" | "subluxated" | "dislocated",
        "type": "nuclear" | "cortical" | "posterior_subcapsular" | "mixed",
        "measurements": {
          "thickness": número en mm o null,
          "diameter": número en mm o null
        }
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"],
          "measurements": {
            "size": número en mm o mm²,
            "area": número en mm² o null
          }
        }
      ]
    }
  },
  "measurements": [
    {
      "parameter": "nombre del parámetro medido",
      "value": número,
      "unit": "unidad de medida",
      "location": "ubicación en la imagen",
      "confidence": número entre 0 y 1
    }
  ],
  "differentialDiagnosis": [
    {
      "condition": "nombre de la condición",
      "probability": número entre 0 y 1,
      "evidence": "evidencia que apoya este diagnóstico",
      "nextSteps": "próximos pasos para confirmar"
    }
  ],
  "treatmentOptions": [
    {
      "intervention": "nombre de la intervención",
      "urgency": "urgent" | "routine" | "follow_up",
      "rationale": "justificación basada en hallazgos"
    }
  ],
  "prognosis": {
    "visual": "excellent" | "good" | "fair" | "poor",
    "stability": "stable" | "progressive" | "improving",
    "factors": ["factores que influyen en el pronóstico"]
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "followUp": {
    "timing": "inmediato" | "1_semana" | "1_mes" | "3_meses" | "6_meses" | "1_año",
    "studies": ["estudios adicionales recomendados"]
  },
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA SEGMENTO ANTERIOR MEJORADO:
- Evalúa la claridad y estructura de la córnea con mediciones
- Analiza la profundidad y contenido de la cámara anterior
- Examina el iris y busca neovascularización con mediciones
- Evalúa el tamaño, forma y reactividad pupilar
- Analiza el cristalino y su posición con mediciones
- Identifica patologías del segmento anterior con mediciones
- Proporciona diagnósticos diferenciales con probabilidades
- Sugiere opciones de tratamiento basadas en hallazgos
- Incluye consideraciones pronósticas
- Especifica timing de seguimiento y estudios adicionales`;
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

  private getEnhancedUltrasoundPrompt(config: Partial<ImageAnalysisConfig>): string {
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
        "hemorrhage": "none" | "mild" | "moderate" | "severe",
        "measurements": {
          "thickness": número en mm o null,
          "volume": número en mm³ o null
        }
      },
      "retina": {
        "attached": boolean,
        "thickness": "normal" | "thickened" | "thinned",
        "detachment": "none" | "partial" | "complete",
        "measurements": {
          "thickness": número en micrones o null,
          "detachmentHeight": número en mm o null
        }
      },
      "choroid": {
        "thickness": "normal" | "thickened" | "thinned",
        "detachment": "none" | "partial" | "complete",
        "measurements": {
          "thickness": número en micrones o null,
          "detachmentHeight": número en mm o null
        }
      },
      "orbit": {
        "muscles": "normal" | "thickened" | "atrophic",
        "opticNerve": "normal" | "thickened" | "atrophic",
        "foreignBodies": "none" | "present",
        "measurements": {
          "muscleThickness": número en mm o null,
          "opticNerveDiameter": número en mm o null
        }
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"],
          "measurements": {
            "size": número en mm o mm²,
            "area": número en mm² o null
          }
        }
      ]
    }
  },
  "measurements": [
    {
      "parameter": "nombre del parámetro medido",
      "value": número,
      "unit": "unidad de medida",
      "location": "ubicación en la imagen",
      "confidence": número entre 0 y 1
    }
  ],
  "differentialDiagnosis": [
    {
      "condition": "nombre de la condición",
      "probability": número entre 0 y 1,
      "evidence": "evidencia que apoya este diagnóstico",
      "nextSteps": "próximos pasos para confirmar"
    }
  ],
  "treatmentOptions": [
    {
      "intervention": "nombre de la intervención",
      "urgency": "urgent" | "routine" | "follow_up",
      "rationale": "justificación basada en hallazgos"
    }
  ],
  "prognosis": {
    "visual": "excellent" | "good" | "fair" | "poor",
    "stability": "stable" | "progressive" | "improving",
    "factors": ["factores que influyen en el pronóstico"]
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "followUp": {
    "timing": "inmediato" | "1_semana" | "1_mes" | "3_meses" | "6_meses" | "1_año",
    "studies": ["estudios adicionales recomendados"]
  },
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA ECOGRAFÍA MEJORADA:
- Identifica el tipo de escaneo con mediciones específicas
- Evalúa el vítreo con mediciones de espesor y volumen
- Analiza la retina con mediciones de adherencia y espesor
- Examina la coroides con mediciones de espesor
- Evalúa la órbita con mediciones de músculos y nervio óptico
- Proporciona diagnósticos diferenciales con probabilidades
- Sugiere opciones de tratamiento basadas en hallazgos ecográficos
- Incluye consideraciones pronósticas
- Especifica timing de seguimiento y estudios adicionales`;
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

  private getEnhancedVisualFieldPrompt(config: Partial<ImageAnalysisConfig>): string {
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
      "measurements": {
        "centralThreshold": número en dB o null,
        "peripheralThreshold": número en dB o null,
        "defectArea": número en mm² o null,
        "defectDepth": número en dB o null
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"],
          "measurements": {
            "area": número en mm² o null,
            "depth": número en dB o null
          }
        }
      ]
    }
  },
  "measurements": [
    {
      "parameter": "nombre del parámetro medido",
      "value": número,
      "unit": "unidad de medida",
      "location": "ubicación en la imagen",
      "confidence": número entre 0 y 1
    }
  ],
  "differentialDiagnosis": [
    {
      "condition": "nombre de la condición",
      "probability": número entre 0 y 1,
      "evidence": "evidencia que apoya este diagnóstico",
      "nextSteps": "próximos pasos para confirmar"
    }
  ],
  "treatmentOptions": [
    {
      "intervention": "nombre de la intervención",
      "urgency": "urgent" | "routine" | "follow_up",
      "rationale": "justificación basada en hallazgos"
    }
  ],
  "prognosis": {
    "visual": "excellent" | "good" | "fair" | "poor",
    "stability": "stable" | "progressive" | "improving",
    "factors": ["factores que influyen en el pronóstico"]
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "followUp": {
    "timing": "inmediato" | "1_semana" | "1_mes" | "3_meses" | "6_meses" | "1_año",
    "studies": ["estudios adicionales recomendados"]
  },
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA CAMPO VISUAL MEJORADO:
- Identifica el tipo de prueba con mediciones de confiabilidad
- Evalúa los valores de desviación con mediciones cuantitativas
- Analiza patrones de defectos con mediciones de área y profundidad
- Evalúa el punto ciego con mediciones de tamaño y posición
- Proporciona diagnósticos diferenciales con probabilidades
- Sugiere opciones de tratamiento basadas en hallazgos funcionales
- Incluye consideraciones pronósticas
- Especifica timing de seguimiento y estudios adicionales`;
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

  private getEnhancedCorneaPrompt(config: Partial<ImageAnalysisConfig>): string {
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
        "axis": número en grados o null,
        "measurements": {
          "steepAxis": número en grados o null,
          "flatAxis": número en grados o null,
          "astigmatism": número en dioptrías o null
        }
      },
      "pachymetry": {
        "central": número en micrones o null,
        "thinnest": número en micrones o null,
        "location": "ubicación del punto más delgado",
        "measurements": {
          "thinnestLocation": "ubicación específica",
          "thicknessMap": "mapa de espesores"
        }
      },
      "elevation": {
        "anterior": "normal" | "elevated" | "depressed",
        "posterior": "normal" | "elevated" | "depressed",
        "measurements": {
          "anteriorElevation": número en micrones o null,
          "posteriorElevation": número en micrones o null,
          "elevationMap": "mapa de elevaciones"
        }
      },
      "regularity": {
        "surface": "regular" | "irregular",
        "astigmatism": "with_the_rule" | "against_the_rule" | "oblique",
        "measurements": {
          "surfaceRegularityIndex": número o null,
          "asymmetryIndex": número o null
        }
      },
      "pathology": [
        {
          "type": "tipo de patología",
          "location": "ubicación específica",
          "severity": "mild" | "moderate" | "severe",
          "description": "descripción detallada",
          "confidence": número entre 0 y 1,
          "differential": ["diagnósticos diferenciales"],
          "measurements": {
            "size": número en mm o mm²,
            "area": número en mm² o null
          }
        }
      ]
    }
  },
  "measurements": [
    {
      "parameter": "nombre del parámetro medido",
      "value": número,
      "unit": "unidad de medida",
      "location": "ubicación en la imagen",
      "confidence": número entre 0 y 1
    }
  ],
  "differentialDiagnosis": [
    {
      "condition": "nombre de la condición",
      "probability": número entre 0 y 1,
      "evidence": "evidencia que apoya este diagnóstico",
      "nextSteps": "próximos pasos para confirmar"
    }
  ],
  "treatmentOptions": [
    {
      "intervention": "nombre de la intervención",
      "urgency": "urgent" | "routine" | "follow_up",
      "rationale": "justificación basada en hallazgos"
    }
  ],
  "prognosis": {
    "visual": "excellent" | "good" | "fair" | "poor",
    "stability": "stable" | "progressive" | "improving",
    "factors": ["factores que influyen en el pronóstico"]
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "followUp": {
    "timing": "inmediato" | "1_semana" | "1_mes" | "3_meses" | "6_meses" | "1_año",
    "studies": ["estudios adicionales recomendados"]
  },
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES ESPECÍFICAS PARA TOPOGRAFÍA CORNEAL MEJORADA:
- Analiza los valores de queratometría con mediciones de ejes
- Evalúa la paquimetría con mapas de espesores
- Identifica elevaciones y depresiones con mediciones cuantitativas
- Evalúa la regularidad de la superficie con índices
- Analiza el astigmatismo corneal con mediciones de ejes
- Proporciona diagnósticos diferenciales con probabilidades
- Sugiere opciones de tratamiento basadas en hallazgos topográficos
- Incluye consideraciones pronósticas
- Especifica timing de seguimiento y estudios adicionales`;
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

  private getEnhancedGenericPrompt(config: Partial<ImageAnalysisConfig>): string {
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
        "differential": ["diagnósticos diferenciales"],
        "measurements": {
          "size": número en mm o mm²,
          "area": número en mm² o null
        }
      }
    ]
  },
  "measurements": [
    {
      "parameter": "nombre del parámetro medido",
      "value": número,
      "unit": "unidad de medida",
      "location": "ubicación en la imagen",
      "confidence": número entre 0 y 1
    }
  ],
  "differentialDiagnosis": [
    {
      "condition": "nombre de la condición",
      "probability": número entre 0 y 1,
      "evidence": "evidencia que apoya este diagnóstico",
      "nextSteps": "próximos pasos para confirmar"
    }
  ],
  "treatmentOptions": [
    {
      "intervention": "nombre de la intervención",
      "urgency": "urgent" | "routine" | "follow_up",
      "rationale": "justificación basada en hallazgos"
    }
  ],
  "prognosis": {
    "visual": "excellent" | "good" | "fair" | "poor",
    "stability": "stable" | "progressive" | "improving",
    "factors": ["factores que influyen en el pronóstico"]
  },
  "confidence": número entre 0 y 1,
  "recommendations": ["recomendaciones clínicas específicas"],
  "followUp": {
    "timing": "inmediato" | "1_semana" | "1_mes" | "3_meses" | "6_meses" | "1_año",
    "studies": ["estudios adicionales recomendados"]
  },
  "timestamp": "fecha y hora actual"
}

INSTRUCCIONES GENERALES MEJORADAS:
- Evalúa la calidad general de la imagen con mediciones
- Identifica artefactos que puedan afectar la interpretación
- Busca patologías específicas con mediciones cuantitativas
- Proporciona diagnósticos diferenciales con probabilidades
- Sugiere opciones de tratamiento basadas en hallazgos
- Incluye consideraciones pronósticas
- Especifica timing de seguimiento y estudios adicionales`;
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
