import React, { useState, useRef, useCallback, useEffect } from 'react';

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  liveTranscription: string;
  isTranscribing: boolean;
}

interface AudioRecorderControls {
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  startLiveTranscription: () => void;
  stopLiveTranscription: () => void;
}

export const useAudioRecorder = (): AudioRecorderState & AudioRecorderControls => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Verificar soporte del navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Grabación de audio no soportada en este navegador');
      }

      // Solicitar permisos de micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Crear MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Configurar eventos
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Crear URL para reproducción
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Detener el stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error('Error en MediaRecorder:', event);
        setError('Error durante la grabación');
      };

      // Iniciar grabación
      mediaRecorder.start(1000); // Recopilar datos cada segundo
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      startTimer();

    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  }, [isRecording, stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, [isRecording, isPaused, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [isRecording, isPaused, startTimer]);

  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setError(null);
    setLiveTranscription('');
    audioChunksRef.current = [];
  }, [audioUrl]);

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
    stopTimer();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [stopTimer, audioUrl]);

  // Cleanup en useEffect si es necesario
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    liveTranscription,
    isTranscribing,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    startLiveTranscription,
    stopLiveTranscription
  };
};

// Función para formatear tiempo de grabación
export const formatRecordingTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
