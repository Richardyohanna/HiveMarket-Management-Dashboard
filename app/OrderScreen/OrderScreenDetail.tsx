import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  useColorScheme,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { OrderStatus } from "@/hivemarket-shop-dashboard/src/types/Order";
import { TransitLocation, OrderDetail } from "@/hivemarket-shop-dashboard/src/types/Order";
import { getOrderDetail } from "@/hivemarket-shop-dashboard/src/api/OrderApi";


// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; emoji: string; color: string; darkColor: string; bg: string; darkBg: string; border: string; darkBorder: string }
> = {
 ALL: {
    label: "Pending",
    emoji: "⏳",
    color: "#e65100",
    darkColor: "#ff8a50",
    bg: "#fff3e0",
    darkBg: "#3a2600",
    border: "#ffe0b2",
    darkBorder: "#663300",
  },
  IN_PROGRESS: {
    label: "Pending",
    emoji: "⏳",
    color: "#e65100",
    darkColor: "#ff8a50",
    bg: "#fff3e0",
    darkBg: "#3a2600",
    border: "#ffe0b2",
    darkBorder: "#663300",
  },
  IN_TRANSIT: {
    label: "In Transit",
    emoji: "🚚",
    color: "#00695c",
    darkColor: "#4db6ac",
    bg: "#e0f2f1",
    darkBg: "#1e3a3a",
    border: "#b2dfdb",
    darkBorder: "#2d5a5a",
  },
  DELIVERED: {
    label: "Delivered",
    emoji: "✓",
    color: "#008100",
    darkColor: "#66bb6a",
    bg: "#e8f5e9",
    darkBg: "#0a2e0a",
    border: "#c8e6c9",
    darkBorder: "#2d5a2d",
  },
  CANCELLED: {
    label: "Cancelled",
    emoji: "✕",
    color: "#c62828",
    darkColor: "#ef9a9a",
    bg: "#ffebee",
    darkBg: "#3b0a0a",
    border: "#ffcdd2",
    darkBorder: "#7f1d1d",
  },
};

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const fmtDate = (iso: string, includeTime = false) => {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (!includeTime) return datePart;
  const timePart = d.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
};

// ─── Mock data (replace with API) ─────────────────────────────────────────────

const MOCK_DETAIL: OrderDetail = {
  orderId: "ORD-001",
  status: "IN_TRANSIT",
  createdAt: "2025-06-28T09:12:00Z",
  updatedAt: "2025-06-29T14:30:00Z",

  buyer: {
    name: "Chioma Okafor",
    phone: "+234 812 345 6789",
    email: "chioma.okafor@student.uniabuja.edu.ng",
    university: "University of Abuja",
    //faculty: "Faculty of Education",
    //level: "300 Level",
    //hostel: "Queens Hall, Room 14B",
    avatar: null,
  },

  delivery: {
    address: "Queens Hall, Room 14B",
    landmark: "Near the faculty of education car park",
    campus: "University of Abuja, Main Campus",
    estimatedDate: "2025-07-01T18:00:00Z",
    trackingId: "HV-TRK-20250629-001",
    currentLocation: "UniAbuja Campus Gate",
    transitHistory: [
      {
        checkpoint: "Order confirmed by seller",
        timestamp: "2025-06-28T10:00:00Z",
        note: "Seller accepted and is packaging",
      },
      {
        checkpoint: "Picked up by dispatch",
        timestamp: "2025-06-29T08:30:00Z",
        note: "On the way to campus",
      },
      {
        checkpoint: "Arrived at campus gate",
        timestamp: "2025-06-29T14:10:00Z",
        note: "Waiting at UniAbuja main gate",
      },
    ],
  },

  product: {
    id: "PROD-089",
    name: "Nigerian Study Bible (New King James Version)",
    imageUrl: null,
    category: "Books & Stationery",
    condition: "New",
    description:
      "Brand-new NKJV Study Bible with concordance, maps, and wide margins for annotations. Hardcover, ribbon bookmark included.",
    unitPrice: 7500,
  },

  quantity: 1,
  subtotal: 7500,
  platformFee: 750,
  total: 7500,

  transaction: {
    reference: "HVM-TXN-28062025-9A3F",
   // channel: "card",
    paidAt: "2025-06-28T09:14:32Z",
    settlementStatus: "pending",
    amountToReceive: 6750,
  },

  notes: "Please leave at the hostel reception if I'm not in.",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section = ({
  title,
  children,
  isDark,
}: {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) => (
  <View style={[sectionStyles.wrap, { backgroundColor: isDark ? "#141414" : "#fff", borderColor: isDark ? "#222" : "#f0f0f0" }]}>
    <Text style={[sectionStyles.title, { color: isDark ? "#aaa" : "#777" }]}>{title.toUpperCase()}</Text>
    {children}
  </View>
);

const sectionStyles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 14,
  },
});

