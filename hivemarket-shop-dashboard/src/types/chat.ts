export interface Conversation {
  conversationId: string;
  buyerId: string;
  sellerId: string;
  profile_picture: string;
  lastMessage: string;
  lastMessageTime: string;
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
}

export interface MessageResponse {
  conversationId: string;
  senderId: string;
  receiverId: string;
  
  message: string;
  fileUrl?: string;
  messageTime: string;
  isReceived: boolean;
  isRead: boolean;
}

export interface FileEvent {
  url: string;
  type: 'image' | 'document';
}

export interface ChatStore {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  error: string | null;
  activeConversationId: string | null;

  fetchConversations: (userId: string) => Promise<void>;
  fetchMessages: (buyerId: string, sellerId: string) => Promise<void>;
  createConversation: (
    buyerId: string,
    sellerId: string,
    message?: string
  ) => Promise<void>;

  clearChat: () => void;
}