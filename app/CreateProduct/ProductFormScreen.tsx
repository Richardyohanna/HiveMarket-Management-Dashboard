 import {
  //createShopProductApi,
  updateShopProductApi,
  //uploadShopProductImagesApi,
} from "../../hivemarket-shop-dashboard/src/api/shopApi"; 

import { createProductOnlyApi, uploadProductImagesApi } from "@/hivemarket-shop-dashboard/src/api/productApi";

import { shopStore } from "../../hivemarket-shop-dashboard/src/store/shopStore";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Field, GREEN, ScreenRings, ShimmerButton, shopTheme } from "../../hivemarket-shop-dashboard/app/Shop/components/ui";

const CATEGORIES = [
  "Electronics", "Books", "Fashion", "Hostel & Rooms", "Beauty & Care",
  "Food & Snacks", "Services", "Accessories", "Sports & Fitness",
  "Furniture", "Vehicles", "Others",
];

const CONDITIONS = ["NEW", "LIKE NEW", "UK USED", "GOOD", "FAIR", "USED"];

const ProductFormScreen = () => {
  const isDark = useColorScheme() === "dark";
  const t = shopTheme(isDark);
  const shop = shopStore();
  const params = useLocalSearchParams<{
    id?: string;
    pName?: string;
    pDetail?: string;
    pAmount?: string;
    pDiscount?: string;
    pCondition?: string;
    pQuantity?: string;
    category?: string;
    location?: string;
    image?: string;
  }>();

  const isEdit = !!params.id;

  const [pName, setPName] = useState(params.pName ?? "");
  const [pDetail, setPDetail] = useState(params.pDetail ?? "");
  const [pAmount, setPAmount] = useState(params.pAmount ?? "");
  const [pDiscount, setPDiscount] = useState(params.pDiscount ?? "");
  const [pQuantity, setPQuantity] = useState(params.pQuantity ?? "1");
  const [category, setCategory] = useState(params.category ?? "");
  const [condition, setCondition] = useState(params.pCondition ?? "NEW");
  const [location, setLocation] = useState(params.location ?? shop.location?.address ?? "");
  const [images, setImages] = useState<string[]>(params.image ? [params.image] : []);
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!pName.trim() || !pAmount.trim() || !category) {
      Alert.alert("Validation Error", "Name, price and category are required.");
      return;
    }
    if (!shop.id) {
      Alert.alert("Error", "No shop session found. Please log in again.");
      return;
    }

    const payload = {
      pName: pName.trim(),
      pDetail: pDetail.trim(),
      pAmount: Number(pAmount),
      pDiscount: pDiscount ? Number(pDiscount) : 0,
      pCondition: condition,
      pQuantity: Number(pQuantity) || 1,
      category,
      location: shop.location,
      shopId: shop.id,
    };

    try {
      setLoading(true);
      const product = //isEdit
        //? console.log("Updating")//await updateShopProductApi(params.id!, payload) :
        await createProductOnlyApi(payload) //createShopProductApi(payload);

      const newImages = images.filter((uri) => uri && !uri.startsWith("http"));
      if (newImages.length > 0) {
        await uploadProductImagesApi(product.id, newImages); //uploadShopProductImagesApi(product.id, newImages);
      }

      Alert.alert("Success", isEdit ? "Product updated." : "Product published.");
      router.replace("/(shop)/ProductsScreen");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: t.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenRings isDark={isDark} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={[s.backBtn, { borderColor: t.border, backgroundColor: t.card }]}>
            <Text style={{ fontSize: 16, color: t.text }}>←</Text>
          </Pressable>
          <Text style={[s.title, { color: t.text }]}>{isEdit ? "Edit product" : "Add product"}</Text>
        </View>

        {/* Images */}
        <Text style={[s.groupLabel, { color: t.label }]}>PHOTOS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.imgRow}>
          <Pressable onPress={pickImages} style={[s.addImg, { borderColor: t.inputBorder, backgroundColor: t.inputBg }]}>
            <Text style={{ fontSize: 24, color: GREEN }}>＋</Text>
            <Text style={[s.addImgText, { color: t.subText }]}>Add</Text>
          </Pressable>
          {images.map((uri, i) => (
            <View key={`${uri}-${i}`} style={s.imgWrap}>
              <Image source={{ uri }} style={s.img} />
              <Pressable onPress={() => removeImage(i)} style={s.removeImg}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>✕</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {/* Card */}
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <Field label="Product name" placeholder="e.g. Wireless headphones" value={pName} onChangeText={setPName} isDark={isDark} />
          <Field label="Description" placeholder="Describe your product" value={pDetail} onChangeText={setPDetail} isDark={isDark} multiline />

          <View style={s.twoCol}>
            <View style={{ flex: 1 }}>
              <Field label="Price (ETB)" placeholder="0" value={pAmount} onChangeText={setPAmount} keyboardType="numeric" isDark={isDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Discount %" placeholder="0" value={pDiscount} onChangeText={setPDiscount} keyboardType="numeric" isDark={isDark} />
            </View>
          </View>

          <Field label="Quantity" placeholder="1" value={pQuantity} onChangeText={setPQuantity} keyboardType="numeric" isDark={isDark} />
          <Field label="Location" placeholder="Where buyers can collect" value={location} onChangeText={setLocation} icon="📍" isDark={isDark} />

          {/* Category chips */}
          <Text style={[s.groupLabel, { color: t.label, marginTop: 4 }]}>CATEGORY</Text>
          <View style={s.chips}>
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[s.chip, { borderColor: active ? GREEN : t.inputBorder, backgroundColor: active ? GREEN : t.inputBg }]}
                >
                  <Text style={[s.chipText, { color: active ? "#fff" : t.subText }]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Condition chips */}
          <Text style={[s.groupLabel, { color: t.label, marginTop: 14 }]}>CONDITION</Text>
          <View style={s.chips}>
            {CONDITIONS.map((c) => {
              const active = condition === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCondition(c)}
                  style={[s.chip, { borderColor: active ? GREEN : t.inputBorder, backgroundColor: active ? GREEN : t.inputBg }]}
                >
                  <Text style={[s.chipText, { color: active ? "#fff" : t.subText }]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: 18 }} />
          <ShimmerButton
            label={loading ? "Saving…" : isEdit ? "Update product" : "Publish product"}
            onPress={handleSubmit}
            loading={loading}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProductFormScreen;

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 60 },

  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },

  groupLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.9, marginBottom: 10 },

  imgRow: { gap: 10, paddingBottom: 18 },
  addImg: {
    width: 84,
    height: 84,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  addImgText: { fontSize: 11, fontWeight: "600" },
  imgWrap: { position: "relative" },
  img: { width: 84, height: 84, borderRadius: 16 },
  removeImg: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#e53935",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  card: { borderRadius: 24, borderWidth: 1, padding: 22 },
  twoCol: { flexDirection: "row", gap: 12 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 12, fontWeight: "600" },
});
