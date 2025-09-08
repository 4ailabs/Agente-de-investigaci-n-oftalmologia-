import React from 'react';

const ExplanationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-4">¿Cómo Funciona el Agente de Investigación Clínica?</h2>
        
        <div className="prose prose-sm max-w-none text-slate-800">
          <p>
            Este agente de IA no es un simple chatbot. Es una herramienta diseñada para emular el proceso de investigación de un experto clínico, siguiendo un protocolo estructurado y transparente para garantizar la calidad y fiabilidad de la información. A continuación, se detalla su funcionamiento interno.
          </p>

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
        </div>
      </div>
    </div>
  );
};

export default ExplanationModal;
