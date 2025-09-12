import React, { useEffect, useState } from 'react';

const ExplanationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Animate modal open
    setIsOpen(true);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Wait for animation to complete
    setTimeout(() => onClose(), 300);
  };

  // Mobile Bottom Sheet Layout
  if (isMobile) {
    return (
      <div 
        className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      >
        <div 
          className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          } max-h-[85vh] flex flex-col`}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-slate-300 rounded-full"></div>
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Guía de la App</h2>
            <button 
              onClick={handleClose} 
              className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <MobileContent />
          </div>
        </div>
      </div>
    );
  }

  // Desktop Modal Layout
  return (
    <div 
      className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-300 ${
        isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4 transform transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">Agente de Investigación Clínica</h2>
          <button 
            onClick={handleClose} 
            className="flex items-center justify-center w-10 h-10 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto p-6">
          <DesktopContent />
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized content component
const MobileContent: React.FC = () => (
  <div className="prose prose-sm max-w-none text-slate-800 space-y-4">
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
      <div className="flex items-start space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Aviso Médico</p>
          <p className="text-xs text-amber-700">Este análisis es generado por IA y no reemplaza el juicio clínico profesional.</p>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <h3 className="font-semibold text-base">¿Cómo Funciona?</h3>
      <p className="text-sm">Esta herramienta especializada en oftalmología sigue un proceso de investigación médica estructurado en tres fases:</p>
      
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
          <div>
            <h4 className="font-medium text-sm">Planificación</h4>
            <p className="text-xs text-slate-600">Analiza tus síntomas y crea un plan de investigación paso a paso</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
          <div>
            <h4 className="font-medium text-sm">Investigación</h4>
            <p className="text-xs text-slate-600">Busca evidencia médica actualizada de fuentes científicas confiables</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
          <div>
            <h4 className="font-medium text-sm">Síntesis</h4>
            <p className="text-xs text-slate-600">Genera un reporte final con diagnósticos diferenciales y recomendaciones</p>
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <h3 className="font-semibold text-base">Navegación Móvil</h3>
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-xs text-blue-800 mb-2"><strong>Consejo:</strong> Puedes deslizar hacia izquierda/derecha en el área de contenido para navegar entre pasos completados.</p>
        <div className="flex items-center justify-center space-x-4 text-xs text-blue-600">
          <span>← Paso anterior</span>
          <span>•</span>
          <span>Paso siguiente →</span>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <h3 className="font-semibold text-base">Fuentes Médicas</h3>
      <p className="text-xs">El sistema prioriza automáticamente:</p>
      <ul className="text-xs space-y-1 pl-4">
        <li>• Revisiones sistemáticas (Cochrane, PubMed)</li>
        <li>• Guías clínicas oficiales (AAO, ESCRS)</li>
        <li>• Revistas médicas revisadas por pares</li>
        <li>• Bases de datos especializadas</li>
      </ul>
    </div>
  </div>
);

// Desktop content component  
const DesktopContent: React.FC = () => (
  <div className="prose max-w-none text-slate-800">
    <p>
      Este agente de IA no es un simple chatbot. Es una herramienta diseñada para emular el proceso de investigación de un experto clínico, siguiendo un protocolo estructurado y transparente para garantizar la calidad y fiabilidad de la información.
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
    <ol>
      <li><strong>Fase 1: Planificación.</strong> El agente analiza tu consulta y crea un plan de investigación paso a paso estructurado.</li>
      <li><strong>Fase 2: Ejecución.</strong> Ejecuta cada paso buscando en fuentes médicas confiables y construyendo contexto acumulativo.</li>
      <li><strong>Fase 3: Síntesis.</strong> Consolida toda la información en un reporte final con diagnósticos diferenciales y recomendaciones.</li>
    </ol>

    <h3 className="font-semibold text-slate-800 mt-6">Garantías de Calidad Médica</h3>
    <ul>
      <li><strong>Validación Automática de Fuentes:</strong> Sistema de scoring de autoridad médica (0-100 puntos).</li>
      <li><strong>Detección de Contradicciones:</strong> Análisis automático que prioriza evidencia de mayor calidad.</li>
      <li><strong>Filtrado Inteligente:</strong> Eliminación automática de fuentes no confiables.</li>
    </ul>

    <h3 className="font-semibold text-slate-800 mt-6">Protocolo de Fuentes Médicas</h3>
    <ol>
      <li><strong>Revisiones Sistemáticas y Metaanálisis</strong> (Cochrane Library, PubMed)</li>
      <li><strong>Ensayos Clínicos Registrados</strong> (ClinicalTrials.gov)</li>
      <li><strong>Guías de Práctica Clínica</strong> (AAO, ESCRS)</li>
      <li><strong>Revistas Médicas Revisadas por Pares</strong></li>
    </ol>
  </div>
);

export default ExplanationModal;
