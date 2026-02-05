import { create } from 'zustand';
import { Chat, Message } from '../types';
import { chatApi, messageApi } from '../services/api';

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  loadChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  createChat: (type: string, memberIds: string[], name?: string, description?: string) => Promise<Chat>;
  sendMessage: (chatId: string, content: string, file?: File, messageType?: string, expiresIn?: number) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, contentOrMessage: string | Message) => void;
  deleteMessage: (messageId: string) => void;
  markMessageAsRead: (messageId: string, userId: string) => void;
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
    set({ isLoading: true, error: null, messages: [] }); // Очищаем сообщения при смене чата
    try {
      const response = await chatApi.getById(chatId);
      const chat = response.data;
      set({ currentChat: chat, isLoading: false });
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

  sendMessage: async (chatId: string, content: string, file?: File, messageType?: string, expiresIn?: number) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      // Определяем тип сообщения
      let type = messageType || 'TEXT';
      if (file && !messageType) {
        // Автоматическое определение типа на основе MIME типа файла
        if (file.type.startsWith('image/')) {
          type = 'IMAGE';
        } else if (file.type.startsWith('video/')) {
          type = 'VIDEO';
        } else if (file.type.startsWith('audio/')) {
          type = 'AUDIO';
        } else {
          type = 'FILE';
        }
      }
      
      formData.append('type', type);
      if (file) {
        formData.append('file', file);
      }
      if (expiresIn) {
        formData.append('expiresIn', expiresIn.toString());
      }

      const response = await messageApi.send(chatId, formData);
      
      // Добавляем сообщение сразу в локальный state (оптимистичное обновление)
      if (response.data) {
        const newMessage = response.data;
        set((state) => {
          // Добавляем сообщение если это для текущего чата или если currentChat не установлен, но chatId совпадает
          const isCurrentChat = state.currentChat?.id === chatId || (!state.currentChat && chatId);
          
          if (isCurrentChat) {
            // Проверяем, нет ли уже такого сообщения (избегаем дубликатов)
            const messageExists = state.messages.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              // Обновляем существующее сообщение
              return {
                messages: state.messages.map(msg => 
                  msg.id === newMessage.id ? newMessage : msg
                ),
              };
            }
            return {
              messages: [...state.messages, newMessage],
            };
          }
          return state;
        });
      }
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
    set((state) => {
      // Добавляем сообщение если оно для текущего чата или если currentChat не установлен
      const isCurrentChat = state.currentChat?.id === message.chatId || (!state.currentChat);
      
      if (isCurrentChat) {
        // Проверяем, нет ли уже такого сообщения (избегаем дубликатов)
        const messageExists = state.messages.some(msg => msg.id === message.id);
        if (messageExists) {
          // Обновляем существующее сообщение вместо игнорирования
          return {
            messages: state.messages.map(msg => 
              msg.id === message.id ? message : msg
            ),
          };
        }
        return {
          messages: [...state.messages, message],
        };
      }
      return state;
    });
  },

  updateMessage: (messageId: string, contentOrMessage: string | Message) => {
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === messageId) {
          // If it's a full message object, merge it
          if (typeof contentOrMessage === 'object') {
            return { ...msg, ...contentOrMessage };
          }
          // Otherwise, just update content
          return { ...msg, content: contentOrMessage, isEdited: true };
        }
        return msg;
      }),
    }));
  },

  deleteMessage: (messageId: string) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    }));
  },

  markMessageAsRead: (messageId: string, userId: string) => {
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === messageId) {
          const readBy = msg.readBy || [];
          if (!readBy.includes(userId)) {
            return {
              ...msg,
              isRead: true,
              readBy: [...readBy, userId],
            };
          }
        }
        return msg;
      }),
    }));
  },
}));
