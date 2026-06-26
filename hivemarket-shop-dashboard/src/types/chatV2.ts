/**
 * Enhanced Chat Types for Production-Scale Messaging
 * Supports: Normalization, Pagination, Caching, Deduplication
 */

// ─── Base Domain Types ─────────────────────────────────────────────────────
export interface Conversation {
  conversationId: string;
  buyerId: string;
  sellerId: string;
  profile_picture: string;
  lastMessage: string;
  lastMessageTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  conversationId: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageTime: string;
  isReceived: boolean;
  isRead: boolean;
  fileUrl?: string | null;
  // Unique identifier for deduplication
  messageId?: string; // Generated as: conversationId_messageTime_senderId
}

// ─── UI Types ─────────────────────────────────────────────────────────────
export interface UIConversation extends Conversation {
  otherUserId: string;
  otherUserName: string;
  unreadCount: number;
  isActive: boolean;
}

export interface UIMessage {
  id: string; // Unique dedup key
  text: string;
  sent: boolean;
  time: string; // Formatted for display
  timestamp: number; // Unix timestamp for sorting
  fileUrl?: string | null;
  fileType?: 'image' | 'document' | null;
  uploading?: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read'; // Message status
}

// ─── Pagination & Caching ──────────────────────────────────────────────────
export interface PaginationCursor {
  conversationId: string;
  cursor: string | null; // Backend cursor token
  hasMore: boolean;
  totalCount: number;
  isLoading: boolean;
  timestamp: number; // When last fetched
}

export interface MessageCache {
  conversationId: string;
  messages: Record<string, Message>; // Keyed by messageId
  messageIds: string[]; // Ordered list of message IDs
  oldestMessageTime: string | null;
  newestMessageTime: string | null;
  cursor: PaginationCursor;
  isFetching: boolean;
  error: string | null;
}

// ─── Store State ──────────────────────────────────────────────────────────
export interface NormalizedChatState {
  // Normalized by ID for O(1) lookups
  conversationsById: Record<string, Conversation>;
  conversationIds: string[]; // Ordered by lastMessageTime (desc)

  // Grouped by conversationId for isolation
  messagesByConversationId: Record<string, Message[]>;
  messageMetadata: Record<string, MessageCache>; // Metadata per conversation

  // Global state
  activeConversationId: string | null;
  loading: boolean;
  error: string | null;
  wsConnected: boolean;

  // Deduplication tracking (temporary, TTL 10 mins)
  processedMessageIds: Set<string>;
  lastProcessedTime: number;
}

export interface ConversationPreview {
  id: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
  online?: boolean;
  isActive: boolean;
}

// ─── Pagination Request/Response ──────────────────────────────────────────
export interface FetchMessagesRequest {
  conversationId: string;
  buyerId: string;
  sellerId: string;
  limit?: number; // Default: 25
  cursor?: string | null; // Pagination cursor
  direction?: 'newer' | 'older'; // Direction to fetch
}

export interface FetchMessagesResponse {
  messages: Message[];
  cursor: string | null; // For next fetch
  hasMore: boolean;
  totalCount: number;
}

// ─── WebSocket Event Types ────────────────────────────────────────────────
export interface WebSocketMessage {
  type: 'message' | 'file' | 'typing' | 'read-receipt' | 'connection-status';
  data: any;
  timestamp: number;
}

export interface IncomingMessage extends Message {
  // Server may add these
  deliveredAt?: string;
  readAt?: string;
}

export interface ReadReceipt {
  conversationId: string;
  messageTime: string;
  senderId: string;
  receiverId: string;
}

// ─── Store Actions Return Types ──────────────────────────────────────────
export interface StoreActions {
  // Conversations
  fetchConversations: (userId: string) => Promise<void>;
  setActiveConversation: (conversationId: string) => Promise<void>;
  createConversation: (buyerId: string, sellerId: string, message?: string) => Promise<void>;
  updateConversationPreview: (
    conversationId: string,
    updates: Partial<{ lastMessage: string; lastMessageTime: string; unreadCount: number }>
  ) => void;

  // Messages
  fetchMessages: (req: FetchMessagesRequest) => Promise<void>;
  addMessage: (message: Message, isOptimistic?: boolean) => void;
  addWebSocketMessage: (message: IncomingMessage) => void;
  markMessagesAsRead: (conversationId: string, upToTime: string) => Promise<void>;

  // Pagination
  loadOlderMessages: (conversationId: string) => Promise<void>;
  loadNewerMessages: (conversationId: string) => Promise<void>;

  // WebSocket
  setWebSocketConnected: (connected: boolean) => void;
  handleWebSocketMessage: (wsMessage: WebSocketMessage) => void;

  // Cache Management
  clearConversationCache: (conversationId: string) => void;
  clearAllCaches: () => void;
  cleanupOldMessages: (maxAge?: number) => void;

  // State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export type ChatStore = NormalizedChatState & StoreActions;

// ─── Selector Types (Memoized) ────────────────────────────────────────────
export interface ChatSelectors {
  selectConversationList: (state: NormalizedChatState, userId: string) => ConversationPreview[];
  selectActiveConversation: (state: NormalizedChatState) => Conversation | undefined;
  selectActiveConversationMessages: (state: NormalizedChatState) => Message[];
  selectConversationMessages: (state: NormalizedChatState, conversationId: string) => Message[];
  selectUnreadCount: (state: NormalizedChatState) => number;
  selectPaginationState: (state: NormalizedChatState, conversationId: string) => PaginationCursor | null;
  selectIsLoading: (state: NormalizedChatState) => boolean;
  selectWebSocketStatus: (state: NormalizedChatState) => boolean;
}

// ─── Hook Return Types ────────────────────────────────────────────────────
export interface UseChatMessagesReturn {
  messages: UIMessage[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadOlder: () => Promise<void>;
  loadNewer: () => Promise<void>;
  isLoadingOlder: boolean;
  isLoadingNewer: boolean;
}

export interface UseChatConversationsReturn {
  conversations: ConversationPreview[];
  activeConversation: ConversationPreview | undefined;
  loading: boolean;
  error: string | null;
  unreadCount: number;
  setActive: (conversationId: string) => Promise<void>;
}

// ─── File Event Types ────────────────────────────────────────────────────
export interface FileEvent {
  url: string;
  type: 'image' | 'document';
  conversationId?: string;
}

export interface FileChunkPayload {
  buyerId: string;
  sellerId: string;
  fileName: string;
  fileType: string;
  chunkIndex: number;
  totalChunks: number;
  chunkData: string;
}

// ─── Constants ────────────────────────────────────────────────────────────
export const CHAT_CONFIG = {
  MESSAGES_PAGE_SIZE: 25,
  MESSAGE_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  MEMORY_LIMIT_PER_CONVERSATION: 500, // Max messages in memory
  DEDUP_TRACKING_TTL: 10 * 60 * 1000, // 10 minutes
  WS_RECONNECT_DELAY: 5000,
  WS_HEARTBEAT_INTERVAL: 30000,
  INACTIVITY_CLEANUP_TIME: 60 * 60 * 1000, // 1 hour
};
