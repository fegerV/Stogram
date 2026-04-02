import { useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff, X } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

interface CallModalProps {
  callId: string;
  chatId: string;
  callType: 'AUDIO' | 'VIDEO';
  isInitiator: boolean;
  onClose: () => void;
}

export default function CallModal({ callId, chatId, callType, isInitiator, onClose }: CallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const { currentChat } = useChatStore();
  const { user: currentUser } = useAuthStore();

  const remoteUserId =
    currentChat?.members?.find((member: any) => member.userId !== currentUser?.id)?.userId || '';

  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    startCall,
    toggleAudio,
    toggleVideo,
    cleanup,
  } = useWebRTC(callId, isInitiator, remoteUserId);

  useEffect(() => {
    if (isInitiator) {
      void startCall(callType === 'VIDEO');
    }
  }, [callType, isInitiator, startCall]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    if (remoteAudioRef.current && remoteStream && callType === 'AUDIO') {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [callType, remoteStream]);

  const handleEndCall = () => {
    cleanup();
    if (callId) {
      socketService.endCall(callId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="relative h-full w-full overflow-hidden">
        <button
          type="button"
          onClick={handleEndCall}
          className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/60 p-2 text-white transition hover:bg-slate-900/90"
          title="Завершить звонок"
        >
          <X className="h-6 w-6" />
        </button>

        {callType === 'VIDEO' ? (
          <>
            <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-24 right-4 h-36 w-48 rounded-2xl border-2 border-white/80 object-cover shadow-2xl"
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white">
            <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-[#3390ec] text-4xl shadow-2xl">
              👤
            </div>
            <h2 className="mb-2 text-2xl font-bold">Аудиозвонок</h2>
            <p className="text-slate-300">
              {remoteStream ? 'Соединение установлено' : isInitiator ? 'Вызываем...' : 'Подключаемся...'}
            </p>
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-slate-900/60 px-4 py-3 shadow-2xl backdrop-blur">
          <button
            type="button"
            onClick={toggleAudio}
            className={`rounded-full p-4 transition ${
              isAudioEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-600 hover:bg-rose-700'
            }`}
            title={isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
          >
            {isAudioEnabled ? <Mic className="h-6 w-6 text-white" /> : <MicOff className="h-6 w-6 text-white" />}
          </button>

          {callType === 'VIDEO' && (
            <button
              type="button"
              onClick={toggleVideo}
              className={`rounded-full p-4 transition ${
                isVideoEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-rose-600 hover:bg-rose-700'
              }`}
              title={isVideoEnabled ? 'Выключить камеру' : 'Включить камеру'}
            >
              {isVideoEnabled ? (
                <Video className="h-6 w-6 text-white" />
              ) : (
                <VideoOff className="h-6 w-6 text-white" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleEndCall}
            className="rounded-full bg-rose-600 p-4 transition hover:bg-rose-700"
            title="Завершить звонок"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
