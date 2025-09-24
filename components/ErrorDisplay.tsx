import React from 'react';

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
          <svg 
            className="h-5 w-5 text-red-400" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
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
                <svg 
                  className="h-4 w-4 mr-2" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
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
