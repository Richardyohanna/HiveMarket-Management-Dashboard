import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  useColorScheme,
  SafeAreaView,
  StatusBar,
  TextInput,
  RefreshControl,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import * as Location from "expo-location";
import { Follower } from "@/hivemarket-shop-dashboard/src/types/Follower";
import getAllShopFollowers from "@/hivemarket-shop-dashboard/src/api/followerApi";
import { useShopStore } from "@/hivemarket-shop-dashboard/src/hooks/useShopStore";
import { shopStore } from "@/hivemarket-shop-dashboard/src/store/shopStore";
// ─── Types ────────────────────────────────────────────────────────────────────



// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Haversine formula — returns distance in km */
function getDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/** Initials fallback for avatar */
function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/** Colour from name (deterministic) */
function avatarColor(name: string): string {
  const palette = [
    "#008100", "#00695c", "#e65100", "#1565c0",
    "#6a1b9a", "#ad1457", "#2e7d32", "#004d40",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_FOLLOWERS: Follower[] = [
  { id: "f1", name: "Chioma Okafor", avatarUrl: null, university: "University of Abuja", state: "FCT", city: "Abuja", coordinates: { lat: 9.0057, lng: 7.4898 }, followedAt: "2025-06-01T10:00:00Z", isActive: true },
  { id: "f2", name: "Emeka Nwosu", avatarUrl: null, university: "UNILAG", state: "Lagos", city: "Yaba", coordinates: { lat: 6.5158, lng: 3.3784 }, followedAt: "2025-05-20T08:30:00Z", isActive: false },
  { id: "f3", name: "Fatima Bello", avatarUrl: null, university: "ABU Zaria", state: "Kaduna", city: "Zaria", coordinates: { lat: 11.0748, lng: 7.6892 }, followedAt: "2025-06-10T15:45:00Z", isActive: true },
  { id: "f4", name: "Tunde Adeyemi", avatarUrl: null, university: "OAU Ile-Ife", state: "Osun", city: "Ile-Ife", coordinates: { lat: 7.5227, lng: 4.5198 }, followedAt: "2025-04-15T09:00:00Z", isActive: false },
  { id: "f5", name: "Ngozi Eze", avatarUrl: null, university: "UNIBEN", state: "Edo", city: "Benin City", coordinates: { lat: 6.3350, lng: 5.6037 }, followedAt: "2025-06-18T12:00:00Z", isActive: true },
  { id: "f6", name: "Ibrahim Suleiman", avatarUrl: null, university: "BUK", state: "Kano", city: "Kano", coordinates: { lat: 11.9964, lng: 8.5167 }, followedAt: "2025-03-30T07:00:00Z", isActive: false },
  { id: "f7", name: "Adaeze Obi", avatarUrl: null, university: "UNIZIK", state: "Anambra", city: "Awka", coordinates: { lat: 6.2104, lng: 7.0683 }, followedAt: "2025-06-25T16:20:00Z", isActive: true },
  { id: "f8", name: "Yusuf Garba", avatarUrl: null, university: "Usmanu Danfodiyo University", state: "Sokoto", city: "Sokoto", coordinates: { lat: 13.0535, lng: 5.2224 }, followedAt: "2025-05-05T11:00:00Z", isActive: false },
  { id: "f9", name: "Blessing Otu", avatarUrl: null, university: "University of Calabar", state: "Cross River", city: "Calabar", coordinates: { lat: 4.9517, lng: 8.3220 }, followedAt: "2025-06-28T09:00:00Z", isActive: true },
  { id: "f10", name: "Chidi Anyanwu", avatarUrl: null, university: "FUTO", state: "Imo", city: "Owerri", coordinates: { lat: 5.4846, lng: 7.0351 }, followedAt: "2025-06-22T14:30:00Z", isActive: false },
];

type SortKey = "distance" | "recent" | "name";

// ─── Avatar Component ─────────────────────────────────────────────────────────

const Avatar = ({ follower, size = 52 }: { follower: Follower; size?: number }) => {
  if (follower.avatarUrl) {
    return (
      <Image
        source={{ uri: follower.avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View style={[
      avatarStyles.fallback,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(follower.name) },
    ]}>
      <Text style={[avatarStyles.initials, { fontSize: size * 0.33 }]}>{initials(follower.name)}</Text>
    </View>
  );
};

const avatarStyles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
  initials: { color: "#fff", fontWeight: "800" },
});

// ─── Follower Card ────────────────────────────────────────────────────────────

const FollowerCard = ({
  follower,
  distanceKm,
  isDark,
  onPress,
}: {
  follower: Follower;
  distanceKm: number | null;
  isDark: boolean;
  onPress: () => void;
}) => {
  const cardBg = isDark ? "#141414" : "#ffffff";
  const border = isDark ? "#202020" : "#f0f0f0";
  const textPrimary = isDark ? "#f0f0f0" : "#1a1a1a";
  const textSecondary = isDark ? "#777" : "#999";
  const distanceColor = distanceKm !== null && distanceKm < 5
    ? "#008100"
    : distanceKm !== null && distanceKm < 50
    ? "#00695c"
    : isDark ? "#777" : "#999";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        cardStyles.card,
        { backgroundColor: cardBg, borderColor: border, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      {/* Avatar + online dot */}
      <View style={cardStyles.avatarWrap}>
        <Avatar follower={follower} size={52} />
        {follower.isActive && (
          <View style={[cardStyles.onlineDot, { borderColor: cardBg }]} />
        )}
      </View>

      {/* Info */}
      <View style={cardStyles.info}>
        <Text style={[cardStyles.name, { color: textPrimary }]} numberOfLines={1}>
          {follower.name}
        </Text>

        <View style={cardStyles.uniRow}>
          <Text style={{ fontSize: 11 }}>🎓</Text>
          <Text style={[cardStyles.uni, { color: "#008100" }]} numberOfLines={1}>
            {follower.university}
          </Text>
        </View>

        <View style={cardStyles.locationRow}>
          <Text style={{ fontSize: 11 }}>📍</Text>
          <Text style={[cardStyles.location, { color: textSecondary }]} numberOfLines={1}>
            {follower.city}, {follower.state}
          </Text>
        </View>

        <Text style={[cardStyles.followedAt, { color: textSecondary }]}>
          Followed {fmtDate(follower.followedAt)}
        </Text>
      </View>

      {/* Right — distance + chevron */}
      <View style={cardStyles.right}>
        {distanceKm !== null ? (
          <>
            <Text style={[cardStyles.distanceValue, { color: distanceColor }]}>
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}` : distanceKm < 10 ? distanceKm.toFixed(1) : `${Math.round(distanceKm)}`}
            </Text>
            <Text style={[cardStyles.distanceUnit, { color: distanceColor }]}>
              {distanceKm < 1 ? "m" : "km"}
            </Text>
          </>
        ) : (
          <Text style={[cardStyles.distanceUnit, { color: textSecondary }]}>—</Text>
        )}
        <Text style={[cardStyles.chevron, { color: isDark ? "#444" : "#ccc" }]}>›</Text>
      </View>
    </Pressable>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarWrap: { position: "relative", flexShrink: 0 },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#008100",
    borderWidth: 2,
  },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: "700" },
  uniRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  uni: { fontSize: 12, fontWeight: "600", flex: 1 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 12, flex: 1 },
  followedAt: { fontSize: 11, marginTop: 2 },
  right: { alignItems: "center", gap: 0, minWidth: 44, flexShrink: 0 },
  distanceValue: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  distanceUnit: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  chevron: { fontSize: 22, fontWeight: "300", marginTop: 4 },
});

// ─── Sort / Filter bar ────────────────────────────────────────────────────────

const SortBar = ({
  active,
  onChange,
  isDark,
}: {
  active: SortKey;
  onChange: (k: SortKey) => void;
  isDark: boolean;
}) => {
  const options: { key: SortKey; label: string; icon: string }[] = [
    { key: "distance", label: "Nearest", icon: "📍" },
    { key: "recent", label: "Recent", icon: "🕐" },
    { key: "name", label: "A – Z", icon: "🔤" },
  ];
  return (
    <View style={sortStyles.row}>
      {options.map((o) => {
        const isActive = active === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[
              sortStyles.pill,
              {
                backgroundColor: isActive ? "#008100" : (isDark ? "#1a1a1a" : "#f0f0f0"),
                borderColor: isActive ? "#008100" : (isDark ? "#2a2a2a" : "#e5e5e5"),
              },
            ]}
          >
            <Text style={sortStyles.pillIcon}>{o.icon}</Text>
            <Text style={[sortStyles.pillLabel, { color: isActive ? "#fff" : (isDark ? "#aaa" : "#555") }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const sortStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillIcon: { fontSize: 12 },
  pillLabel: { fontSize: 13, fontWeight: "600" },
});

// ─── Stats bar ────────────────────────────────────────────────────────────────

const StatsBar = ({
  total,
  online,
  nearbyCount,
  isDark,
}: {
  total: number;
  online: number;
  nearbyCount: number;
  isDark: boolean;
}) => {
  const bg = isDark ? "#0a2e0a" : "#e8f5e9";
  const border = isDark ? "#2d5a2d" : "#c8e6c9";
  const textSecondary = isDark ? "#888" : "#999";

  const items = [
    { label: "Followers", value: total, color: isDark ? "#66bb6a" : "#008100" },
    { label: "Online now", value: online, color: isDark ? "#4db6ac" : "#00695c" },
    { label: "Nearby", value: nearbyCount, color: isDark ? "#ff8a50" : "#e65100" },
  ];

  return (
    <View style={[statsBarStyles.wrap, { backgroundColor: bg, borderColor: border }]}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <View style={[statsBarStyles.div, { backgroundColor: border }]} />}
          <View style={statsBarStyles.stat}>
            <Text style={[statsBarStyles.val, { color: item.color }]}>{item.value}</Text>
            <Text style={[statsBarStyles.label, { color: textSecondary }]}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
};

const statsBarStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  val: { fontSize: 20, fontWeight: "800" },
  label: { fontSize: 11, fontWeight: "600" },
  div: { width: 1, marginVertical: 4 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FollowersScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const shop = shopStore();

  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "denied">("loading");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("distance");

  const bg = isDark ? "#0d0d0d" : "#f2f2f2";
  const inputBg = isDark ? "#1a1a1a" : "#ffffff";
  const inputBorder = isDark ? "#252525" : "#e8e8e8";
  const textPrimary = isDark ? "#f0f0f0" : "#1a1a1a";
  const textSecondary = isDark ? "#666" : "#aaa";

  // Get seller's location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationStatus("denied");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setMyLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setLocationStatus("granted");
    })();
  }, []);

  const fetchFollowers = useCallback(async () => {
    // TODO: GET /api/seller/followers
    //await new Promise((r) => setTimeout(r, 600));

    const data = await getAllShopFollowers(shop.id);

    setFollowers(data);
  }, []);

  useEffect(() => {
    fetchFollowers().finally(() => setLoading(false));
  }, [fetchFollowers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFollowers();
    setRefreshing(false);
  }, [fetchFollowers]);

  // Compute distance for each follower
  const withDistance = followers.map((f) => ({
    ...f,
    distanceKm: myLocation
      ? getDistanceKm(myLocation.lat, myLocation.lng, f.coordinates.lat, f.coordinates.lng)
      : null,
  }));

  // Filter by search
  const filtered = withDistance.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.university.toLowerCase().includes(q) ||
      f.city.toLowerCase().includes(q) ||
      f.state.toLowerCase().includes(q)
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "distance") {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    }
    if (sortKey === "recent") {
      return new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime();
    }
    return a.name.localeCompare(b.name);
  });

  const onlineCount = followers.filter((f) => f.isActive).length;
  const nearbyCount = withDistance.filter((f) => f.distanceKm !== null && f.distanceKm < 10).length;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Stack.Screen
        options={{
          title: "Followers",
          headerStyle: { backgroundColor: isDark ? "#0d0d0d" : "#f2f2f2" },
          headerTintColor: isDark ? "#f0f0f0" : "#1a1a1a",
          headerShadowVisible: false,
        }}
      />

      {/* Search */}
      <View style={[s.searchWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, university, city…"
          placeholderTextColor={textSecondary}
          style={[s.searchInput, { color: textPrimary }]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Text style={[s.clearBtn, { color: textSecondary }]}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Location denied notice */}
      {locationStatus === "denied" && (
        <View style={[s.locationBanner, { backgroundColor: isDark ? "#3a2600" : "#fff3e0", borderColor: isDark ? "#663300" : "#ffe0b2" }]}>
          <Text style={{ fontSize: 14 }}>📍</Text>
          <Text style={[s.locationText, { color: isDark ? "#ff8a50" : "#e65100" }]}>
            Enable location to see how far each follower is from you
          </Text>
        </View>
      )}

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#008100" />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(f) => f.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#008100" colors={["#008100"]} />
          }
          ListHeaderComponent={
            <>
              {/* Stats */}
              {!search && (
                <View style={{ paddingTop: 4 }}>
                  <StatsBar
                    total={followers.length}
                    online={onlineCount}
                    nearbyCount={nearbyCount}
                    isDark={isDark}
                  />
                </View>
              )}
              {/* Sort bar */}
              <SortBar active={sortKey} onChange={setSortKey} isDark={isDark} />

              {/* Results label */}
              {search.length > 0 && (
                <Text style={[s.resultsLabel, { color: textSecondary }]}>
                  {sorted.length} result{sorted.length !== 1 ? "s" : ""} for "{search}"
                </Text>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ fontSize: 44 }}>👥</Text>
              <Text style={[s.emptyTitle, { color: textPrimary }]}>
                {search ? "No matches" : "No followers yet"}
              </Text>
              <Text style={[s.emptyBody, { color: textSecondary }]}>
                {search
                  ? "Try a different name, university, or location."
                  : "When students follow your shop, they'll show up here."}
              </Text>
            </View>
          }
          contentContainerStyle={[s.list, sorted.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FollowerCard
              follower={item}
              distanceKm={item.distanceKm}
              isDark={isDark}
              onPress={() => {
                // TODO: router.push(`/(shop)/FollowerProfile?id=${item.id}`)
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14 },
  clearBtn: { fontSize: 14, padding: 2 },
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  locationText: { fontSize: 12, fontWeight: "600", flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  resultsLabel: { fontSize: 13, paddingHorizontal: 16, paddingBottom: 8 },
});