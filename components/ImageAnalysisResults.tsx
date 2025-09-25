import React, { useState } from 'react';
import { MedicalImageAnalysis, MedicalImageType } from '../types/medicalImageTypes';

interface ImageAnalysisResultsProps {
  analyses: MedicalImageAnalysis[];
  onClose: () => void;
}

const ImageAnalysisResults: React.FC<ImageAnalysisResultsProps> = ({
  analyses,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const getImageTypeLabel = (type: MedicalImageType): string => {
    const labels: Record<MedicalImageType, string> = {
      'fundus': 'Fondo de Ojo',
      'oct': 'OCT',
      'angiography': 'Angiografía',
      'anterior_segment': 'Segmento Anterior',
      'ultrasound': 'Ecografía',
      'visual_field': 'Campo Visual',
      'cornea': 'Topografía Corneal',
      'other': 'Otros'
    };
    return labels[type] || 'Desconocido';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Media';
    return 'Baja';
  };

  const renderFundusFindings = (findings: any) => {
    if (!findings.fundus) return null;

    const { opticNerve, macula, vessels, periphery, pathology } = findings.fundus;

    return (
      <div className="space-y-4">
        {/* Nervio óptico */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Nervio Óptico</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Apariencia:</span> {opticNerve.appearance}
            </div>
            <div>
              <span className="font-medium">Relación C/D:</span> 
              {opticNerve.cupDiscRatio.OD && ` OD: ${opticNerve.cupDiscRatio.OD}`}
              {opticNerve.cupDiscRatio.OI && ` OI: ${opticNerve.cupDiscRatio.OI}`}
            </div>
            <div>
              <span className="font-medium">Márgenes:</span> {opticNerve.margins}
            </div>
            <div>
              <span className="font-medium">Color:</span> {opticNerve.color}
            </div>
          </div>
        </div>

        {/* Mácula */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Mácula</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Apariencia:</span> {macula.appearance}
            </div>
            <div>
              <span className="font-medium">Reflejo foveal:</span> {macula.fovealReflex}
            </div>
            <div>
              <span className="font-medium">Drusen:</span> {macula.drusen}
            </div>
            <div>
              <span className="font-medium">Hemorragias:</span> {macula.hemorrhages}
            </div>
            <div>
              <span className="font-medium">Exudados:</span> {macula.exudates}
            </div>
          </div>
        </div>

        {/* Vasos */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Vasos Retinianos</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Arterias:</span> Calibre {vessels.arteries.caliber}, 
              Tortuosidad {vessels.arteries.tortuosity}, 
              Cruces {vessels.arteries.crossings}
            </div>
            <div>
              <span className="font-medium">Venas:</span> Calibre {vessels.veins.caliber}, 
              Tortuosidad {vessels.veins.tortuosity}
            </div>
            {vessels.occlusions.length > 0 && (
              <div>
                <span className="font-medium">Oclusiones:</span> {vessels.occlusions.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Periferia */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Periferia</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="font-medium">Desgarros:</span> {periphery.tears}
            </div>
            <div>
              <span className="font-medium">Desprendimientos:</span> {periphery.detachments}
            </div>
            <div>
              <span className="font-medium">Lattice:</span> {periphery.lattice}
            </div>
            <div>
              <span className="font-medium">Pigmento:</span> {periphery.pigment}
            </div>
          </div>
        </div>

        {/* Patologías */}
        {pathology && pathology.length > 0 && (
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-3">Patologías Identificadas</h4>
            <div className="space-y-2">
              {pathology.map((p: any, index: number) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-red-700">
                    {p.type} - {p.location} ({p.severity})
                  </div>
                  <div className="text-red-600">{p.description}</div>
                  {p.differential && p.differential.length > 0 && (
                    <div className="text-xs text-red-500 mt-1">
                      Diagnósticos diferenciales: {p.differential.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOCTFindings = (findings: any) => {
    if (!findings.oct) return null;

    const { scanType, layers, thickness, fluid, pathology } = findings.oct;

    return (
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Tipo de Escaneo</h4>
          <p className="text-sm">{scanType}</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Capas Retinianas</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">RPE:</span> {layers.rpe}
            </div>
            <div>
              <span className="font-medium">Zona elipsoide:</span> {layers.ellipsoid}
            </div>
            <div>
              <span className="font-medium">Núcleos externos:</span> {layers.outerNuclei}
            </div>
            <div>
              <span className="font-medium">Núcleos internos:</span> {layers.innerNuclei}
            </div>
            <div>
              <span className="font-medium">Ganglionares:</span> {layers.ganglion}
            </div>
          </div>
        </div>

        {thickness && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Espesores (μm)</h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
              {thickness.central && (
                <div>
                  <span className="font-medium">Central:</span> {thickness.central}
                </div>
              )}
              {thickness.average && (
                <div>
                  <span className="font-medium">Promedio:</span> {thickness.average}
                </div>
              )}
              {thickness.minimum && (
                <div>
                  <span className="font-medium">Mínimo:</span> {thickness.minimum}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Fluido</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="font-medium">Intraretiniano:</span> {fluid.intraretinal}
            </div>
            <div>
              <span className="font-medium">Subretiniano:</span> {fluid.subretinal}
            </div>
            <div>
              <span className="font-medium">Sub-RPE:</span> {fluid.subRPE}
            </div>
          </div>
        </div>

        {/* Patologías */}
        {pathology && pathology.length > 0 && (
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-3">Patologías Identificadas</h4>
            <div className="space-y-2">
              {pathology.map((p: any, index: number) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-red-700">
                    {p.type} - {p.location} ({p.severity})
                  </div>
                  <div className="text-red-600">{p.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGenericFindings = (findings: any) => {
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Calidad de la Imagen</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="font-medium">Calidad:</span> {findings.quality}
            </div>
            <div>
              <span className="font-medium">Lateralidad:</span> {findings.laterality}
            </div>
            <div>
              <span className="font-medium">Artefactos:</span> {findings.artifacts?.length || 0}
            </div>
          </div>
        </div>

        {findings.pathology && findings.pathology.length > 0 && (
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-3">Patologías Identificadas</h4>
            <div className="space-y-2">
              {findings.pathology.map((p: any, index: number) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-red-700">
                    {p.type} - {p.location} ({p.severity})
                  </div>
                  <div className="text-red-600">{p.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFindings = (analysis: MedicalImageAnalysis) => {
    const { findings, imageType } = analysis;

    switch (imageType) {
      case 'fundus':
        return renderFundusFindings(findings);
      case 'oct':
        return renderOCTFindings(findings);
      default:
        return renderGenericFindings(findings);
    }
  };

  if (analyses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white lg:rounded-lg lg:shadow-xl w-full h-full lg:max-w-6xl lg:max-h-[90vh] overflow-hidden">
      {/* Desktop Header - only show on desktop since mobile has its own header in App.tsx */}
      <div className="hidden lg:flex items-center justify-between p-6 border-b border-slate-200">
        <h3 className="text-xl font-semibold text-slate-800">
          Resultados del Análisis de Imágenes ({analyses.length})
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden mb-4">
        <p className="text-sm text-slate-600">
          {analyses.length} {analyses.length === 1 ? 'análisis completado' : 'análisis completados'}
        </p>
      </div>

        {/* Tabs */}
        {analyses.length > 1 && (
          <div className="border-b border-slate-200">
            {/* Desktop Tabs */}
            <div className="hidden lg:flex space-x-1 p-4">
              {analyses.map((analysis, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === index
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {getImageTypeLabel(analysis.imageType)} {index + 1}
                </button>
              ))}
            </div>

            {/* Mobile Tabs - Horizontal scroll */}
            <div className="lg:hidden p-4">
              <div className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
                {analyses.map((analysis, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === index
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-600'
                        : 'text-slate-600 hover:text-slate-800 bg-white border-2 border-slate-200'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Imagen {index + 1}</div>
                      <div className="text-xs">{getImageTypeLabel(analysis.imageType)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Content */}
      <div className="p-4 lg:p-6 overflow-y-auto lg:max-h-[60vh]">
        {analyses.map((analysis, index) => (
          <div key={index} className={activeTab === index ? 'block' : 'hidden'}>
            {/* Información general */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-800">
                  {getImageTypeLabel(analysis.imageType)}
                </h4>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(analysis.confidence)}`}>
                  Confianza: {getConfidenceLabel(analysis.confidence)} ({(analysis.confidence * 100).toFixed(0)}%)
                </div>
              </div>

              {/* Imagen */}
              {analysis.imageUrl && (
                <div className="mb-4">
                  <img
                    src={analysis.imageUrl}
                    alt="Imagen analizada"
                    className="max-w-full h-64 object-contain rounded-lg border border-slate-200"
                  />
                </div>
              )}
            </div>

            {/* Hallazgos específicos */}
            {renderFindings(analysis)}

            {/* Recomendaciones */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">Recomendaciones</h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, recIndex) => (
                    <li key={recIndex} className="text-sm text-blue-700 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageAnalysisResults;
