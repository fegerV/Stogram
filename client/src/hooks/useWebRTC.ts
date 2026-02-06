import { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = (callId: string, isInitiator: boolean, remoteUserId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    initializePeerConnection();
    setupSocketListeners();

    return () => {
      cleanup();
    };
  }, [callId]);

  const initializePeerConnection = async () => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnection.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate && remoteUserId) {
          socketService.sendICECandidate(callId, remoteUserId, event.candidate);
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
      };
    } catch (error) {
      console.error('Error initializing peer connection:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('webrtc:offer', handleOffer);
    socketService.on('webrtc:answer', handleAnswer);
    socketService.on('webrtc:ice-candidate', handleICECandidate);
  };

  const startCall = async (video: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video,
      });

      setLocalStream(stream);

      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });

      if (isInitiator) {
        const offer = await peerConnection.current?.createOffer();
        await peerConnection.current?.setLocalDescription(offer);
        socketService.sendWebRTCOffer(callId, remoteUserId, offer!);
      }
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const handleOffer = async ({ callId: incomingCallId, from, offer, video }: any) => {
    // Обрабатываем только предложения для текущего звонка
    if (incomingCallId !== callId) return;
    
    try {
      // If we're not the initiator and don't have a local stream yet, get it
      // Determine if this is a video call from the offer's SDP
      const isVideoCall = offer?.sdp?.includes('m=video') || false;
      
      if (!localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideoCall,
        });
        setLocalStream(stream);
        stream.getTracks().forEach((track) => {
          peerConnection.current?.addTrack(track, stream);
        });
      }

      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current?.createAnswer();
      await peerConnection.current?.setLocalDescription(answer);
      socketService.sendWebRTCAnswer(callId, from, answer!);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async ({ callId: incomingCallId, answer }: any) => {
    // Обрабатываем только ответы для текущего звонка
    if (incomingCallId !== callId) return;
    
    try {
      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleICECandidate = async ({ callId: incomingCallId, candidate }: any) => {
    // Обрабатываем только ICE кандидаты для текущего звонка
    if (incomingCallId !== callId) return;
    
    try {
      await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const cleanup = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    peerConnection.current?.close();
    socketService.off('webrtc:offer', handleOffer);
    socketService.off('webrtc:answer', handleAnswer);
    socketService.off('webrtc:ice-candidate', handleICECandidate);
  };

  return {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    startCall,
    toggleAudio,
    toggleVideo,
    cleanup,
  };
};
