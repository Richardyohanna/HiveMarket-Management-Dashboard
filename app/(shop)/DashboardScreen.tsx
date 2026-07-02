
import { getShopFollowersApi, getShopStatsApi, openToggle } from "../../hivemarket-shop-dashboard/src/api/shopApi";
import { shopStore } from "../../hivemarket-shop-dashboard/src/store/shopStore";
import { Follower, ShopStats } from "../../hivemarket-shop-dashboard/src/types/shop";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { GREEN, ScreenRings, StatCard, shopTheme } from "../../hivemarket-shop-dashboard/app/Shop/components/ui";
import { WithdrawFundsModal } from "../../components/WithdrawFundsModal";
import { useBankVerification, withdrawFromWallet } from "../../hivemarket-shop-dashboard/src/api/walletApi";
import { useWallet } from "../../hivemarket-shop-dashboard/src/hooks/useWallet";

const PRIMARY_SOFT = "#e8f5e9";
const money = (n: number) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────
// Clickable Stat Tile (compact, modern)
// ─────────────────────────────────────────────
const ClickableStatTile = ({
  label,
  value,
  emoji,
  isDark,
  theme,
  onPress,
}: {
  label: string;
  value: string | number;
  emoji: string;
  isDark: boolean;
  theme: any;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[statTileStyles.tile, {
      backgroundColor: isDark ? "#1e293b" : "#fff",
      borderColor: isDark ? "#334155" : "#e4f0e4",
    }]}
  >
    <View style={statTileStyles.header}>
      <Text style={statTileStyles.emoji}>{emoji}</Text>
      <Text style={[statTileStyles.label, { color: theme.subText }]}>{label}</Text>
    </View>
    <Text style={[statTileStyles.value, { color: "#008100" }]}>{value}</Text>
    <Text style={[statTileStyles.arrow, { color: theme.readColor }]}>→</Text>
  </Pressable>
);

const statTileStyles = StyleSheet.create({
  tile: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    position: "relative",
    width: "100%"
  },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  emoji: { fontSize: 18 },
  label: { fontSize: 11, fontWeight: "600" },
  value: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  arrow: { position: "absolute", top: 8, right: 8, fontSize: 16, fontWeight: "700" },
});

