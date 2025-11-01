import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Chat } from '@types/index';
import { COLORS } from '@utils/config';
import { formatDistanceToNow } from 'date-fns';

interface ChatListItemProps {
  chat: Chat;
  onPress: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onPress }) => {
  const lastMessageTime = chat.lastMessage?.createdAt
    ? formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })
    : '';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        {chat.avatar ? (
          <Image source={{ uri: chat.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Icon
              name={chat.type === 'GROUP' ? 'people' : 'person'}
              size={28}
              color={COLORS.gray}
            />
          </View>
        )}
        {chat.isSecret && (
          <View style={styles.secretBadge}>
            <Icon name="lock-closed" size={12} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {chat.name || 'Chat'}
          </Text>
          {lastMessageTime && (
            <Text style={styles.time}>{lastMessageTime}</Text>
          )}
        </View>

        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {chat.lastMessage?.content || 'No messages yet'}
          </Text>
          {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f7f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secretBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 13,
    color: COLORS.gray,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 15,
    color: COLORS.gray,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatListItem;
