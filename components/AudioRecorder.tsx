import React from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AudioRecorderProps {
  onTranscriptionComplete: (transcription: string, medicalInfo?: any) => void;
  onError: (error: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onTranscriptionComplete, 
  onError 
}) => {
  const {
    error,
    liveTranscription,
    isTranscribing,
    startLiveTranscription,
    stopLiveTranscription,
    clearTranscription
  } = useAudioRecorder();

  const handleUseLiveTranscription = () => {
    if (liveTranscription.trim()) {
      onTranscriptionComplete(liveTranscription);
    }
  };

  const handleClear = () => {
    clearTranscription();
  };

  return (
    <div className="space-y-4">
      {/* Controles de transcripción */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Transcripción de Voz
          </h3>
        </div>

        {/* Botones de transcripción */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={isTranscribing ? stopLiveTranscription : startLiveTranscription}
            className={`flex items-center space-x-2 px-6 py-3 font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md ${
              isTranscribing 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>{isTranscribing ? 'Detener Transcripción' : 'Iniciar Transcripción'}</span>
          </button>
          
          {liveTranscription && (
            <button
              onClick={handleClear}
              className="flex items-center space-x-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Indicador de transcripción */}
        {isTranscribing && (
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Transcribiendo en tiempo real...</span>
          </div>
        )}

        {/* Transcripción en tiempo real */}
        {liveTranscription && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-800">Transcripción</h4>
              <button
                onClick={handleUseLiveTranscription}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors duration-200"
              >
                Usar Texto
              </button>
            </div>
            <div className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">
              {liveTranscription}
            </div>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
