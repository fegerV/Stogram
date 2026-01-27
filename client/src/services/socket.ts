import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  sendMessage(chatId: string, content: string, type = 'TEXT', replyToId?: string) {
    this.emit('message:send', { chatId, content, type, replyToId });
  }

  typing(chatId: string, isTyping: boolean) {
    this.emit('message:typing', { chatId, isTyping });
  }

  readMessage(messageId: string) {
    this.emit('message:read', { messageId });
  }

  initiateCall(chatId: string, type: 'AUDIO' | 'VIDEO') {
    this.emit('call:initiate', { chatId, type });
  }

  answerCall(callId: string) {
    this.emit('call:answer', { callId });
  }

  rejectCall(callId: string) {
    this.emit('call:reject', { callId });
  }

  endCall(callId: string) {
    this.emit('call:end', { callId });
  }

  rejectCall(callId: string) {
    this.emit('call:reject', { callId });
  }

  sendWebRTCOffer(callId: string, to: string, offer: RTCSessionDescriptionInit) {
    this.emit('webrtc:offer', { callId, to, offer });
  }

  sendWebRTCAnswer(callId: string, to: string, answer: RTCSessionDescriptionInit) {
    this.emit('webrtc:answer', { callId, to, answer });
  }

  sendICECandidate(callId: string, to: string, candidate: RTCIceCandidate) {
    this.emit('webrtc:ice-candidate', { callId, to, candidate });
  }
}

export const socketService = new SocketService();
