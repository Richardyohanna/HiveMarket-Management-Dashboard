/**
 * RegisterShopScreen.tsx — Enhanced multi-step shop onboarding
 *
 * Step 1: Shop Identity   — name, slogan, logo, banner
 * Step 2: Owner Details   — owner name, phone, email, password
 * Step 3: Location        — address, area name, university, lat/lng
 * Step 4: Shop Type       — products / services / both + categories
 *
 * Design language matches HiveMarket's existing screens:
 *  PRIMARY #008100 · PRIMARY_SOFT #e8f5e9 · PRIMARY_DARK #1a3a1a
 *  Rounded cards · Emoji icons · Green CTAs · Dark mode aware
 */

import { registerShopApi } from "../../hivemarket-shop-dashboard/src/api/shopApi";
import { shopStore } from "../../hivemarket-shop-dashboard/src/store/shopStore";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

// ── Design tokens (matches your HiveMarket system) ────────────────────────────
const PRIMARY      = "#008100";
const PRIMARY_SOFT = "#e8f5e9";
const PRIMARY_DARK = "#1a3a1a";

const TOTAL_STEPS = 4;

// ── Shop type options ─────────────────────────────────────────────────────────
type ShopType = "products" | "services" | "both";

const SHOP_TYPE_OPTIONS: { key: ShopType; label: string; emoji: string; desc: string }[] = [
  { key: "products", label: "Products only",  emoji: "📦", desc: "I sell physical or digital items" },
  { key: "services", label: "Services only",  emoji: "🛠️", desc: "I offer skills, repairs, or consultations" },
  { key: "both",     label: "Products & Services", emoji: "🐝", desc: "I sell items and offer services" },
];

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "electronics",  label: "Electronics",      emoji: "📱" },
  { id: "academics",    label: "Books & Academics", emoji: "📚" },
  { id: "fashion",      label: "Fashion",           emoji: "👗" },
  { id: "food",         label: "Food & Snacks",     emoji: "🍔" },
  { id: "beauty",       label: "Beauty & Care",     emoji: "💄" },
  { id: "services",     label: "Services",          emoji: "🛠️" },
  { id: "accessories",  label: "Accessories",       emoji: "⌚" },
  { id: "sport",        label: "Sports & Fitness",  emoji: "⚽" },
  { id: "hostel",       label: "Hostel & Rooms",    emoji: "🏠" },
  { id: "furniture",    label: "Furniture",         emoji: "🪑" },
  { id: "vehicle",      label: "Vehicles",          emoji: "🚗" },
  { id: "others",       label: "Others",            emoji: "🎁" },
];

// ── Shared Field component (matches your existing Field pattern) ───────────────
const Field = ({
  label, placeholder, value, onChangeText, emoji, isDark, theme,
  secureTextEntry, keyboardType, autoCapitalize, multiline,
  rightSlot, hint,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; emoji: string;
  isDark: boolean; theme: any; secureTextEntry?: boolean;
  keyboardType?: any; autoCapitalize?: any; multiline?: boolean;
  rightSlot?: React.ReactNode; hint?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const animIn  = () => { setFocused(true);  Animated.spring(borderAnim, { toValue: 1, useNativeDriver: false }).start(); };
  const animOut = () => { setFocused(false); Animated.spring(borderAnim, { toValue: 0, useNativeDriver: false }).start(); };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? "#1e293b" : "#e2e8f0", PRIMARY],
  });

  return (
    <View style={fs.wrap}>
      <Text style={[fs.label, { color: isDark ? "#64748b" : "#64748b" }]}>{label}</Text>
      <Animated.View style={[fs.row, {
        backgroundColor: isDark ? "#0f172a" : "#f8fafc",
        borderColor,
        borderWidth: focused ? 1.8 : 1.2,
        minHeight: multiline ? 80 : undefined,
        alignItems: multiline ? "flex-start" : "center",
      }]}>
        <Text style={[fs.emoji, multiline && { marginTop: 12 }]}>{emoji}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#334155" : "#cbd5e1"}
          style={[fs.input, { color: theme.text }, multiline && { height: 70, textAlignVertical: "top" }]}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "sentences"}
          multiline={multiline}
          onFocus={animIn}
          onBlur={animOut}
        />
        {value.length > 0 && !secureTextEntry && !rightSlot && (
          <View style={[fs.check, { backgroundColor: PRIMARY }]}>
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "900" }}>✓</Text>
          </View>
        )}
        {rightSlot}
      </Animated.View>
      {hint && <Text style={[fs.hint, { color: isDark ? "#334155" : "#cbd5e1" }]}>{hint}</Text>}
    </View>
  );
};
const fs = StyleSheet.create({
  wrap:  { gap: 5 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginLeft: 2 },
  row:   { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13 },
  emoji: { fontSize: 16 },
  input: { flex: 1, fontSize: 14 },
  check: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  hint:  { fontSize: 10, marginLeft: 4, marginTop: 1 },
});

