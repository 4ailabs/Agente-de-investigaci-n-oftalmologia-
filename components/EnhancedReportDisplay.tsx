// Enhanced Report Display - Muestra reportes con fuentes médicas mejoradas
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, FileText, ExternalLink, Database, Search, ChevronDown, Download } from 'lucide-react';
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

  // Debug logging
  console.log('🔍 EnhancedReportDisplay Props:', {
    sources: sources?.length || 0,
    enhancedSources: enhancedSources?.length || 0,
    qualityMetrics,
    sourcesBreakdown
  });

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
            {/* Información de búsqueda */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Información de Búsqueda
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Bases de datos consultadas:</span>
                  <ul className="mt-1 text-blue-600">
                    <li>• PubMed (National Library of Medicine)</li>
                    <li>• Google Scholar</li>
                    <li>• Fuentes médicas especializadas</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Criterios de búsqueda:</span>
                  <ul className="mt-1 text-blue-600">
                    <li>• Artículos de los últimos 5 años</li>
                    <li>• Revistas de alto impacto</li>
                    <li>• Guías de práctica clínica</li>
                    <li>• Meta-análisis y revisiones sistemáticas</li>
                  </ul>
                </div>
              </div>
              
              {/* Estadísticas de fuentes encontradas */}
              {enhancedSources && qualityMetrics && sourcesBreakdown && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h4 className="font-medium text-blue-700 mb-2">Resultados de la búsqueda:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{enhancedSources.length}</div>
                      <div className="text-blue-500">Fuentes encontradas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{qualityMetrics.highQualityCount}</div>
                      <div className="text-blue-500">Alta calidad</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{qualityMetrics.openAccessCount}</div>
                      <div className="text-blue-500">Acceso abierto</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{qualityMetrics.recentPublications}</div>
                      <div className="text-blue-500">Recientes</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sección de fuentes similar a Gemini Deep Search */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Fuentes usadas en el informe
                  <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
                </h3>
                <button className="flex items-center px-3 py-1 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-md hover:bg-slate-50">
                  <Download className="w-4 h-4 mr-1" />
                  Exportar a Hojas de cálculo
                </button>
              </div>

              {enhancedSources && enhancedSources.length > 0 ? (
                <div className="space-y-2">
                  {enhancedSources.slice(0, 10).map((source, index) => (
                    <div key={source.id} className="flex items-start p-3 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="flex-shrink-0 mr-3 mt-1">
                        {source.sourceType === 'pubmed' ? (
                          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        ) : source.sourceType === 'google' ? (
                          <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-red-600 font-bold text-xs">G</span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                            <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block hover:underline"
                        >
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {source.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 truncate">
                            {new URL(source.url).hostname}
                          </div>
                        </a>
                        {source.abstract && (
                          <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {source.abstract.substring(0, 150)}...
                          </div>
                        )}
                        <div className="flex items-center mt-2 text-xs text-slate-500">
                          {source.journal && (
                            <span className="mr-3">{source.journal}</span>
                          )}
                          {source.publicationDate && (
                            <span className="mr-3">{new Date(source.publicationDate).getFullYear()}</span>
                          )}
                          {source.isOpenAccess && (
                            <span className="text-green-600 font-medium">Acceso abierto</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {enhancedSources.length > 10 && (
                    <div className="text-center py-2">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Ver {enhancedSources.length - 10} fuentes adicionales
                      </button>
                    </div>
                  )}
                </div>
              ) : sources && sources.length > 0 ? (
                <div className="space-y-2">
                  {sources.slice(0, 10).map((source, index) => (
                    <div key={index} className="flex items-start p-3 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="flex-shrink-0 mr-3 mt-1">
                        <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                          <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={source.web?.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block hover:underline"
                        >
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {source.web?.title || 'Sin título'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 truncate">
                            {source.web?.uri ? new URL(source.web.uri).hostname : 'URL no disponible'}
                          </div>
                        </a>
                      </div>
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