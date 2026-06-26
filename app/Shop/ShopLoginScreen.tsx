import { loginShopApi } from "../../hivemarket-shop-dashboard/src/api/shopApi";
import { shopStore } from "../../hivemarket-shop-dashboard/src/store/shopStore";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import {
  Field,
  GREEN,
  GREEN_LIGHT,
  ScreenRings,
  ShimmerButton,
  shopTheme,
} from "../../hivemarket-shop-dashboard/app/Shop/components/ui";

const ShopLoginScreen = () => {
  const isDark = useColorScheme() === "dark";
  const t = shopTheme(isDark);
  const { setShop, setAuthenticated } = shopStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Please enter email and password.");
      return;
    }
    try {
      setLoading(true);
      const res = await loginShopApi({ email: email.trim(), password: password.trim() });
      setShop(res.shop);
      setAuthenticated(true);
      router.replace("/(shop)/DashboardScreen");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: t.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.inner}>
          <ScreenRings isDark={isDark} />

          {/* Logo + wordmark */}
          <View style={s.logoWrap}>
            <View style={[s.logoRing, { backgroundColor: t.card, borderColor: t.border }]}>
              <Image source={require("../../assets/images/favicon.png")} style={s.logoImg} resizeMode="contain" />
            </View>
            <Text style={[s.brand, { color: t.text }]}>
              Hive<Text style={{ color: GREEN }}>Market</Text>
            </Text>
            <Text style={[s.tagline, { color: t.subText }]}>Shop owner portal</Text>
          </View>

          {/* Card */}
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Welcome back</Text>
            <Text style={[s.cardSub, { color: t.subText }]}>Sign in to manage your shop</Text>

            <Field label="Email" placeholder="shop@email.com" value={email} onChangeText={setEmail} icon="✉" keyboardType="email-address" autoCapitalize="none" isDark={isDark} />
            <Field
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              icon="🔒"
              secure={!showPass}
              isDark={isDark}
              rightElement={
                <Pressable onPress={() => setShowPass((p) => !p)} hitSlop={10}>
                  <Text style={{ fontSize: 15 }}>{showPass ? "👁" : "🙈"}</Text>
                </Pressable>
              }
            />

            <View style={{ height: 8 }} />
            <ShimmerButton label={loading ? "Signing in…" : "Sign In"} onPress={handleLogin} loading={loading} />

            <View style={s.signupRow}>
              <Text style={[s.signupPrompt, { color: t.subText }]}>New to HiveMarket?</Text>
              <Pressable onPress={() => router.replace("/Shop/RegisterShopScreen")}>
                <Text style={[s.signupLink, { color: GREEN_LIGHT }]}> Register your shop</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ShopLoginScreen;

const s = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },

  logoWrap: { alignItems: "center", marginBottom: 26 },
  logoRing: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: GREEN,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    marginBottom: 12,
  },
  logoImg: { width: 48, height: 48 },
  brand: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  tagline: { fontSize: 12, fontWeight: "500", marginTop: 2, letterSpacing: 0.4 },

  card: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  cardSub: { fontSize: 13, marginTop: 3, marginBottom: 20 },

  signupRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 18 },
  signupPrompt: { fontSize: 13 },
  signupLink: { fontSize: 13, fontWeight: "700" },
});
