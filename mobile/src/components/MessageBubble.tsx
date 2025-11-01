import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Message } from '@types/index';
import { COLORS } from '@utils/config';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const time = format(new Date(message.createdAt), 'HH:mm');

  const renderMessageContent = () => {
    switch (message.type) {
      case 'IMAGE':
        return (
          <View>
            {message.fileUrl && (
              <Image source={{ uri: message.fileUrl }} style={styles.image} />
            )}
            {message.content && <Text style={styles.imageCaption}>{message.content}</Text>}
          </View>
        );

      case 'FILE':
        return (
          <View style={styles.fileContainer}>
            <Icon name="document-outline" size={32} color={COLORS.primary} />
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {message.fileName || 'File'}
              </Text>
              {message.fileSize && (
                <Text style={styles.fileSize}>
                  {(message.fileSize / 1024).toFixed(2)} KB
                </Text>
              )}
            </View>
          </View>
        );

      case 'VOICE':
        return (
          <View style={styles.voiceContainer}>
            <TouchableOpacity style={styles.playButton}>
              <Icon name="play" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.voiceWaveform}>
              <Text style={styles.voiceDuration}>0:00</Text>
            </View>
          </View>
        );

      default:
        return <Text style={styles.messageText}>{message.content}</Text>;
    }
  };

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {message.replyTo && (
          <View style={styles.replyContainer}>
            <View style={styles.replyLine} />
            <View>
              <Text style={styles.replyAuthor}>
                {message.replyTo.sender?.displayName || 'User'}
              </Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {message.replyTo.content}
              </Text>
            </View>
          </View>
        )}

        {renderMessageContent()}

        <View style={styles.footer}>
          <Text style={[styles.time, isOwn && styles.ownTime]}>{time}</Text>
          {isOwn && (
            <Icon
              name="checkmark-done"
              size={16}
              color={message.isDeleted ? COLORS.gray : COLORS.primary}
            />
          )}
          {message.isEdited && (
            <Text style={[styles.edited, isOwn && styles.ownTime]}>edited</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#f7f9fa',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.text,
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  replyLine: {
    width: 3,
    backgroundColor: COLORS.primary,
    marginRight: 8,
    borderRadius: 2,
  },
  replyAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  imageCaption: {
    fontSize: 15,
    color: COLORS.text,
    marginTop: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 13,
    color: COLORS.gray,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceWaveform: {
    flex: 1,
    marginLeft: 12,
  },
  voiceDuration: {
    fontSize: 14,
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    color: COLORS.gray,
    marginRight: 4,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  edited: {
    fontSize: 11,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginLeft: 4,
  },
});

export default MessageBubble;
