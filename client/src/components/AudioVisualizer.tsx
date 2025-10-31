import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';

interface AudioVisualizerProps {
  audioUrl: string;
  waveform?: string;
  duration?: number;
}

export const AudioVisualizer = ({ audioUrl, waveform, duration }: AudioVisualizerProps) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#94a3b8',
      progressColor: '#0088cc',
      cursorColor: '#0088cc',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 40,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurfer.current.load(audioUrl);

    // Load pre-computed waveform if available
    if (waveform) {
      try {
        const peaks = JSON.parse(waveform);
        if (Array.isArray(peaks)) {
          wavesurfer.current.load(audioUrl, peaks);
        }
      } catch (error) {
        console.error('Error parsing waveform:', error);
      }
    }

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));
    wavesurfer.current.on('audioprocess', (time) => setCurrentTime(time));
    wavesurfer.current.on('seek', () => {
      setCurrentTime(wavesurfer.current?.getCurrentTime() || 0);
    });

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [audioUrl, waveform]);

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const totalDuration = duration || wavesurfer.current?.getDuration() || 0;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={handlePlayPause}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full transition"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>
      <div className="flex-1">
        <div ref={waveformRef} className="w-full" />
      </div>
      <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 font-mono min-w-[45px] text-right">
        {formatTime(currentTime)} / {formatTime(totalDuration)}
      </div>
    </div>
  );
};
