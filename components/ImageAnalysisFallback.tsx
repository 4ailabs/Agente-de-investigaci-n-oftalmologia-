import React from 'react';

interface ImageAnalysisFallbackProps {
  onClose: () => void;
}

const ImageAnalysisFallback: React.FC<ImageAnalysisFallbackProps> = ({ onClose }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="text-center">
        {/* Icono de advertencia */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
          <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Análisis de Imágenes No Disponible
        </h3>
        
        <p className="text-slate-600 mb-4">
          Para usar el análisis de imágenes médicas, necesitas configurar tu API key de Google Gemini.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-semibold text-blue-800 mb-2">Cómo configurar:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Obtén tu API key desde <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
            <li>Crea un archivo <code className="bg-blue-100 px-1 rounded">.env</code> en la raíz del proyecto</li>
            <li>Agrega la línea: <code className="bg-blue-100 px-1 rounded">VITE_GEMINI_API_KEY=tu_api_key_aqui</code></li>
            <li>Reinicia el servidor de desarrollo</li>
          </ol>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-semibold text-yellow-800 mb-2">Límites de la API gratuita:</h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>50 requests por día</li>
            <li>15 requests por minuto</li>
            <li>1 millón de tokens por día</li>
          </ul>
        </div>

        <div className="flex space-x-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cerrar
          </button>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Obtener API Key
          </a>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysisFallback;
