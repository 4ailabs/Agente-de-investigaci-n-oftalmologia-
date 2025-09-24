import React from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { Mic, AlertTriangle } from 'lucide-react';

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
            <Mic className="h-5 w-5 mr-2 text-blue-600" />
            Transcripción de Voz
          </h3>
        </div>

        {/* Botón principal de transcripción */}
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={isTranscribing ? stopLiveTranscription : startLiveTranscription}
            className={`flex items-center space-x-2 px-8 py-4 font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md ${
              isTranscribing 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Mic className="h-6 w-6" />
            <span className="text-lg">{isTranscribing ? 'Detener Transcripción' : 'Iniciar Transcripción'}</span>
          </button>
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
          <div className="mt-4 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-blue-800">Transcripción</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleUseLiveTranscription}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  Usar Texto
                </button>
              </div>
            </div>
            <div className="text-base text-blue-700 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-lg border border-blue-100">
              {liveTranscription}
            </div>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
