import React from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorDisplayProps {
  error: {
    type: 'retryable' | 'permanent';
    message: string;
    originalError: string;
  };
  onRetry?: () => void;
  showDetails?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  showDetails = false 
}) => {
  const isRetryable = error.type === 'retryable';
  
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {isRetryable ? 'Error Temporal' : 'Error del Sistema'}
          </h3>
          
          <div className="mt-2 text-sm text-red-700">
            <p className="whitespace-pre-line">{error.message}</p>
          </div>
          
          {showDetails && (
            <details className="mt-3">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                Ver detalles técnicos
              </summary>
              <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono text-red-800">
                {error.originalError}
              </div>
            </details>
          )}
          
          {isRetryable && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </button>
            </div>
          )}
          
          {!isRetryable && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Acción requerida:</strong> Este error requiere intervención manual. 
                Por favor, verifica la configuración de la API o contacta al administrador.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
