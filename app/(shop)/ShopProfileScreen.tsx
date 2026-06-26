import { updateShopApi } from "../../hivemarket-shop-dashboard/src/api/shopApi";
import { removeToken } from "@/hivemarket-shop-dashboard/src/services/authStorage";
import { shopStore } from "../../hivemarket-shop-dashboard/src/store/shopStore";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
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

const ShopProfileScreen = () => {
  const isDark = useColorScheme() === "dark";
  const t = shopTheme(isDark);
  const shop = shopStore();

  const [name, setName] = useState(shop.name);
  const [ownerName, setOwnerName] = useState(shop.ownerName);
  const [phone, setPhone] = useState(shop.phone);
  const [email, setEmail] = useState(shop.email);
  const [address, setAddress] = useState(shop.location?.address ?? "");
  const [coords, setCoords] = useState({
    latitude: shop.location?.latitude ?? 0,
    longitude: shop.location?.longitude ?? 0,
  });
  const [image, setImage] = useState(shop.imageUrl);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.length) setImage(result.assets[0].uri);
  };

  const detectLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const current = await Location.getCurrentPositionAsync({});
    setCoords({ latitude: current.coords.latitude, longitude: current.coords.longitude });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateShopApi({
        id: shop.id,
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        location: { address: address.trim(), latitude: coords.latitude, longitude: coords.longitude },
        image: image && image !== shop.imageUrl ? image : undefined,
      });
      shop.setShop(updated);
      setEditing(false);
      Alert.alert("Saved", "Your shop details have been updated.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update shop.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await removeToken();
          shop.clearShop();
          router.replace("/Shop/ShopLoginScreen");
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: t.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenRings isDark={isDark} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.headerRow}>
          <Text style={[s.title, { color: t.text }]}>Shop settings</Text>
          <Pressable onPress={() => setEditing((e) => !e)}>
            <Text style={[s.editToggle, { color: GREEN }]}>{editing ? "Cancel" : "Edit"}</Text>
          </Pressable>
        </View>

        {/* Logo + identity */}
        <View style={s.identity}>
          <Pressable onPress={editing ? pickImage : undefined} style={[s.logo, { borderColor: t.border, backgroundColor: t.card }]}>
            {image ? <Image source={{ uri: image }} style={s.logoImg} /> : <Text style={{ fontSize: 30 }}>🏪</Text>}
            {editing && (
              <View style={s.logoBadge}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>✎</Text>
              </View>
            )}
          </Pressable>
          <Text style={[s.shopName, { color: t.text }]}>{shop.name}</Text>
          <View style={s.statRow}>
            <Text style={[s.statText, { color: t.subText }]}>
              <Text style={{ color: GREEN, fontWeight: "800" }}>{shop.followers}</Text> followers
            </Text>
            <Text style={[s.statDot, { color: t.subText }]}>•</Text>
            <Text style={[s.statText, { color: t.subText }]}>
              <Text style={{ color: GREEN, fontWeight: "800" }}>{shop.productCount}</Text> products
            </Text>
          </View>
        </View>

        {/* Details card */}
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          {editing ? (
            <>
              <Field label="Shop name" placeholder="Shop name" value={name} onChangeText={setName} icon="🏷️" isDark={isDark} />
              <Field label="Owner name" placeholder="Owner" value={ownerName} onChangeText={setOwnerName} icon="👤" isDark={isDark} />
              <Field label="Phone" placeholder="Phone" value={phone} onChangeText={setPhone} icon="📞" keyboardType="phone-pad" isDark={isDark} />
              <Field label="Email" placeholder="Email" value={email} onChangeText={setEmail} icon="✉" keyboardType="email-address" autoCapitalize="none" isDark={isDark} />
              <Field label="Address" placeholder="Address" value={address} onChangeText={setAddress} icon="📍" isDark={isDark} />
              <Pressable onPress={detectLocation} style={[s.locBtn, { borderColor: t.inputBorder, backgroundColor: t.inputBg }]}>
                <Text style={{ fontSize: 14 }}>🧭</Text>
                <Text style={[s.locText, { color: t.subText }]}>
                  {coords.latitude !== 0 ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : "Update location"}
                </Text>
              </Pressable>
              <View style={{ height: 14 }} />
              <ShimmerButton label={saving ? "Saving…" : "Save changes"} onPress={handleSave} loading={saving} />
            </>
          ) : (
            <>
              <InfoRow label="Owner" value={shop.ownerName} t={t} />
              <InfoRow label="Phone" value={shop.phone} t={t} />
              <InfoRow label="Email" value={shop.email} t={t} />
              <InfoRow label="Address" value={shop.location?.address || "—"} t={t} last />
            </>
          )}
        </View>

        {/* Logout */}
        <Pressable onPress={handleLogout} style={[s.logout, { borderColor: "rgba(229,57,53,0.4)" }]}>
          <Text style={s.logoutText}>Log out</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const InfoRow = ({
  label,
  value,
  t,
  last,
}: {
  label: string;
  value: string;
  t: ReturnType<typeof shopTheme>;
  last?: boolean;
}) => (
  <View style={[s.infoRow, !last && { borderBottomColor: t.border, borderBottomWidth: 1 }]}>
    <Text style={[s.infoLabel, { color: t.subText }]}>{label}</Text>
    <Text style={[s.infoValue, { color: t.text }]} numberOfLines={1}>{value}</Text>
  </View>
);

export default ShopProfileScreen;

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 64 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  editToggle: { fontSize: 14, fontWeight: "700" },

  identity: { alignItems: "center", marginBottom: 20 },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  logoImg: { width: "100%", height: "100%" },
  logoBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  shopName: { fontSize: 20, fontWeight: "900", letterSpacing: -0.4, marginTop: 12 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  statText: { fontSize: 13 },
  statDot: { fontSize: 13 },

  card: { borderRadius: 22, borderWidth: 1, padding: 20, marginBottom: 16 },

  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  infoLabel: { fontSize: 13, fontWeight: "600" },
  infoValue: { fontSize: 14, fontWeight: "700", flex: 1, textAlign: "right", marginLeft: 16 },

  locBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  locText: { fontSize: 13, fontWeight: "600", flex: 1 },

  logout: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  logoutText: { color: "#e53935", fontWeight: "800", fontSize: 14 },
});
