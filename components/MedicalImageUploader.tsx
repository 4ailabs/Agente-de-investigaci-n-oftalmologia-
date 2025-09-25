import React, { useState, useRef, useEffect } from 'react';
import { MedicalImageAnalysisService } from '../services/medicalImageAnalysisService';
import { MedicalImageAnalysis, MedicalImageType, ImageAnalysisConfig } from '../types/medicalImageTypes';
import ImageAnalysisFallback from './ImageAnalysisFallback';

interface MedicalImageUploaderProps {
  onAnalysisComplete: (analysis: MedicalImageAnalysis) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  maxImages?: number;
}

const MedicalImageUploader: React.FC<MedicalImageUploaderProps> = ({
  onAnalysisComplete,
  onError,
  isLoading = false,
  maxImages = 5
}) => {
  const [selectedImages, setSelectedImages] = useState<{ file: File; type: MedicalImageType; config?: ImageAnalysisConfig }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number } | null>(null);
  const [isServiceAvailable, setIsServiceAvailable] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Intentar inicializar el servicio de forma segura
  const [analysisService, setAnalysisService] = useState<MedicalImageAnalysisService | null>(null);

  useEffect(() => {
    try {
      const service = MedicalImageAnalysisService.getInstance();
      setAnalysisService(service);
      setIsServiceAvailable(true);
    } catch (error) {
      console.warn('MedicalImageAnalysisService no disponible:', error);
      setIsServiceAvailable(false);
      setServiceError(error instanceof Error ? error.message : 'Servicio no disponible');
      setAnalysisService(null);
    }
  }, []);

  // Verificar disponibilidad del servicio al montar
  useEffect(() => {
    if (!isServiceAvailable) {
      console.warn('Análisis de imágenes no disponible - API key no configurada');
    }
  }, [isServiceAvailable]);

  const imageTypes: { value: MedicalImageType; label: string; description: string }[] = [
    { value: 'fundus', label: 'Fondo de Ojo', description: 'Fotografías de retina y nervio óptico' },
    { value: 'oct', label: 'OCT', description: 'Tomografía de coherencia óptica' },
    { value: 'angiography', label: 'Angiografía', description: 'Fluoresceína, ICG o OCT-A' },
    { value: 'anterior_segment', label: 'Segmento Anterior', description: 'Córnea, iris, cristalino' },
    { value: 'ultrasound', label: 'Ecografía', description: 'A-scan, B-scan o Doppler' },
    { value: 'visual_field', label: 'Campo Visual', description: 'Humphrey, Goldmann, Octopus' },
    { value: 'cornea', label: 'Topografía Corneal', description: 'Queratometría y paquimetría' },
    { value: 'other', label: 'Otros', description: 'Otras imágenes oftalmológicas' }
  ];

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validar número máximo de imágenes
    if (selectedImages.length + files.length > maxImages) {
      onError(`Máximo ${maxImages} imágenes permitidas.`);
      return;
    }

    const newImages: { file: File; type: MedicalImageType; config?: ImageAnalysisConfig }[] = [];

    for (const file of files) {
      // Validar archivo
      const validation = analysisService.validateImageFile(file);
      if (!validation.valid) {
        onError(validation.error || 'Archivo inválido');
        continue;
      }

      // Detectar tipo automáticamente
      try {
        const detectedType = await analysisService.detectImageType(file);
        console.log(`Tipo detectado para ${file.name}: ${detectedType}`);
        
        newImages.push({
          file,
          type: detectedType,
          config: {
            imageType: detectedType,
            priority: 'routine',
            includeDifferential: true,
            includeRecommendations: true,
            detailLevel: 'detailed'
          }
        });
      } catch (error) {
        console.warn(`Error detectando tipo para ${file.name}:`, error);
        // Fallback a tipo genérico
        newImages.push({
          file,
          type: 'other',
          config: {
            imageType: 'other',
            priority: 'routine',
            includeDifferential: true,
            includeRecommendations: true,
            detailLevel: 'detailed'
          }
        });
      }
    }

    setSelectedImages(prev => [...prev, ...newImages]);
  };

  const handleImageTypeChange = (index: number, type: MedicalImageType) => {
    setSelectedImages(prev => prev.map((img, i) => 
      i === index 
        ? { 
            ...img, 
            type, 
            config: { 
              ...img.config, 
              imageType: type 
            } 
          }
        : img
    ));
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeImages = async () => {
    if (!analysisService) {
      onError('Servicio de análisis no disponible. Verifica la configuración de la API key.');
      return;
    }

    if (selectedImages.length === 0) {
      onError('Selecciona al menos una imagen para analizar');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: selectedImages.length });

    try {
      for (let i = 0; i < selectedImages.length; i++) {
        const { file, type, config } = selectedImages[i];
        
        setAnalysisProgress({ current: i + 1, total: selectedImages.length });
        
        const analysis = await analysisService.analyzeImage(file, type, config);
        onAnalysisComplete(analysis);
      }

      // Limpiar imágenes después del análisis
      setSelectedImages([]);
      setAnalysisProgress(null);

    } catch (error) {
      onError(`Error analizando imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearImages = () => {
    setSelectedImages([]);
    setAnalysisProgress(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600">Cargando analizador de imágenes...</span>
        </div>
      </div>
    );
  }

  // Mostrar fallback si el servicio no está disponible
  if (!isServiceAvailable || !analysisService) {
    return <ImageAnalysisFallback onClose={() => onError('Servicio no disponible')} />;
  }

  return (
    <div className="bg-white lg:rounded-lg lg:border lg:border-slate-200 lg:p-6">
      {/* Desktop Header */}
      <div className="hidden lg:block mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Análisis de Imágenes Médicas
        </h3>
        <p className="text-sm text-slate-600">
          Sube imágenes oftalmológicas para análisis automático con IA especializada
        </p>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden mb-4">
        <p className="text-sm text-slate-600">
          Sube imágenes oftalmológicas para análisis con IA
        </p>
      </div>

      {/* Botón de selección de archivos */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleFileSelect}
          disabled={isAnalyzing || selectedImages.length >= maxImages}
          className="w-full py-6 lg:py-3 px-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center">
            <svg className="h-12 w-12 lg:h-8 lg:w-8 text-slate-400 mb-3 lg:mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-base lg:text-sm font-medium text-slate-600">
              {selectedImages.length >= maxImages
                ? `Máximo ${maxImages} imágenes alcanzado`
                : 'Seleccionar Imágenes Médicas'
              }
            </span>
            <span className="text-sm lg:text-xs text-slate-500 mt-2 lg:mt-1">
              JPG, PNG, GIF, WebP (máx. 10MB cada una)
            </span>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Lista de imágenes seleccionadas */}
      {selectedImages.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-800">
              Imágenes Seleccionadas ({selectedImages.length})
            </h4>
            <button
              type="button"
              onClick={handleClearImages}
              disabled={isAnalyzing}
              className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
            >
              Limpiar todo
            </button>
          </div>

          <div className="space-y-3">
            {selectedImages.map((image, index) => (
              <div key={index} className="bg-slate-50 rounded-lg">
                {/* Desktop Layout */}
                <div className="hidden lg:flex items-center space-x-3 p-3">
                  {/* Preview de imagen */}
                  <div className="flex-shrink-0">
                    <img
                      src={URL.createObjectURL(image.file)}
                      alt={`Imagen ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  </div>

                  {/* Información de la imagen */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {image.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(image.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      Tipo detectado: {imageTypes.find(t => t.value === image.type)?.label || 'Desconocido'}
                    </p>
                  </div>

                  {/* Selector de tipo */}
                  <div className="flex-shrink-0">
                    <label className="text-xs text-slate-600 block mb-1">Tipo:</label>
                    <select
                      value={image.type}
                      onChange={(e) => handleImageTypeChange(index, e.target.value as MedicalImageType)}
                      disabled={isAnalyzing}
                      className="text-xs border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      {imageTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Botón de eliminar */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    disabled={isAnalyzing}
                    className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden p-3 space-y-3">
                  {/* Image and basic info */}
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <img
                        src={URL.createObjectURL(image.file)}
                        alt={`Imagen ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {image.file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(image.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        {imageTypes.find(t => t.value === image.type)?.label || 'Desconocido'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      disabled={isAnalyzing}
                      className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Type selector - full width on mobile */}
                  <div className="w-full">
                    <label className="text-sm text-slate-600 block mb-2">Tipo de imagen:</label>
                    <select
                      value={image.type}
                      onChange={(e) => handleImageTypeChange(index, e.target.value as MedicalImageType)}
                      disabled={isAnalyzing}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 bg-white"
                    >
                      {imageTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progreso de análisis */}
      {analysisProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span>Analizando imágenes...</span>
            <span>{analysisProgress.current} de {analysisProgress.total}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-col lg:flex-row lg:space-x-3 space-y-3 lg:space-y-0">
        <button
          type="button"
          onClick={handleAnalyzeImages}
          disabled={selectedImages.length === 0 || isAnalyzing}
          className="w-full lg:flex-1 bg-blue-600 text-white py-3 lg:py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isAnalyzing ? 'Analizando...' : 'Analizar Imágenes'}
        </button>

        {selectedImages.length > 0 && (
          <button
            type="button"
            onClick={handleClearImages}
            disabled={isAnalyzing}
            className="w-full lg:w-auto px-4 py-3 lg:py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors font-medium"
          >
            Limpiar Todo
          </button>
        )}
      </div>

      {/* Información sobre tipos de imagen */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h5 className="text-sm lg:text-sm font-medium text-blue-800 mb-3 lg:mb-2">Tipos de Imagen Soportados:</h5>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-2 text-sm lg:text-xs text-blue-700">
          {imageTypes.map(type => (
            <div key={type.value} className="flex flex-col lg:flex-row lg:items-center">
              <span className="font-medium text-blue-800">{type.label}</span>
              <span className="lg:ml-1 text-xs lg:text-xs text-blue-600">{type.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MedicalImageUploader;
