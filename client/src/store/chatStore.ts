import { create } from 'zustand';
import { Chat, Message } from '../types';
import { chatApi, messageApi } from '../services/api';
import { socketService } from '../services/socket';

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  loadChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  createChat: (type: string, memberIds: string[], name?: string, description?: string) => Promise<Chat>;
  sendMessage: (chatId: string, content: string, file?: File) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
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
      const response = await chatApi.getAll();
      set({ chats: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to load chats',
        isLoading: false,
      });
    }
  },

  selectChat: async (chatId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chatApi.getById(chatId);
      set({ currentChat: response.data });
      await get().loadMessages(chatId);
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to load chat',
        isLoading: false,
      });
    }
  },

  createChat: async (type: string, memberIds: string[], name?: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chatApi.create({ type, memberIds, name, description });
      const newChat = response.data;
      set((state) => ({
        chats: [newChat, ...state.chats],
        isLoading: false,
      }));
      return newChat;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to create chat',
        isLoading: false,
      });
      throw error;
    }
  },

  sendMessage: async (chatId: string, content: string, file?: File) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('type', file ? 'FILE' : 'TEXT');
      if (file) {
        formData.append('file', file);
      }

      await messageApi.send(chatId, formData);
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to send message',
      });
    }
  },

  loadMessages: async (chatId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await messageApi.getMessages(chatId);
      set({ messages: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to load messages',
        isLoading: false,
      });
    }
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateMessage: (messageId: string, content: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content, isEdited: true } : msg
      ),
    }));
  },

  deleteMessage: (messageId: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, isDeleted: true, content: 'Message deleted' } : msg
      ),
    }));
  },
}));
