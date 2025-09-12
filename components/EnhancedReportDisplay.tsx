import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface EnhancedReportDisplayProps {
  content: string;
  sources?: any[];
  onCopy?: () => void;
  isCopied?: boolean;
}

interface ReportSection {
  id: string;
  title: string;
  level: number;
  content: string;
  subsections: ReportSection[];
}

interface QualityMetrics {
  sourceCount: number;
  highQualitySources: number;
  averageRelevance: number;
  completeness: number;
}

const EnhancedReportDisplay: React.FC<EnhancedReportDisplayProps> = ({
  content,
  sources = [],
  onCopy,
  isCopied = false
}) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [showQualityMetrics, setShowQualityMetrics] = useState(true);
  const [viewMode, setViewMode] = useState<'full' | 'summary' | 'print'>('full');
  const contentRef = useRef<HTMLDivElement>(null);

  // Extract sections from markdown content
  const extractSections = (content: string) => {
    const sections: Array<{id: string; title: string; level: number}> = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2];
        const id = title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        sections.push({ id, title, level });
      }
    });
    
    return sections;
  };

  const sections = extractSections(content);

  // Highlight search terms in content
  const highlightSearchTerms = (content: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return content;
    const regex = new RegExp(`(${searchTerm.trim()})`, 'gi');
    return content.replace(regex, '**$1**');
  };

  // Calculate quality metrics from sources
  const calculateQualityMetrics = (): QualityMetrics => {
    const sourceCount = sources.length;
    const highQualitySources = sources.filter(source => 
      source.web?.title?.includes('PubMed') || 
      source.web?.title?.includes('Cochrane') ||
      source.web?.uri?.includes('pubmed') ||
      source.web?.uri?.includes('cochrane')
    ).length;
    
    const averageRelevance = sourceCount > 0 ? (highQualitySources / sourceCount) * 100 : 0;
    const completeness = Math.min((sourceCount / 5) * 100, 100); // Max score with 5+ sources
    
    return {
      sourceCount,
      highQualitySources,
      averageRelevance: Math.round(averageRelevance),
      completeness: Math.round(completeness)
    };
  };

  // Generate executive summary from content
  const generateExecutiveSummary = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const summaryPoints: string[] = [];
    
    // Extract key diagnostic points
    lines.forEach(line => {
      if (line.includes('**Diagnóstico') || line.includes('**Diagnosis')) {
        summaryPoints.push(line.replace(/\*\*/g, '').trim());
      } else if (line.includes('- **') && (line.includes('Probabilidad') || line.includes('Probability'))) {
        summaryPoints.push(line.replace(/\*\*/g, '').replace(/- /, '• ').trim());
      } else if (line.includes('Red Flag') || line.includes('Urgente') || line.includes('Emergent')) {
        summaryPoints.push(`🚨 ${line.replace(/\*\*/g, '').trim()}`);
      }
    });
    
    return summaryPoints.slice(0, 6); // Top 6 most important points
  };

  // Extract clinical recommendations
  const extractClinicalRecommendations = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const recommendations: string[] = [];
    
    lines.forEach(line => {
      if (line.includes('Se recomienda') || line.includes('Recommend') || 
          line.includes('Debe realizar') || line.includes('Should perform')) {
        recommendations.push(line.replace(/\*\*/g, '').replace(/- /, '').trim());
      }
    });
    
    return recommendations;
  };

  // Generate summary from content
  const generateSummary = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const summaryLines: string[] = [];
    
    // Extract key points - look for lines with strong emphasis or bullet points
    lines.forEach(line => {
      if (line.includes('**') || line.startsWith('- ') || line.startsWith('* ')) {
        const cleaned = line.replace(/\*\*/g, '').replace(/^[-*]\s*/, '');
        if (cleaned.length > 20 && cleaned.length < 200) {
          summaryLines.push(cleaned);
        }
      }
    });
    
    return summaryLines.slice(0, 5); // Top 5 key points
  };

  const summary = generateSummary(content);

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
    setShowTableOfContents(false);
  };

  // Highlight search terms
  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  // Custom markdown components with search highlighting
  const markdownComponents = {
    h1: ({children, ...props}: any) => {
      const id = String(children).toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      return (
        <h1 
          id={id} 
          className="text-2xl lg:text-3xl font-bold mb-6 text-slate-900 border-b-2 border-blue-100 pb-3"
          {...props}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {children}
          </div>
        </h1>
      );
    },
    h2: ({children, ...props}: any) => {
      const id = String(children).toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      return (
        <h2 
          id={id} 
          className="text-xl lg:text-2xl font-semibold mb-4 text-slate-800 mt-8"
          {...props}
        >
          <div className="flex items-center">
            <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center mr-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {children}
          </div>
        </h2>
      );
    },
    h3: ({children, ...props}: any) => {
      const id = String(children).toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      return (
        <h3 
          id={id} 
          className="text-lg lg:text-xl font-medium mb-3 text-slate-700 mt-6"
          {...props}
        >
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-sm mr-2"></div>
            {children}
          </div>
        </h3>
      );
    },
    p: ({children}: any) => (
      <p className="text-sm lg:text-base mb-4 leading-7 text-slate-700">
        {children}
      </p>
    ),
    ul: ({children}: any) => (
      <ul className="text-sm lg:text-base mb-4 pl-6 space-y-2">
        {children}
      </ul>
    ),
    li: ({children}: any) => (
      <li className="flex items-start">
        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
        <span>{children}</span>
      </li>
    ),
    strong: ({children}: any) => (
      <strong className="font-semibold text-slate-900 bg-slate-100 px-1 rounded">
        {children}
      </strong>
    ),
    a: ({href, children}: any) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
      >
        {children}
      </a>
    ),
    // Enhanced table components for medical data
    table: ({children}: any) => (
      <div className="my-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-t-lg border-b border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
            Análisis Clínico
          </h4>
        </div>
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-b-lg">
          <table className="min-w-full divide-y divide-gray-200">
            {children}
          </table>
        </div>
      </div>
    ),
    thead: ({children}: any) => (
      <thead className="bg-gray-50">
        {children}
      </thead>
    ),
    tbody: ({children}: any) => (
      <tbody className="bg-white divide-y divide-gray-200">
        {children}
      </tbody>
    ),
    tr: ({children}: any) => (
      <tr className="hover:bg-gray-50 transition-colors duration-150">
        {children}
      </tr>
    ),
    th: ({children, ...props}: any) => (
      <th 
        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
        {...props}
      >
        <div className="flex items-center space-x-1">
          <span>{children}</span>
        </div>
      </th>
    ),
    td: ({children, ...props}: any) => (
      <td 
        className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100 last:border-r-0 max-w-xs"
        {...props}
      >
        <div className="break-words">
          {children}
        </div>
      </td>
    )
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Reporte Clínico</h2>
          </div>
          
          {sections.length > 3 && (
            <button
              onClick={() => setShowTableOfContents(!showTableOfContents)}
              className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Índice
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('full')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'full' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Completo
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'summary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setViewMode('print')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'print' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Impresión
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en el reporte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-4 py-2 pl-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Copy button */}
          {onCopy && (
            <button
              onClick={onCopy}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{isCopied ? '¡Copiado!' : 'Copiar Reporte'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quality Metrics Panel */}
      {showQualityMetrics && sources.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-900 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Métricas de Calidad del Reporte
            </h3>
            <button
              onClick={() => setShowQualityMetrics(!showQualityMetrics)}
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showQualityMetrics ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
          </div>
          
          {(() => {
            const metrics = calculateQualityMetrics();
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-2">
                    {metrics.sourceCount}
                  </div>
                  <p className="text-sm text-purple-800 font-medium">Fuentes Total</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-2">
                    {metrics.highQualitySources}
                  </div>
                  <p className="text-sm text-purple-800 font-medium">Alta Calidad</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-2">
                    {metrics.averageRelevance}%
                  </div>
                  <p className="text-sm text-purple-800 font-medium">Relevancia</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-2">
                    {metrics.completeness}%
                  </div>
                  <p className="text-sm text-purple-800 font-medium">Completitud</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Executive Summary for Summary View */}
      {viewMode === 'summary' && (() => {
        const executiveSummary = generateExecutiveSummary(content);
        const clinicalRecommendations = extractClinicalRecommendations(content);
        
        return (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 mb-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resumen Clínico Ejecutivo
            </h3>
            
            {executiveSummary.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-amber-800 mb-3">Hallazgos Principales:</h4>
                <div className="space-y-2">
                  {executiveSummary.map((point, index) => (
                    <div key={index} className="flex items-start">
                      <span className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm text-amber-800 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {clinicalRecommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-amber-800 mb-3">Recomendaciones Clínicas:</h4>
                <div className="space-y-2">
                  {clinicalRecommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <svg className="w-4 h-4 text-amber-600 mt-1 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-amber-800 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Table of Contents */}
      {showTableOfContents && sections.length > 0 && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Índice de Contenidos
          </h3>
          <div className="space-y-2">
            {sections.map((section, index) => (
              <button
                key={index}
                onClick={() => scrollToSection(section.id)}
                className={`block w-full text-left px-3 py-2 rounded-lg transition-colors text-sm
                  ${section.level === 1 ? 'font-semibold text-blue-800 bg-blue-100' : 
                    section.level === 2 ? 'font-medium text-blue-700 ml-4 hover:bg-blue-100' : 
                    'text-blue-600 ml-8 hover:bg-blue-100'}`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {summary.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Resumen Ejecutivo
          </h3>
          <div className="space-y-2">
            {summary.map((point, index) => (
              <div key={index} className="flex items-start">
                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-sm text-green-800 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content - Conditional based on view mode */}
      {viewMode !== 'summary' && (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${
          viewMode === 'print' ? 'p-8 print:shadow-none print:border-none' : 'p-6 lg:p-8'
        }`}>
          <div 
            ref={contentRef}
            className={`prose prose-slate max-w-none text-slate-800 leading-relaxed ${
              viewMode === 'print' ? 'print:text-black print:text-sm' : ''
            }`}
          >
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {searchTerm ? highlightSearchTerms(content, searchTerm) : content}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Print-specific styles */}
      {viewMode === 'print' && (
        <style jsx>{`
          @media print {
            .no-print { display: none !important; }
            .print\\:text-black { color: black !important; }
            .print\\:text-sm { font-size: 0.875rem !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:border-none { border: none !important; }
          }
        `}</style>
      )}

      {/* Enhanced Sources Section */}
      {sources && sources.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-indigo-900">Referencias y Fuentes</h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                {sources.length} fuente{sources.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            {sources.map((source, index) => {
              // Determine access type for display - matching original implementation
              const isOpenAccess = source.web.uri.includes('pubmed.ncbi.nlm.nih.gov') || 
                                 source.web.uri.includes('cochrane.org') ||
                                 source.web.uri.includes('clinicaltrials.gov') ||
                                 source.web.uri.includes('aao.org') ||
                                 source.web.uri.includes('esrs.org') ||
                                 source.web.uri.includes('arvo.org');
              
              const isSubscription = source.web.uri.includes('uptodate.com') ||
                                    source.web.uri.includes('medscape.com') ||
                                    source.web.uri.includes('thelancet.com') ||
                                    source.web.uri.includes('jama.ama-assn.org') ||
                                    source.web.uri.includes('nejm.org');

              const accessIndicator = isOpenAccess ? '[LIBRE]' : isSubscription ? '[SUSCRIPCION]' : '[LIMITADO]';
              const accessMessage = isOpenAccess ? 'Acceso abierto' : 
                                  isSubscription ? 'Requiere suscripción' : 'Acceso limitado';
              
              return (
                <div key={index} className="bg-white p-4 rounded-lg border border-indigo-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div className="flex items-center space-x-2 flex-1">
                          <a 
                            href={source.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-700 hover:text-indigo-900 font-semibold text-base hover:underline transition-colors"
                            title={`Abrir: ${source.web.uri}`}
                          >
                            {source.web.title || source.web.uri}
                          </a>
                          <span className="text-lg" title={accessMessage}>
                            {accessIndicator}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs lg:text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-md">
                        <div className="flex items-center">
                          <svg className="h-3 w-3 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="truncate font-mono">{source.web.uri}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isOpenAccess ? 'bg-green-100 text-green-800' :
                          isSubscription ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {accessMessage}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Medical Disclaimers */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-amber-800 mb-4">AVISOS MÉDICOS IMPORTANTES</h4>
            <div className="space-y-3 text-sm text-amber-700">
              <div className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <p><strong>Herramienta de Investigación:</strong> Este análisis es generado por IA y está diseñado como herramienta de investigación médica, no como diagnóstico definitivo.</p>
              </div>
              <div className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <p><strong>Supervisión Profesional Requerida:</strong> Todas las recomendaciones y diagnósticos diferenciales deben ser validados por un médico calificado.</p>
              </div>
              <div className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <p><strong>No Sustituye el Juicio Clínico:</strong> Este reporte complementa, pero no reemplaza, la evaluación clínica y el criterio médico profesional.</p>
              </div>
              <div className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <p><strong>Responsabilidad del Usuario:</strong> El uso de esta información es responsabilidad exclusiva del profesional médico que la consulta.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedReportDisplay;