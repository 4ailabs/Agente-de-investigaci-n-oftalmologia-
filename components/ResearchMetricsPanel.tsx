import React, { useState } from 'react';
import { InvestigationState } from '../types';

interface ResearchMetricsPanelProps {
  investigation: InvestigationState;
  className?: string;
}

const ResearchMetricsPanel: React.FC<ResearchMetricsPanelProps> = ({
  investigation,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const metadata = investigation.researchMetadata;

  if (!metadata) return null;

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getModeInfo = (mode: string) => {
    switch (mode) {
      case 'deep_research':
        return {
          name: 'Deep Research',
          icon: 'AI',
          color: 'from-purple-500 to-indigo-600',
          description: 'Investigación autónoma completa'
        };
      case 'hybrid':
        return {
          name: 'Híbrido',
          icon: 'HYB',
          color: 'from-blue-500 to-cyan-600',
          description: 'Deep Research + transparencia'
        };
      case 'manual':
        return {
          name: 'Manual',
          icon: 'MAN',
          color: 'from-green-500 to-emerald-600',
          description: 'Control paso a paso'
        };
      default:
        return {
          name: 'Desconocido',
          icon: '?',
          color: 'from-gray-500 to-gray-600',
          description: 'Modo no especificado'
        };
    }
  };

  const modeInfo = getModeInfo(metadata.mode);
  const confidenceColor = (metadata.confidenceScore || 0) >= 80 ? 'text-green-600' :
                          (metadata.confidenceScore || 0) >= 60 ? 'text-yellow-600' :
                          'text-red-600';

  return (
    <div className={`bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${modeInfo.color} rounded-lg flex items-center justify-center shadow-md`}>
              <span className="text-white text-xs font-bold">{modeInfo.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Métricas de Investigación</h3>
              <p className="text-sm text-slate-600">{modeInfo.name} - {modeInfo.description}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Execution Time */}
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-semibold mx-auto mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {formatTime(metadata.totalExecutionTime)}
            </div>
            <div className="text-xs text-slate-500">Tiempo Total</div>
          </div>

          {/* Sources */}
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center text-sm font-semibold mx-auto mb-2">
              {metadata.sourcesAnalyzed || investigation.finalReportSources?.length || 0}
            </div>
            <div className="text-xs text-slate-500">Fuentes</div>
          </div>

          {/* Queries */}
          {metadata.queriesExecuted !== undefined && (
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center text-sm font-semibold mx-auto mb-2">
                {metadata.queriesExecuted}
              </div>
              <div className="text-xs text-slate-500">Búsquedas</div>
            </div>
          )}

          {/* Confidence */}
          {metadata.confidenceScore !== undefined && (
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-semibold mx-auto mb-2">
                {metadata.confidenceScore}%
              </div>
              <div className="text-xs text-slate-500">Confianza</div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="border-t border-slate-200 p-4">
          <div className="space-y-4">
            {/* Provider Info */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Proveedor de IA</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Modelo:</span>
                <span className="font-mono text-slate-900">{metadata.provider}</span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Rendimiento</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Tiempo por fuente:</span>
                  <span className="font-mono text-slate-900">
                    {metadata.sourcesAnalyzed 
                      ? formatTime(metadata.totalExecutionTime / metadata.sourcesAnalyzed)
                      : 'N/A'
                    }
                  </span>
                </div>
                
                {metadata.queriesExecuted && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Tiempo por búsqueda:</span>
                    <span className="font-mono text-slate-900">
                      {formatTime(metadata.totalExecutionTime / metadata.queriesExecuted)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Eficiencia:</span>
                  <span className={`font-semibold ${
                    metadata.totalExecutionTime < 300000 ? 'text-green-600' :
                    metadata.totalExecutionTime < 600000 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {metadata.totalExecutionTime < 300000 ? 'Alta' :
                     metadata.totalExecutionTime < 600000 ? 'Media' : 'Baja'}
                  </span>
                </div>
              </div>
            </div>

            {/* Deep Research Specific */}
            {metadata.mode === 'deep_research' && metadata.deepResearchProcess && (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Proceso Deep Research</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Temas investigados:</span>
                    <span className="font-semibold text-slate-900">
                      {metadata.deepResearchProcess.planningPhase?.identifiedTopics?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Iteraciones:</span>
                    <span className="font-semibold text-slate-900">
                      {metadata.deepResearchProcess.executionPhase?.refinementIterations || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Contradicciones analizadas:</span>
                    <span className="font-semibold text-slate-900">
                      {metadata.deepResearchProcess.synthesisPhase?.contradictionsFound || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Hybrid Mode Specific */}
            {metadata.mode === 'hybrid' && metadata.transparencySteps && (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Modo Híbrido</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Pasos de transparencia:</span>
                  <span className="font-semibold text-slate-900">{metadata.transparencySteps}</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Deep Research + explicaciones paso a paso
                </div>
              </div>
            )}

            {/* Quality Assessment */}
            {metadata.confidenceScore !== undefined && (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Evaluación de Calidad</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Nivel de confianza:</span>
                  <span className={`text-sm font-semibold ${confidenceColor}`}>
                    {metadata.confidenceScore}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      (metadata.confidenceScore || 0) >= 80 ? 'bg-green-500' :
                      (metadata.confidenceScore || 0) >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${metadata.confidenceScore || 0}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {(metadata.confidenceScore || 0) >= 80 ? 'Alta confianza en resultados' :
                   (metadata.confidenceScore || 0) >= 60 ? 'Confianza moderada' :
                   'Resultados requieren validación adicional'}
                </div>
              </div>
            )}

            {/* Comparison with Manual Mode */}
            {metadata.mode !== 'manual' && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Comparación</h4>
                <div className="text-xs text-blue-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Vs. Modo Manual:</span>
                    <span className="font-semibold">
                      ~{Math.round((1200000 / metadata.totalExecutionTime) * 100)}% más rápido
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fuentes adicionales:</span>
                    <span className="font-semibold">
                      +{Math.max(0, (metadata.sourcesAnalyzed || 0) - 8)} fuentes
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchMetricsPanel;