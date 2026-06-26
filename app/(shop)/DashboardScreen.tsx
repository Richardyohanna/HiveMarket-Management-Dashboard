import { getShopFollowersApi, getShopStatsApi } from "../../hivemarket-shop-dashboard/src/api/shopApi";
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
// Wallet sub-component (dashboard-native style)
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
      {/* Wallet card — same green-card style as the followers highlight */}
      <View style={[wStyles.card, { backgroundColor: GREEN }]}>
        {/* Top row: label + eye toggle */}
        <View style={wStyles.topRow}>
          <Text style={wStyles.cardLabel}>💰 My Wallet</Text>
          <Pressable onPress={() => setBalanceVisible((v) => !v)} hitSlop={10} style={wStyles.eyeBtn}>
            <Text style={wStyles.eyeIcon}>{balanceVisible ? "🙈" : "👁️"}</Text>
          </Pressable>
        </View>

        {/* Balance + earned row */}
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

        {/* Withdraw button */}
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
interface DashboardScreenProps {
  /** Pass true when the logged-in user has a seller role */
  isSeller?: boolean;
  /** The logged-in user's id (needed for wallet) */
  userId?: string;
}

const DashboardScreen = () => {
  const isDark = useColorScheme() === "dark";
  const t = shopTheme(isDark);
  const shop = shopStore();

  const userId = shop.id;

  const [stats, setStats] = useState<ShopStats | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  // Shop open / closed toggle state
  const [isOpen, setIsOpen] = useState<boolean>(shop.isOpen ?? true);

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
    } catch (e) {
      console.log("[v0] dashboard load failed", e);
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
    // Persist to store / API if your shopStore supports it
    if (shop.setIsOpen) shop.setIsOpen(next);
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

          {/* Open / Close toggle — replaces the old ＋ button */}
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


        {/* ── Wallet card (sellers only) ── */}
        { userId && (
          <WalletCard userId={userId} isDark={isDark} t={t} />
        )}

        {/* ── Stat grid ──         <StatCard
            label="Revenue"
            value={money(stats?.revenue ?? 0)}
            accent
            isDark={isDark}
            wide
          />   */}
        <View style={s.grid}>
          <StatCard label="Products" value={String(stats?.totalProducts ?? shop.productCount)} isDark={isDark} />
          <StatCard label="Total views" value={String(stats?.totalViews ?? 0)} isDark={isDark} />
          <StatCard label="Sales" value={String(stats?.totalSales ?? 0)} isDark={isDark} />
          <StatCard label="Reactions" value={String(stats?.reactions ?? 0)} isDark={isDark} />
  
        </View>

        {/* ── Followers highlight ── */}
        <View style={[s.followCard, { backgroundColor: GREEN }]}>
          <View>
            <Text style={s.followLabel}>Followers</Text>
            <Text style={s.followValue}>
              {(stats?.followers ?? shop.followers).toLocaleString()}
            </Text>
          </View>
          {/* Stacked follower avatars */}
          <View style={s.avatarStack}>
            {followers.slice(0, 4).map((f, i) => (
              <View key={f.id} style={[s.stackItem, { right: i * 18 }]}>
                {f.profile_picture ? (
                  <Image source={{ uri: f.profile_picture }} style={s.stackImg} />
                ) : (
                  <Text style={{ fontSize: 14 }}>👤</Text>
                )}
              </View>
            ))}
            {followers.length > 4 && (
              <View style={[s.stackMore, { right: 4 * 18 }]}>
                <Text style={s.stackMoreText}>+{followers.length - 4}</Text>
              </View>
            )}
          </View>
        </View>


        {/* ── Quick actions ── */}
        <Text style={[s.sectionTitle, { color: t.text }]}>Quick actions</Text>
        <View style={s.actions}>
          <ActionTile
            label="Add product"
            icon="➕"
            onPress={() => router.push("/(shop)/ProductFormScreen")}
            t={t}
          />
          <ActionTile
            label="My products"
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
            label="Shop settings"
            icon="⚙️"
            onPress={() => router.push("/(shop)/ShopProfileScreen")}
            t={t}
          />
        </View>

        {/* ── Recent followers list ── */}
        <Text style={[s.sectionTitle, { color: t.text }]}>Recent followers</Text>
        {followers.length === 0 ? (
          <Text style={[s.empty, { color: t.subText }]}>No followers yet.</Text>
        ) : (
          followers.slice(0, 6).map((f) => (
            <View
              key={f.id}
              style={[s.followerRow, { backgroundColor: t.card, borderColor: t.border }]}
            >
              <View style={[s.followerAvatar, { borderColor: t.border }]}>
                {f.profile_picture ? (
                  <Image source={{ uri: f.profile_picture }} style={s.followerImg} />
                ) : (
                  <Text style={{ fontSize: 16 }}>👤</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.followerName, { color: t.text }]}>{f.full_name}</Text>
                {f.university ? (
                  <Text style={[s.followerSub, { color: t.subText }]}>{f.university}</Text>
                ) : null}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────
// Action tile
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
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 64 },

  /* ── Header ── */
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

  /* Open / Close toggle button */
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

  /* ── Followers card ── */
  followCard: {
    borderRadius: 22,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    overflow: "hidden",
  },
  followLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  followValue: { color: "#fff", fontSize: 38, fontWeight: "900", letterSpacing: -1 },
  avatarStack: { flexDirection: "row", height: 38, width: 120, position: "relative" },
  stackItem: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  stackImg: { width: "100%", height: "100%" },
  stackMore: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  stackMoreText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  /* ── Stat grid ── */
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },

  /* ── Section titles ── */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 10,
    marginBottom: 12,
  },

  /* ── Quick action tiles ── */
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

  /* ── Followers list ── */
  empty: { fontSize: 13, paddingVertical: 16, textAlign: "center" },
  followerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  followerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  followerImg: { width: "100%", height: "100%" },
  followerName: { fontSize: 14, fontWeight: "700" },
  followerSub: { fontSize: 12 },
});