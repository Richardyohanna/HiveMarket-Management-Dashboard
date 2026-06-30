import { Colors } from '../../components/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { shopStore } from "../../hivemarket-shop-dashboard/src/store/shopStore";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { chatSocketService } from '../../hivemarket-shop-dashboard/src/api/chatSocket'//src/api/chatSocket;
import { useChatStore } from '../../hivemarket-shop-dashboard/src/store/chatStore';
import { userStore } from '../../hivemarket-shop-dashboard/src/store/userStore';
import { Conversation, MessageResponse } from '../../hivemarket-shop-dashboard/src/types/chat';

const PRIMARY      = "#008100";
const PRIMARY_SOFT = "#e8f5e9";
const PRIMARY_DARK = "#1a3a1a";

// ─── UI contact shape ──────────────────────────────────────────────────────────
type ChatContact = {
  id:            string;
  buyerId:       string;
  sellerId:      string;
  fullName:      string;
  lastMessage:   string;
  timeSent:      string;
  timeSentLabel: string;
  online:        boolean;
  unread:        number;
  avatar?:       string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (iso: string): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const now    = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDay === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7)   return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const toContact = (
  c: Conversation & { otherUserName?: string; otherUserId?: string; unreadCount?: number },
  currentUserId: string,
  unreadMap: Record<string, number>
): ChatContact => ({
  id:            c.conversationId,
  buyerId:       c.buyerId,
  sellerId:      c.sellerId,
  fullName:      c.otherUserName ?? (c.buyerId === currentUserId ? "Seller" : "Buyer"),
  lastMessage:   c.lastMessage ?? "No messages yet",
  timeSent:      c.lastMessageTime ?? "",
  timeSentLabel: formatTime(c.lastMessageTime ?? ""),
  online:        false,
  unread:        c.unreadCount ?? unreadMap[c.conversationId] ?? 0,
  avatar:        c.profile_picture,
});

// ─── Initials avatar ───────────────────────────────────────────────────────────
const Avatar = ({
  name, size = 46, uri, isDark,
}: {
  name: string; size?: number; uri?: string; isDark: boolean;
}) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: isDark ? PRIMARY_DARK : PRIMARY_SOFT,
      alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: size * 0.34 }}>{initials}</Text>
    </View>
  );
};

