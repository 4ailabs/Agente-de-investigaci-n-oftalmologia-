// Context Engineering Optimization for Medical Research Agent
// Mejoras propuestas para el manejo de contexto

export interface ContextSummary {
  keyFindings: string[];
  criticalEvidence: string[];
  differentialDiagnoses: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface OptimizedStep {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  result: string | null;
  sources: any[] | null;
  contextSummary: ContextSummary | null; // Nuevo: resumen del contexto
  criticalInsights: string[]; // Nuevo: insights clave
}

// 1. CONTEXT WINDOW MANAGEMENT
export const createContextWindowManager = () => {
  const MAX_CONTEXT_LENGTH = 8000; // tokens aproximados
  const CRITICAL_INFO_THRESHOLD = 0.8; // 80% de importancia
  
  return {
    // Resumir contexto cuando excede límite
    summarizeContext: (steps: OptimizedStep[]): string => {
      const criticalSteps = steps.filter(step => 
        step.contextSummary?.confidenceLevel === 'high'
      );
      
      return criticalSteps.map(step => `
### RESUMEN CRÍTICO - PASO ${step.id}: ${step.title} ###
**Hallazgos Clave:** ${step.contextSummary?.keyFindings.join(', ')}
**Evidencia Crítica:** ${step.contextSummary?.criticalEvidence.join(', ')}
**Diagnósticos Diferenciales:** ${step.contextSummary?.differentialDiagnoses.join(', ')}
**Nivel de Confianza:** ${step.contextSummary?.confidenceLevel}
      `).join('\n');
    },
    
    // Determinar qué información mantener
    shouldKeepStep: (step: OptimizedStep, currentStep: number): boolean => {
      const stepAge = currentStep - step.id;
      const isCritical = step.contextSummary?.confidenceLevel === 'high';
      const isRecent = stepAge <= 2;
      
      return isCritical || isRecent;
    }
  };
};

// 2. PROMPT TEMPLATING MEJORADO
export const createAdvancedPromptTemplates = () => {
  return {
    // Template para análisis de contexto
    contextAnalysisPrompt: (currentContext: string, newInformation: string) => `
### ANÁLISIS DE CONTEXTO ###
**Contexto Actual:**
${currentContext}

**Nueva Información:**
${newInformation}

**TAREA:** Analiza la nueva información en el contexto de la investigación actual. Identifica:
1. Información contradictoria que requiera resolución
2. Evidencia que refuerza diagnósticos existentes
3. Nuevos hallazgos que cambien la dirección de la investigación
4. Nivel de confianza en la nueva información (Alto/Medio/Bajo)

Proporciona un análisis estructurado que guíe el siguiente paso.
    `,
    
    // Template para síntesis incremental
    incrementalSynthesisPrompt: (stepResults: string[], currentHypothesis: string) => `
### SÍNTESIS INCREMENTAL ###
**Hipótesis Actual:**
${currentHypothesis}

**Resultados de Pasos Recientes:**
${stepResults.map((result, i) => `Paso ${i + 1}: ${result}`).join('\n')}

**TAREA:** Actualiza la hipótesis principal basándote en los nuevos hallazgos. Identifica:
1. Cambios en la probabilidad de diagnósticos diferenciales
2. Nueva evidencia que requiera investigación adicional
3. Consistencia entre hallazgos
4. Próximos pasos más críticos

Mantén un enfoque en evidencia médica de alta calidad.
    `
  };
};

// 3. MEMORY MANAGEMENT
export interface MemoryBank {
  patientProfile: {
    demographics: string;
    symptoms: string[];
    medicalHistory: string[];
    riskFactors: string[];
  };
  workingDiagnoses: {
    primary: string | null;
    differentials: Array<{
      diagnosis: string;
      probability: number;
      evidence: string[];
    }>;
  };
  evidenceQuality: {
    highQuality: string[];
    mediumQuality: string[];
    lowQuality: string[];
  };
}

export const createMemoryManager = () => {
  return {
    // Actualizar perfil del paciente
    updatePatientProfile: (memory: MemoryBank, newInfo: string): MemoryBank => {
      // Lógica para extraer y actualizar información del paciente
      return memory;
    },
    
    // Actualizar diagnósticos de trabajo
    updateWorkingDiagnoses: (memory: MemoryBank, newEvidence: string): MemoryBank => {
      // Lógica para actualizar diagnósticos basados en nueva evidencia
      return memory;
    },
    
    // Evaluar calidad de evidencia
    evaluateEvidenceQuality: (source: string, content: string): 'high' | 'medium' | 'low' => {
      // Lógica para evaluar calidad basada en fuente y contenido
      if (source.includes('cochrane') || source.includes('pubmed')) return 'high';
      if (source.includes('uptodate') || source.includes('medscape')) return 'medium';
      return 'low';
    }
  };
};

// 4. ERROR HANDLING Y RECOVERY
export const createErrorRecovery = () => {
  return {
    // Detectar errores en contexto
    detectContextErrors: (response: string): string[] => {
      const errors = [];
      if (response.includes('no se pudo encontrar')) errors.push('INFORMATION_NOT_FOUND');
      if (response.includes('contradicción')) errors.push('CONTRADICTORY_EVIDENCE');
      if (response.includes('fuente no confiable')) errors.push('UNRELIABLE_SOURCE');
      return errors;
    },
    
    // Estrategias de recuperación
    recoveryStrategies: {
      INFORMATION_NOT_FOUND: 'Buscar en fuentes alternativas o reformular la búsqueda',
      CONTRADICTORY_EVIDENCE: 'Priorizar evidencia de mayor calidad y buscar consenso',
      UNRELIABLE_SOURCE: 'Verificar con fuentes de mayor autoridad'
    }
  };
};

// 5. OPTIMIZACIÓN DE PROMPTS
export const createOptimizedPrompts = () => {
  return {
    // Prompt de planificación mejorado
    enhancedPlanningPrompt: (userQuery: string) => `
### ROL Y CONTEXTO ###
Eres un Agente de Investigación Clínica de IA especializado en oftalmología. Tu objetivo es crear un plan de investigación riguroso y basado en evidencia.

### PROTOCOLO DE EVIDENCIA ###
Prioriza fuentes en este orden:
1. Revisiones Sistemáticas (Cochrane, PubMed)
2. Ensayos Clínicos (ClinicalTrials.gov)
3. Guías Clínicas (AAO, ESCRS)
4. Revistas Médicas (Lancet, JAMA Ophthalmology)
5. Bases de Datos (UpToDate, Medscape)

### ANÁLISIS DE LA CONSULTA ###
**Consulta del Usuario:** ${userQuery}

**TAREA:** Crea un plan de investigación de 5-7 pasos que:
1. Identifique síntomas clave y perfil del paciente
2. Genere diagnósticos diferenciales priorizados
3. Investigue evidencia para cada diagnóstico
4. Analice fisiopatología del diagnóstico más probable
5. Considere pruebas diagnósticas y manejo
6. Sintetice hallazgos en reporte accionable

**FORMATO DE SALIDA:**
Para cada paso, proporciona:
- Título descriptivo
- Objetivo específico
- Fuentes prioritarias a consultar
- Criterios de éxito

### EJEMPLO DE ESTRUCTURA:
1. **Identificar hallazgos clínicos clave** - Analizar síntomas y signos específicos
2. **Generar diagnósticos diferenciales** - Lista priorizada basada en evidencia
3. **Investigar evidencia diagnóstica** - Buscar criterios y prevalencia
4. **Analizar fisiopatología** - Mecanismos del diagnóstico más probable
5. **Evaluar pruebas diagnósticas** - Confirmación y manejo
6. **Sintetizar hallazgos** - Reporte clínico accionable
    `,
    
    // Prompt de ejecución optimizado
    enhancedExecutionPrompt: (userQuery: string, plan: any[], currentStep: any, context: string) => `
### CONTEXTO DE INVESTIGACIÓN ###
${context}

### TAREA ACTUAL ###
**Paso ${currentStep.id}: ${currentStep.title}**

### INSTRUCCIONES ESPECÍFICAS ###
1. **Búsqueda Dirigida:** Enfócate en fuentes de alta calidad según el protocolo
2. **Análisis Crítico:** Evalúa la calidad y relevancia de cada fuente
3. **Síntesis Precisa:** Resume hallazgos de manera clara y estructurada
4. **Citas Obligatorias:** Incluye todas las fuentes utilizadas

### CRITERIOS DE ÉXITO ###
- Mínimo 3 fuentes de alta calidad
- Análisis basado en evidencia
- Conclusiones claras y accionables
- Referencias completas

**RESPUESTA REQUERIDA:**
Proporciona un análisis estructurado que incluya:
- Hallazgos principales
- Evidencia de apoyo
- Limitaciones identificadas
- Próximos pasos sugeridos
- Fuentes consultadas
    `
  };
};
