// Enhanced Sources Display - Muestra fuentes médicas mejoradas con métricas de calidad
import React, { useState } from 'react';
import { EnhancedSource } from '../services/enhancedMedicalSourcesService';

interface EnhancedSourcesDisplayProps {
  sources: EnhancedSource[];
  qualityMetrics: {
    averageQuality: number;
    highQualityCount: number;
    openAccessCount: number;
    recentPublications: number;
  };
  sourcesBreakdown: {
    pubmed: number;
    google: number;
    cochrane: number;
    clinical_trials: number;
    other: number;
  };
}

const EnhancedSourcesDisplay: React.FC<EnhancedSourcesDisplayProps> = ({
  sources,
  qualityMetrics,
  sourcesBreakdown
}) => {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'quality' | 'relevance' | 'authority' | 'date'>('quality');

  // Ordenar fuentes según el criterio seleccionado
  const sortedSources = [...sources].sort((a, b) => {
    switch (sortBy) {
      case 'quality':
        return b.qualityScore - a.qualityScore;
      case 'relevance':
        return b.relevanceScore - a.relevanceScore;
      case 'authority':
        return b.authorityScore - a.authorityScore;
      case 'date':
        return new Date(b.publicationDate || '').getTime() - new Date(a.publicationDate || '').getTime();
      default:
        return 0;
    }
  });

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'pubmed':
        return '📚';
      case 'cochrane':
        return '🔬';
      case 'clinical_trials':
        return '🏥';
      case 'google':
        return '🔍';
      default:
        return '📄';
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'pubmed':
        return 'PubMed';
      case 'cochrane':
        return 'Cochrane';
      case 'clinical_trials':
        return 'Clinical Trials';
      case 'google':
        return 'Google Scholar';
      default:
        return 'Otra fuente';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Alta';
    if (score >= 60) return 'Media';
    return 'Baja';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      {/* Header con métricas */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Fuentes Médicas Especializadas
        </h3>

        {/* Métricas de calidad */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{qualityMetrics.averageQuality}</div>
            <div className="text-sm text-blue-700">Calidad Promedio</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{qualityMetrics.highQualityCount}</div>
            <div className="text-sm text-green-700">Alta Calidad</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{qualityMetrics.openAccessCount}</div>
            <div className="text-sm text-purple-700">Acceso Abierto</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{qualityMetrics.recentPublications}</div>
            <div className="text-sm text-orange-700">Recientes</div>
          </div>
        </div>

        {/* Desglose de fuentes */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(sourcesBreakdown).map(([type, count]) => (
            <div key={type} className="flex items-center bg-slate-100 px-3 py-1 rounded-full text-sm">
              <span className="mr-1">{getSourceTypeIcon(type)}</span>
              <span className="font-medium">{getSourceTypeLabel(type)}:</span>
              <span className="ml-1 text-slate-600">{count}</span>
            </div>
          ))}
        </div>

        {/* Controles de ordenamiento */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-slate-300 rounded-md px-2 py-1"
          >
            <option value="quality">Calidad</option>
            <option value="relevance">Relevancia</option>
            <option value="authority">Autoridad</option>
            <option value="date">Fecha</option>
          </select>
        </div>
      </div>

      {/* Lista de fuentes */}
      <div className="space-y-3">
        {sortedSources.map((source, index) => (
          <div
            key={source.id}
            className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getSourceTypeIcon(source.sourceType)}</span>
                  <span className="text-sm font-medium text-slate-600">
                    {getSourceTypeLabel(source.sourceType)}
                  </span>
                  {source.isOpenAccess && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Acceso Abierto
                    </span>
                  )}
                </div>

                <h4 className="font-semibold text-slate-800 mb-2 line-clamp-2">
                  {source.title}
                </h4>

                {source.journal && (
                  <p className="text-sm text-slate-600 mb-2">
                    <span className="font-medium">Revista:</span> {source.journal}
                  </p>
                )}

                {source.authors && source.authors.length > 0 && (
                  <p className="text-sm text-slate-600 mb-2">
                    <span className="font-medium">Autores:</span> {source.authors.slice(0, 3).join(', ')}
                    {source.authors.length > 3 && ` y ${source.authors.length - 3} más`}
                  </p>
                )}

                {source.publicationDate && (
                  <p className="text-sm text-slate-600 mb-2">
                    <span className="font-medium">Fecha:</span> {new Date(source.publicationDate).toLocaleDateString()}
                  </p>
                )}

                {/* Métricas de calidad */}
                <div className="flex gap-4 mb-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getQualityColor(source.qualityScore)}`}>
                    Calidad: {source.qualityScore}/100 ({getQualityLabel(source.qualityScore)})
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600">
                    Relevancia: {Math.round(source.relevanceScore)}/100
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-600">
                    Autoridad: {Math.round(source.authorityScore)}/100
                  </div>
                </div>

                {/* Resumen expandible */}
                {source.abstract && (
                  <div className="mb-3">
                    <button
                      onClick={() => setExpandedSource(expandedSource === source.id ? null : source.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      {expandedSource === source.id ? 'Ocultar resumen' : 'Ver resumen'}
                      <svg
                        className={`ml-1 h-4 w-4 transition-transform ${
                          expandedSource === source.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSource === source.id && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                        {source.abstract}
                      </div>
                    )}
                  </div>
                )}

                {/* Palabras clave y MeSH terms */}
                {(source.keywords?.length > 0 || source.meshTerms?.length > 0) && (
                  <div className="mb-3">
                    {source.keywords && source.keywords.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-slate-600">Palabras clave:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {source.keywords.slice(0, 5).map((keyword, idx) => (
                            <span key={idx} className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {source.meshTerms && source.meshTerms.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-slate-600">MeSH Terms:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {source.meshTerms.slice(0, 3).map((term, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ml-4 flex flex-col gap-2">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver fuente
                </a>
                {source.doi && (
                  <a
                    href={`https://doi.org/${source.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    DOI
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sources.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2">No se encontraron fuentes médicas especializadas</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedSourcesDisplay;
