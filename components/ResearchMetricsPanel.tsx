import React from 'react';
import { InvestigationState } from '../types';

interface ResearchMetricsPanelProps {
  investigation: InvestigationState;
  className?: string;
}

const ResearchMetricsPanel: React.FC<ResearchMetricsPanelProps> = ({
  investigation,
  className = ''
}) => {
  const metadata = investigation.researchMetadata;

  if (!metadata) return null;

  // Solo mostrar información básica y útil para el usuario
  const getModeInfo = (mode: string) => {
    switch (mode) {
      case 'deep_research':
        return {
          name: 'Investigación Avanzada',
          description: 'Análisis completo con IA'
        };
      case 'hybrid':
        return {
          name: 'Modo Híbrido',
          description: 'Investigación automática con supervisión'
        };
      case 'manual':
        return {
          name: 'Modo Manual',
          description: 'Control paso a paso'
        };
      default:
        return {
          name: 'Investigación',
          description: 'Análisis clínico'
        };
    }
  };

  const modeInfo = getModeInfo(metadata.mode);

  return (
    <div className={`bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {/* Información simplificada */}
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{modeInfo.name}</h3>
            <p className="text-sm text-slate-600">{modeInfo.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchMetricsPanel;