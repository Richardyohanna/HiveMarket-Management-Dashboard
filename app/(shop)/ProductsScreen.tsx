import { deleteProductByIdApi } from "../../hivemarket-shop-dashboard/src/api/productApi";
import { useShopStore } from "../../hivemarket-shop-dashboard/src/hooks/useShopStore";
import { shopStore } from "../../hivemarket-shop-dashboard/src/store/shopStore";
import { RecentListingItem } from "../../hivemarket-shop-dashboard/src/types/products";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { GREEN, shopTheme } from "../../hivemarket-shop-dashboard/app/Shop/components/ui";
import { userStore } from "@/hivemarket-shop-dashboard/src/store/userStore";

const ProductsScreen = () => {
  const isDark = useColorScheme() === "dark";
  const t = shopTheme(isDark);
  const shop = shopStore();

  const user = userStore.getState();

  const { products, loading, error, refetch } = useShopStore(user.id, shop.id || null);
  const [query, setQuery] = useState("");
  const [defaultLoading, setDefaultLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {

    setDefaultLoading(loading);
    refetch();

  }, [])

  const filtered = useMemo(
    () =>
      products.filter((p: any) =>
        p.pName.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [products, query]
  );

  const onScroll = () => {

    setDefaultLoading(true)
    refetch()
    setDefaultLoading(false);
  }

  const onEdit = (item: RecentListingItem) => {
    router.push({
      pathname: "/CreateProduct/ProductFormScreen",
      params: {
        id: item.id,
        pName: item.pName,
        pDetail: item.pDetail,
        pAmount: item.pAmount,
        pDiscount: item.pDiscount ?? "",
        pCondition: item.pQuality,
        pQuantity: String(item.pQuantity),
        category: item.category,
        location: item.location?.address,
        image: item.imageUrls?.[0] ?? "",
      },
    });
  };

  const onDelete = (item: RecentListingItem) => {
    Alert.alert("Delete product", `Remove "${item.pName}" from your shop?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingId(item.id);
            await deleteProductByIdApi(item.id);
            await refetch();
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to delete product.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: RecentListingItem }) => (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[s.thumb, { backgroundColor: t.inputBg }]}>
        {item.imageUrls?.[0] ? (
          <Image source={{ uri: item.imageUrls[0] }} style={s.thumbImg} />
        ) : (
          <Text style={{ fontSize: 22 }}>📦</Text>
        )}
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[s.name, { color: t.text }]} numberOfLines={1}>
          {item.pName}
        </Text>
        <Text style={[s.price, { color: GREEN }]}>ETB {item.pAmount}</Text>
        <View style={s.metaRow}>
          <Text style={[s.meta, { color: t.subText }]}>Qty {item.pQuantity}</Text>
          <Text style={[s.dot, { color: t.subText }]}>•</Text>
          <Text style={[s.meta, { color: t.subText }]}>{item.views ?? 0} views</Text>
          <Text style={[s.dot, { color: t.subText }]}>•</Text>
          <Text style={[s.meta, { color: t.subText }]}>{item.reactions ?? 0} likes</Text>
        </View>
      </View>

      <View style={s.actionsCol}>
        <Pressable onPress={() => onEdit(item)} style={[s.iconBtn, { borderColor: t.border }]}>
          <Text style={{ fontSize: 15 }}>✏️</Text>
        </Pressable>
        <Pressable
          onPress={() => onDelete(item)}
          style={[s.iconBtn, { borderColor: "rgba(229,57,53,0.4)" }]}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator size="small" color="#e53935" />
          ) : (
            <Text style={{ fontSize: 15 }}>🗑️</Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: t.text }]}>My products</Text>
          <Text style={[s.sub, { color: t.subText }]}>
            {products.length} item{products.length === 1 ? "" : "s"} listed
          </Text>
        </View>
        <Pressable onPress={() => router.push("/(shop)/ProductFormScreen")} style={s.addBtn}>
          <Text style={s.addBtnText}>＋</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={[s.search, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
        <Text style={{ fontSize: 14 }}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your products"
          placeholderTextColor={t.placeholder}
          style={[s.searchInput, { color: t.text }]}
        />
      </View>

      {defaultLoading ? (
        <View style={s.center}>
          <ActivityIndicator color={GREEN} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={[s.sub, { color: t.subText }]}>{error}</Text>
          <Pressable onPress={refetch} style={s.retry}>
            <Text style={{ color: GREEN, fontWeight: "700" }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onScroll={onScroll}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ fontSize: 34, marginBottom: 8 }}>📦</Text>
              <Text style={[s.title, { color: t.text, fontSize: 16 }]}>No products yet</Text>
              <Text style={[s.sub, { color: t.subText, textAlign: "center" }]}>
                Tap the + button to list your first product.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default ProductsScreen;

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: 64 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  sub: { fontSize: 13, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },
  addBtnText: { color: "#fff", fontSize: 24, fontWeight: "300", marginTop: -2 },

  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: "100%" },
  name: { fontSize: 15, fontWeight: "700" },
  price: { fontSize: 14, fontWeight: "800" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  meta: { fontSize: 11 },
  dot: { fontSize: 11 },

  actionsCol: { gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  center: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 6 },
  retry: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 20 },
});
