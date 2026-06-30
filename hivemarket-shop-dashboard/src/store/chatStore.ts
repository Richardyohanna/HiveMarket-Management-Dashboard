import { create } from "zustand";
import {
  createConversationApi,
  getConversationsApi,
  getMessagesApi,
} from "../api/chatApi";
import { ChatStore } from "../types/chat";



export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  messages: [],
  loading: false,
  error: null,
  activeConversationId: null,

  setActiveConversation: (id: string) =>
    set({ activeConversationId: id }),

fetchConversations: async (userId: string) => {
  try {
    set({ loading: true, error: null });

    const data = await getConversationsApi(userId);

    console.log("Response from fetchConversations:", data);

    // Store raw — let the component's toContact() handle mapping
    set({
      conversations: data,
      loading: false,
    });
  } catch (err) {
    set({
      loading: false,
      error: err instanceof Error ? err.message : "Failed to load chats",
    });
  }
},

  fetchMessages: async (buyerId: string, sellerId: string) => {
    try {
      set({ loading: true, error: null });

      const data = await getMessagesApi(buyerId, sellerId);

      console.log("Response from fetchMessages:", data);

      set({
        messages: data,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load messages",
      });
    }
  },

  createConversation: async (buyerId, sellerId, message) => {
    try {
      set({ error: null });

      await createConversationApi({
        buyerId,
        sellerId,
        message,
      });
      console.log("Conversation created successfully");
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to create conversation",
      });
    }
  },

  clearChat: () =>
    set({
      conversations: [],
      messages: [],
      error: null,
      activeConversationId: null,
    }),
}));