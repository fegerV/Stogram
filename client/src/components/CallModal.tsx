import { useEffect, useRef } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { socketService } from '../services/socket';

interface CallModalProps {
  chatId: string;
  callType: 'AUDIO' | 'VIDEO';
  onClose: () => void;
}

export default function CallModal({ chatId, callType, onClose }: CallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    startCall,
    toggleAudio,
    toggleVideo,
    cleanup,
  } = useWebRTC(chatId, true, 'remote-user-id');

  useEffect(() => {
    startCall(callType === 'VIDEO');
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = () => {
    cleanup();
    socketService.endCall(chatId);
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
            <div className="w-32 h-32 rounded-full bg-primary-600 flex items-center justify-center mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Audio Call</h2>
            <p className="text-gray-300">Calling...</p>
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
