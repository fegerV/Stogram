import { useEffect, useState, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { socketService } from '../services/socket';
import { Call } from '../types';
import { getMediaUrl } from '../utils/helpers';
import { notificationSound } from '../utils/notificationSound';

interface IncomingCallModalProps {
  call: Call;
  onAnswer: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({ call, onAnswer, onReject }: IncomingCallModalProps) {
  const [duration, setDuration] = useState(0);
  const ringtoneIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Play ringtone repeatedly
    const playRingtone = () => {
      notificationSound.playCallRingtone();
    };
    
    // Play immediately
    playRingtone();
    
    // Then repeat every 2 seconds
    ringtoneIntervalRef.current = setInterval(playRingtone, 2000);

    // Duration counter
    const durationInterval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
      }
      clearInterval(durationInterval);
      notificationSound.stopCallRingtone();
    };
  }, []);

  const handleAnswer = () => {
    // Stop ringtone
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    notificationSound.stopCallRingtone();
    
    socketService.answerCall(call.id);
    onAnswer();
  };

  const handleReject = () => {
    // Stop ringtone
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    notificationSound.stopCallRingtone();
    
    socketService.rejectCall(call.id);
    onReject();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center text-white">
        <div className="mb-8">
          {call.initiator.avatar ? (
            <img
              src={getMediaUrl(call.initiator.avatar) || ''}
              alt={call.initiator.displayName || call.initiator.username}
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-[#3390ec] dark:bg-[#3390ec] flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">
                {call.initiator.displayName?.[0] || call.initiator.username[0] || '👤'}
              </span>
            </div>
          )}
          <h2 className="text-3xl font-bold mb-2">
            {call.initiator.displayName || call.initiator.username}
          </h2>
          <p className="text-gray-300 text-lg">
            {call.type === 'VIDEO' ? 'Входящий видеозвонок' : 'Входящий аудиозвонок'}
          </p>
          {duration > 0 && (
            <p className="text-gray-400 mt-2">{formatDuration(duration)}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReject}
            className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition"
            title="Отклонить"
          >
            <PhoneOff className="w-8 h-8" />
          </button>

          <button
            onClick={handleAnswer}
            className="p-4 bg-green-600 rounded-full hover:bg-green-700 transition"
            title="Принять"
          >
            {call.type === 'VIDEO' ? (
              <Video className="w-8 h-8" />
            ) : (
              <Phone className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
