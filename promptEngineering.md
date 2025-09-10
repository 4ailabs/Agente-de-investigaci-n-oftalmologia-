# Prompt Engineering - Agente de Investigación Clínica de Oftalmología

## Resumen Ejecutivo

Este documento describe el sistema de prompt engineering implementado en el Agente de Investigación Clínica de Oftalmología, una aplicación web que utiliza Google Gemini 2.5 Flash para realizar investigaciones médicas estructuradas y basadas en evidencia. La aplicación está optimizada para dispositivos móviles y desplegada en Vercel.

## Arquitectura del Sistema de Prompts

### 1. Instrucción Maestra (System Instruction)

**Ubicación:** `constants.ts` - `SYSTEM_INSTRUCTION`

**Propósito:** Establece la personalidad, rol y protocolo fundamental del agente.

**Características Clave:**
- **Rol Específico:** "Agente de Investigación Clínica de IA especializado en oftalmología"
- **Herramienta Única:** Búsqueda de Google como única fuente de información
- **Protocolo de Fuentes:** Jerarquía clara de evidencia médica
- **Proceso Estructurado:** 3 fases definidas (Planificación, Ejecución, Síntesis)

**Estructura del Prompt:**
```
Actúas como un Agente de Investigación Clínica de IA, un especialista en la síntesis de información médica de alta autoridad. Tu única herramienta para recopilar información es la Búsqueda de Google. Tu misión es ejecutar un plan de investigación riguroso, priorizando la evidencia de la más alta calidad.

**Protocolo de Búsqueda y Priorización de Fuentes:**
1. Revisiones Sistemáticas y Metaanálisis (Cochrane Library, PubMed)
2. Ensayos Clínicos Registrados (ClinicalTrials.gov)
3. Guías de Práctica Clínica (AAO, ESCRS)
4. Publicaciones en Revistas Médicas Revisadas por Pares
5. Bases de Datos de Autoridad (UpToDate, Medscape)

**Proceso General:**
1. Fase de Planificación: Analiza y genera plan de investigación
2. Fase de Ejecución: Ejecuta cada paso con búsqueda web
3. Fase de Síntesis: Genera reporte final estructurado

Tu comunicación es siempre profesional, objetiva y basada en la evidencia encontrada. DEBES citar las fuentes web que utilizas para cada respuesta.
```

### 2. Prompt de Planificación

**Ubicación:** `constants.ts` - `createResearchPlanPrompt()`

**Propósito:** Generar un plan de investigación paso a paso basado en la consulta del usuario.

**Estructura:**
```
${SYSTEM_INSTRUCTION}

### SOLICITUD DEL USUARIO ###
"""
${userQuery}
"""

### TAREA ###
Analiza la SOLICITUD DEL USUARIO y crea un plan de investigación paso a paso para abordarla, siguiendo tu protocolo de búsqueda. El plan debe ser una lista numerada que describa las acciones de búsqueda y análisis que realizarás. No ejecutes el plan todavía. Solo proporciona la lista del plan.

Ejemplo de formato de salida:
1. Identificar los síntomas clave y el perfil del paciente
2. Generar una lista priorizada de diagnósticos diferenciales
3. Investigar evidencia de apoyo para cada diagnóstico
4. Investigar fisiopatología del diagnóstico más probable
5. Investigar pruebas de confirmación y manejo
6. Sintetizar la evidencia en un reporte final accionable
```

**Técnicas de Prompt Engineering Utilizadas:**
- **Few-shot Learning:** Ejemplo de formato de salida
- **Instrucciones Específicas:** "No ejecutes el plan todavía"
- **Contexto Estructurado:** Secciones claramente delimitadas
- **Reinforcement:** Repetición de la instrucción maestra

### 3. Prompt de Ejecución

**Ubicación:** `constants.ts` - `createExecuteStepPrompt()`

**Propósito:** Ejecutar un paso específico del plan con contexto acumulativo.

**Estructura:**
```
${SYSTEM_INSTRUCTION}

### SOLICITUD ORIGINAL DEL USUARIO ###
"""
${userQuery}
"""

### PLAN DE INVESTIGACIÓN COMPLETO ###
${plan.map(step => `${step.id}. ${step.title}`).join('\n')}

${previousStepsContext}

### TAREA ACTUAL (Paso ${currentStep.id}) ###
Ejecuta el siguiente paso del plan: "${currentStep.title}".
Utiliza la Búsqueda de Google siguiendo estrictamente tu protocolo de priorización de fuentes. Sintetiza la información encontrada en una respuesta clara y concisa para este paso.
Proporciona solo el resultado para este paso. No repitas el plan ni los resultados anteriores. Tu respuesta DEBE basarse en la evidencia encontrada en tus búsquedas.
```

**Técnicas de Prompt Engineering Utilizadas:**
- **Context Window Management:** Contexto acumulativo de pasos anteriores
- **Chain of Thought:** Construcción lógica paso a paso
- **Memory Pattern:** "Recuerda" resultados anteriores
- **Focus Instructions:** "Solo el resultado para este paso"
- **Evidence-based:** "DEBE basarse en la evidencia encontrada"

### 4. Prompt de Reporte Final

**Ubicación:** `constants.ts` - `createFinalReportPrompt()`

**Propósito:** Sintetizar toda la investigación en un reporte clínico estructurado.

**Estructura:**
```
${SYSTEM_INSTRUCTION}

Has completado la fase de ejecución de una investigación. Ahora debes entrar en la **Fase de Síntesis**.

### SOLICITUD ORIGINAL DEL USUARIO ###
"""
${userQuery}
"""

### CONTEXTO DE LA INVESTIGACIÓN REALIZADA ###
${researchContext}

### TAREA FINAL ###
Analiza la totalidad del CONTEXTO DE LA INVESTIGACIÓN REALIZADA. Sintetiza toda la información en un **Reporte Clínico Accionable** coherente, bien estructurado y en formato Markdown, diseñado para ser de máxima utilidad para un médico.

El reporte DEBE tener la siguiente estructura precisa:

1. **Síntesis Clínica Clave:**
   - Un párrafo conciso que presente el diagnóstico más probable
   - Hallazgos clave que lo respaldan
   - Conclusión directa y al grano

2. **Tabla de Diagnósticos Diferenciales:**
   - Formato Markdown con columnas específicas
   - "Diagnóstico", "Evidencia a Favor", "Evidencia en Contra", "Nivel de Sospecha"

3. **Teoría y Fisiopatología:**
   - Explicación clara de mecanismos biológicos
   - Procesos patológicos subyacentes
   - Explicación del "por qué" y "cómo"

4. **Plan de Acción Sugerido:**
   - Pruebas Diagnósticas
   - Consultas a Especialistas
   - Consideraciones Terapéuticas

5. **Desarrollo Detallado de Hallazgos:**
   - Análisis narrativo que conecte información
   - Desarrollo lógico para respaldar conclusiones

6. **Referencias Consolidadas:**
   - Lista numerada de TODAS las fuentes únicas
   - Solo títulos de las fuentes (sin URLs)
```

**Técnicas de Prompt Engineering Utilizadas:**
- **Template Pattern:** Estructura específica y detallada
- **Role-based Instructions:** "Diseñado para ser de máxima utilidad para un médico"
- **Format Specification:** Markdown con estructura específica
- **Comprehensive Context:** Toda la investigación como contexto
- **Quality Constraints:** "coherente, bien estructurado"

## Prompts Completos Utilizados

### 1. Instrucción Maestra Completa

```typescript
export const SYSTEM_INSTRUCTION = `Actúas como un Agente de Investigación Clínica de IA, un especialista en la síntesis de información médica de alta autoridad. Tu única herramienta para recopilar información es la Búsqueda de Google. Tu misión es ejecutar un plan de investigación riguroso, priorizando la evidencia de la más alta calidad. Una parte crucial de tu análisis es la elaboración de diagnósticos diferenciales, sopesando la evidencia para cada posibilidad.

**Protocolo de Búsqueda y Priorización de Fuentes:**
Al ejecutar cada paso de investigación, DEBES priorizar la búsqueda y el análisis de información proveniente de las siguientes fuentes, en este orden de preferencia:
1.  **Revisiones Sistemáticas y Metaanálisis:** (Ej. Cochrane Library, revisiones en PubMed).
2.  **Ensayos Clínicos Registrados:** (Ej. ClinicalTrials.gov).
3.  **Guías de Práctica Clínica:** Publicadas por sociedades médicas reconocidas (ej. AAO, ESCRS).
4.  **Publicaciones en Revistas Médicas Revisadas por Pares:** (Ej. The Lancet, JAMA Ophthalmology, NEJM, Ophthalmology).
5.  **Bases de Datos de Autoridad:** (Ej. UpToDate, Medscape).

**Proceso General:**
Sigues un proceso de tres fases:
1.  **Fase de Planificación:** Analiza la solicitud del usuario y genera un plan de investigación lógico que refleje tu protocolo de búsqueda.
2.  **Fase de Ejecución:** Ejecutas cada paso del plan, uno a la vez, utilizando la Búsqueda de Google para encontrar información según tu protocolo de priorización. El resultado de cada paso se utiliza como contexto para el siguiente.
3.  **Fase de Síntesis (Reporte Final):** Al finalizar todos los pasos, sintetizas toda la información recopilada en un reporte de investigación completo y estructurado.

Tu comunicación es siempre profesional, objetiva y basada en la evidencia encontrada. DEBES citar las fuentes web que utilizas para cada respuesta.`;
```

### 2. Prompt de Planificación Completo

```typescript
export const createResearchPlanPrompt = (userQuery: string): string => `
${SYSTEM_INSTRUCTION}

### SOLICITUD DEL USUARIO ###
"""
${userQuery}
"""

### TAREA ###
Analiza la SOLICITUD DEL USUARIO y crea un plan de investigación paso a paso para abordarla, siguiendo tu protocolo de búsqueda. El plan debe ser una lista numerada que describa las acciones de búsqueda y análisis que realizarás. No ejecutes el plan todavía. Solo proporciona la lista del plan.

Ejemplo de formato de salida:
1. Identificar los síntomas clave (p. ej., disminución súbita de la visión) y el perfil del paciente.
2. Generar una lista priorizada de diagnósticos diferenciales buscando en fuentes de autoridad (UpToDate, PubMed) las causas de [síntomas] en un paciente de [perfil].
3. Para cada diagnóstico diferencial probable, investigar la evidencia de apoyo (criterios diagnósticos, prevalencia) en guías clínicas y revisiones sistemáticas.
4. Investigar la fisiopatología del diagnóstico más probable.
5. Investigar las pruebas de confirmación y el manejo recomendado para los diagnósticos principales.
6. Sintetizar la evidencia en un reporte final accionable.
`;
```

### 3. Prompt de Ejecución Completo

```typescript
export const createExecuteStepPrompt = (
    userQuery: string,
    plan: { id: number, title: string, result: string | null }[],
    currentStep: { id: number, title: string }
): string => {
    
    const previousStepsContext = plan
        .filter(step => step.id < currentStep.id && step.result)
        .map(step => `
### RESULTADO DEL PASO ${step.id}: ${step.title} ###
"""
${step.result}
"""
        `)
        .join('\n');

    return `
${SYSTEM_INSTRUCTION}

### SOLICITUD ORIGINAL DEL USUARIO ###
"""
${userQuery}
"""

### PLAN DE INVESTIGACIÓN COMPLETO ###
${plan.map(step => `${step.id}. ${step.title}`).join('\n')}

${previousStepsContext}

### TAREA ACTUAL (Paso ${currentStep.id}) ###
Ejecuta el siguiente paso del plan: "${currentStep.title}".
Utiliza la Búsqueda de Google siguiendo estrictamente tu protocolo de priorización de fuentes. Sintetiza la información encontrada en una respuesta clara y concisa para este paso.
Proporciona solo el resultado para este paso. No repitas el plan ni los resultados anteriores. Tu respuesta DEBE basarse en la evidencia encontrada en tus búsquedas.
`;
};
```

### 4. Prompt de Reporte Final Completo

```typescript
export const createFinalReportPrompt = (
  userQuery: string,
  completedSteps: ResearchStep[]
): string => {
  const researchContext = completedSteps
    .map(step => `
### RESULTADO DEL PASO ${step.id}: ${step.title} ###
**Hallazgos:**
${step.result}

**Títulos de las Fuentes Usadas en este Paso:**
${step.sources?.map(s => `- ${s.web.title}`).join('\n') || 'Ninguna'}
    `)
    .join('\n\n---\n');

  return `
${SYSTEM_INSTRUCTION}

Has completado la fase de ejecución de una investigación. Ahora debes entrar en la **Fase de Síntesis**.

### SOLICITUD ORIGINAL DEL USUARIO ###
"""
${userQuery}
"""

### CONTEXTO DE LA INVESTIGACIÓN REALIZADA ###
A continuación se presentan todos los hallazgos y los títulos de las fuentes de cada paso de la investigación que has completado:
---
${researchContext}
---

### TAREA FINAL ###
Analiza la totalidad del CONTEXTO DE LA INVESTIGACIÓN REALIZADA. Sintetiza toda la información en un **Reporte Clínico Accionable** coherente, bien estructurado y en formato Markdown, diseñado para ser de máxima utilidad para un médico. El reporte debe ser objetivo y basarse únicamente en la información recopilada.

El reporte DEBE tener la siguiente estructura precisa:

1.  **Síntesis Clínica Clave:**
    *   Un párrafo conciso que presente el diagnóstico más probable, los hallazgos clave que lo respaldan y una conclusión directa y al grano.

2.  **Tabla de Diagnósticos Diferenciales:**
    *   Una tabla en formato Markdown con las siguientes columnas: "Diagnóstico", "Evidencia a Favor", "Evidencia en Contra", "Nivel de Sospecha (Alta/Media/Baja)".
    *   Enumera los diagnósticos diferenciales más importantes, llenando cada columna con justificaciones concisas basadas en la evidencia.

3.  **Teoría y Fisiopatología:**
    *   Una explicación clara y detallada de los mecanismos biológicos y procesos patológicos subyacentes del diagnóstico más probable. Explica *por qué* y *cómo* ocurre la enfermedad.

4.  **Plan de Acción Sugerido:**
    *   Una lista de recomendaciones claras y accionables, dividida en:
        *   **Pruebas Diagnósticas:** Exámenes o tests recomendados para confirmar o descartar diagnósticos.
        *   **Consultas a Especialistas:** Si se recomienda la interconsulta con otras especialidades.
        *   **Consideraciones Terapéuticas:** Posibles líneas de tratamiento iniciales basadas en la evidencia encontrada.

5.  **Desarrollo Detallado de Hallazgos:**
    *   Un análisis narrativo que conecte y desarrolle la información de los diferentes pasos de la investigación de manera lógica para respaldar las conclusiones.

6.  **Referencias Consolidadas:**
    *   Una lista numerada de TODAS las fuentes únicas utilizadas a lo largo de toda la investigación. Muestra únicamente los **títulos** de las fuentes. No incluyas URLs.
`;
};
```

### 5. Prompts de Validación Médica

#### Prompt de Análisis de Contexto
```typescript
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
`
```

#### Prompt de Síntesis Incremental
```typescript
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
```

### 6. Prompts de Planificación Mejorados

#### Prompt de Planificación Avanzado
```typescript
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
`
```

#### Prompt de Ejecución Optimizado
```typescript
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
```

### 7. Disclaimers Médicos

```typescript
export const MEDICAL_DISCLAIMERS: MedicalDisclaimers = {
  ai_limitation: "IMPORTANTE: Este análisis es generado por inteligencia artificial y no reemplaza el juicio clínico profesional.",
  supervision_required: "SUPERVISIÓN MÉDICA REQUERIDA: Todas las recomendaciones deben ser validadas por un médico calificado antes de su aplicación.",
  evidence_quality: "CALIDAD DE EVIDENCIA: La calidad y actualidad de la evidencia puede variar según las fuentes disponibles.",
  not_diagnostic: "NO ES DIAGNÓSTICO: Este análisis no constituye un diagnóstico médico definitivo y no debe utilizarse como tal.",
  source_validation: "VALIDACIÓN DE FUENTES: Las fuentes han sido evaluadas por autoridad médica, pero se recomienda verificación adicional."
};
```

## Técnicas Avanzadas de Prompt Engineering

### 1. Context Window Management

**Problema:** Los LLMs tienen límites de contexto que pueden causar pérdida de información.

**Solución Implementada:**
- **Contexto Acumulativo:** Solo pasos anteriores relevantes
- **Resumen Inteligente:** Información crítica preservada
- **Priorización:** Pasos con alta confianza mantenidos

**Código de Ejemplo:**
```typescript
const previousStepsContext = plan
    .filter(step => step.id < currentStep.id && step.result)
    .map(step => `