const Row = ({
  label,
  value,
  valueColor,
  isDark,
  mono = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  isDark: boolean;
  mono?: boolean;
}) => (
  <View style={rowStyles.row}>
    <Text style={[rowStyles.label, { color: isDark ? "#666" : "#999" }]}>{label}</Text>
    <Text
      style={[
        rowStyles.value,
        { color: valueColor ?? (isDark ? "#e8e8e8" : "#1a1a1a") },
        mono && rowStyles.mono,
      ]}
      selectable
    >
      {value}
    </Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
    gap: 12,
  },
  label: {
    fontSize: 13,
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 12,
  },
});

const Divider = ({ isDark }: { isDark: boolean }) => (
  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? "#252525" : "#ebebeb", marginVertical: 8 }} />
);

// Transit timeline
const TransitTimeline = ({
  history,
  currentLocation,
  isDark,
}: {
  history: TransitLocation[];
  currentLocation?: string;
  isDark: boolean;
}) => {
  const textSecondary = isDark ? "#888" : "#999";
  const textPrimary = isDark ? "#e8e8e8" : "#1a1a1a";
  const lineColor = isDark ? "#2d5a5a" : "#b2dfdb";
  const dotActive = "#00695c";
  const dotInactive = isDark ? "#333" : "#ddd";

  return (
    <View>
      {currentLocation && (
        <View style={[timelineStyles.locationBanner, { backgroundColor: isDark ? "#1e3a3a" : "#e0f2f1", borderColor: isDark ? "#2d5a5a" : "#b2dfdb" }]}>
          <Text style={[timelineStyles.locationIcon]}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={[timelineStyles.locationLabel, { color: isDark ? "#4db6ac" : "#00695c" }]}>Current Location</Text>
            <Text style={[timelineStyles.locationValue, { color: textPrimary }]}>{currentLocation}</Text>
          </View>
        </View>
      )}

      <View style={{ marginTop: 14 }}>
        {[...history].reverse().map((item, idx, arr) => {
          const isLast = idx === arr.length - 1;
          const isFirst = idx === 0;
          return (
            <View key={idx} style={timelineStyles.timelineRow}>
              {/* Dot + line */}
              <View style={timelineStyles.dotCol}>
                <View style={[timelineStyles.dot, { backgroundColor: isFirst ? dotActive : dotInactive, borderColor: isFirst ? dotActive : dotInactive }]} />
                {!isLast && <View style={[timelineStyles.line, { backgroundColor: lineColor }]} />}
              </View>
              {/* Content */}
              <View style={timelineStyles.timelineContent}>
                <Text style={[timelineStyles.checkpoint, { color: textPrimary, fontWeight: isFirst ? "700" : "500" }]}>
                  {item.checkpoint}
                </Text>
                {item.note && (
                  <Text style={[timelineStyles.note, { color: textSecondary }]}>{item.note}</Text>
                )}
                <Text style={[timelineStyles.timestamp, { color: textSecondary }]}>
                  {fmtDate(item.timestamp, true)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const timelineStyles = StyleSheet.create({
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  locationIcon: { fontSize: 20 },
  locationLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  locationValue: { fontSize: 14, fontWeight: "600" },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 4,
  },
  dotCol: {
    alignItems: "center",
    width: 14,
    paddingTop: 3,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
    marginTop: 4,
    borderRadius: 1,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  checkpoint: {
    fontSize: 13,
  },
  note: {
    fontSize: 12,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
});

// Action buttons
const ActionButton = ({
  label,
  icon,
  onPress,
  variant = "secondary",
  isDark,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  isDark: boolean;
}) => {
  const styles = {
    primary: {
      bg: "#008100",
      text: "#fff",
      border: "#008100",
    },
    secondary: {
      bg: isDark ? "#1e1e1e" : "#f5f5f5",
      text: isDark ? "#e8e8e8" : "#1a1a1a",
      border: isDark ? "#2e2e2e" : "#e5e5e5",
    },
    danger: {
      bg: isDark ? "#3b0a0a" : "#ffebee",
      text: isDark ? "#ef9a9a" : "#c62828",
      border: isDark ? "#7f1d1d" : "#ffcdd2",
    },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        actionStyles.btn,
        { backgroundColor: styles.bg, borderColor: styles.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={actionStyles.icon}>{icon}</Text>
      <Text style={[actionStyles.label, { color: styles.text }]}>{label}</Text>
    </Pressable>
  );
};

const actionStyles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  icon: { fontSize: 16 },
  label: { fontSize: 14, fontWeight: "700" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [order, setOrder] = useState<OrderDetail>();
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const bg = isDark ? "#0d0d0d" : "#f2f2f2";
  const textPrimary = isDark ? "#f0f0f0" : "#1a1a1a";
  const textSecondary = isDark ? "#888" : "#777";

const fetchOrder = useCallback(async () => {
    setLoading(true);

    try {
        const data = await getOrderDetail(id);

        console.log("Order Detail", data);

        setOrder(data);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
}, [id]);

  useEffect(() => {
    fetchOrder().finally(() => setLoading(false));
  }, [fetchOrder]);

  const handleMarkInTransit = async () => {
    Alert.alert("Mark as In Transit", "Confirm that you've dispatched this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "default",
        onPress: async () => {
          setUpdatingStatus(true);
          // TODO: PATCH /api/seller/orders/{id}/status { status: "in_transit" }
          await new Promise((r) => setTimeout(r, 800));
          setOrder((o) => o ? { ...o, status: "IN_TRANSIT" } : o);
          setUpdatingStatus(false);
        },
      },
    ]);
  };

  const handleMarkDelivered = async () => {
    Alert.alert("Mark as Delivered", "Confirm the buyer has received this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "default",
        onPress: async () => {
          setUpdatingStatus(true);
          // TODO: PATCH /api/seller/orders/{id}/status { status: "delivered" }
          await new Promise((r) => setTimeout(r, 800));
          setOrder((o) => o ? { ...o, status: "DELIVERED" } : o);
          setUpdatingStatus(false);
        },
      },
    ]);
  };

  const handleCallBuyer = () => {
    if (!order) return;
    Linking.openURL(`tel:${order.buyer.phone}`);
  };

  const handleMessageBuyer = () => {
    if (!order) return;
    // TODO: router.push(`/(tabs)/ChatScreen?buyerId=${order.buyer.id}`)
    Alert.alert("Open Chat", "This would open the chat with the buyer.");
  };

  if (loading) {
    return (
      <SafeAreaView style={[mainStyles.safe, { backgroundColor: bg }]}>
        <Stack.Screen options={{ title: "Order Details", headerShown: true }} />
        <View style={mainStyles.center}>
          <ActivityIndicator size="large" color="#008100" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[mainStyles.safe, { backgroundColor: bg }]}>
        <Stack.Screen options={{ title: "Order Details" }} />
        <View style={mainStyles.center}>
          <Text style={{ fontSize: 40 }}>📭</Text>
          <Text style={[mainStyles.emptyTitle, { color: textPrimary }]}>Order not found</Text>
          <Text style={[mainStyles.emptyBody, { color: textSecondary }]}>
            This order may have been removed or the ID is incorrect.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status];
  const statusColor = isDark ? statusCfg.darkColor : statusCfg.color;

  return (
    <SafeAreaView style={[mainStyles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Stack.Screen
        options={{
          title: order.orderId,
          headerStyle: { backgroundColor: isDark ? "#0d0d0d" : "#f2f2f2" },
          headerTintColor: isDark ? "#f0f0f0" : "#1a1a1a",
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={mainStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── STATUS HERO ── */}
        <View style={[heroStyles.hero, { backgroundColor: isDark ? statusCfg.darkBg : statusCfg.bg, borderColor: isDark ? statusCfg.darkBorder : statusCfg.border }]}>
          <View style={heroStyles.heroLeft}>
            <Text style={heroStyles.heroEmoji}>{statusCfg.emoji}</Text>
            <View>
              <Text style={[heroStyles.heroStatus, { color: statusColor }]}>{statusCfg.label}</Text>
              <Text style={[heroStyles.heroId, { color: isDark ? "#555" : "#aaa" }]}>{order.orderId}</Text>
            </View>
          </View>
          <View style={[heroStyles.heroBadge, { backgroundColor: isDark ? "#0d0d0d22" : "#fff5", borderColor: isDark ? statusCfg.darkBorder : statusCfg.border }]}>
            <Text style={[heroStyles.heroBadgeText, { color: statusColor }]}>
              {fmtDate(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* ── PRODUCT ── */}
        <Section title="Product" isDark={isDark}>
          <View style={productStyles.productRow}>
            {/* Product Image */}
            <View style={[productStyles.imageWrap, { backgroundColor: isDark ? "#1e1e1e" : "#f5f5f5", borderColor: isDark ? "#2a2a2a" : "#ebebeb" }]}>
              {order.product.imageUrl ? (
                <Image
                  source={{ uri: order.product.imageUrl }}
                  style={productStyles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={productStyles.imagePlaceholder}>
                  <Text style={{ fontSize: 32 }}>📦</Text>
                </View>
              )}
            </View>

            {/* Product Info */}
            <View style={productStyles.info}>
              <Text style={[productStyles.name, { color: textPrimary }]} numberOfLines={2}>
                {order.product.name}
              </Text>
              <View style={productStyles.badges}>
                <View style={[productStyles.chip, { backgroundColor: isDark ? "#1e1e1e" : "#f0f0f0" }]}>
                  <Text style={[productStyles.chipText, { color: textSecondary }]}>{order.product.category}</Text>
                </View>
                <View style={[productStyles.chip, { backgroundColor: isDark ? "#0a2e0a" : "#e8f5e9" }]}>
                  <Text style={[productStyles.chipText, { color: "#008100" }]}>{order.product.condition}</Text>
                </View>
              </View>
              <Text style={[productStyles.unitPrice, { color: "#008100" }]}>
                {fmt(order.product.unitPrice)} <Text style={{ color: textSecondary, fontSize: 12, fontWeight: "400" }}>/ unit</Text>
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={[productStyles.descWrap, { backgroundColor: isDark ? "#1a1a1a" : "#fafafa", borderColor: isDark ? "#222" : "#f0f0f0" }]}>
            <Text style={[productStyles.descText, { color: textSecondary }]}>
              {order.product.description}
            </Text>
          </View>
        </Section>

        {/* ── BUYER ── */}
        <Section title="Buyer" isDark={isDark}>
          {/* Avatar + name */}
          <View style={buyerStyles.buyerHeader}>
            <View style={[buyerStyles.avatar, { backgroundColor: isDark ? "#1e3a3a" : "#e0f2f1" }]}>
              {order.buyer.avatar ? (
                <Image source={{ uri: order.buyer.avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              ) : (
                <Text style={{ fontSize: 22 }}>🎓</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[buyerStyles.buyerName, { color: textPrimary }]}>{order.buyer.name}</Text>
              <Text style={[buyerStyles.buyerUni, { color: "#008100" }]}>{order.buyer.university}</Text>
            </View>
          </View>

          <Divider isDark={isDark} />

           {/* {order.buyer.faculty && <Row label="Faculty" value={order.buyer.faculty} isDark={isDark} />} */}
           {/* {order.buyer.level && <Row label="Level" value={order.buyer.level} isDark={isDark} />} */}
           {/* {order.buyer.hostel && <Row label="Hostel / Room" value={order.buyer.hostel} isDark={isDark} />} */}
          <Row label="Phone" value={order.buyer.phone} isDark={isDark} valueColor="#008100" />
          <Row label="Email" value={order.buyer.email} isDark={isDark} />
        </Section>

        {/* ── DELIVERY ── */}
        <Section title="Delivery" isDark={isDark}>
          <Row label="Campus" value={order.delivery.campus} isDark={isDark} />
          <Row label="Address" value={order.delivery.address} isDark={isDark} />
          {order.delivery.landmark && (
            <Row label="Landmark" value={order.delivery.landmark} isDark={isDark} />
          )}
          {order.delivery.estimatedDate && (
            <Row
              label="Est. Delivery"
              value={fmtDate(order.delivery.estimatedDate)}
              isDark={isDark}
              valueColor="#00695c"
            />
          )}
          {order.delivery.trackingId && (
            <Row label="Tracking ID" value={order.delivery.trackingId} isDark={isDark} mono />
          )}

          {order.notes && (
            <>
              <Divider isDark={isDark} />
              <View style={[deliveryStyles.noteBanner, { backgroundColor: isDark ? "#3a3000" : "#fffde7", borderColor: isDark ? "#665500" : "#fff9c4" }]}>
                <Text style={{ fontSize: 14 }}>💬</Text>
                <Text style={[deliveryStyles.noteText, { color: isDark ? "#ffe082" : "#5d4037" }]}>
                  {order.notes}
                </Text>
              </View>
            </>
          )}
        </Section>

        {/* ── TRANSIT TRACKING (only when in_transit) ── */}
        {order.status === "IN_TRANSIT" && order.delivery.transitHistory && (
          <Section title="Live Tracking" isDark={isDark}>
            <TransitTimeline
              history={order.delivery.transitHistory}
              currentLocation={order.delivery.currentLocation}
              isDark={isDark}
            />
          </Section>
        )}

        {/* ── ORDER SUMMARY ── */}
        <Section title="Order Summary" isDark={isDark}>
          <Row label="Product" value={order.product.name} isDark={isDark} />
          <Row label="Quantity" value={`${order.quantity} unit${order.quantity > 1 ? "s" : ""}`} isDark={isDark} />
          <Row label="Unit Price" value={fmt(order.product.unitPrice)} isDark={isDark} />
          <Divider isDark={isDark} />
          <Row label="Subtotal" value={fmt(order.subtotal)} isDark={isDark} />
          <Row
            label="Platform Fee (10%)"
            value={`− ${fmt(order.platformFee)}`}
            isDark={isDark}
            valueColor={isDark ? "#ef9a9a" : "#c62828"}
          />
          <Divider isDark={isDark} />
          <View style={summaryStyles.totalRow}>
            <Text style={[summaryStyles.totalLabel, { color: textSecondary }]}>You receive</Text>
            <Text style={[summaryStyles.totalValue, { color: "#008100" }]}>
              {fmt(order.transaction.amountToReceive)}
            </Text>
          </View>
        </Section>

        {/* ── TRANSACTION ── */}
        <Section title="Transaction" isDark={isDark}>
          <Row label="Reference" value={order.transaction.reference} isDark={isDark} mono />
          {/*<Row
            label="Payment channel"
            value={order.transaction.channel.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            isDark={isDark}
          /> */}
          <Row label="Paid at" value={fmtDate(order.transaction.paidAt, true)} isDark={isDark} />
          <Row
            label="Settlement"
            value={order.transaction.settlementStatus === "settled" ? "✓ Settled" : "⏳ Pending settlement"}
            isDark={isDark}
            valueColor={order.transaction.settlementStatus === "settled" ? "#008100" : "#e65100"}
          />
        </Section>

        {/* ── ACTIONS ── */}
        <View style={actionsStyles.container}>
          {/* Contact buyer */}
          <View style={actionsStyles.row}>
            <ActionButton label="Call Buyer" icon="📞" onPress={handleCallBuyer} isDark={isDark} variant="secondary" />
            <ActionButton label="Message" icon="💬" onPress={handleMessageBuyer} isDark={isDark} variant="secondary" />
          </View>

          {/* Status update */}
          {order.status === "IN_PROGRESS" && (
            <ActionButton
              label={updatingStatus ? "Updating…" : "Mark as In Transit"}
              icon="🚚"
              onPress={handleMarkInTransit}
              variant="primary"
              isDark={isDark}
            />
          )}
          {order.status === "IN_TRANSIT" && (
            <ActionButton
              label={updatingStatus ? "Updating…" : "Mark as Delivered"}
              icon="✓"
              onPress={handleMarkDelivered}
              variant="primary"
              isDark={isDark}
            />
          )}
          {order.status === "DELIVERED" && (
            <View style={[actionsStyles.deliveredBanner, { backgroundColor: isDark ? "#0a2e0a" : "#e8f5e9", borderColor: isDark ? "#2d5a2d" : "#c8e6c9" }]}>
              <Text style={{ fontSize: 18 }}>✅</Text>
              <Text style={[actionsStyles.deliveredText, { color: "#008100" }]}>
                Order delivered — payment will be settled shortly
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const mainStyles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 14, paddingTop: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptyBody: { fontSize: 14, textAlign: "center", marginTop: 6, lineHeight: 20 },
});

const heroStyles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  heroLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroEmoji: { fontSize: 28 },
  heroStatus: { fontSize: 18, fontWeight: "800", letterSpacing: 0.2 },
  heroId: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  heroBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: { fontSize: 12, fontWeight: "600" },
});

const productStyles = StyleSheet.create({
  productRow: { flexDirection: "row", gap: 14, marginBottom: 14 },
  imageWrap: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    flexShrink: 0,
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 6 },
  name: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: "600" },
  unitPrice: { fontSize: 16, fontWeight: "800" },
  descWrap: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  descText: { fontSize: 13, lineHeight: 19 },
});

const buyerStyles = StyleSheet.create({
  buyerHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buyerName: { fontSize: 16, fontWeight: "700" },
  buyerUni: { fontSize: 12, fontWeight: "600", marginTop: 2 },
});

const deliveryStyles = StyleSheet.create({
  noteBanner: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    alignItems: "flex-start",
  },
  noteText: { fontSize: 13, lineHeight: 18, flex: 1 },
});

const summaryStyles = StyleSheet.create({
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 22, fontWeight: "800" },
});

const actionsStyles = StyleSheet.create({
  container: { gap: 10, marginBottom: 8 },
  row: { flexDirection: "row", gap: 10 },
  deliveredBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  deliveredText: { fontSize: 14, fontWeight: "600", flex: 1 },
});