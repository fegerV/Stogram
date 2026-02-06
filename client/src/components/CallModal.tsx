import { useEffect, useRef } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { socketService } from '../services/socket';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

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
  
  // Определяем remoteUserId - это другой участник чата
  // Для приватного чата - другой участник, для группового - первый другой участник
  const remoteUserId = currentChat?.members?.find((m: any) => m.userId !== currentUser?.id)?.userId || '';
  
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
    // Only start call if we're the initiator
    // For non-initiators, getUserMedia will be called when we receive the offer
    if (isInitiator) {
      startCall(callType === 'VIDEO').catch((error) => {
        console.error('Failed to start call:', error);
      });
    }
  }, [callId, callType, isInitiator, startCall]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    // For audio calls, also set remote stream to audio element
    if (remoteAudioRef.current && remoteStream && callType === 'AUDIO') {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callType]);

  const handleEndCall = () => {
    cleanup();
    if (callId) {
      socketService.endCall(callId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-800 bg-opacity-50 rounded-full hover:bg-opacity-70 transition z-10"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {callType === 'VIDEO' && (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-24 right-4 w-48 h-36 object-cover rounded-lg shadow-lg border-2 border-white"
            />
          </>
        )}

        {callType === 'AUDIO' && (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <div className="w-32 h-32 rounded-full bg-[#3390ec] dark:bg-[#3390ec] flex items-center justify-center mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Audio Call</h2>
            <p className="text-gray-300">
              {remoteStream ? 'Connected' : isInitiator ? 'Calling...' : 'Connecting...'}
            </p>
            {/* Hidden audio element for remote stream */}
            <audio
              ref={remoteAudioRef}
              autoPlay
              playsInline
              className="hidden"
            />
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </button>

          {callType === 'VIDEO' && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition ${
                isVideoEnabled
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isVideoEnabled ? (
                <Video className="w-6 h-6 text-white" />
              ) : (
                <VideoOff className="w-6 h-6 text-white" />
              )}
            </button>
          )}

          <button
            onClick={handleEndCall}
            className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
