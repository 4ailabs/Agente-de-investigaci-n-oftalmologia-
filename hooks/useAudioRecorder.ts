import React, { useState, useRef, useCallback, useEffect } from 'react';

interface AudioRecorderState {
  error: string | null;
  liveTranscription: string;
  isTranscribing: boolean;
}

interface AudioRecorderControls {
  startLiveTranscription: () => void;
  stopLiveTranscription: () => void;
  clearTranscription: () => void;
}

export const useAudioRecorder = (): AudioRecorderState & AudioRecorderControls => {
  const [error, setError] = useState<string | null>(null);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recognitionRef = useRef<any>(null);

  const clearTranscription = useCallback(() => {
    setLiveTranscription('');
    setError(null);
  }, []);

  const startLiveTranscription = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Reconocimiento de voz no soportado en este navegador');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setLiveTranscription(prev => prev + finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Error en reconocimiento de voz:', event.error);
      setError(`Error en reconocimiento: ${event.error}`);
    };

    recognition.onend = () => {
      setIsTranscribing(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsTranscribing(true);
    setLiveTranscription('');
  }, []);

  const stopLiveTranscription = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsTranscribing(false);
    }
  }, []);

  // Limpiar recursos al desmontar
  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // Cleanup en useEffect si es necesario
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    error,
    liveTranscription,
    isTranscribing,
    startLiveTranscription,
    stopLiveTranscription,
    clearTranscription
  };
};

// Función para formatear tiempo de grabación
export const formatRecordingTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
