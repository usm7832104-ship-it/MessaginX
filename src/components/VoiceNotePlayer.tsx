import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { formatDuration } from '../utils/mediaUtils';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number;
  isOutgoing?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  duration = 0,
  isOutgoing = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (!totalDuration || isNaN(totalDuration)) {
        setTotalDuration(audio.duration || 0);
      }
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
  }, [totalDuration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * totalDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Generate pseudo-waveform bars
  const barsCount = 28;
  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[220px] max-w-[290px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md ${
          isOutgoing
            ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Scrubber */}
      <div className="flex-1 flex flex-col gap-1 cursor-pointer" onClick={handleSeek}>
        <div className="flex items-center gap-[2px] h-6 w-full">
          {Array.from({ length: barsCount }).map((_, i) => {
            const barProgress = (i / barsCount) * 100;
            const isPlayed = barProgress <= progressPercent;
            // Simulated varied heights for realistic sound wave
            const heights = [30, 45, 70, 90, 60, 40, 80, 100, 75, 50, 85, 95, 65, 40, 70, 90, 80, 60, 40, 75, 95, 80, 50, 65, 85, 55, 40, 30];
            const height = heights[i % heights.length];

            return (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`flex-1 rounded-full transition-colors duration-150 ${
                  isPlayed
                    ? isOutgoing
                      ? 'bg-cyan-300'
                      : 'bg-emerald-300'
                    : isOutgoing
                    ? 'bg-cyan-900/40'
                    : 'bg-slate-600/50'
                }`}
              />
            );
          })}
        </div>

        {/* Timers */}
        <div className="flex justify-between items-center text-[10px] tabular-nums font-mono text-slate-400">
          <span>{formatDuration(isPlaying ? currentTime : totalDuration)}</span>
          <Volume2 className="w-3 h-3 opacity-60" />
        </div>
      </div>
    </div>
  );
};
