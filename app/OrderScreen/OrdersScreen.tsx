import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { shopStore } from "@/hivemarket-shop-dashboard/src/store/shopStore";
import { getAllCancelledOrderApi , getAllDeliveredOrderApi,getAllPendingOrderApi, getAllInTransitOrderApi, getAllOrderApi} from "@/hivemarket-shop-dashboard/src/api/OrderApi";
import { Order , OrderStatus} from "@/hivemarket-shop-dashboard/src/types/Order";

// ─── Types ────────────────────────────────────────────────────────────────────

const formatOrderId = (orderId: string) => {
  return `HM-${orderId.split("-")[0].toUpperCase()}`;
};

/*
interface Order {
  id: string;
  buyerName: string;
  productName: string;
  amount: number;
  quantity: number;
  status: OrderStatus;
  createdAt: string;
  address: string;
} */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; emoji: string; color: string; darkColor: string; bg: string; darkBg: string; border: string; darkBorder: string }
> = {
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
  ALL: {
    label: "All Orders",
    emoji: "📦",
    color: "#37474f",
    darkColor: "#b0bec5",
    bg: "#eceff1",
    darkBg: "#1a2226",
    border: "#cfd8dc",
    darkBorder: "#37474f",
  },
};

const formatCurrency = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

// ─── Mock data (replace with real API call) ──────────────────────────────────

