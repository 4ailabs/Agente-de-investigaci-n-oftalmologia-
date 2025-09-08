import { ResearchStep } from './types';

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