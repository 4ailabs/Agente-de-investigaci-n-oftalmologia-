import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Mic, Loader2, FileText } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string | null;
  onTranscribe?: (transcript: string) => void;
  isTranscribing?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  onTranscribe, 
  isTranscribing = false 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) return null;

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={togglePlayPause}
          disabled={isTranscribing}
          className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-full transition-colors duration-200"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={isTranscribing}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #e2e8f0 ${(currentTime / duration) * 100}%, #e2e8f0 100%)`
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mic className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-600">Grabación de audio</span>
        </div>

        {onTranscribe && (
          <button
            onClick={() => onTranscribe('')}
            disabled={isTranscribing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                <span>Transcribiendo...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Transcribir Audio</span>
              </>
            )}
          </button>
        )}
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        className="hidden"
      />
    </div>
  );
};
