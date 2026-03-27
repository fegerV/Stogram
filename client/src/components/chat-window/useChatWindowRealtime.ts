import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useChatStore } from '../../store/chatStore';
import { socketService } from '../../services/socket';
import { Call, CallType, Chat, Message } from '../../types';

type TypingUsersMap = Map<string, { username: string; displayName?: string }>;

interface UseChatWindowRealtimeParams {
  chatId: string;
  currentChat: Chat | null;
  userId?: string;
  messages: Message[];
  markMessageAsRead: (messageId: string, userId: string) => void;
  deleteMessageFromStore: (messageId: string) => void;
}

export function useChatWindowRealtime({
  chatId,
  currentChat,
  userId,
  messages,
  markMessageAsRead,
  deleteMessageFromStore,
}: UseChatWindowRealtimeParams) {
  const [typingUsers, setTypingUsers] = useState<TypingUsersMap>(new Map());
  const [showCallModal, setShowCallModal] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callType, setCallType] = useState<'AUDIO' | 'VIDEO'>('AUDIO');
  const [isInitiator, setIsInitiator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (message.chatId !== chatId) {
        return;
      }

      useChatStore.getState().addMessage(message);
    };

    const handleMessageRead = ({ messageId, userId: readerId }: { messageId: string; userId: string }) => {
      markMessageAsRead(messageId, readerId);
    };

    const handleMessageExpired = ({ messageIds }: { messageIds: string[] }) => {
      messageIds.forEach((messageId) => {
        deleteMessageFromStore(messageId);
      });
    };

    socketService.on('message:new', handleNewMessage);
    socketService.on('message:read', handleMessageRead);
    socketService.on('message:expired', handleMessageExpired);

    return () => {
      socketService.off('message:new', handleNewMessage);
      socketService.off('message:read', handleMessageRead);
      socketService.off('message:expired', handleMessageExpired);
    };
  }, [chatId, deleteMessageFromStore, markMessageAsRead]);

  useEffect(() => {
    const handleIncomingCall = (call: Call) => {
      if (call.chatId !== chatId || activeCallId) {
        return;
      }

      if (call.initiatorId === userId) {
        setActiveCallId(call.id);
        setCallType(call.type as CallType);
        setIsInitiator(true);
        setShowCallModal(true);
        return;
      }

      setIncomingCall(call);
    };

    const handleCallInitiated = ({ callId, call }: { callId: string; call: Call }) => {
      if (call.chatId !== chatId || activeCallId) {
        return;
      }

      setActiveCallId(callId);
      setCallType(call.type as CallType);
      setIsInitiator(true);
      setShowCallModal(true);
    };

    const handleCallAnswered = ({ callId, userId: answeredUserId }: { callId: string; userId: string }) => {
      if (incomingCall?.id === callId) {
        setIncomingCall(null);
        setActiveCallId(callId);
        setShowCallModal(true);
        setIsInitiator(false);
        return;
      }

      if (answeredUserId !== userId && !activeCallId) {
        setActiveCallId(callId);
        setShowCallModal(true);
        setIsInitiator(true);
      }
    };

    const handleCallRejected = ({ callId }: { callId: string }) => {
      if (incomingCall?.id === callId) {
        setIncomingCall(null);
      }

      if (activeCallId === callId) {
        setShowCallModal(false);
        setActiveCallId(null);
      }
    };

    const handleCallEnded = ({ callId }: { callId: string }) => {
      if (activeCallId === callId) {
        setShowCallModal(false);
        setActiveCallId(null);
      }

      setIncomingCall(null);
    };

    const handleCallMissed = ({ callId }: { callId: string }) => {
      if (activeCallId !== callId && incomingCall?.id !== callId) {
        return;
      }

      setShowCallModal(false);
      setActiveCallId(null);
      setIncomingCall(null);
      toast('Call was missed');
    };

    socketService.on('call:incoming', handleIncomingCall);
    socketService.on('call:initiated', handleCallInitiated);
    socketService.on('call:answered', handleCallAnswered);
    socketService.on('call:rejected', handleCallRejected);
    socketService.on('call:ended', handleCallEnded);
    socketService.on('call:missed', handleCallMissed);

    return () => {
      socketService.off('call:incoming', handleIncomingCall);
      socketService.off('call:initiated', handleCallInitiated);
      socketService.off('call:answered', handleCallAnswered);
      socketService.off('call:rejected', handleCallRejected);
      socketService.off('call:ended', handleCallEnded);
      socketService.off('call:missed', handleCallMissed);
    };
  }, [activeCallId, chatId, incomingCall, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleUserTyping = ({
      userId: typingUserId,
      chatId: eventChatId,
      isTyping,
    }: {
      userId: string;
      chatId: string;
      isTyping: boolean;
    }) => {
      if (eventChatId !== chatId || typingUserId === userId) {
        return;
      }

      setTypingUsers((prev) => {
        const next = new Map(prev);

        if (isTyping) {
          const chatMember = currentChat?.members?.find((member) => member.userId === typingUserId);
          if (chatMember?.user) {
            next.set(typingUserId, {
              username: chatMember.user.username,
              displayName: chatMember.user.displayName || undefined,
            });
          }
        } else {
          next.delete(typingUserId);
        }

        return next;
      });
    };

    const handlePinUpdated = ({ chat: updatedChat }: { chat: Chat }) => {
      if (updatedChat.id !== chatId) {
        return;
      }

      useChatStore.setState((state) => ({
        currentChat: state.currentChat
          ? {
              ...state.currentChat,
              pinnedMessageId: updatedChat.pinnedMessageId,
              pinnedMessage: updatedChat.pinnedMessage,
            }
          : null,
      }));
    };

    socketService.on('user:typing', handleUserTyping);
    socketService.on('chat:pin-updated', handlePinUpdated);

    return () => {
      socketService.off('user:typing', handleUserTyping);
      socketService.off('chat:pin-updated', handlePinUpdated);
      setTypingUsers(new Map());
    };
  }, [chatId, currentChat, userId]);

  const handleAnswerCall = () => {
    if (!incomingCall) {
      return;
    }

    setActiveCallId(incomingCall.id);
    setCallType(incomingCall.type as CallType);
    setIsInitiator(false);
    setShowCallModal(true);
  };

  const handleRejectCall = () => {
    setIncomingCall(null);
  };

  return {
    typingUsers,
    showCallModal,
    setShowCallModal,
    incomingCall,
    activeCallId,
    setActiveCallId,
    callType,
    setCallType,
    isInitiator,
    setIsInitiator,
    messagesEndRef,
    handleAnswerCall,
    handleRejectCall,
  };
}