### RESULTADO DEL PASO ${step.id}: ${step.title} ###
"""
${step.result}
"""
    `)
    .join('\n');
```

### 2. Memory Pattern

**Implementación:** El agente "recuerda" resultados de pasos anteriores para construir razonamiento complejo.

**Beneficios:**
- **Coherencia:** Cada paso construye sobre el anterior
- **Profundidad:** Análisis más detallado y contextual
- **Trazabilidad:** Seguimiento completo del razonamiento

### 3. Few-shot Learning

**Implementación:** Ejemplos específicos en prompts de planificación.

**Ejemplo:**
```
Ejemplo de formato de salida:
1. Identificar los síntomas clave (p. ej., disminución súbita de la visión) y el perfil del paciente.
2. Generar una lista priorizada de diagnósticos diferenciales buscando en fuentes de autoridad...
```

### 4. Chain of Thought

**Implementación:** Proceso secuencial de 3 fases que guía el razonamiento.

**Flujo:**
1. **Planificación** → Estrategia de investigación
2. **Ejecución** → Búsqueda y análisis paso a paso
3. **Síntesis** → Integración y reporte final

### 5. Role-based Prompting

**Implementación:** El agente actúa como "especialista en síntesis de información médica de alta autoridad".

**Características:**
- **Especialización:** Oftalmología específica
- **Autoridad:** Fuentes médicas reconocidas
- **Profesionalismo:** Comunicación objetiva y basada en evidencia

## Validación y Calidad de Prompts

### 1. Validación de Fuentes

**Implementación:** Sistema de scoring automático de autoridad médica.

**Criterios:**
- **Dominio:** Reconocimiento de fuentes médicas
- **Autoridad:** Scoring 0-100 puntos
- **Calidad:** Identificación de evidencia revisada por pares

### 2. Detección de Contradicciones

**Implementación:** Análisis automático de inconsistencias entre fuentes.

**Patrones Detectados:**
- Información contradictoria sobre efectividad
- Conflictos en recomendaciones de tratamiento
- Evidencia contradictoria sobre seguridad

### 3. Disclaimers Médicos

**Implementación:** Advertencias obligatorias en reportes.

**Contenido:**
- Limitaciones de IA
- Requerimiento de supervisión médica
- No constituye diagnóstico definitivo

## Métricas de Efectividad

### 1. Calidad de Fuentes
- **Objetivo:** >80% de fuentes de alta calidad
- **Métrica:** Porcentaje de fuentes con scoring >70

### 2. Consistencia
- **Objetivo:** 100% de detección de contradicciones
- **Métrica:** Contradicciones identificadas automáticamente

### 3. Completitud
- **Objetivo:** Cobertura completa de aspectos clínicos
- **Métrica:** Pasos del plan ejecutados exitosamente

### 4. Trazabilidad
- **Objetivo:** 100% de fuentes citadas
- **Métrica:** Referencias incluidas en cada paso

## Optimizaciones Futuras

### 1. Prompt Templates Dinámicos
- Adaptación según tipo de consulta
- Especialización por sub-áreas de oftalmología
- Personalización según nivel de experiencia del usuario

### 2. Context Engineering Avanzado
- Memoria persistente entre sesiones
- Resumen inteligente de contexto
- Priorización dinámica de información

### 3. Validación de Prompts
- A/B testing de diferentes versiones
- Métricas de calidad de respuestas
- Feedback loop con especialistas médicos

### 4. Especialización Médica
- Prompts específicos por patología
- Protocolos de validación médica
- Integración con guías clínicas actualizadas

## Conclusiones

El sistema de prompt engineering implementado combina técnicas avanzadas de LLM con validación médica rigurosa para crear un agente de investigación clínica especializado en oftalmología. La arquitectura modular permite escalabilidad y mejoras continuas mientras mantiene la calidad y precisión médica requerida.

**Puntos Clave:**
- **Estructura de 3 Fases** para investigación sistemática
- **Context Window Management** para manejo eficiente de información
- **Validación Médica** para garantizar calidad de fuentes
- **Disclaimers Obligatorios** para responsabilidad legal
- **Métricas de Calidad** para evaluación continua

Este sistema representa un enfoque innovador para la aplicación de LLMs en investigación médica especializada, combinando la potencia de la IA con la rigurosidad requerida en el campo médico.

