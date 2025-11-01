import { create } from 'zustand';
import { Chat, Message } from '@types/index';
import apiService from '@services/api';

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  loadChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string, type?: string) => Promise<void>;
  setCurrentChat: (chat: Chat | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  error: null,

  loadChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const chats = await apiService.getChats();
      set({ chats, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load chats',
        isLoading: false,
      });
    }
  },

  loadMessages: async (chatId: string) => {
    set({ isLoading: true, error: null });
    try {
      const messages = await apiService.getMessages(chatId);
      set({ messages, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load messages',
        isLoading: false,
      });
    }
  },

  sendMessage: async (chatId: string, content: string, type = 'TEXT') => {
    try {
      const message = await apiService.sendMessage(chatId, { content, type });
      set(state => ({
        messages: [...state.messages, message],
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to send message',
      });
      throw error;
    }
  },

  setCurrentChat: (chat: Chat | null) => {
    set({ currentChat: chat, messages: [] });
  },

  addMessage: (message: Message) => {
    set(state => {
      const messageExists = state.messages.some(m => m.id === message.id);
      if (messageExists) return state;
      return { messages: [...state.messages, message] };
    });
  },

  updateMessage: (messageId: string, content: string) => {
    set(state => ({
      messages: state.messages.map(m =>
        m.id === messageId ? { ...m, content, isEdited: true } : m
      ),
    }));
  },

  deleteMessage: (messageId: string) => {
    set(state => ({
      messages: state.messages.filter(m => m.id !== messageId),
    }));
  },

  clearError: () => set({ error: null }),
}));
