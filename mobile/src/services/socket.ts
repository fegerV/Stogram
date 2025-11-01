import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@utils/config';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect() {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      console.log('No token available, skipping socket connection');
      return;
    }

    this.socket = io(API_BASE_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', reason => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', error => {
      console.log('Socket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
      }
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

  onMessageNew(callback: (message: any) => void) {
    this.on('message:new', callback);
  }

  offMessageNew(callback: (message: any) => void) {
    this.off('message:new', callback);
  }

  onUserTyping(callback: (data: { userId: string; chatId: string; isTyping: boolean }) => void) {
    this.on('user:typing', callback);
  }

  offUserTyping(callback: (data: { userId: string; chatId: string; isTyping: boolean }) => void) {
    this.off('user:typing', callback);
  }

  onCallIncoming(callback: (call: any) => void) {
    this.on('call:incoming', callback);
  }

  offCallIncoming(callback: (call: any) => void) {
    this.off('call:incoming', callback);
  }

  sendMessage(data: { chatId: string; content: string; type: string }) {
    this.emit('message:send', data);
  }

  sendTyping(chatId: string, isTyping: boolean) {
    this.emit('message:typing', { chatId, isTyping });
  }

  initiateCall(chatId: string, type: 'AUDIO' | 'VIDEO') {
    this.emit('call:initiate', { chatId, type });
  }

  answerCall(callId: string) {
    this.emit('call:answer', { callId });
  }

  endCall(callId: string) {
    this.emit('call:end', { callId });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