// ─────────────────────────────────────────────
// Followers List Section (organized)
// ─────────────────────────────────────────────
const FollowersSection = ({
  followers,
  isDark,
  theme,
  totalFollowers,
}: {
  followers: Follower[];
  isDark: boolean;
  theme: any;
  totalFollowers: number;
}) => {
  // Group followers by university
  const groupedFollowers = followers.reduce((acc, follower) => {
    const university = follower.university || "Unknown Campus";
    if (!acc[university]) {
      acc[university] = [];
    }
    acc[university].push(follower);
    return acc;
  }, {} as Record<string, Follower[]>);

  return (
    <View style={followerStyles.container}>
      <View style={followerStyles.header}>
        <Text style={[followerStyles.title, { color: theme.text }]}>👥 Followers</Text>
        <Text style={[followerStyles.count, { color: "#008100" }]}>{totalFollowers}</Text>
      </View>

      {Object.entries(groupedFollowers).slice(0, 3).map(([university, unis]) => (
        <View key={university} style={followerStyles.universityGroup}>
          <Text style={[followerStyles.universityLabel, { color: theme.readColor }]}>
            📍 {university}
          </Text>
          <View style={followerStyles.avatarRow}>
            {unis.slice(0, 5).map((f, i) => (
              <View key={f.id} style={followerStyles.avatarWrapper}>
                {f.profile_picture ? (
                  <Image source={{ uri: f.profile_picture }} style={followerStyles.avatar} />
                ) : (
                  <View style={[followerStyles.avatar, { 
                    backgroundColor: "#008100",
                    alignItems: "center",
                    justifyContent: "center",
                  }]}>
                    <Text style={{ fontSize: 12, color: "#fff", fontWeight: "700" }}>
                      {f.full_name?.charAt(0) || "F"}
                    </Text>
                  </View>
                )}
                <Text 
                  style={[followerStyles.name, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {f.full_name?.split(" ")[0] || "User"}
                </Text>
              </View>
            ))}
            {unis.length > 5 && (
              <View style={followerStyles.moreWrapper}>
                <Text style={[followerStyles.moreText, { color: theme.text }]}>
                  +{unis.length - 5}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}

      {followers.length > 10 && (
        <Pressable style={followerStyles.viewAll}>
          <Text style={[followerStyles.viewAllText, { color: "#008100" }]}>
            View all {totalFollowers} followers →
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const followerStyles = StyleSheet.create({
  container: { gap: 12, marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  title: { fontSize: 14, fontWeight: "800", letterSpacing: -0.3 },
  count: { fontSize: 18, fontWeight: "900" },
  universityGroup: { gap: 8 },
  universityLabel: { fontSize: 11, fontWeight: "600", marginLeft: 2 },
  avatarRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatarWrapper: { alignItems: "center", gap: 4 },
  avatar: { width: 42, height: 42, borderRadius: 21, overflow: "hidden" },
  name: { fontSize: 10, fontWeight: "600", width: 45, textAlign: "center" },
  moreWrapper: { 
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#008100",
    alignItems: "center", justifyContent: "center",
  },
  moreText: { fontSize: 12, fontWeight: "700" },
  viewAll: { marginTop: 4, paddingVertical: 8 },
  viewAllText: { fontSize: 12, fontWeight: "700", textAlign: "center" },
});

// ─────────────────────────────────────────────
// Order Stats Section (compact, clickable)
// ─────────────────────────────────────────────
const OrderStatsSection = ({
  pendingCount,
  inTransitCount,
  deliveredCount,
  isDark,
  theme,
}: {
  pendingCount: number;
  inTransitCount: number;
  deliveredCount: number;
  isDark: boolean;
  theme: any;
}) => (
  <View style={orderStatsStyles.container}>
    <Text style={[orderStatsStyles.title, { color: theme.text }]}>📦 Order Stats</Text>
    <View style={orderStatsStyles.grid}>
      <Pressable
        onPress={() => router.push("/OrderScreen/OrdersScreen?status=IN_PROGRESS")}
        style={[orderStatsStyles.statCard, {
          backgroundColor: isDark ? "#3a2600" : "#fff3e0",
          borderColor: isDark ? "#663300" : "#ffe0b2",
        }]}
      >
        <Text style={orderStatsStyles.statEmoji}>⏳</Text>
        <Text style={[orderStatsStyles.statValue, { color: "#e65100" }]}>{pendingCount}</Text>
        <Text style={[orderStatsStyles.statLabel, { color: "#e65100" }]}>Pending</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/OrderScreen/OrdersScreen?status=IN_TRANSIT")}
        style={[orderStatsStyles.statCard, {
          backgroundColor: isDark ? "#1e3a3a" : "#e0f2f1",
          borderColor: isDark ? "#2d5a5a" : "#b2dfdb",
        }]}
      >
        <Text style={orderStatsStyles.statEmoji}>🚚</Text>
        <Text style={[orderStatsStyles.statValue, { color: "#00695c" }]}>{inTransitCount}</Text>
        <Text style={[orderStatsStyles.statLabel, { color: "#00695c" }]}>In Transit</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/OrderScreen/OrdersScreen?status=DELIVERED")}
        style={[orderStatsStyles.statCard, {
          backgroundColor: isDark ? "#0a2e0a" : "#e8f5e9",
          borderColor: isDark ? "#2d5a2d" : "#c8e6c9",
        }]}
      >
        <Text style={orderStatsStyles.statEmoji}>✓</Text>
        <Text style={[orderStatsStyles.statValue, { color: "#008100" }]}>{deliveredCount}</Text>
        <Text style={[orderStatsStyles.statLabel, { color: "#008100" }]}>Delivered</Text>
      </Pressable>
    </View>
  </View>
);

const orderStatsStyles = StyleSheet.create({
  container: { gap: 12, marginBottom: 18 },
  title: { fontSize: 14, fontWeight: "800", letterSpacing: -0.3 },
  grid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 6,
  },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 18, fontWeight: "900" },
  statLabel: { fontSize: 10, fontWeight: "700" },
});

// ─────────────────────────────────────────────
// Wallet Card (dashboard-native style)
// ─────────────────────────────────────────────
const WalletCard = ({
  userId,
  isDark,
  t,
}: {
  userId: string;
  isDark: boolean;
  t: ReturnType<typeof shopTheme>;
}) => {
  const { wallet, loading, error } = useWallet(userId);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [balance, setBalance] = useState(0);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (wallet?.balance == null) return;
    setBalance(Number(wallet.balance.toFixed(2)));
  }, [wallet?.balance]);

  const {
    banks,
    loadingBanks,
    fetchBanks,
    resolving,
    resolvedName,
    resolveError,
    resolveAccount,
    resetResolve,
  } = useBankVerification();

  const handleSubmit = async (data: {
    amount: number;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }) => {
    setSubmitting(true);
    try {
      await withdrawFromWallet(userId, data.amount, {
        bankName: data.bankName,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      });
      setBalance((prev) => prev - data.amount);
      Alert.alert("Success", "Withdrawal initiated successfully!");
      setShowWithdraw(false);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Withdrawal failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[wStyles.card, { backgroundColor: GREEN, alignItems: "center", justifyContent: "center", minHeight: 100 }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (error || !wallet) {
    return (
      <View style={[wStyles.card, { backgroundColor: GREEN, padding: 20 }]}>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
          {error ?? "Unable to load wallet."}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={[wStyles.card, { backgroundColor: GREEN }]}>
        <View style={wStyles.topRow}>
          <Text style={wStyles.cardLabel}>💰 My Wallet</Text>
          <Pressable onPress={() => setBalanceVisible((v) => !v)} hitSlop={10} style={wStyles.eyeBtn}>
            <Text style={wStyles.eyeIcon}>{balanceVisible ? "🙈" : "👁️"}</Text>
          </Pressable>
        </View>

        <View style={wStyles.balanceRow}>
          <View style={wStyles.balanceBlock}>
            <Text style={wStyles.balanceSubLabel}>Current Balance</Text>
            <Text style={wStyles.balanceValue}>
              {balanceVisible ? money(balance) : "₦••••••"}
            </Text>
          </View>
          <View style={wStyles.divider} />
          <View style={wStyles.balanceBlock}>
            <Text style={wStyles.balanceSubLabel}>Total Earned</Text>
            <Text style={wStyles.balanceValue}>
              {balanceVisible ? money(wallet.totalEarned) : "₦••••••"}
            </Text>
          </View>
        </View>

        <Pressable
          style={wStyles.withdrawBtn}
          onPress={() => setShowWithdraw(true)}
        >
          <Text style={wStyles.withdrawBtnText}>💸  Withdraw Funds</Text>
        </Pressable>
      </View>

      <WithdrawFundsModal
        visible={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        balance={wallet.balance}
        isDark={isDark}
        theme={t}
        banks={banks}
        loadingBanks={loadingBanks}
        fetchBanks={fetchBanks}
        resolveAccount={resolveAccount}
        resolving={resolving}
        resolvedName={resolvedName}
        resolveError={resolveError}
        resetResolve={resetResolve}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </>
  );
};

const wStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    gap: 16,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  eyeIcon: { fontSize: 16 },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  balanceBlock: { flex: 1, gap: 2 },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 16,
  },
  balanceSubLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  balanceValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  withdrawBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  withdrawBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
const DashboardScreen = () => {
  const isDark = useColorScheme() === "dark";
  const t = shopTheme(isDark);
  const shop = shopStore();

  const userId = shop.id;

  const [stats, setStats] = useState<ShopStats | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(shop.isOpen ?? true);
  
  // Order stats state
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    inTransit: 0,
    delivered: 0,
  });

  const [pendingCount, setPendingCount] = useState<number>(shop.pendingCount );
  const [inTransitCount, setinTransitCount] = useState<number>(shop.inTransitCount );
  const [deliveredCount, setDeliveredCount] = useState<number>(shop.deliveredCount );

  console.log("PendingCount ", pendingCount, " inTransitCount ", inTransitCount + " shop.pendingCOunt " , shop.pendingCount);
  const load = useCallback(async () => {
    if (!shop.id) return;
    try {
      const [statsRes, followersRes] = await Promise.all([
        getShopStatsApi(shop.id),
        getShopFollowersApi(shop.id),
      ]);
      setStats(statsRes);
      setFollowers(followersRes);
      shop.setFollowers(statsRes.followers);
      shop.setProductCount(statsRes.totalProducts);
      
      // Mock order stats - replace with real API call
      setOrderStats({
        pending: Math.floor(Math.random() * 10),
        inTransit: Math.floor(Math.random() * 15),
        delivered: statsRes.totalSales || 0,
      });
    } catch (e) {
      console.log("[dashboard] load failed", e);
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

  const handleToggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (shop.setIsOpen) shop.setIsOpen(next);
    openToggle(shop.id, next);
    Alert.alert(
      next ? "Shop is now Open 🟢" : "Shop is now Closed 🔴",
      next
        ? "Buyers can see and purchase your products."
        : "Your shop is hidden from buyers until you reopen.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <ScreenRings isDark={isDark} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />
        }
      >
        {/* ── Shop header ── */}
        <View style={s.header}>
          <View style={[s.avatar, { borderColor: t.border, backgroundColor: t.card }]}>
            {shop.imageUrl ? (
              <Image source={{ uri: shop.imageUrl }} style={s.avatarImg} />
            ) : (
              <Text style={{ fontSize: 26 }}>🏪</Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[s.greeting, { color: t.subText }]}>Welcome back</Text>
            <Text style={[s.shopName, { color: t.text }]} numberOfLines={1}>
              {shop.name || "Your Shop"}
            </Text>
            <Text style={[s.owner, { color: t.subText }]} numberOfLines={1}>
              {shop.ownerName}
            </Text>
          </View>

          <Pressable
            onPress={handleToggleOpen}
            style={[
              s.toggleBtn,
              { backgroundColor: isOpen ? GREEN : (isDark ? "#3a1a1a" : "#fdecea") },
            ]}
          >
            <View style={[s.statusDot, { backgroundColor: isOpen ? "#fff" : "#e53935" }]} />
            <Text
              style={[
                s.toggleBtnText,
                { color: isOpen ? "#fff" : "#e53935" },
              ]}
            >
              {isOpen ? "Open" : "Closed"}
            </Text>
          </Pressable>
        </View>

        {/* ── Wallet card ── */}
        {userId && <WalletCard userId={userId} isDark={isDark} t={t} />}

        {/* ── Followers Section ──
        <FollowersSection
          followers={followers}
          isDark={isDark}
          theme={t}
          totalFollowers={stats?.followers ?? shop.followers}
        />  */}

        {/* ── Order Stats Section ── */}
        <OrderStatsSection
          pendingCount={pendingCount}//}
          inTransitCount={inTransitCount } //orderStats.inTransit}
          deliveredCount={deliveredCount} // orderStats.delivered}
          isDark={isDark}
          theme={t}
        />

          {/* ── Quick actions ── */}
        <Text style={[s.sectionTitle, { color: t.text }]}>⚡ Quick Actions</Text>
        <View style={s.actions}>
          <ActionTile
            label="Add Product"
            icon="➕"
            onPress={() => router.push("/CreateProduct/ProductFormScreen")}
            t={t}
          />
          <ActionTile
            label="My Products"
            icon="📦"
            onPress={() => router.push("/(shop)/ProductsScreen")}
            t={t}
          />
          <ActionTile
            label="Messages"
            icon="💬"
            onPress={() => router.push("/(shop)/MessagesScreen")}
            t={t}
          />
          <ActionTile
            label="Settings"
            icon="⚙️"
            onPress={() => router.push("/(shop)/ShopProfileScreen")}
            t={t}
          />
        </View>


        {/* ── Key Metrics (Clickable) ── */}
        <Text style={[s.sectionTitle, { color: t.text }]}>📊 Key Metrics</Text>
        <View style={s.metricsGrid}>
          <ClickableStatTile
            label="Products"
            value={String(stats?.totalProducts ?? shop.productCount)}
            emoji="📦"
            isDark={isDark}
            theme={t}
            onPress={() => router.push("/(shop)/ProductsScreen")}
          />
          <ClickableStatTile
            label="Total Views"
            value={String(stats?.totalViews ?? 0)}
            emoji="👁️"
            isDark={isDark}
            theme={t}
            onPress={() => router.push("/(shop)/AnalyticsScreen")}
          />
         {/*} <ClickableStatTile
            label="Reactions"
            value={String(stats?.reactions ?? 0)}
            emoji="❤️"
            isDark={isDark}
            theme={t}
            onPress={() => router.push("/(shop)/ReactionsScreen")}
          /> */}
          <ClickableStatTile
            label="Followers"
            value={String(stats?.followers ?? shop.followers)}
            emoji="👥"
            isDark={isDark}
            theme={t}
            onPress={() => router.push("/Followers/FollowersScreen")}
          />
        </View>

      
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────
// Action Tile
// ─────────────────────────────────────────────
const ActionTile = ({
  label,
  icon,
  onPress,
  t,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  t: ReturnType<typeof shopTheme>;
}) => (
  <Pressable
    onPress={onPress}
    style={[s.tile, { backgroundColor: t.card, borderColor: t.border }]}
  >
    <Text style={{ fontSize: 22 }}>{icon}</Text>
    <Text style={[s.tileLabel, { color: t.text }]}>{label}</Text>
  </Pressable>
);

export default DashboardScreen;

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, paddingBottom: 20 },
  scroll: { paddingHorizontal: 20, paddingTop: 64 },

  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  greeting: { fontSize: 12, fontWeight: "600" },
  shopName: { fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  owner: { fontSize: 12 },

  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 16,
    marginBottom: 12,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 18,
  },

  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  tile: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tileLabel: { fontSize: 13, fontWeight: "700" },
});