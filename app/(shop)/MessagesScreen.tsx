import { localURL } from "../../localURL";
import { fetchWithTimeout } from "../../hivemarket-shop-dashboard/src/api/productApi";
import { getToken } from "@/hivemarket-shop-dashboard/src/services/authStorage";
import { shopStore } from "../../hivemarket-shop-dashboard/src/store/shopStore";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { GREEN, shopTheme } from "../../hivemarket-shop-dashboard/app/Shop/components/ui";

interface Conversation {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  lastMessage: string;
  time: string;
  unread: number;
}

const MessagesScreen = () => {
  const isDark = useColorScheme() === "dark";
  const t = shopTheme(isDark);
  const shop = shopStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!shop.id) {
      setLoading(false);
      return;
    }
    try {
      const token = await getToken();
      // Assumed endpoint: GET /api/shops/{shopId}/conversations
      const res = await fetchWithTimeout(`${localURL}/api/shops/${shop.id}/conversations`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      const list: Conversation[] = (Array.isArray(data) ? data : data.conversations ?? []).map(
        (c: any) => ({
          id: String(c.id),
          userId: String(c.userId ?? c.buyerId ?? ""),
          name: c.name ?? c.buyerName ?? "Buyer",
          avatar: c.avatar ?? c.profile_picture ?? null,
          lastMessage: c.lastMessage ?? "",
          time: c.time ?? c.updatedAt ?? "",
          unread: c.unread ?? 0,
        })
      );
      setConversations(list);
    } catch (e) {
      console.log("[v0] messages load failed", e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [shop.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <Pressable
      onPress={() => router.push(`/ChatScreen/${item.userId}`)}
      style={[s.row, { backgroundColor: t.card, borderColor: t.border }]}
    >
      <View style={[s.avatar, { borderColor: t.border, backgroundColor: t.inputBg }]}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={s.avatarImg} />
        ) : (
          <Text style={{ fontSize: 18 }}>👤</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.topLine}>
          <Text style={[s.name, { color: t.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[s.time, { color: t.subText }]}>{item.time}</Text>
        </View>
        <Text style={[s.preview, { color: t.subText }]} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      {item.unread > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{item.unread > 9 ? "9+" : item.unread}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: t.text }]}>Messages</Text>
        <Text style={[s.sub, { color: t.subText }]}>Chat with your buyers</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ fontSize: 34, marginBottom: 8 }}>💬</Text>
              <Text style={[s.title, { color: t.text, fontSize: 16 }]}>No messages yet</Text>
              <Text style={[s.sub, { color: t.subText, textAlign: "center" }]}>
                When buyers reach out about your products, their chats appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default MessagesScreen;

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: 64 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  sub: { fontSize: 13, marginTop: 2 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  topLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "700", flex: 1, marginRight: 8 },
  time: { fontSize: 11 },
  preview: { fontSize: 13, marginTop: 2 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  center: { alignItems: "center", justifyContent: "center", paddingVertical: 70, gap: 6 },
});
