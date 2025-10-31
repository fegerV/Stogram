import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export const VoiceRecorder = ({ onSend, onCancel }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
    }
  };

  const handleCancel = () => {
    stopRecording();
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-600 dark:text-red-400 font-medium">
            Recording
          </span>
        </div>
      )}

      {/* Duration */}
      <div className="flex-1 text-center">
        <span className="text-2xl font-mono text-gray-700 dark:text-gray-300">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {isRecording ? (
          <button
            onClick={handleStop}
            className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            title="Stop recording"
          >
            <Square size={20} fill="currentColor" />
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              title="Cancel"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={handleSend}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
              title="Send voice message"
            >
              <Send size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
