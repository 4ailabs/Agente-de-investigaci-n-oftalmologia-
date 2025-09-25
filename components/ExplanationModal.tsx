import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

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
              <X className="h-5 w-5" />
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
            <X className="h-6 w-6" />
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
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">Aviso Médico</p>
          <p className="text-xs text-amber-700">Este análisis es generado por IA y no reemplaza el juicio clínico profesional.</p>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <h3 className="font-semibold text-base">Modos de Investigación</h3>
      <p className="text-sm">La app ofrece 4 modos de investigación especializados:</p>
      
      <div className="space-y-3">
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm text-blue-800">🤖 Deep Research (3-5 min)</h4>
          <p className="text-xs text-blue-700">35+ búsquedas automáticas en PubMed, Crossref, Google Scholar. Ideal para urgencias y casos complejos.</p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm text-purple-800">⚡ Híbrido (5-8 min)</h4>
          <p className="text-xs text-purple-700">Combina Deep Research + transparencia del proceso. Perfecto para enseñanza y documentación.</p>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm text-green-800">🎯 Manual (10-20 min)</h4>
          <p className="text-xs text-green-700">Control total paso a paso. Ideal para casos simples conocidos y aprendizaje activo.</p>
        </div>
        
        <div className="bg-orange-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm text-orange-800">🔮 Automático (Variable)</h4>
          <p className="text-xs text-orange-700">El sistema selecciona automáticamente el mejor modo según la complejidad del caso.</p>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <h3 className="font-semibold text-base">Funcionalidades Principales</h3>
      <ul className="text-xs space-y-1 pl-4">
        <li>• <strong>Análisis de imágenes médicas:</strong> OCT, fundus, angiografía</li>
        <li>• <strong>Búsqueda multi-fuente:</strong> PubMed, Europe PMC, Crossref, Semantic Scholar</li>
        <li>• <strong>25+ referencias reales:</strong> Formato Vancouver automático</li>
        <li>• <strong>Análisis bayesiano:</strong> Probabilidades diagnósticas</li>
        <li>• <strong>Historial de investigaciones:</strong> Acceso rápido a casos anteriores</li>
        <li>• <strong>Interfaz responsive:</strong> Optimizada para móvil y desktop</li>
      </ul>
    </div>

    <div className="space-y-3">
      <h3 className="font-semibold text-base">Fuentes Médicas</h3>
      <p className="text-xs">El sistema prioriza automáticamente:</p>
      <ul className="text-xs space-y-1 pl-4">
        <li>• Revisiones sistemáticas (Cochrane, PubMed)</li>
        <li>• Guías clínicas oficiales (AAO, ESCRS)</li>
        <li>• Revistas médicas revisadas por pares</li>
        <li>• Bases de datos especializadas</li>
        <li>• Estudios de los últimos 5 años</li>
      </ul>
    </div>

    <div className="space-y-3">
      <h3 className="font-semibold text-base">Navegación</h3>
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-xs text-blue-800 mb-2"><strong>Consejo:</strong> Usa el sidebar para navegar entre pasos de investigación completados.</p>
        <div className="flex items-center justify-center space-x-4 text-xs text-blue-600">
          <span>← Paso anterior</span>
          <span>•</span>
          <span>Paso siguiente →</span>
        </div>
      </div>
    </div>
  </div>
);

// Desktop content component  
const DesktopContent: React.FC = () => (
  <div className="prose max-w-none text-slate-800">
    <p>
      Este agente de IA especializado en oftalmología no es un simple chatbot. Es una herramienta diseñada para emular el proceso de investigación de un experto clínico, siguiendo un protocolo estructurado y transparente para garantizar la calidad y fiabilidad de la información médica.
    </p>

    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
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

    <h3 className="font-semibold text-slate-800 mt-6">Modos de Investigación Disponibles</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">🤖 Deep Research (3-5 min)</h4>
        <p className="text-sm text-blue-700">35+ búsquedas automáticas en PubMed, Crossref, Google Scholar. Ideal para urgencias oftalmológicas y casos complejos.</p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-purple-800 mb-2">⚡ Híbrido (5-8 min)</h4>
        <p className="text-sm text-purple-700">Combina Deep Research + transparencia del proceso. Perfecto para enseñanza y documentación clínica.</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-800 mb-2">🎯 Manual (10-20 min)</h4>
        <p className="text-sm text-green-700">Control total paso a paso. Ideal para casos simples conocidos y aprendizaje activo.</p>
      </div>
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <h4 className="font-semibold text-orange-800 mb-2">🔮 Automático (Variable)</h4>
        <p className="text-sm text-orange-700">El sistema selecciona automáticamente el mejor modo según la complejidad del caso.</p>
      </div>
    </div>

    <h3 className="font-semibold text-slate-800 mt-6">Funcionalidades Principales</h3>
    <ul className="space-y-2">
      <li><strong>Análisis de Imágenes Médicas:</strong> OCT, fundus, angiografía fluoresceínica, tomografía de coherencia óptica</li>
      <li><strong>Búsqueda Multi-Fuente:</strong> PubMed, Europe PMC, Crossref, Semantic Scholar, Google Scholar</li>
      <li><strong>25+ Referencias Reales:</strong> Formato Vancouver automático con PMID y DOI</li>
      <li><strong>Análisis Bayesiano:</strong> Probabilidades diagnósticas y diagnósticos diferenciales</li>
      <li><strong>Historial de Investigaciones:</strong> Acceso rápido a casos anteriores y reportes</li>
      <li><strong>Interfaz Responsive:</strong> Optimizada para móvil, tablet y desktop</li>
      <li><strong>Sidebar de Navegación:</strong> Acceso rápido a pasos de investigación completados</li>
    </ul>

    <h3 className="font-semibold text-slate-800 mt-6">Garantías de Calidad Médica</h3>
    <ul className="space-y-2">
      <li><strong>Validación Automática de Fuentes:</strong> Sistema de scoring de autoridad médica (0-100 puntos)</li>
      <li><strong>Detección de Contradicciones:</strong> Análisis automático que prioriza evidencia de mayor calidad</li>
      <li><strong>Filtrado Inteligente:</strong> Eliminación automática de fuentes no confiables</li>
      <li><strong>Referencias Específicas:</strong> Todas las referencias son específicas del tema médico investigado</li>
      <li><strong>Actualización Continua:</strong> Prioriza evidencia de los últimos 5 años</li>
    </ul>

    <h3 className="font-semibold text-slate-800 mt-6">Protocolo de Fuentes Médicas</h3>
    <ol className="space-y-1">
      <li><strong>Revisiones Sistemáticas y Metaanálisis</strong> (Cochrane Library, PubMed)</li>
      <li><strong>Ensayos Clínicos Registrados</strong> (ClinicalTrials.gov)</li>
      <li><strong>Guías de Práctica Clínica</strong> (AAO, ESCRS, AAN)</li>
      <li><strong>Revistas Médicas Revisadas por Pares</strong> (Nature, Science, NEJM, JAMA)</li>
      <li><strong>Bases de Datos Especializadas</strong> (Europe PMC, Crossref, Semantic Scholar)</li>
    </ol>
  </div>
);

export default ExplanationModal;
