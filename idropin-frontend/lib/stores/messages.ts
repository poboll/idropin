import { create } from 'zustand';
import { Message, getMessages, getUnreadCount, markAsRead, markAllAsRead, deleteMessage } from '../api/messages';

interface MessageState {
  messages: Message[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  currentPage: number;
  showUnreadOnly: boolean;
  
  // Actions
  fetchMessages: (reset?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  markAllMessagesAsRead: () => Promise<void>;
  removeMessage: (messageId: string) => Promise<void>;
  setShowUnreadOnly: (value: boolean) => void;
  loadMore: () => Promise<void>;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  unreadCount: 0,
  loading: false,
  hasMore: true,
  currentPage: 1,
  showUnreadOnly: false,

  fetchMessages: async (reset = false) => {
    const { showUnreadOnly, currentPage } = get();
    const page = reset ? 1 : currentPage;
    
    set({ loading: true });
    try {
      const result = await getMessages({
        unreadOnly: showUnreadOnly || undefined,
        page,
        size: 20,
      });
      
      set(state => ({
        messages: reset ? result.records : [...state.messages, ...result.records],
        hasMore: result.current < result.pages,
        currentPage: page,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markMessageAsRead: async (messageId: string) => {
    try {
      await markAsRead(messageId);
      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  },

  markAllMessagesAsRead: async () => {
    try {
      await markAllAsRead();
      set(state => ({
        messages: state.messages.map(msg => ({ ...msg, isRead: true, readAt: new Date().toISOString() })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  },

  removeMessage: async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      set(state => {
        const message = state.messages.find(m => m.id === messageId);
        return {
          messages: state.messages.filter(msg => msg.id !== messageId),
          unreadCount: message && !message.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  },

  setShowUnreadOnly: (value: boolean) => {
    set({ showUnreadOnly: value, currentPage: 1, messages: [], hasMore: true });
    get().fetchMessages(true);
  },

  loadMore: async () => {
    const { hasMore, loading, currentPage } = get();
    if (!hasMore || loading) return;
    
    set({ currentPage: currentPage + 1 });
    await get().fetchMessages();
  },
}));
