import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useChatStore } from '@store/chatStore';
import { useAuthStore } from '@store/authStore';
import { Message } from '@types/index';
import { COLORS } from '@utils/config';
import socketService from '@services/socket';
import MessageBubble from '@components/MessageBubble';

const ChatScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { chatId } = route.params;
  const { currentChat, messages, loadMessages, sendMessage, isLoading, addMessage } = useChatStore();
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages(chatId);

    const handleNewMessage = (message: Message) => {
      if (message.chatId === chatId) {
        addMessage(message);
      }
    };

    socketService.onMessageNew(handleNewMessage);

    return () => {
      socketService.offMessageNew(handleNewMessage);
    };
  }, [chatId]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendMessage(chatId, messageText);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} isOwn={item.senderId === user?.id} />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{currentChat?.name || 'Chat'}</Text>
          <Text style={styles.headerSubtitle}>Online</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="ellipsis-vertical" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {isLoading && messages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Icon name="add-circle-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={COLORS.gray}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={4000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          <Icon
            name={isSending ? 'hourglass-outline' : 'send'}
            size={24}
            color={!inputText.trim() || isSending ? COLORS.gray : COLORS.primary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  moreButton: {
    padding: 8,
  },
  messagesList: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f7f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen;
