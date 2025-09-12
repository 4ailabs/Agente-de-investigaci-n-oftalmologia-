import React, { useState, useRef } from 'react';
import { DocumentCaptureService, CapturedImage } from '../services/documentCaptureService';

interface DocumentCaptureProps {
  onDataExtracted: (data: any) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

const DocumentCapture: React.FC<DocumentCaptureProps> = ({ 
  onDataExtracted, 
  onError, 
  isLoading = false 
}) => {
  const [images, setImages] = useState<CapturedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureService = DocumentCaptureService.getInstance();

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Limitar a máximo 10 fotos para evitar sobrecarga
    const limitedFiles = files.slice(0, 10);
    if (files.length > 10) {
      onError('Se seleccionaron muchas fotos. Se procesarán solo las primeras 10.');
    }

    setIsProcessing(true);
    try {
      const processedImages = await captureService.processImages(limitedFiles);
      setImages(prevImages => [...prevImages, ...processedImages]);
      setShowPreview(true);
    } catch (error) {
      onError('Error procesando las imágenes: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseData = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    try {
      const result = await captureService.extractMedicalDataFromImages(images);
      onDataExtracted(result.extractedData);
      
      // Limpiar previews
      captureService.cleanupImagePreviews(images);
      setImages([]);
      setShowPreview(false);
    } catch (error) {
      onError('Error extrayendo datos: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearImages = () => {
    captureService.cleanupImagePreviews(images);
    setImages([]);
    setShowPreview(false);
  };

  const handleRemoveImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    const removedImage = images.find(img => img.id === imageId);
    if (removedImage) {
      captureService.cleanupImagePreviews([removedImage]);
    }
    setImages(updatedImages);
  };

  return (
    <div className="space-y-4">
      {/* Botones de captura */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleCaptureClick}
            disabled={isLoading || isProcessing}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors min-h-[48px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">
              {isProcessing ? 'Procesando...' : 'Agregar Fotos'}
            </span>
          </button>

          {images.length > 0 && (
            <button
              type="button"
              onClick={handleUseData}
              disabled={isLoading || isProcessing}
              className="flex-1 sm:flex-none px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors min-h-[48px]"
            >
              <span className="font-medium">
                {isProcessing ? 'Extrayendo...' : 'Usar Datos'}
              </span>
            </button>
          )}
        </div>

        {/* Información sobre múltiples fotos */}
        {images.length > 0 && (
          <div className="text-center">
            <p className="text-sm text-slate-600">
              {images.length} foto{images.length !== 1 ? 's' : ''} capturada{images.length !== 1 ? 's' : ''}
              {images.length < 10 && (
                <span className="text-green-600 ml-1">
                  (puedes agregar más)
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Input oculto para captura */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview de imágenes */}
      {showPreview && images.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-800">
              Imágenes Capturadas ({images.length})
            </h4>
            <button
              type="button"
              onClick={handleClearImages}
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              Limpiar todo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {images.map((image) => (
              <div key={image.id} className="relative bg-white rounded-lg border border-slate-200 overflow-hidden">
                <img
                  src={image.preview}
                  alt="Expediente capturado"
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
                
                {/* Estado del procesamiento */}
                <div className="p-2">
                  {image.extractedText ? (
                    <div className="text-xs text-green-600 font-medium">
                      ✓ Texto extraído
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 font-medium">
                      ⏳ Procesando...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Texto extraído (vista previa) */}
          {images.some(img => img.extractedText) && (
            <div className="mt-4">
              <details className="bg-white rounded-lg border border-slate-200">
                <summary className="p-3 cursor-pointer font-medium text-slate-700 hover:bg-slate-50">
                  Ver texto extraído
                </summary>
                <div className="p-3 border-t border-slate-200 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                    {images
                      .map(img => img.extractedText || '')
                      .filter(text => text.trim())
                      .join('\n\n---\n\n')}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Consejos para mejor captura:</p>
            <ul className="text-xs space-y-1">
              <li>• <strong>Múltiples fotos:</strong> Puedes capturar varias páginas del expediente</li>
              <li>• <strong>Calidad:</strong> Asegúrate de que el texto sea legible y esté bien iluminado</li>
              <li>• <strong>Estabilidad:</strong> Mantén la cámara estable y perpendicular al documento</li>
              <li>• <strong>Completitud:</strong> Captura páginas completas del expediente</li>
              <li>• <strong>Agregar más:</strong> Puedes seguir agregando fotos después de la primera captura</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCapture;
