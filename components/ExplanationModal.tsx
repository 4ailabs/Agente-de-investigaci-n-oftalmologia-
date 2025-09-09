import React from 'react';

const ExplanationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-3 lg:p-6 relative mx-2 lg:mx-4"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 lg:top-4 lg:right-4 text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 min-h-[40px] min-w-[40px]"
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-lg lg:text-2xl font-bold text-slate-900 mb-4">Agente de Investigación Clínica de Oftalmología</h2>
        
        <div className="prose prose-sm max-w-none text-slate-800">
          <p>
            Este agente de IA no es un simple chatbot. Es una herramienta diseñada para emular el proceso de investigación de un experto clínico, siguiendo un protocolo estructurado y transparente para garantizar la calidad y fiabilidad de la información. A continuación, se detalla su funcionamiento interno.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800 mb-2">Avisos Médicos Importantes</h4>
                <div className="text-sm text-amber-700 space-y-1">
                  <p><strong>IMPORTANTE:</strong> Este análisis es generado por IA y no reemplaza el juicio clínico profesional.</p>
                  <p><strong>SUPERVISIÓN MÉDICA REQUERIDA:</strong> Todas las recomendaciones deben ser validadas por un médico calificado.</p>
                  <p><strong>NO ES DIAGNÓSTICO:</strong> Este análisis no constituye un diagnóstico médico definitivo.</p>
                </div>
              </div>
            </div>
          </div>

          <h3 className="font-semibold text-slate-800 mt-6">El Proceso de Investigación en Tres Fases</h3>
          <p>
            Toda la investigación sigue un flujo de trabajo lógico y secuencial, dividido en tres fases distintas:
          </p>
          <ol>
            <li><strong>Fase 1: Planificación.</strong> Al recibir tu consulta inicial (datos del paciente y síntomas), la primera tarea del agente es analizarla y crear un plan de investigación paso a paso. No busca respuestas aún; simplemente define una estrategia lógica para encontrarlas.</li>
            <li><strong>Fase 2: Ejecución.</strong> El agente ejecuta cada paso del plan, uno a la vez. Para cada paso, realiza búsquedas en la web y sintetiza la información. Crucialmente, los resultados de los pasos anteriores se añaden al contexto del siguiente, creando una "memoria de trabajo" que permite un análisis más profundo y coherente.</li>
            <li><strong>Fase 3: Síntesis.</strong> Una vez completados todos los pasos, el agente revisa toda la información recopilada (hallazgos y fuentes) y la consolida en un reporte de investigación final, bien estructurado y con referencias.</li>
          </ol>

          <h3 className="font-semibold text-slate-800 mt-6">La Ingeniería de Prompts (Las Instrucciones para la IA)</h3>
          <p>
            La clave del comportamiento del agente reside en un conjunto de instrucciones (prompts) cuidadosamente diseñadas que guían su "pensamiento" en cada fase:
          </p>
          <ul>
            <li><strong>La Instrucción Maestra (<code>SYSTEM_INSTRUCTION</code>):</strong> Es la "personalidad" y el protocolo fundamental del agente. Le indica que debe actuar como un investigador clínico experto, que debe priorizar fuentes de alta autoridad (PubMed, Cochrane, etc.), que debe citar sus fuentes y que debe seguir el proceso de tres fases. Esta instrucción está presente en cada interacción con la IA.</li>
            <li><strong>El Prompt de Planificación:</strong> Le pide a la IA que, basándose en la consulta del usuario, cree el plan de investigación. La instrucción es clara: "No ejecutes el plan todavía, solo créalo".</li>
            <li><strong>El Prompt de Ejecución:</strong> Es la instrucción más compleja. Proporciona a la IA la consulta original, el plan completo, los resultados de los pasos anteriores y la tarea específica del paso actual. Esto le permite enfocarse en una sola tarea teniendo todo el contexto relevante.</li>
            <li><strong>El Prompt del Reporte Final:</strong> Le da a la IA todos los hallazgos y fuentes de la investigación y le pide que los sintetice en un reporte con una estructura específica (Resumen, Diagnósticos Diferenciales, Desarrollo, etc.).</li>
          </ul>

          <h3 className="font-semibold text-slate-800 mt-6">Metodología de Investigación de la IA</h3>
          <ul>
            <li><strong>Búsqueda Activa en la Web:</strong> El agente no tiene una base de datos interna de conocimiento médico. Para cada paso, utiliza la herramienta de <strong>Búsqueda de Google</strong> del API de Gemini para acceder a información actualizada y relevante en tiempo real.</li>
            <li><strong>Priorización de Fuentes:</strong> Gracias a su instrucción maestra, el agente está programado para dar una alta preferencia a dominios y fuentes de reconocida autoridad científica, asegurando que la evidencia recopilada sea de alta calidad.</li>
            <li><strong>Contexto Acumulativo (Cadena de Pensamiento):</strong> Al "recordar" los resultados de los pasos previos, el agente puede construir un razonamiento complejo. Por ejemplo, primero identifica síntomas, luego busca diagnósticos diferenciales para esos síntomas, y después investiga las pruebas para esos diagnósticos, creando una línea de investigación lógica y coherente.</li>
          </ul>

          <h3 className="font-semibold text-slate-800 mt-6">Garantías de Calidad Médica</h3>
          <p>
            La aplicación implementa múltiples capas de validación para garantizar la seriedad y precisión de las investigaciones:
          </p>
          <ul>
            <li><strong>Validación Automática de Fuentes:</strong> Sistema de scoring de autoridad médica (0-100 puntos) que evalúa automáticamente la calidad de cada fuente utilizada.</li>
            <li><strong>Detección de Contradicciones:</strong> Análisis automático que identifica información contradictoria entre fuentes y prioriza evidencia de mayor calidad.</li>
            <li><strong>Filtrado Inteligente:</strong> Eliminación automática de fuentes no confiables (Wikipedia, blogs, etc.) y priorización de fuentes médicas reconocidas.</li>
            <li><strong>Evaluación de Evidencia:</strong> Clasificación automática de la calidad de evidencia basada en estándares médicos (GRADE simplificado).</li>
          </ul>

          <h3 className="font-semibold text-slate-800 mt-6">Protocolo de Fuentes Médicas</h3>
          <p>
            El sistema prioriza automáticamente las fuentes en este orden de autoridad:
          </p>
          <ol>
            <li><strong>Revisiones Sistemáticas y Metaanálisis</strong> (Cochrane Library, PubMed)</li>
            <li><strong>Ensayos Clínicos Registrados</strong> (ClinicalTrials.gov)</li>
            <li><strong>Guías de Práctica Clínica</strong> (AAO, ESCRS)</li>
            <li><strong>Revistas Médicas Revisadas por Pares</strong> (Lancet, JAMA Ophthalmology, NEJM)</li>
            <li><strong>Bases de Datos de Autoridad</strong> (UpToDate, Medscape)</li>
          </ol>

          <h3 className="font-semibold text-slate-800 mt-6">Funcionalidades Avanzadas</h3>
          <ul>
            <li><strong>Sistema de Copiado Inteligente:</strong> Permite copiar pasos individuales o reportes completos con formato estructurado.</li>
            <li><strong>Navegación Intuitiva:</strong> Panel de control con indicadores de estado y progreso en tiempo real.</li>
            <li><strong>Fuentes Interactivas:</strong> Enlaces directos a todas las referencias médicas utilizadas.</li>
            <li><strong>Métricas de Calidad:</strong> Evaluación continua de la calidad de fuentes y consistencia de la investigación.</li>
          </ul>

          <h3 className="font-semibold text-slate-800 mt-6">Flujo de Trabajo Recomendado</h3>
          <ol>
            <li><strong>Preparación:</strong> Reúne toda la información clínica disponible del paciente.</li>
            <li><strong>Ingreso de Datos:</strong> Completa todos los campos del formulario inicial con la mayor precisión posible.</li>
            <li><strong>Ejecución:</strong> Deja que el sistema ejecute todos los pasos automáticamente.</li>
            <li><strong>Revisión:</strong> Examina cada paso y sus fuentes para verificar la calidad de la evidencia.</li>
            <li><strong>Validación:</strong> Consulta con especialistas médicos antes de aplicar cualquier recomendación.</li>
            <li><strong>Aplicación:</strong> Utiliza el reporte como guía complementaria al juicio clínico profesional.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ExplanationModal;
