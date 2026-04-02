import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
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
    const playRingtone = () => {
      notificationSound.playCallRingtone();
    };

    playRingtone();
    ringtoneIntervalRef.current = setInterval(playRingtone, 2000);

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
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    notificationSound.stopCallRingtone();

    socketService.answerCall(call.id);
    onAnswer();
  };

  const handleReject = () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="text-center text-white">
        <div className="mb-8">
          {call.initiator.avatar ? (
            <img
              src={getMediaUrl(call.initiator.avatar) || ''}
              alt={call.initiator.displayName || call.initiator.username}
              className="mx-auto mb-4 h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-[#3390ec]">
              <span className="text-5xl">
                {call.initiator.displayName?.[0] || call.initiator.username[0] || '👤'}
              </span>
            </div>
          )}

          <h2 className="mb-2 text-3xl font-bold">
            {call.initiator.displayName || call.initiator.username}
          </h2>
          <p className="text-lg text-gray-300">
            {call.type === 'VIDEO' ? 'Входящий видеозвонок' : 'Входящий аудиозвонок'}
          </p>
          {duration > 0 && <p className="mt-2 text-gray-400">{formatDuration(duration)}</p>}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReject}
            className="rounded-full bg-red-600 p-4 transition hover:bg-red-700"
            title="Отклонить"
          >
            <PhoneOff className="h-8 w-8" />
          </button>

          <button
            onClick={handleAnswer}
            className="rounded-full bg-green-600 p-4 transition hover:bg-green-700"
            title="Принять"
          >
            {call.type === 'VIDEO' ? <Video className="h-8 w-8" /> : <Phone className="h-8 w-8" />}
          </button>
        </div>
      </div>
    </div>
  );
}
