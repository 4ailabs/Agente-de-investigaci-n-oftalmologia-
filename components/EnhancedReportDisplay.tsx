// Enhanced Report Display - Muestra reportes con fuentes médicas mejoradas
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, FileText, ExternalLink, Database } from 'lucide-react';
import { Source } from '../types';
import EnhancedSourcesDisplay from './EnhancedSourcesDisplay';
import { EnhancedSource } from '../services/enhancedMedicalSourcesService';

interface EnhancedReportDisplayProps {
  content: string;
  sources: Source[] | null;
  onCopy: () => void;
  isCopied: boolean;
  investigationSteps: any[];
  enhancedSources?: EnhancedSource[];
  qualityMetrics?: {
    averageQuality: number;
    highQualityCount: number;
    openAccessCount: number;
    recentPublications: number;
  };
  sourcesBreakdown?: {
    pubmed: number;
    google: number;
    cochrane: number;
    clinical_trials: number;
    other: number;
  };
}

const EnhancedReportDisplay: React.FC<EnhancedReportDisplayProps> = ({
  content,
  sources,
  onCopy,
  isCopied,
  investigationSteps,
  enhancedSources,
  qualityMetrics,
  sourcesBreakdown
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'sources' | 'steps'>('report');

  const formatContent = (text: string) => {
    // Dividir el contenido en secciones basadas en headers
    const sections = text.split(/(?=^#{1,3}\s)/m).filter(section => section.trim());
    
    return sections.map((section, index) => {
      const lines = section.split('\n');
      const headerLine = lines[0];
      const content = lines.slice(1).join('\n').trim();
      
      // Detectar nivel de header
      const headerMatch = headerLine.match(/^(#{1,3})\s(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2];
        
        const HeaderTag = `h${level}` as keyof JSX.IntrinsicElements;
        const className = level === 1 
          ? 'text-2xl font-bold text-slate-800 mb-6 mt-8 first:mt-0'
          : level === 2
          ? 'text-xl font-semibold text-slate-700 mb-4 mt-6'
          : 'text-lg font-medium text-slate-600 mb-3 mt-4';
        
        return (
          <div key={index} className="mb-6">
            <HeaderTag className={className}>{title}</HeaderTag>
            <div className="prose prose-slate max-w-none">
              {content.split('\n').map((line, lineIndex) => {
                if (line.trim() === '') return <br key={lineIndex} />;
                
                // Detectar listas
                if (line.match(/^\s*[-*+]\s/)) {
                  return (
                    <div key={lineIndex} className="flex items-start mb-2">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      <span className="text-slate-700">{line.replace(/^\s*[-*+]\s/, '')}</span>
                    </div>
                  );
                }
                
                // Detectar listas numeradas
                if (line.match(/^\s*\d+\.\s/)) {
                  return (
                    <div key={lineIndex} className="flex items-start mb-2">
                      <span className="text-blue-500 mr-2 mt-1 font-medium">
                        {line.match(/^\s*(\d+)\./)?.[1]}.
                      </span>
                      <span className="text-slate-700">{line.replace(/^\s*\d+\.\s/, '')}</span>
                    </div>
                  );
                }
                
                return (
                  <p key={lineIndex} className="text-slate-700 mb-3 leading-relaxed">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        );
      }
      
      // Si no es un header, mostrar como párrafo normal
      return (
        <p key={index} className="text-slate-700 mb-4 leading-relaxed">
          {section}
        </p>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Header con tabs */}
      <div className="border-b border-slate-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Reporte de Investigación Clínica</h2>
            <button
              onClick={onCopy}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
                isCopied 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <Copy className="h-4 w-4 mr-2" />
              {isCopied ? 'Copiado' : 'Copiar Reporte'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('report')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'report'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Reporte
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sources'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Fuentes Médicas
              {enhancedSources && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {enhancedSources.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'steps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Proceso de Investigación
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido de las tabs */}
      <div className="p-6">
        {activeTab === 'report' && (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{content || 'No hay reporte final disponible.'}</ReactMarkdown>
          </div>
        )}

        {activeTab === 'sources' && (
          <div>
            {enhancedSources && qualityMetrics && sourcesBreakdown ? (
              <EnhancedSourcesDisplay
                sources={enhancedSources}
                qualityMetrics={qualityMetrics}
                sourcesBreakdown={sourcesBreakdown}
              />
            ) : sources && sources.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Fuentes Consultadas</h3>
                {sources.map((source, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-medium text-slate-800 mb-2">{source.web?.title || 'Sin título'}</h4>
                    <a
                      href={source.web?.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {source.web?.uri}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-2">No hay fuentes disponibles</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'steps' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Proceso de Investigación</h3>
            {investigationSteps.map((step, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium text-slate-800 mb-2">{step.title || `Paso ${index + 1}`}</h4>
                    {step.description && (
                      <p className="text-slate-600 text-sm mb-2">{step.description}</p>
                    )}
                    {step.status && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        step.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : step.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {step.status === 'completed' ? 'Completado' : 
                         step.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedReportDisplay;