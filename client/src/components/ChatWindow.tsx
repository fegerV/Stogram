import { lazy, Suspense } from 'react';
import toast from 'react-hot-toast';
import { messageApi } from '../services/api';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { ChatType, Message, NotificationLevel } from '../types';
import { getChatAvatar, getChatName, getInitials } from '../utils/helpers';
import PinnedMessageBanner from './PinnedMessageBanner';
import { useConfirm } from './confirm/ConfirmDialogProvider';
import { ChatWindowHeader } from './chat-window/ChatWindowHeader';
import { MessageComposer } from './chat-window/MessageComposer';
import { MessageContextMenu } from './chat-window/MessageContextMenu';
import { MessageListViewport } from './chat-window/MessageListViewport';
import { useChatComposer } from './chat-window/useChatComposer';
import { useChatWindowData } from './chat-window/useChatWindowData';
import { useChatWindowRealtime } from './chat-window/useChatWindowRealtime';
import { useChatWindowUiState } from './chat-window/useChatWindowUiState';

const CallModal = lazy(() => import('./CallModal'));
const IncomingCallModal = lazy(() => import('./IncomingCallModal'));
const ForwardMessageModal = lazy(() => import('./ForwardMessageModal'));
const MessageSearch = lazy(() => import('./MessageSearch'));
const VoiceRecorder = lazy(() => import('./VoiceRecorder'));
const ChatSettingsDrawer = lazy(() => import('./ChatSettingsDrawer'));
const ChatProfileDrawer = lazy(() => import('./ChatProfileDrawer'));

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void;
}

export default function ChatWindow({ chatId, onBack }: ChatWindowProps) {
  const confirm = useConfirm();
  const {
    currentChat,
    messages,
    selectChat,
    sendMessage,
    markMessageAsRead,
    deleteMessage: deleteMessageFromStore,
  } = useChatStore();
  const { user } = useAuthStore();

  const {
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
  } = useChatWindowRealtime({
    chatId,
    currentChat,
    userId: user?.id,
    messages,
    markMessageAsRead,
    deleteMessageFromStore,
  });

  const {
    chatSettings,
    folders,
    isAdmin,
    handlePinMessage,
    handleUnpinMessage,
    handleUpdateNotificationLevel,
    handleUpdateFolder,
  } = useChatWindowData({
    chatId,
    currentChat,
    userId: user?.id,
    selectChat,
  });

  const handleStartCall = (type: 'AUDIO' | 'VIDEO') => {
    if (currentChat?.type !== ChatType.PRIVATE) {
      toast.error('Звонки сейчас доступны только в личных чатах');
      return;
    }

    setCallType(type);
    setIsInitiator(true);
    socketService.initiateCall(chatId, type);
  };

  const {
    messageInput,
    showVoiceRecorder,
    selfDestructSeconds,
    showSelfDestructOptions,
    selfDestructButtonRef,
    fileInputRef,
    setShowVoiceRecorder,
    setSelfDestructSeconds,
    setShowSelfDestructOptions,
    setMessageInput,
    handleTyping,
    handleSendMessage,
    handleEmojiSelect,
    handleFileSelect,
    handleFileButtonClick,
    handleVoiceSend,
  } = useChatComposer({
    chatId,
    currentChat,
    sendMessage,
    onStartCall: handleStartCall,
  });

  const {
    showForwardModal,
    setShowForwardModal,
    forwardMessageId,
    setForwardMessageId,
    showSearch,
    setShowSearch,
    contextMenu,
    setContextMenu,
    showChatSettings,
    setShowChatSettings,
    showChatProfile,
    setShowChatProfile,
    handleMessageContextMenu,
    handleForwardMessage,
    handleSearchSelect,
  } = useChatWindowUiState({
    chatId,
  });

  const handleCopyMessage = async (message: Message) => {
    if (message.content) {
      await navigator.clipboard.writeText(message.content);
    }
    setContextMenu(null);
  };

  const handleEditMessage = (message: Message) => {
    setMessageInput(message.content || '');
    setContextMenu(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    const shouldDelete = await confirm({
      title: 'Удалить сообщение',
      message: 'Сообщение будет удалено из чата.',
      confirmText: 'Удалить',
      tone: 'danger',
    });

    if (!shouldDelete) {
      return;
    }

    try {
      await messageApi.delete(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }

    setContextMenu(null);
  };

  if (!currentChat) {
    return (
      <div className="telegram-wallpaper flex h-full items-center justify-center">
        <div className="panel-soft flex h-16 w-16 items-center justify-center rounded-[22px]">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/10 border-t-[#4ba3ff]" />
        </div>
      </div>
    );
  }

  const chatName = getChatName(currentChat, user?.id || '');
  const chatAvatar = getChatAvatar(currentChat, user?.id || '') || null;
  const canStartCall = currentChat.type === ChatType.PRIVATE;
  const chatSubtitle =
    currentChat.type === ChatType.PRIVATE
      ? 'личный чат'
      : currentChat.type === ChatType.GROUP
        ? `${currentChat.members.length} участников`
        : 'канал';

  return (
    <div className="flex h-full bg-transparent">
      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(11,20,31,0.76),rgba(10,17,28,0.92))]">
        <ChatWindowHeader
          chatName={chatName}
          chatAvatar={chatAvatar}
          chatSubtitle={chatSubtitle}
          canStartCall={canStartCall}
          hasPinnedMessage={Boolean(currentChat.pinnedMessageId)}
          onBack={onBack}
          onOpenProfile={() => setShowChatProfile(true)}
          onUnpinMessage={handleUnpinMessage}
          onOpenSearch={() => setShowSearch(true)}
          onStartAudioCall={() => handleStartCall('AUDIO')}
          onStartVideoCall={() => handleStartCall('VIDEO')}
          onOpenSettings={() => setShowChatSettings(true)}
          getInitials={getInitials}
        />

        {currentChat.pinnedMessage && (
          <PinnedMessageBanner
            message={currentChat.pinnedMessage}
            onUnpin={isAdmin ? handleUnpinMessage : undefined}
          />
        )}

        <MessageListViewport
          messages={messages}
          currentUserId={user?.id}
          currentChatType={currentChat.type}
          typingUsers={typingUsers}
          messagesEndRef={messagesEndRef}
          onMessageContextMenu={handleMessageContextMenu}
          onExpireMessage={deleteMessageFromStore}
        />

        <MessageComposer
          messageInput={messageInput}
          selfDestructSeconds={selfDestructSeconds}
          showSelfDestructOptions={showSelfDestructOptions}
          selfDestructButtonRef={selfDestructButtonRef}
          fileInputRef={fileInputRef}
          onSubmit={handleSendMessage}
          onTyping={handleTyping}
          onEmojiSelect={handleEmojiSelect}
          onVoiceRecorderOpen={() => setShowVoiceRecorder(true)}
          onFileButtonClick={handleFileButtonClick}
          onFileSelect={handleFileSelect}
          onToggleSelfDestructOptions={() => setShowSelfDestructOptions(!showSelfDestructOptions)}
          onSelfDestructSelect={(seconds) => {
            setSelfDestructSeconds(seconds);
            setShowSelfDestructOptions(false);
          }}
          onCloseSelfDestructOptions={() => setShowSelfDestructOptions(false)}
        />
      </div>

      {contextMenu && (
        <MessageContextMenu
          contextMenu={contextMenu}
          message={messages.find((message) => message.id === contextMenu.messageId)}
          isAdmin={isAdmin}
          currentUserId={user?.id}
          onClose={() => setContextMenu(null)}
          onCopyMessage={handleCopyMessage}
          onForwardMessage={handleForwardMessage}
          onPinMessage={handlePinMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      )}

      <Suspense fallback={null}>
        {showChatProfile && (
          <div className="hidden lg:block lg:w-[380px] lg:shrink-0">
            <ChatProfileDrawer
              chat={currentChat}
              currentUserId={user?.id || ''}
              variant="docked"
              onClose={() => setShowChatProfile(false)}
              onStartCall={(type) => {
                setShowChatProfile(false);
                handleStartCall(type);
              }}
            />
          </div>
        )}

        {incomingCall && (
          <IncomingCallModal
            call={incomingCall}
            onAnswer={handleAnswerCall}
            onReject={handleRejectCall}
          />
        )}

        {showCallModal && activeCallId && (
          <CallModal
            callId={activeCallId}
            chatId={chatId}
            callType={callType}
            isInitiator={isInitiator}
            onClose={() => {
              setShowCallModal(false);
              setActiveCallId(null);
            }}
          />
        )}

        {showForwardModal && forwardMessageId && (
          <ForwardMessageModal
            messageId={forwardMessageId}
            onClose={() => {
              setShowForwardModal(false);
              setForwardMessageId(null);
            }}
          />
        )}

        {showSearch && (
          <MessageSearch
            chatId={chatId}
            onSelectMessage={handleSearchSelect}
            onClose={() => setShowSearch(false)}
          />
        )}

        {showVoiceRecorder && (
          <div className="px-4 py-2">
            <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setShowVoiceRecorder(false)} />
          </div>
        )}

        {showChatSettings && (
          <ChatSettingsDrawer
            chatId={chatId}
            chatName={chatName}
            notificationLevel={chatSettings?.notificationLevel ?? NotificationLevel.ALL}
            isMuted={chatSettings?.isMuted || false}
            folders={folders}
            selectedFolderId={chatSettings?.folderId ?? null}
            onUpdateNotificationLevel={handleUpdateNotificationLevel}
            onUpdateFolder={handleUpdateFolder}
            onClose={() => setShowChatSettings(false)}
          />
        )}

        {showChatProfile && (
          <div className="lg:hidden">
            <ChatProfileDrawer
              chat={currentChat}
              currentUserId={user?.id || ''}
              variant="overlay"
              onClose={() => setShowChatProfile(false)}
              onStartCall={(type) => {
                setShowChatProfile(false);
                handleStartCall(type);
              }}
            />
          </div>
        )}
      </Suspense>
    </div>
  );
}
