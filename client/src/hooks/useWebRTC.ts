import { useCallback, useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socket';

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const parseUrls = (value?: string) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const buildIceServers = (): RTCIceServer[] => {
  const rawIceServers = import.meta.env.VITE_WEBRTC_ICE_SERVERS;
  if (rawIceServers) {
    try {
      const parsed = JSON.parse(rawIceServers);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as RTCIceServer[];
      }
    } catch (error) {
      console.warn('Invalid VITE_WEBRTC_ICE_SERVERS value, falling back to STUN/TURN variables.', error);
    }
  }

  const iceServers: RTCIceServer[] = [];
  const stunUrls = parseUrls(import.meta.env.VITE_STUN_URLS);
  const turnUrls = parseUrls(import.meta.env.VITE_TURN_URLS);

  if (stunUrls.length > 0) {
    iceServers.push({ urls: stunUrls });
  }

  if (turnUrls.length > 0) {
    iceServers.push({
      urls: turnUrls,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    });
  }

  return iceServers.length > 0 ? iceServers : DEFAULT_ICE_SERVERS;
};

const ICE_CONFIGURATION: RTCConfiguration = {
  iceServers: buildIceServers(),
};

export const useWebRTC = (callId: string, isInitiator: boolean, remoteUserId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const handleOffer = useCallback(async ({ callId: incomingCallId, from, offer }: any) => {
    if (incomingCallId !== callId) return;

    try {
      const isVideoCall = offer?.sdp?.includes('m=video') || false;

      if (!localStreamRef.current) {
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
  }, [callId]);

  const handleAnswer = useCallback(async ({ callId: incomingCallId, answer }: any) => {
    if (incomingCallId !== callId) return;

    try {
      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, [callId]);

  const handleICECandidate = useCallback(async ({ callId: incomingCallId, candidate }: any) => {
    if (incomingCallId !== callId) return;

    try {
      await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, [callId]);

  const initializePeerConnection = useCallback(async () => {
    try {
      const pc = new RTCPeerConnection(ICE_CONFIGURATION);
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
  }, [callId, remoteUserId]);

  const setupSocketListeners = useCallback(() => {
    socketService.on('webrtc:offer', handleOffer);
    socketService.on('webrtc:answer', handleAnswer);
    socketService.on('webrtc:ice-candidate', handleICECandidate);
  }, [handleAnswer, handleICECandidate, handleOffer]);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnection.current?.close();
    peerConnection.current = null;
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    socketService.off('webrtc:offer', handleOffer);
    socketService.off('webrtc:answer', handleAnswer);
    socketService.off('webrtc:ice-candidate', handleICECandidate);
  }, [handleAnswer, handleICECandidate, handleOffer]);

  useEffect(() => {
    void initializePeerConnection();
    setupSocketListeners();

    return () => {
      cleanup();
    };
  }, [cleanup, initializePeerConnection, setupSocketListeners]);

  const startCall = useCallback(async (video = true) => {
    try {
      if (!remoteUserId) {
        throw new Error('Remote participant is missing');
      }

      if (!peerConnection.current) {
        await initializePeerConnection();
      }

      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video,
        });

        setLocalStream(stream);
        stream.getTracks().forEach((track) => {
          peerConnection.current?.addTrack(track, stream);
        });
      }

      if (isInitiator) {
        const offer = await peerConnection.current?.createOffer();
        await peerConnection.current?.setLocalDescription(offer);
        socketService.sendWebRTCOffer(callId, remoteUserId, offer!);
      }
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }, [callId, initializePeerConnection, isInitiator, remoteUserId]);

  const toggleAudio = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsAudioEnabled(audioTrack.enabled);
  }, []);

  const toggleVideo = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoEnabled(videoTrack.enabled);
  }, []);

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
