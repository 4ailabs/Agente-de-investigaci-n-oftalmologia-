import React, { useState } from 'react';
import { useAudioRecorder, formatRecordingTime } from '../hooks/useAudioRecorder';
import { AudioPlayer } from './AudioPlayer';
import { transcribeAudio, cleanTranscription, extractMedicalInfo } from '../services/audioTranscriptionService';

interface AudioRecorderProps {
  onTranscriptionComplete: (transcription: string, medicalInfo?: any) => void;
  onError: (error: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onTranscriptionComplete, 
  onError 
}) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording
  } = useAudioRecorder();

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');

  const handleTranscribe = async () => {
    if (!audioBlob) return;

    try {
      setIsTranscribing(true);
      setTranscription('');

      // Transcribir audio
      const result = await transcribeAudio(audioBlob);
      const cleanedText = cleanTranscription(result.text);
      setTranscription(cleanedText);

      // Extraer información médica estructurada
      const medicalInfo = await extractMedicalInfo(cleanedText);

      // Llamar callback con la transcripción y información médica
      onTranscriptionComplete(cleanedText, medicalInfo);

    } catch (err) {
      console.error('Error en transcripción:', err);
      onError(err instanceof Error ? err.message : 'Error al transcribir audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClear = () => {
    clearRecording();
    setTranscription('');
  };

  const handleUseTranscription = () => {
    if (transcription) {
      onTranscriptionComplete(transcription);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles de grabación */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Grabación de Audio
          </h3>
          
          {recordingTime > 0 && (
            <div className="text-sm text-slate-600 font-mono">
              {formatRecordingTime(recordingTime)}
            </div>
          )}
        </div>

        {/* Botones de control */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Iniciar Grabación</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                {isPaused ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Reanudar</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Pausar</span>
                  </>
                )}
              </button>

              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h6v4H9v-4z" />
                </svg>
                <span>Detener</span>
              </button>
            </div>
          )}
        </div>

        {/* Indicador de grabación */}
        {isRecording && (
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              {isPaused ? 'Grabación pausada' : 'Grabando...'}
            </span>
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

      {/* Reproductor de audio */}
      {audioUrl && (
        <AudioPlayer
          audioUrl={audioUrl}
          onTranscribe={handleTranscribe}
          isTranscribing={isTranscribing}
        />
      )}

      {/* Transcripción */}
      {transcription && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Transcripción
            </h3>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUseTranscription}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Usar Transcripción
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Limpiar
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {transcription}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