## Arquitectura Técnica Actualizada (Diciembre 2024)

### Stack Tecnológico

**Frontend:**
- **React 19.1.1** - Framework principal
- **TypeScript 5.8.2** - Tipado estático
- **Vite 6.2.0** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **React Markdown 9.0.1** - Renderizado de contenido

**Backend/API:**
- **Google Gemini 2.5 Flash** - Motor de IA
- **@google/genai 1.17.0** - SDK oficial
- **Búsqueda de Google** - Herramienta de investigación

**Despliegue:**
- **Vercel** - Plataforma de hosting
- **Node.js 18.19.0** - Runtime (especificado en .nvmrc)
- **Terser** - Minificación de código

### Estructura de Archivos Actualizada

```
/
├── App.tsx                          # Componente principal
├── constants.ts                     # Prompts y configuraciones
├── types.ts                         # Interfaces TypeScript
├── services/
│   └── geminiService.ts            # Servicio de IA
├── components/
│   ├── Header.tsx                  # Header responsive
│   ├── Footer.tsx                  # Footer minimalista
│   ├── ExplanationModal.tsx        # Modal de guía
│   ├── Spinner.tsx                 # Componentes de carga
│   ├── PromptForm.tsx              # Formulario inicial
│   ├── GeneratedPromptDisplay.tsx  # Display de prompts
│   └── ResultDisplay.tsx           # Display de resultados
├── hooks/
│   └── useSwipeGesture.ts          # Hook para gestos móviles
├── contextEngineering.ts           # Gestión de contexto médico
├── enhancedReasoning.ts            # Razonamiento clínico avanzado
├── ophthalmologyKnowledge.ts       # Base de conocimiento oftalmológico
├── qualityAssurance.ts             # Garantías de calidad
├── medicalValidation.ts            # Validación de fuentes médicas
├── vercel.json                     # Configuración de Vercel
├── vite.config.ts                  # Configuración de Vite
└── package.json                    # Dependencias del proyecto
```

### Optimizaciones de UX/UI Implementadas

**Mobile First:**
- **Header compacto** (56px altura fija)
- **Navegación por gestos** (swipe izquierda/derecha)
- **Modal bottom sheet** en móviles
- **Botones táctiles** optimizados (44px mínimo)
- **Tipografía responsive** (text-sm lg:text-base)

**Desktop:**
- **Layout de dos columnas** (sidebar + contenido)
- **Modal centrado** tradicional
- **Hover effects** y transiciones suaves
- **Z-index optimizado** para evitar superposiciones

### Características de Accesibilidad

**Contraste:**
- **Títulos oscuros** (text-slate-900) en fondos claros
- **Enlaces visibles** con hover effects
- **Iconos descriptivos** con aria-labels

**Usabilidad:**
- **Área táctil mínima** de 44px para botones
- **Navegación por teclado** completa
- **Feedback visual** en todas las interacciones
- **Loading states** informativos

### Sistema de Validación Médica

**MedicalValidationService:**
- **Scoring de autoridad** (0-100 puntos)
- **Detección de contradicciones** entre fuentes
- **Filtrado inteligente** de fuentes no confiables
- **Evaluación de evidencia** (GRADE simplificado)

**QualityAssuranceEngine:**
- **Métricas de calidad** (precisión, evidencia, completitud)
- **Patrones de detección** de problemas médicos
- **Recomendaciones automáticas** de mejora

### URLs de Producción

**Aplicación Principal:**
- **URL:** https://oftalmo-ai-4ailabs-projects.vercel.app
- **Panel:** https://vercel.com/4ailabs-projects/oftalmo-ai
- **Despliegue automático** desde GitHub

### Mejoras Implementadas (Diciembre 2024)

1. **Optimización móvil completa** con navegación por gestos
2. **Sistema de validación médica** robusto
3. **Context engineering** avanzado
4. **Enlaces de fuentes** mejorados y clickables
5. **Contraste de header** corregido
6. **Tamaños de fuente** optimizados para legibilidad
7. **Z-index** corregido para evitar superposiciones
8. **Lazy loading** de componentes pesados
9. **PWA capabilities** con manifest.json
10. **Seguridad mejorada** con variables de entorno

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0.0  
**Desarrollado por:** 4 ailabs
