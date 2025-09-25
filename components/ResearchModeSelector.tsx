import React, { useState, useEffect } from 'react';
import { PatientContext, UserPreferences } from '../services/researchOrchestrator';
import {
  Activity,
  Brain,
  GitMerge,
  Settings,
  Clipboard,
  AlertTriangle,
  Building2,
  GraduationCap,
  ChevronRight,
  FileText,
  Bot,
  Zap,
  Target,
  Sparkles
} from 'lucide-react';

interface ResearchModeSelectorProps {
  onModeSelect: (mode: ResearchMode, context?: PatientContext) => void;
  patientData?: {
    age?: number;
    sex?: 'M' | 'F';
    clinicalInfo?: string;
  };
  isLoading?: boolean;
}

export type ResearchMode = 'manual' | 'deep_research' | 'hybrid' | 'auto';

interface ModeOption {
  id: ResearchMode;
  name: string;
  description: string;
  icon: string;
  pros: string[];
  cons: string[];
  timeEstimate: string;
  bestFor: string[];
  complexity: 'simple' | 'moderate' | 'advanced';
}

const ResearchModeSelector: React.FC<ResearchModeSelectorProps> = ({
  onModeSelect,
  patientData,
  isLoading = false
}) => {
  const [selectedMode, setSelectedMode] = useState<ResearchMode>('auto');
  const [recommendedMode, setRecommendedMode] = useState<ResearchMode>('hybrid');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [caseComplexity, setCaseComplexity] = useState<'simple' | 'moderate' | 'complex'>('moderate');

  const modes: ModeOption[] = [
    {
      id: 'auto',
      name: 'Automático (Recomendado)',
      description: 'El sistema selecciona automáticamente entre Deep Research, Híbrido o Manual según la complejidad del caso',
      icon: 'AUTO',
      pros: ['Selección inteligente automática', 'Balance óptimo tiempo/calidad', 'Sin decisiones manuales'],
      cons: ['Menos control sobre el método específico'],
      timeEstimate: '3-10 minutos',
      bestFor: ['Todos los casos rutinarios', 'Cuando no sabes qué modo elegir', 'Workflow clínico eficiente'],
      complexity: 'simple'
    },
    {
      id: 'deep_research',
      name: 'Deep Research - IA Autónoma',
      description: 'IA ejecuta 35+ búsquedas automáticas en PubMed, Crossref, Google Scholar. Máxima profundidad.',
      icon: 'AI',
      pros: ['Máxima velocidad (3-5 min)', '35+ fuentes automáticas', 'Análisis bayesiano', '25+ referencias reales'],
      cons: ['Proceso menos visible', 'Menos control granular'],
      timeEstimate: '3-5 minutos',
      bestFor: ['Casos complejos/raros', 'Urgencias oftalmológicas', 'Interconsultas hospitalarias', 'Medicina legal'],
      complexity: 'advanced'
    },
    {
      id: 'hybrid',
      name: 'Híbrido - Mejor Balance',
      description: 'Combina Deep Research + pasos visibles del proceso. Potencia total con transparencia educativa.',
      icon: 'HYB',
      pros: ['Potencia de Deep Research', 'Proceso visible', 'Ideal para enseñanza', 'Referencias completas'],
      cons: ['Ligeramente más tiempo que Deep Research'],
      timeEstimate: '5-8 minutos',
      bestFor: ['Residentes/estudiantes', 'Casos de enseñanza', 'Documentación clínica', 'Validación de procesos'],
      complexity: 'moderate'
    },
    {
      id: 'manual',
      name: 'Manual - Control Total',
      description: 'Tú diriges cada paso de la investigación. Sistema tradicional con control granular.',
      icon: 'MAN',
      pros: ['Control total paso a paso', 'Máxima transparencia', 'Personalizable 100%', 'Educativo'],
      cons: ['Más lento (10-20 min)', 'Requiere más intervención'],
      timeEstimate: '10-20 minutos',
      bestFor: ['Casos simples conocidos', 'Aprendizaje activo', 'Investigación dirigida', 'Tiempo disponible'],
      complexity: 'simple'
    }
  ];

  // Analyze case complexity from patient data
  useEffect(() => {
    if (!patientData) return;

    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    let score = 0;

    // Age factors
    if (patientData.age) {
      if (patientData.age < 18 || patientData.age > 65) score += 1;
    }

    // Clinical info complexity
    if (patientData.clinicalInfo) {
      const info = patientData.clinicalInfo.toLowerCase();
      const complexTerms = ['múltiple', 'bilateral', 'recurrent', 'crónico', 'sistémico'];
      const symptomCount = (info.match(/síntoma/g) || []).length;
      
      score += complexTerms.reduce((acc, term) => 
        acc + (info.includes(term) ? 1 : 0), 0);
      score += Math.min(Math.floor(symptomCount / 2), 2);
    }

    if (score >= 4) complexity = 'complex';
    else if (score >= 2) complexity = 'moderate';

    setCaseComplexity(complexity);

    // Set recommended mode based on complexity
    const recommended = complexity === 'complex' ? 'deep_research' : 
                       complexity === 'moderate' ? 'hybrid' : 
                       'auto';
    setRecommendedMode(recommended);
    setSelectedMode(recommended);
  }, [patientData]);

  const handleModeSelect = (mode: ResearchMode) => {
    setSelectedMode(mode);
    
    // Create patient context for orchestrator
    const context: PatientContext | undefined = patientData ? {
      age: patientData.age,
      sex: patientData.sex,
      symptoms: extractSymptoms(patientData.clinicalInfo || ''),
      complexity: caseComplexity,
      urgency: 'routine' // Could be enhanced to detect urgency
    } : undefined;

    onModeSelect(mode, context);
  };

  const extractSymptoms = (clinicalInfo: string): string[] => {
    // Simple symptom extraction - could be enhanced
    const commonSymptoms = [
      'visión borrosa', 'dolor ocular', 'enrojecimiento', 'lagrimeo',
      'fotofobia', 'pérdida de visión', 'moscas volantes', 'destellos'
    ];
    
    return commonSymptoms.filter(symptom => 
      clinicalInfo.toLowerCase().includes(symptom));
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">
          Modo de Investigación
        </h3>
        <p className="text-sm text-slate-600">
          Selecciona cómo deseas que el agente realice la investigación
        </p>
      </div>

      {/* Mode Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {modes.map((mode) => (
          <div
            key={mode.id}
            onClick={() => handleModeSelect(mode.id)}
            className={`relative p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedMode === mode.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
            } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
          >
            {/* Recommended badge */}
            {mode.id === recommendedMode && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                Recomendado
              </div>
            )}

            {/* Mode header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center min-w-0">
                <div className="bg-slate-600 text-white text-xs font-bold px-2 py-1 rounded mr-2 flex-shrink-0">
                  {mode.icon}
                </div>
                <h4 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{mode.name}</h4>
              </div>
              <span className="text-xs text-slate-500 font-mono ml-2 flex-shrink-0">{mode.timeEstimate}</span>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-600 mb-2 line-clamp-2">{mode.description}</p>

            {/* Selection indicator */}
            {selectedMode === mode.id && (
              <div className="absolute top-3 right-3">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Clinical Decision Guide */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 mb-4">
        <div className="flex items-center mb-2">
          <Building2 className="h-4 w-4 text-green-700 mr-2" />
          <h4 className="text-sm font-bold text-green-800">Guía de Decisión Clínica</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <div className="flex items-center font-medium text-green-700 mb-1">
              <Clipboard className="h-3 w-3 mr-1" />
              Consulta Externa Rutinaria:
            </div>
            <div className="text-green-600">• Auto → Para casos típicos</div>
            <div className="text-green-600">• Manual → Casos conocidos simples</div>
          </div>
          <div>
            <div className="flex items-center font-medium text-green-700 mb-1">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Urgencias Oftalmológicas:
            </div>
            <div className="text-green-600">• Deep Research → Pérdida visual súbita</div>
            <div className="text-green-600">• Deep Research → Trauma ocular</div>
          </div>
          <div>
            <div className="flex items-center font-medium text-green-700 mb-1">
              <Building2 className="h-3 w-3 mr-1" />
              Interconsulta Hospitalaria:
            </div>
            <div className="text-green-600">• Deep Research → Manifestaciones sistémicas</div>
            <div className="text-green-600">• Híbrido → Documentación detallada</div>
          </div>
          <div>
            <div className="flex items-center font-medium text-green-700 mb-1">
              <GraduationCap className="h-3 w-3 mr-1" />
              Enseñanza/Residencia:
            </div>
            <div className="text-green-600">• Híbrido → Mejor balance educativo</div>
            <div className="text-green-600">• Manual → Aprendizaje activo</div>
          </div>
        </div>
      </div>

      {/* Advanced info toggle */}
      <div className="border-t border-blue-200 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg className={`w-4 h-4 mr-2 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Comparación detallada y ejemplos
        </button>

        {showAdvanced && (
          <div className="mt-4">
            {/* Examples section */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
              <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Ejemplos Clínicos Específicos
              </h5>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="font-medium text-blue-700 flex items-center">
                    <Bot className="h-3 w-3 mr-1" />
                    Deep Research (3-5 min):
                  </div>
                  <div className="text-slate-600 pl-2">• "Pérdida visual súbita + uso de poppers"</div>
                  <div className="text-slate-600 pl-2">• "Uveítis + artritis reumatoide activa"</div>
                  <div className="text-slate-600 pl-2">• "Manifestaciones oculares de Behçet"</div>
                  <div className="text-slate-600 pl-2">• "Neuropatía óptica bilateral en joven"</div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-purple-700 flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    Híbrido (5-8 min):
                  </div>
                  <div className="text-slate-600 pl-2">• "Retinopatía diabética + nuevos síntomas"</div>
                  <div className="text-slate-600 pl-2">• "Glaucoma juvenil familiar"</div>
                  <div className="text-slate-600 pl-2">• "Casos de enseñanza para residentes"</div>
                  <div className="text-slate-600 pl-2">• "Degeneración macular atípica"</div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-green-700 flex items-center">
                    <Target className="h-3 w-3 mr-1" />
                    Manual (10-20 min):
                  </div>
                  <div className="text-slate-600 pl-2">• "Conjuntivitis alérgica estacional"</div>
                  <div className="text-slate-600 pl-2">• "Orzuelo recurrente"</div>
                  <div className="text-slate-600 pl-2">• "Ametropía simple"</div>
                  <div className="text-slate-600 pl-2">• "Síndrome de ojo seco típico"</div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-orange-700 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto (Variable):
                  </div>
                  <div className="text-slate-600 pl-2">• Cuando no sabes la complejidad</div>
                  <div className="text-slate-600 pl-2">• Casos nuevos o atípicos</div>
                  <div className="text-slate-600 pl-2">• Workflow clínico rutinario</div>
                  <div className="text-slate-600 pl-2">• "Visión borrosa + cefalea" (¿simple o complejo?)</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[480px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-slate-600 font-medium">Modo</th>
                    <th className="text-center py-2 text-slate-600 font-medium whitespace-nowrap">Tiempo</th>
                    <th className="text-center py-2 text-slate-600 font-medium">Fuentes</th>
                    <th className="text-center py-2 text-slate-600 font-medium hidden sm:table-cell">Referencias</th>
                    <th className="text-center py-2 text-slate-600 font-medium">Mejor Para</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-slate-100">
                    <td className="py-2">
                      <div className="flex items-center">
                        <span className="bg-slate-600 text-white text-xs font-bold px-1.5 py-0.5 rounded mr-1.5 flex-shrink-0">AUTO</span>
                        <span className="text-xs sm:text-sm">Automático</span>
                      </div>
                    </td>
                    <td className="text-center py-2 text-xs">3-10 min</td>
                    <td className="text-center py-2 text-xs">8-35</td>
                    <td className="text-center py-2 hidden sm:table-cell text-xs">15-25</td>
                    <td className="text-center py-2 text-xs">Casos rutinarios</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2">
                      <div className="flex items-center">
                        <span className="bg-slate-600 text-white text-xs font-bold px-1.5 py-0.5 rounded mr-1.5 flex-shrink-0">AI</span>
                        <span className="text-xs sm:text-sm">Deep Research</span>
                      </div>
                    </td>
                    <td className="text-center py-2 text-xs">3-5 min</td>
                    <td className="text-center py-2">
                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">35+</span>
                    </td>
                    <td className="text-center py-2 hidden sm:table-cell">
                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">25+</span>
                    </td>
                    <td className="text-center py-2 text-xs">Urgencias/Complejos</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2">
                      <div className="flex items-center">
                        <span className="bg-slate-600 text-white text-xs font-bold px-1.5 py-0.5 rounded mr-1.5 flex-shrink-0">HYB</span>
                        <span className="text-xs sm:text-sm">Híbrido</span>
                      </div>
                    </td>
                    <td className="text-center py-2 text-xs">5-8 min</td>
                    <td className="text-center py-2">
                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">20-35</span>
                    </td>
                    <td className="text-center py-2 hidden sm:table-cell">
                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">20+</span>
                    </td>
                    <td className="text-center py-2 text-xs">Enseñanza/Balance</td>
                  </tr>
                  <tr>
                    <td className="py-2">
                      <div className="flex items-center">
                        <span className="bg-slate-600 text-white text-xs font-bold px-1.5 py-0.5 rounded mr-1.5 flex-shrink-0">MAN</span>
                        <span className="text-xs sm:text-sm">Manual</span>
                      </div>
                    </td>
                    <td className="text-center py-2 text-xs">10-20 min</td>
                    <td className="text-center py-2 text-xs">6-15</td>
                    <td className="text-center py-2 hidden sm:table-cell text-xs">8-15</td>
                    <td className="text-center py-2 text-xs">Control/Aprendizaje</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <svg className="animate-spin h-4 w-4 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-blue-700 font-medium">
              Iniciando investigación con {modes.find(m => m.id === selectedMode)?.name}...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchModeSelector;