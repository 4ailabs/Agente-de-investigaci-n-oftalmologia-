import React, { useState } from 'react';

interface ImageAnalysisAnnouncementProps {
  onClose: () => void;
  onShowImageUploader: () => void;
}

const ImageAnalysisAnnouncement: React.FC<ImageAnalysisAnnouncementProps> = ({
  onClose,
  onShowImageUploader
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const handleTryFeature = () => {
    onShowImageUploader();
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Nueva Funcionalidad
                </h2>
                <p className="text-blue-100 text-sm">
                  Análisis de Imágenes Médicas con IA
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main announcement */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              ¡Análisis de Imágenes Médicas Disponible!
            </h3>
            <p className="text-slate-600 text-lg">
              Ahora puedes analizar imágenes oftalmológicas con inteligencia artificial
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Múltiples Tipos de Imagen</h4>
                  <p className="text-sm text-slate-600">
                    Fondos de ojo, OCT, angiografías, segmento anterior, ecografías y más
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Análisis Inteligente</h4>
                  <p className="text-sm text-slate-600">
                    Detección automática de patologías y hallazgos clínicos
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Reportes Estructurados</h4>
                  <p className="text-sm text-slate-600">
                    Resultados organizados con recomendaciones clínicas
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Procesamiento Rápido</h4>
                  <p className="text-sm text-slate-600">
                    Análisis instantáneo con Google Gemini Pro Vision
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How to use */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">¿Cómo usar la nueva funcionalidad?</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Haz clic en el botón "Analizar Imágenes" en el header</li>
              <li>2. Selecciona las imágenes médicas que deseas analizar</li>
              <li>3. Especifica el tipo de imagen (fondo de ojo, OCT, etc.)</li>
              <li>4. Inicia el análisis y obtén resultados detallados</li>
            </ol>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleTryFeature}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Probar Análisis de Imágenes</span>
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysisAnnouncement;