const MOCK_ORDERS = [ // : Order[] = [
  { id: "ORD-001", buyerName: "Chioma Okafor", productName: "Nigerian Study Bible", amount: 7500, quantity: 1, status: "pending", createdAt: "2025-06-28T09:12:00Z", address: "Room 14B, Queens Hall, UniAbuja" },
  { id: "ORD-002", buyerName: "Emeka Nwosu", productName: "Calculus Textbook (3rd Ed.)", amount: 4200, quantity: 2, status: "in_transit", createdAt: "2025-06-27T14:30:00Z", address: "Block C, Male Hostel, UNILAG" },
  { id: "ORD-003", buyerName: "Fatima Bello", productName: "Programming Lab Coat", amount: 3000, quantity: 1, status: "delivered", createdAt: "2025-06-25T11:05:00Z", address: "Off-campus, Gwarinpa Estate" },
  { id: "ORD-004", buyerName: "Tunde Adeyemi", productName: "HP Calculator FX-991", amount: 12000, quantity: 1, status: "pending", createdAt: "2025-06-28T16:45:00Z", address: "Room 5, Keffi Hall, ABU" },
  { id: "ORD-005", buyerName: "Ngozi Eze", productName: "Anatomy Atlas (8th Ed.)", amount: 18500, quantity: 1, status: "delivered", createdAt: "2025-06-24T08:20:00Z", address: "Block A, Medical Hostel, UNIBEN" },
  { id: "ORD-006", buyerName: "Ibrahim Suleiman", productName: "USB Flash Drive 64GB", amount: 2800, quantity: 3, status: "in_transit", createdAt: "2025-06-26T10:00:00Z", address: "New Site Campus, BUK" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status, isDark }: { status: OrderStatus; isDark: boolean }) => {
  const meta = STATUS_META[status];
  return (
    <View style={[
      badgeStyles.badge,
      { backgroundColor: isDark ? meta.darkBg : meta.bg, borderColor: isDark ? meta.darkBorder : meta.border }
    ]}>
      <Text style={[badgeStyles.text, { color: isDark ? meta.darkColor : meta.color }]}>
        {meta.emoji} {meta.label}
      </Text>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

const OrderCard = ({ order, isDark }: { order: Order; isDark: boolean }) => {
  const router = useRouter();
  const cardBg = isDark ? "#1a1a1a" : "#ffffff";
  const borderColor = isDark ? "#2a2a2a" : "#f0f0f0";
  const textPrimary = isDark ? "#f0f0f0" : "#1a1a1a";
  const textSecondary = isDark ? "#888" : "#777";

  return (
    <Pressable
      onPress={() => router.push(`/OrderScreen/OrderScreenDetail?id=${order.OrderId}`)}
      style={({ pressed }) => [
        cardStyles.card,
        { backgroundColor: cardBg, borderColor, opacity: pressed ? 0.85 : 1 }
      ]}
    >
      {/* Header row */}
      <View style={cardStyles.row}>
        <Text style={[cardStyles.orderId, { color: "#008100" }]}>
            {formatOrderId(order.OrderId)}
        </Text>
        <StatusBadge status={order.status} isDark={isDark} />
      </View>

      {/* Product */}
      <Text style={[cardStyles.productName, { color: textPrimary }]} numberOfLines={1}>
        {order.productName}
      </Text>

      {/* Buyer */}
      <Text style={[cardStyles.buyer, { color: textSecondary }]}>
          👤 Buyer: <Text style={{ fontWeight: "600", color: textPrimary }}>
              {order.buyerName}
          </Text>
      </Text>

      {/* Address */}
      <Text
          style={[cardStyles.address, { color: textSecondary }]}
          numberOfLines={2}
      >
          📍 Delivery Location:{" "}
          <Text style={{ color: textPrimary }}>
              {order.address}
          </Text>
      </Text>

      {/* Footer */}
      <View style={[cardStyles.row, cardStyles.footer]}>
        <View>
          <Text style={[cardStyles.amountLabel, { color: textSecondary }]}>
              Amount Paid
          </Text>
          <Text style={[cardStyles.amount, { color: isDark ? "#f0f0f0" : "#1a1a1a" }]}>
            {formatCurrency(order.amountPaid)}
            {order.quantity > 1 && (
              <Text style={{ color: textSecondary, fontSize: 12 }}> × {order.quantity}</Text>
            )}
          </Text>
        </View>
        <Text style={[cardStyles.date, { color: textSecondary }]}>{formatDate(order.orderDate)}</Text>
      </View>
    </Pressable>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderId: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  buyer: {
    fontSize: 13,
  },
  address: {
    fontSize: 12,
  },
  footer: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
  },
  amountLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  date: {
    fontSize: 12,
  },
});

// Filter tab pills
const FILTER_TABS: { key: OrderStatus; emoji: string; label: string }[] = [
  { key: "ALL", emoji: "📦", label: "All" },
  { key: "IN_PROGRESS", emoji: "⏳", label: "Pending" },
  { key: "IN_TRANSIT", emoji: "🚚", label: "In Transit" },
  { key: "DELIVERED", emoji: "✓", label: "Delivered" },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OrdersScreen() {
  const { status: paramStatus } = useLocalSearchParams<{ status?: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const router = useRouter();

  const shop = shopStore();

  const initialTab: OrderStatus =
    (paramStatus as OrderStatus) && STATUS_META[paramStatus as OrderStatus]
      ? (paramStatus as OrderStatus)
      : "ALL";

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const shopId = shop.id;

useEffect(() => {

    const fetchOrders = async () => {

        console.log("Fetching orders ", activeTab);

        setLoading(true);

        try{

            let data: Order[] = [];

            switch(activeTab){

                case "ALL":
                    data = await getAllOrderApi(shopId);
                    break;

                case "IN_PROGRESS":
                    data = await getAllPendingOrderApi(shopId);
                    break;

                case "IN_TRANSIT":
                    data = await getAllInTransitOrderApi(shopId);
                    break;

                case "DELIVERED":
                    data = await getAllDeliveredOrderApi(shopId);
                    break;

                default:
                    data = [];
            }

            setOrders(data);

        }finally{
            setLoading(false);
        }

    }

    fetchOrders();

},[activeTab,shopId]);


  const loadOrders = useCallback(async () => {
    // TODO: replace with real API call
    // e.g. GET /api/seller/orders?status=${activeTab}
    await new Promise((r) => setTimeout(r, 600));
    const filtered =
      activeTab === "all"
        ? MOCK_ORDERS
        : MOCK_ORDERS.filter((o) => o.status === activeTab);
    //setOrders(filtered);
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    loadOrders().finally(() => setLoading(false));
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const bg = isDark ? "#0d0d0d" : "#f7f7f7";
  const tabBg = isDark ? "#1a1a1a" : "#ffffff";
  const tabBorder = isDark ? "#2a2a2a" : "#eeeeee";
  const textPrimary = isDark ? "#f0f0f0" : "#1a1a1a";
  const textSecondary = isDark ? "#888" : "#332626";

  const meta = STATUS_META[activeTab];
  const activeColor = isDark ? meta.darkColor : meta.color;

  const counts = {
    ALL: MOCK_ORDERS.length,
    IN_PROGRESS: MOCK_ORDERS.filter((o) => o.status === "pending").length,
    IN_TRANSIT: MOCK_ORDERS.filter((o) => o.status === "in_transit").length,
    DELIVERED: MOCK_ORDERS.filter((o) => o.status === "delivered").length,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <Stack.Screen
        options={{
          title: "Orders",
          headerStyle: { backgroundColor: isDark ? "#0d0d0d" : "#f7f7f7" },
          headerTintColor: isDark ? "#f0f0f0" : "#1a1a1a",
          headerShadowVisible: false,
        }}
      />

      {/* Filter Tabs */}
      <View style={[styles.tabsWrapper, { backgroundColor: tabBg, borderBottomColor: tabBorder }]}>
        <FlatList
          horizontal
          data={FILTER_TABS}
          keyExtractor={(t) => t.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => {
            const isActive = activeTab === item.key;
            const tabMeta = STATUS_META[item.key];
            const tabActiveColor = isDark ? tabMeta.darkColor : tabMeta.color;
            return (
              <Pressable
                onPress={() => setActiveTab(item.key)}
                style={[
                  styles.tab,
                  isActive && {
                    backgroundColor: isDark ? tabMeta.darkBg : tabMeta.bg,
                    borderColor: isDark ? tabMeta.darkBorder : tabMeta.border,
                  },
                  !isActive && { borderColor: "transparent", backgroundColor: "transparent" },
                ]}
              >
                <Text style={styles.tabEmoji}>{item.emoji}</Text>
                <Text style={[styles.tabLabel, { color: isActive ? tabActiveColor : textSecondary }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: activeColor }]}>
          {meta.emoji}  {meta.label}
        </Text>
        <Text style={[styles.sectionCount, { color: textSecondary }]}>
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#008100" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No orders here</Text>
          <Text style={[styles.emptyBody, { color: textSecondary }]}>
            {activeTab === "pending"
              ? "New orders from buyers will show up here."
              : activeTab === "in_transit"
              ? "Orders you've dispatched will appear here."
              : "Completed deliveries will be listed here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.OrderId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#008100"
              colors={["#008100"]}
            />
          }
          renderItem={({ item }) => <OrderCard order={item} isDark={isDark} />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Root styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  tabsWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  tabEmoji: {
    fontSize: 13,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabCount: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  sectionCount: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});