// ── Image picker tile ─────────────────────────────────────────────────────────
const ImageTile = ({
  uri, onPress, label, size, radius, isDark,
}: {
  uri: string; onPress: () => void; label: string;
  size: number; radius: number; isDark: boolean;
}) => (
  <Pressable onPress={onPress} style={[
    its.tile,
    { width: size, height: size, borderRadius: radius, borderColor: isDark ? "#1e293b" : "#e2e8f0", backgroundColor: isDark ? "#0f172a" : "#f8fafc" },
  ]}>
    {uri ? (
      <Image source={{ uri }} style={{ width: "100%", height: "100%", borderRadius: radius }} resizeMode="cover" />
    ) : (
      <View style={its.placeholder}>
        <Text style={{ fontSize: size * 0.22 }}>📷</Text>
        <Text style={[its.placeholderLabel, { color: isDark ? "#334155" : "#cbd5e1" }]}>{label}</Text>
      </View>
    )}
    <View style={[its.badge, { backgroundColor: PRIMARY }]}>
      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "900", lineHeight: 14 }}>+</Text>
    </View>
  </Pressable>
);
const its = StyleSheet.create({
  tile:             { borderWidth: 1.5, alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  placeholder:      { alignItems: "center", gap: 4 },
  placeholderLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  badge:            { position: "absolute", bottom: 6, right: 6, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
});

// ── Step indicator dots ───────────────────────────────────────────────────────
const StepDots = ({ current, total, isDark }: { current: number; total: number; isDark: boolean }) => (
  <View style={{ flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" }}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={[
        sd.dot,
        {
          width: i === current - 1 ? 24 : 8,
          backgroundColor: i < current ? PRIMARY : (isDark ? "#1e293b" : "#e2e8f0"),
        },
      ]} />
    ))}
  </View>
);
const sd = StyleSheet.create({
  dot: { height: 8, borderRadius: 4 },
});