// ─── Contact row ───────────────────────────────────────────────────────────────
const ContactRow = React.memo(({
  contact, isDark, theme, onPress,
}: {
  contact:  ChatContact;
  isDark:   boolean;
  theme:    typeof Colors.light;
  onPress:  () => void;
}) => {
  const hasUnread = contact.unread > 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.contactRow,
      pressed && { backgroundColor: isDark ? "#0a1f0a" : PRIMARY_SOFT },
    ]}>
      {/* Avatar */}
      <View style={styles.avatarStack}>
        <Avatar name={contact.fullName} uri={contact.avatar} isDark={isDark} />
        {contact.online && (
          <View style={[styles.onlineDot, { borderColor: theme.background }]} />
        )}
      </View>

      {/* Text content */}
      <View style={styles.contactContent}>
        <View style={styles.contactTop}>
          <Text style={[styles.contactName, { color: theme.text }]} numberOfLines={1}>
            {contact.fullName}
          </Text>
          <Text style={[
            styles.contactTime,
            { color: hasUnread ? PRIMARY : theme.readColor, fontWeight: hasUnread ? "600" : "400" },
          ]}>
            {contact.timeSentLabel}
          </Text>
        </View>

        <View style={styles.contactBottom}>
          <Text numberOfLines={1} style={[
            styles.contactMsg,
            { color: hasUnread ? theme.text : theme.readColor, fontWeight: hasUnread ? "500" : "400", flex: 1 },
          ]}>
            {contact.lastMessage}
          </Text>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{contact.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

// ─── Main ChatScreen ───────────────────────────────────────────────────────────
const MessagesScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const theme  = isDark ? Colors.dark : Colors.light;

  const shop = shopStore();

  const currentUserId = shop.id;


  const { conversations, loading, error, fetchConversations } = useChatStore();

  const [search,    setSearch]    = useState("");
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  const { sellerEmail, sellerName, sellerId } = useLocalSearchParams<{
    sellerEmail?: string;
    sellerName?:  string;
    sellerId?:    string;
  }>();

  // ── Load conversations + subscribe to live messages ────────────────────────
  useEffect(() => {
    if (!currentUserId) return;
    fetchConversations(currentUserId);

    const unsubscribe = chatSocketService.onMessage(
      (incoming: MessageResponse) => {
        setUnreadMap(prev => ({
          ...prev,
          [incoming.conversationId]: (prev[incoming.conversationId] ?? 0) + 1,
        }));
        // Re-fetch so the list re-sorts with the newest message on top
        fetchConversations(currentUserId);
      }
    ) as (() => void) | undefined;

    return () => { if (typeof unsubscribe === "function") unsubscribe(); };
  }, []);

  // ── Build sorted, unified contact list ────────────────────────────────────
  const allContacts: ChatContact[] = conversations
    .map(c => toContact(c, currentUserId, unreadMap))
    .sort((a: any, b: any) => new Date(b.timeSent).getTime() - new Date(a.timeSent).getTime());

  // Prepend a transient "seller" contact if arriving from a product listing
  const sellerContact: ChatContact | null = sellerName
    ? {
        id:            sellerEmail ?? "seller",
        buyerId:       currentUserId,
        sellerId:      sellerId ?? "seller",
        fullName:      sellerName,
        lastMessage:   "Start a conversation…",
        timeSent:      new Date().toISOString(),
        timeSentLabel: "Now",
        online:        true,
        unread:        0,
      }
    : null;

  const displayContacts = sellerContact
    ? [sellerContact, ...allContacts.filter(c => c.id !== sellerContact.id)]
    : allContacts;

  const filtered = displayContacts.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = allContacts.reduce((sum, c) => sum + c.unread, 0);

  // ── Open a conversation ────────────────────────────────────────────────────
  const openChat = (contact: ChatContact) => {
    setUnreadMap(prev => ({ ...prev, [contact.id]: 0 }));
    router.push({
      pathname: "/ChatScreen/[id]",
      params: {
        id:       contact.id,
        buyerId:  contact.buyerId,
        sellerId: contact.sellerId,
        fullName: contact.fullName,
        online:   String(contact.online),
        avatar:   contact.avatar ?? "",
      },
    });
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={[styles.header, { borderColor: isDark ? PRIMARY_DARK : "#e8f0e8" }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
          {totalUnread > 0 && (
            <Text style={styles.headerUnread}>{totalUnread} unread</Text>
          )}
        </View>
        <Pressable
          style={[styles.composeBtn, { backgroundColor: isDark ? PRIMARY_DARK : PRIMARY_SOFT }]}
          aria-label="New message"
        >
          <Text style={{ fontSize: 16 }}>✏️</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9", borderColor: isDark ? "#334155" : "#E2E8F0" }]}>
        <Text style={{ fontSize: 14 }}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search messages…"
          placeholderTextColor={theme.readColor}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Text style={[{ color: theme.readColor, fontSize: 14 }]}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Loading */}
      {loading && (
        <ActivityIndicator size="small" color={PRIMARY} style={{ marginTop: 24 }} />
      )}

      {/* Error */}
      {!!error && !loading && (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>⚠️</Text>
          <Text style={[styles.emptyText, { color: theme.readColor }]}>{error}</Text>
          <Pressable onPress={() => fetchConversations(currentUserId)} style={styles.retryBtn}>
            <Text style={{ color: PRIMARY, fontWeight: "600", fontSize: 14 }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* List */}
      {!loading && !error && (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>💬</Text>
              <Text style={[styles.emptyText, { color: theme.readColor }]}>
                No conversations yet
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ContactRow
              contact={item}
              isDark={isDark}
              theme={theme}
              onPress={() => openChat(item)}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: isDark ? "#1a2a1a" : "#f0f7f0" }]} />
          )}
        />
      )}
    </View>
  );
};

export default MessagesScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 25 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle:  { fontSize: 22, fontWeight: "700", letterSpacing: -0.4 },
  headerUnread: { fontSize: 12, fontWeight: "600", color: PRIMARY, marginTop: 2 },
  composeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 0.5,
    paddingHorizontal: 12, paddingVertical: 10,
    marginHorizontal: 14, marginVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },

  contactRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  avatarStack: { position: "relative", flexShrink: 0 },
  onlineDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: PRIMARY, borderWidth: 2,
  },
  contactContent: { flex: 1, gap: 3 },
  contactTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "baseline",
  },
  contactName: { fontSize: 14, fontWeight: "600", flex: 1, marginRight: 8 },
  contactTime: { fontSize: 11, flexShrink: 0 },
  contactBottom: { flexDirection: "row", alignItems: "center", gap: 6 },
  contactMsg: { fontSize: 13 },
  unreadBadge: {
    minWidth: 19, height: 19, borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 5, flexShrink: 0,
  },
  unreadText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  separator: { height: 0.5, marginLeft: 72 },

  emptyState: { alignItems: "center", paddingTop: 64 },
  emptyText:  { fontSize: 14, fontWeight: "500", marginBottom: 4 },
  retryBtn:   { marginTop: 10, paddingVertical: 8, paddingHorizontal: 16 },
});