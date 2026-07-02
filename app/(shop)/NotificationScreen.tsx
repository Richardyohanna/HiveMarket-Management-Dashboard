import { Colors } from '../../components/constants/theme';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

const PRIMARY      = "#008100";
const PRIMARY_SOFT = "#e8f5e9";
const PRIMARY_DARK = "#1a3a1a";
const DANGER       = "#e53935";

// ── Extended Notification Types for Campus Marketplace ────────────────────────
type NotifType = "message" | "price" | "live" | "sold" | "reaction" | "system" | "payment_received";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  group: "today" | "yesterday" | "earlier";
  metadata?: {
    productId?: string;
    productName?: string;
    senderName?: string;
  };
}

const ICON_MAP: Record<NotifType, { emoji: string; color: string; bg: string; bgDark: string }> = {
  message:          { emoji: "💬", color: "#3b82f6", bg: "#eff6ff",   bgDark: "#0f1a2a" },
  price:            { emoji: "🏷️", color: "#f59e0b", bg: "#fffbeb",   bgDark: "#1a1400" },
  live:             { emoji: "🚀", color: PRIMARY,   bg: PRIMARY_SOFT, bgDark: PRIMARY_DARK },
  sold:             { emoji: "🎉", color: "#8b5cf6", bg: "#f5f3ff",   bgDark: "#1a1030" },
  reaction:         { emoji: "❤️", color: "#ef4444", bg: "#fef2f2",   bgDark: "#1a0a0a" },
  system:           { emoji: "🐝", color: PRIMARY,   bg: PRIMARY_SOFT, bgDark: PRIMARY_DARK },
  payment_received: { emoji: "💰", color: "#10b981", bg: "#ecfdf5",   bgDark: "#062f22" }, // High priority transactional alert
};

// ── Demo Data reflecting new backend requirements ────────────────────────────
const INITIAL_NOTIFS: Notification[] = [
  {
    id: "n1", type: "payment_received", read: false, group: "today",
    title: "Payment Confirmed! 💰",
    body: "Tunde B. paid ₦30,000 for your Chess Set. Ship item immediately.",
    time: "Just now",
    metadata: { productId: "1342e20d", productName: "Chess Set" }
  },
  {
    id: "n2", type: "message", read: false, group: "today",
    title: "New Message from Sarah",
    body: "Sent an inquiry regarding your 'Nike Air Force 1'",
    time: "2m ago",
    metadata: { productId: "nike-123", productName: "Nike Air Force 1", senderName: "Sarah" }
  },
  {
    id: "n3", type: "reaction", read: false, group: "today",
    title: "Product Reaction",
    body: "Amara J. liked your listing 'Calculus 101 Textbook'",
    time: "15m ago",
    metadata: { productId: "calc-456", productName: "Calculus 101 Textbook" }
  },
  {
    id: "n4", type: "price", read: false, group: "today",
    title: "Price drop on saved item",
    body: "The Mid-century chair is now 15% off — ₦12,750",
    time: "1h ago",
  },
  {
    id: "n5", type: "live", read: true, group: "yesterday",
    title: "Listing Active",
    body: "iPhone 13 charger is now visible to students in your area",
    time: "Yesterday · 4:12 PM",
  },
];

const NotifRow = ({
  notif, isDark, theme, onPress, onMarkRead,
}: {
  notif: Notification;
  isDark: boolean;
  theme: any;
  onPress: () => void;
  onMarkRead: () => void;
}) => {
  const icon = ICON_MAP[notif.type];
  const bgColor = isDark ? icon.bgDark : icon.bg;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isHighPriority = notif.type === "payment_received";

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={() => { onMarkRead(); onPress(); }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.notifCard,
          {
            backgroundColor: !notif.read
              ? (isHighPriority ? (isDark ? "#122315" : "#e6fcf0") : (isDark ? "#0d1f0d" : "#f0fdf4"))
              : (isDark ? "#0f172a" : "#fff"),
            borderColor: !notif.read
              ? (isHighPriority ? "#10b981" : (isDark ? PRIMARY_DARK : "#bbf7d0"))
              : (isDark ? "#1e293b" : "#f1f5f9"),
            borderWidth: isHighPriority && !notif.read ? 1.5 : 1,
          },
        ]}
      >
        {/* Priority Indicator Stripe */}
        {!notif.read && (
          <View style={[styles.unreadBar, { backgroundColor: isHighPriority ? "#10b981" : PRIMARY }]} />
        )}

        {/* Dynamic Context Bubble */}
        <View style={[styles.iconBubble, { backgroundColor: bgColor }]}>
          <Text style={styles.iconEmoji}>{icon.emoji}</Text>
        </View>

        {/* Text Container */}
        <View style={styles.notifContent}>
          <View style={styles.notifTop}>
            <Text
              numberOfLines={1}
              style={[
                styles.notifTitle,
                {
                  color: theme.text,
                  fontWeight: notif.read ? "500" : "800",
                },
              ]}
            >
              {notif.title}
            </Text>
            {!notif.read && (
              <View style={[styles.unreadDot, { backgroundColor: isHighPriority ? "#10b981" : PRIMARY }]} />
            )}
          </View>
          
          <Text style={[styles.notifBody, { color: isDark ? "#94a3b8" : "#475569" }]}>
            {notif.body}
          </Text>

          {/* Subtitle tag linking to the related item contextual route */}
          {notif.metadata?.productName && (
            <View style={[styles.productBadge, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
              <Text numberOfLines={1} style={[styles.productBadgeText, { color: PRIMARY }]}>
                📦 Item: {notif.metadata.productName}
              </Text>
            </View>
          )}

          <Text style={[styles.notifTime, { color: isDark ? "#475569" : "#94a3b8" }]}>
            {notif.time}
          </Text>
        </View>

        <Text style={[styles.chevron, { color: isDark ? "#334155" : "#cbd5e1" }]}>›</Text>
      </Pressable>
    </Animated.View>
  );
};

const SectionLabel = ({ label, isDark, theme }: { label: string; isDark: boolean; theme: any }) => (
  <View style={styles.sectionLabelRow}>
    <View style={[styles.sectionAccent, { backgroundColor: PRIMARY }]} />
    <Text style={[styles.sectionLabelText, { color: theme.text }]}>{label}</Text>
    <View style={[styles.sectionLine, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]} />
  </View>
);

const NotificationScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const theme  = isDark ? Colors.dark : Colors.light;

  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markOneRead = (id: string) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const handleNotificationPress = (notif: Notification) => {
    if (notif.metadata?.productId) {
      if (notif.type === "message") {
      //  router.push({ pathname: `/ChatScreen/${notif.metadata.productId}` });
      } else if (notif.type === "payment_received" || notif.type === "sold") {
      //  router.push({ pathname: `/OrderDetail/${notif.metadata.productId}` });
      } else {
        router.push({ pathname: `/ProductDetail/ProductDetail`, params: { id: notif.metadata.productId } });
      }
    }
  };

  const groups: { key: "today" | "yesterday" | "earlier"; label: string }[] = [
    { key: "today",     label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "earlier",   label: "Earlier" },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: theme.screenBackground ?? theme.background, paddingTop: 25 }]}>
      <StatusBar backgroundColor={theme.screenBackground ?? theme.background} barStyle={isDark ? "light-content" : "dark-content"} />

      {/* --- Header --- */}
      <View style={[styles.header, { borderColor: isDark ? PRIMARY_DARK : "#e4f0e4" }]}>
        <Pressable onPress={() => router.back()}>
          <View style={[styles.backCircle, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
            <Text style={[styles.backArrow, { color: isDark ? "#94a3b8" : "#475569" }]}>←</Text>
          </View>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Activity Hub</Text>
          {unreadCount > 0 && <Text style={[styles.headerSub, { color: isDark ? "#64748b" : "#94a3b8" }]}>{unreadCount} new interactions</Text>}
        </View>

        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <Pressable onPress={markAllRead} style={[styles.markAllBtn, { backgroundColor: isDark ? PRIMARY_DARK : PRIMARY_SOFT }]}>
              <Text style={[styles.markAllText, { color: PRIMARY }]}>Clear All</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* --- Notification scroll container --- */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {groups.map(({ key, label }) => {
          const items = notifications.filter((n) => n.group === key);
          if (items.length === 0) return null;
          return (
            <View key={key} style={{ marginBottom: 4 }}>
              <SectionLabel label={label} isDark={isDark} theme={theme} />
              <View style={styles.group}>
                {items.map((notif) => (
                  <NotifRow
                    key={notif.id}
                    notif={notif}
                    isDark={isDark}
                    theme={theme}
                    onPress={() => handleNotificationPress(notif)}
                    onMarkRead={() => markOneRead(notif.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {unreadCount === 0 && (
          <View style={styles.allReadBanner}>
            <Text style={{ fontSize: 36 }}>🐝</Text>
            <Text style={[styles.allReadText, { color: isDark ? "#64748b" : "#94a3b8" }]}>You're all caught up!</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backCircle: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  backArrow: { fontSize: 18, fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  headerSub: { fontSize: 11, marginTop: 1, fontWeight: "500" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  markAllText: { fontSize: 11, fontWeight: "700" },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, marginBottom: 10 },
  sectionAccent: { width: 3, height: 14, borderRadius: 2 },
  sectionLabelText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  sectionLine: { flex: 1, height: 1 },
  group: { gap: 10 },
  notifCard: {
    flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16,
    padding: 14, overflow: "hidden", position: "relative",
  },
  unreadBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3.5 },
  iconBubble: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconEmoji: { fontSize: 18 },
  notifContent: { flex: 1, gap: 2 },
  notifTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  notifTitle: { fontSize: 13, flex: 1 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  notifBody: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
  productBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, marginTop: 4, maxWidth: '90%'
  },
  productBadgeText: { fontSize: 10, fontWeight: "700" },
  notifTime: { fontSize: 10, marginTop: 4, fontWeight: "500" },
  chevron: { fontSize: 18, fontWeight: "400", marginLeft: 4 },
  allReadBanner: { alignItems: "center", gap: 8, paddingVertical: 60 },
  allReadText: { fontSize: 13, fontWeight: "600" },
});