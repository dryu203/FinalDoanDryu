import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthUser, AuthUser } from '../../src/services/auth';
import {
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  ChatMessageDto,
} from '../../src/services/chat';
import { colors, theme } from '../../src/theme';
import dayjs from 'dayjs';

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadUser();
    loadMessages();

    // Subscribe to real-time messages
    const unsubscribe = subscribeToMessages('global', (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m._id === newMessage._id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadUser = async () => {
    const currentUser = await getAuthUser();
    setUser(currentUser);
  };

  const loadMessages = async () => {
    try {
      const data = await fetchMessages('global', 100);
      setMessages(data);
      
      // Scroll to bottom after loading
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await sendMessage('global', text);
      // Message will be added via socket subscription
    } catch (error: any) {
      console.error('Send message error:', error);
      // Restore text on error
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessageDto }) => {
    const isOwn = item.userId === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwn && item.userName && (
          <Text style={styles.userName}>{item.userName}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text style={isOwn ? styles.ownText : styles.otherText}>
            {item.content}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {dayjs(item.createdAt).format('HH:mm')}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brandOrange} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending || !inputText.trim()}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  messagesList: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  ownBubble: {
    backgroundColor: colors.brandOrange,
    ...theme.shadows.sm,
  },
  otherBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ownText: {
    color: colors.textInverse,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 20,
  },
  otherText: {
    color: colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
    marginHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    maxHeight: 100,
    marginRight: theme.spacing.sm,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandOrange,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