// ── Section header ────────────────────────────────────────────────────────────
const SectionHead = ({ emoji, title, sub, isDark, theme }: {
  emoji: string; title: string; sub: string; isDark: boolean; theme: any;
}) => (
  <View style={{ alignItems: "center", gap: 6, marginBottom: 4 }}>
    <View style={[sh.iconBubble, { backgroundColor: isDark ? PRIMARY_DARK : PRIMARY_SOFT }]}>
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
    </View>
    <Text style={[sh.title, { color: theme.text }]}>{title}</Text>
    <Text style={[sh.sub, { color: isDark ? "#475569" : "#94a3b8" }]}>{sub}</Text>
  </View>
);
const sh = StyleSheet.create({
  iconBubble: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title:      { fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  sub:        { fontSize: 13, textAlign: "center", lineHeight: 18, paddingHorizontal: 10 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RegisterShopScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const theme  = {
    text:       isDark ? "#f1f5f9" : "#0f172a",
    subText:    isDark ? "#64748b" : "#94a3b8",
    bg:         isDark ? "#080f08" : "#ffffff",
    card:       isDark ? "#0f172a" : "#ffffff",
    border:     isDark ? "#1e293b" : "#e2e8f0",
    inputBg:    isDark ? "#0f172a" : "#f8fafc",
    readColor:  isDark ? "#64748b" : "#94a3b8",
  };

  const { setAuthenticated } = shopStore();

  // ── Step tracker ─────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Step 1: Identity ─────────────────────────────────────────────────────
  const [shopName,   setShopName]   = useState("");
  const [slogan,     setSlogan]     = useState("");
  const [logoImage,  setLogoImage]  = useState("");
  const [bannerImage,setBannerImage] = useState("");

  // ── Step 2: Owner Details ─────────────────────────────────────────────────
  const [ownerName,    setOwnerName]    = useState("");
  const [phoneNumber,  setPhoneNumber]  = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPass,     setShowPass]     = useState(false);

  // ── Step 3: Location ──────────────────────────────────────────────────────
  const [address,      setAddress]      = useState("");
  const [areaName,     setAreaName]     = useState("");
  const [university,   setUniversity]   = useState("");
  const [userLocation, setUserLocation] = useState({ latitude: 0, longitude: 0 });
  const [locating,     setLocating]     = useState(false);

  // ── Step 4: Shop Type + Categories ───────────────────────────────────────
  const [shopType,     setShopType]     = useState<ShopType>("products");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const hasLocation = userLocation.latitude !== 0 || userLocation.longitude !== 0;

  // ── Image pickers ─────────────────────────────────────────────────────────
  const pickImage = async (setter: (uri: string) => void, aspect: [number, number] = [1, 1]) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission required", "Please allow gallery access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.75, allowsEditing: true, aspect,
    });
    if (!result.canceled && result.assets?.length) setter(result.assets[0].uri);
  };

  // ── Location detection ────────────────────────────────────────────────────
  const detectLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission denied", "Please allow location access."); return; }
      const current = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      const geo = await Location.reverseGeocodeAsync(current.coords);
      if (geo?.[0] && !address) {
        const g = geo[0];
        setAddress([g.name, g.street, g.city].filter(Boolean).join(", "));
      }
    } catch { Alert.alert("Error", "Unable to detect location."); }
    finally { setLocating(false); }
  };

  // ── Category toggle ───────────────────────────────────────────────────────
  const toggleCat = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // ── Step validation ───────────────────────────────────────────────────────
  const validateStep = (): boolean => {
    if (step === 1) {
      if (!shopName.trim()) { Alert.alert("Shop name required", "Give your shop a name."); return false; }
    }
    if (step === 2) {
      if (!ownerName.trim()) { Alert.alert("Owner name required"); return false; }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Alert.alert("Valid email required"); return false;
      }
      if (password.length < 8) { Alert.alert("Password too short", "Use at least 8 characters."); return false; }
      if (!phoneNumber.trim()) { Alert.alert("Phone number required"); return false; }
    }
    if (step === 3) {
      if (!address.trim()) { Alert.alert("Address required", "Add your shop address."); return false; }
      if (!university.trim()) { Alert.alert("University required", "Enter the nearby university."); return false; }
    }
    if (step === 4) {
      if (selectedCats.length === 0) { Alert.alert("Select at least one category"); return false; }
    }
    return true;
  };

  const goNext = () => { if (validateStep()) setStep((s) => Math.min(s + 1, TOTAL_STEPS)); };
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // ── Final submit ──────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validateStep()) return;
    try {
      setLoading(true);
      await registerShopApi({
        name:       shopName.trim(),
        password:   password.trim(),
        ownerName:  ownerName.trim(),
        phone:      phoneNumber.trim(),
        email:      email.trim(),
        slogan:     slogan.trim(),
        shopType,
        categories: selectedCats,
        university: university.trim(),
        areaName:   areaName.trim(),
        location: {
          address:   address.trim(),
          latitude:  userLocation.latitude,
          longitude: userLocation.longitude,
        },
        image:   logoImage,
        banner:  bannerImage,
      });
      setAuthenticated(true);
      Alert.alert("🎉 Shop created!", "Your HiveMarket shop is live.", [
        { text: "Go to Dashboard", onPress: () => router.replace("/Shop/ShopLoginScreen") },
      ]);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── Animated slide ────────────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(0)).current;
  const animateIn = () => {
    slideAnim.setValue(30);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80 }).start();
  };
  const onNext = () => { goNext(); animateIn(); };
  const onBack = () => { goBack(); animateIn(); };

  // ── Render step content ───────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── STEP 1: Shop Identity ───────────────────────────────────────────
      case 1:
        return (
          <View style={styles.stepContent}>
            <SectionHead
              emoji="🏪"
              title="Your shop identity"
              sub="Give your shop a name, personality, and first impression"
              isDark={isDark}
              theme={theme}
            />

            {/* Banner + Logo pickers side-by-side */}
            <View style={styles.imagePickerSection}>
              <View style={styles.imagePickerCol}>
                <Text style={[styles.imagePickerLabel, { color: theme.subText }]}>Shop Banner</Text>
                <ImageTile
                  uri={bannerImage}
                  onPress={() => pickImage(setBannerImage, [16, 9])}
                  label="Add banner"
                  size={160}
                  radius={18}
                  isDark={isDark}
                />
              </View>
              <View style={styles.imagePickerCol}>
                <Text style={[styles.imagePickerLabel, { color: theme.subText }]}>Shop Logo</Text>
                <ImageTile
                  uri={logoImage}
                  onPress={() => pickImage(setLogoImage, [1, 1])}
                  label="Add logo"
                  size={80}
                  radius={20}
                  isDark={isDark}
                />
              </View>
            </View>

            <View style={styles.fields}>
              <Field
                label="Shop Name" placeholder="e.g. Campus Tech Hub" emoji="🏷️"
                value={shopName} onChangeText={setShopName}
                isDark={isDark} theme={theme}
              />
              <Field
                label="Slogan / Motto" placeholder="e.g. Your go-to campus store for quality electronics"
                emoji="✨" value={slogan} onChangeText={setSlogan}
                isDark={isDark} theme={theme} multiline
                hint="Optional · Max 80 characters"
              />
            </View>
          </View>
        );

      // ── STEP 2: Owner Details ───────────────────────────────────────────
      case 2:
        return (
          <View style={styles.stepContent}>
            <SectionHead
              emoji="👤"
              title="About you"
              sub="Tell us who's running this shop"
              isDark={isDark}
              theme={theme}
            />
            <View style={styles.fields}>
              <Field
                label="Owner Name" placeholder="Your full name" emoji="👤"
                value={ownerName} onChangeText={setOwnerName}
                isDark={isDark} theme={theme}
              />
              <Field
                label="Phone Number" placeholder="+234 800 000 0000" emoji="📞"
                value={phoneNumber} onChangeText={setPhoneNumber}
                keyboardType="phone-pad" autoCapitalize="none"
                isDark={isDark} theme={theme}
              />
              <Field
                label="Email Address" placeholder="you@university.edu.ng" emoji="✉️"
                value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none"
                isDark={isDark} theme={theme}
              />
              <Field
                label="Password" placeholder="Min. 8 characters" emoji="🔒"
                value={password} onChangeText={setPassword}
                secureTextEntry={!showPass}
                isDark={isDark} theme={theme}
                rightSlot={
                  <Pressable onPress={() => setShowPass((p) => !p)} hitSlop={10}>
                    <Text style={{ fontSize: 16 }}>{showPass ? "👁️" : "🙈"}</Text>
                  </Pressable>
                }
              />
            </View>
          </View>
        );

      // ── STEP 3: Location ────────────────────────────────────────────────
      case 3:
        return (
          <View style={styles.stepContent}>
            <SectionHead
              emoji="📍"
              title="Where are you based?"
              sub="Help students find your shop on campus"
              isDark={isDark}
              theme={theme}
            />

            {/* Auto-detect button */}
            <Pressable
              onPress={detectLocation}
              style={[styles.locBtn, {
                borderColor: hasLocation ? PRIMARY : (isDark ? "#1e293b" : "#e2e8f0"),
                backgroundColor: hasLocation ? (isDark ? "#0a1f0a" : PRIMARY_SOFT) : (isDark ? "#0f172a" : "#f8fafc"),
              }]}
            >
              <Text style={{ fontSize: 18 }}>{hasLocation ? "✅" : "🧭"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locBtnTitle, { color: hasLocation ? PRIMARY : theme.text }]}>
                  {locating ? "Detecting location…" : hasLocation ? "Location pinned" : "Use my current location"}
                </Text>
                {hasLocation && (
                  <Text style={[styles.locBtnCoords, { color: isDark ? "#64748b" : "#94a3b8" }]}>
                    {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
                  </Text>
                )}
              </View>
              {!hasLocation && !locating && (
                <Text style={{ fontSize: 13, color: isDark ? "#334155" : "#cbd5e1" }}>Tap →</Text>
              )}
            </Pressable>

            <View style={styles.fields}>
              <Field
                label="Street Address" placeholder="Block, building, street" emoji="🏢"
                value={address} onChangeText={setAddress}
                isDark={isDark} theme={theme}
              />
              <Field
                label="Area / Zone Name" placeholder="e.g. Main Gate Area, Engineering Block"
                emoji="🗺️" value={areaName} onChangeText={setAreaName}
                isDark={isDark} theme={theme}
                hint="Helps students navigate to you quickly"
              />
              <Field
                label="Nearby University" placeholder="e.g. University of Lagos"
                emoji="🎓" value={university} onChangeText={setUniversity}
                isDark={isDark} theme={theme}
              />
            </View>
          </View>
        );

      // ── STEP 4: Shop Type + Categories ─────────────────────────────────
      case 4:
        return (
          <View style={styles.stepContent}>
            <SectionHead
              emoji="🐝"
              title="What do you offer?"
              sub="Choose your shop type and the categories you sell in"
              isDark={isDark}
              theme={theme}
            />

            {/* Shop type selector */}
            <View style={styles.typeGrid}>
              {SHOP_TYPE_OPTIONS.map((opt) => {
                const active = shopType === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setShopType(opt.key)}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor: active ? (isDark ? PRIMARY_DARK : PRIMARY_SOFT) : (isDark ? "#0f172a" : "#f8fafc"),
                        borderColor: active ? PRIMARY : (isDark ? "#1e293b" : "#e2e8f0"),
                        borderWidth: active ? 2 : 1.2,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                    <Text style={[styles.typeLabel, { color: active ? PRIMARY : theme.text }]}>{opt.label}</Text>
                    <Text style={[styles.typeDesc,  { color: theme.subText }]}>{opt.desc}</Text>
                    <View style={[
                      styles.typeRadio,
                      { borderColor: active ? PRIMARY : (isDark ? "#334155" : "#cbd5e1"), backgroundColor: active ? PRIMARY : "transparent" },
                    ]}>
                      {active && <Text style={{ color: "#fff", fontSize: 9, fontWeight: "900" }}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Category picker */}
            <View style={styles.catSection}>
              <View style={styles.catSectionHead}>
                <View style={[styles.catAccent, { backgroundColor: PRIMARY }]} />
                <Text style={[styles.catSectionTitle, { color: theme.text }]}>
                  Pick your categories
                </Text>
                <View style={[styles.catBadge, { backgroundColor: isDark ? PRIMARY_DARK : PRIMARY_SOFT }]}>
                  <Text style={[styles.catBadgeText, { color: PRIMARY }]}>{selectedCats.length} selected</Text>
                </View>
              </View>

              <View style={styles.catGrid}>
                {CATEGORIES.map((cat) => {
                  const sel = selectedCats.includes(cat.id);
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => toggleCat(cat.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: sel ? PRIMARY : (isDark ? "#0f172a" : "#f8fafc"),
                          borderColor:     sel ? PRIMARY : (isDark ? "#1e293b" : "#e2e8f0"),
                          borderWidth: sel ? 0 : 1.2,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                      <Text style={[styles.catChipText, { color: sel ? "#fff" : theme.text }]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // ── Progress fill ─────────────────────────────────────────────────────────
  const progressWidth: `${number}%` = `${(step / TOTAL_STEPS) * 100}%`;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Fixed top bar ─────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { borderColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
        {step > 1 ? (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <View style={[styles.backCircle, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
              <Text style={[styles.backArrow, { color: theme.text }]}>←</Text>
            </View>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}

        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: PRIMARY }]}>
            Hive<Text style={{ color: theme.text }}>Market</Text>
          </Text>
          <Text style={[styles.topBarStep, { color: isDark ? "#475569" : "#94a3b8" }]}>
            Step {step} of {TOTAL_STEPS}
          </Text>
        </View>

        {/* Bee badge */}
        <View style={[styles.beeBadge, { backgroundColor: isDark ? PRIMARY_DARK : PRIMARY_SOFT }]}>
          <Text style={{ fontSize: 18 }}>🐝</Text>
        </View>
      </View>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <View style={[styles.progressTrack, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
        <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: PRIMARY }]} />
      </View>

      {/* ── Scrollable step content ───────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          {/* Step dots */}
          <StepDots current={step} total={TOTAL_STEPS} isDark={isDark} />

          {/* Step card */}
          <View style={[styles.card, {
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowColor: PRIMARY,
          }]}>
            {renderStep()}
          </View>

          {/* CTA */}
          <Pressable
            onPress={step === TOTAL_STEPS ? handleRegister : onNext}
            disabled={loading}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: PRIMARY,
                opacity: loading ? 0.65 : pressed ? 0.88 : 1,
                shadowColor: PRIMARY,
              },
            ]}
          >
            <Text style={styles.ctaText}>
              {loading
                ? "Creating your shop…"
                : step === TOTAL_STEPS
                ? "🐝  Launch my shop"
                : `Continue  →`}
            </Text>
          </Pressable>

          {/* Login link */}
          {step === 1 && (
            <View style={styles.loginRow}>
              <Text style={[styles.loginPrompt, { color: theme.subText }]}>Already have a shop?</Text>
              <Pressable onPress={() => router.replace("/Shop/ShopLoginScreen")}>
                <Text style={[styles.loginLink, { color: PRIMARY }]}> Sign in</Text>
              </Pressable>
            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterShopScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingTop: Platform.OS === "ios" ? 52 : 16, paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn:      {},
  backCircle:   { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  backArrow:    { fontSize: 20, fontWeight: "300" },
  topBarCenter: { flex: 1, alignItems: "center", gap: 2 },
  topBarTitle:  { fontSize: 16, fontWeight: "900", letterSpacing: -0.3 },
  topBarStep:   { fontSize: 11, fontWeight: "600" },
  beeBadge:     { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },

  // Progress
  progressTrack: { height: 3, width: "100%" },
  progressFill:  { height: "100%", borderRadius: 2 },

  // Scroll
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },

  // Step card
  card: {
    borderRadius: 24, borderWidth: 1,
    padding: 20, marginTop: 14,
    shadowOpacity: 0.07, shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  stepContent: { gap: 18 },

  // Image pickers
  imagePickerSection: {
    flexDirection: "row", gap: 14, alignItems: "flex-end",
  },
  imagePickerCol:   { gap: 6, alignItems: "center" },
  imagePickerLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },

  // Fields
  fields: { gap: 14 },

  // Location button
  locBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  locBtnTitle:  { fontSize: 13, fontWeight: "700" },
  locBtnCoords: { fontSize: 10, marginTop: 2 },

  // Type cards
  typeGrid: { gap: 10 },
  typeCard: {
    borderRadius: 18, padding: 14, gap: 4,
    flexDirection: "column", position: "relative",
  },
  typeLabel: { fontSize: 14, fontWeight: "800", marginTop: 4 },
  typeDesc:  { fontSize: 11, lineHeight: 16 },
  typeRadio: {
    position: "absolute", top: 14, right: 14,
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },

  // Category
  catSection:      { gap: 12 },
  catSectionHead:  { flexDirection: "row", alignItems: "center", gap: 8 },
  catAccent:       { width: 4, height: 16, borderRadius: 2 },
  catSectionTitle: { fontSize: 14, fontWeight: "800", flex: 1 },
  catBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catBadgeText:    { fontSize: 10, fontWeight: "800" },
  catGrid:         { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  catChipText: { fontSize: 12, fontWeight: "600" },

  // CTA
  cta: {
    marginTop: 16, borderRadius: 18, paddingVertical: 16,
    alignItems: "center",
    shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 0.2 },

  // Login row
  loginRow: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    marginTop: 16,
  },
  loginPrompt: { fontSize: 13 },
  loginLink:   { fontSize: 13, fontWeight: "800" },
});