import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

/* ── Brand palette (matches Login / CreateAccount screens) ───────────────── */
export const GREEN = "#008100";
export const GREEN_LIGHT = "#00a300";
export const GREEN_SUBTLE = "#e6f4e6";
export const DARK_BG = "#0d150d";
export const DARK_CARD = "#111e11";
export const DARK_BORDER = "rgba(0,180,0,0.18)";

export function shopTheme(isDark: boolean) {
  return {
    isDark,
    bg: isDark ? DARK_BG : "#f4faf4",
    card: isDark ? DARK_CARD : "#ffffff",
    border: isDark ? DARK_BORDER : "rgba(0,129,0,0.1)",
    inputBg: isDark ? "#152015" : GREEN_SUBTLE,
    inputBorder: isDark ? DARK_BORDER : "rgba(0,129,0,0.15)",
    text: isDark ? "#e0ffe0" : "#0d1a0d",
    subText: isDark ? "#5a7a5a" : "#7a9a7a",
    label: isDark ? "#9aba9a" : "#3a5a3a",
    placeholder: isDark ? "#3a5a3a" : "#9aba9a",
    muted: isDark ? "#1e331e" : "#d4ecd4",
  };
}

/* ── Decorative background rings (minimal, brand-consistent) ─────────────── */
export const ScreenRings = ({ isDark }: { isDark: boolean }) => (
  <View style={ringStyles.wrap} pointerEvents="none">
    {[...Array(5)].map((_, i) => (
      <View
        key={i}
        style={[
          ringStyles.ring,
          {
            width: 120 + i * 90,
            height: 120 + i * 90,
            borderRadius: 60 + i * 45,
            borderColor: isDark
              ? `rgba(0,180,0,${0.05 - i * 0.007})`
              : `rgba(0,129,0,${0.06 - i * 0.009})`,
          },
        ]}
      />
    ))}
  </View>
);

const ringStyles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderWidth: 1 },
});

/* ── Labelled text field ─────────────────────────────────────────────────── */
export const Field = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secure,
  keyboardType,
  autoCapitalize,
  isDark,
  multiline,
  rightElement,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  icon?: string;
  secure?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  isDark: boolean;
  multiline?: boolean;
  rightElement?: React.ReactNode;
}) => {
  const t = shopTheme(isDark);
  return (
    <View style={{ width: "100%", marginBottom: 14 }}>
      <Text style={[fieldStyles.label, { color: t.label }]}>{label}</Text>
      <View
        style={[
          fieldStyles.row,
          {
            backgroundColor: t.inputBg,
            borderColor: t.inputBorder,
            alignItems: multiline ? "flex-start" : "center",
          },
        ]}
      >
        {icon ? <Text style={fieldStyles.icon}>{icon}</Text> : null}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={t.placeholder}
          style={[
            fieldStyles.input,
            { color: t.text, height: multiline ? 90 : undefined, textAlignVertical: multiline ? "top" : "center" },
          ]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "sentences"}
          multiline={multiline}
        />
        {rightElement}
      </View>
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  icon: { fontSize: 15 },
  input: { flex: 1, fontSize: 14 },
});

/* ── Primary shimmer button ──────────────────────────────────────────────── */
export const ShimmerButton = ({
  label,
  onPress,
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const inactive = disabled || loading;
  return (
    <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        disabled={inactive}
        style={[btnStyles.btn, { opacity: inactive ? 0.7 : 1 }]}
      >
        <View style={btnStyles.shimmer} />
        {icon ? <Text style={btnStyles.icon}>{icon}</Text> : null}
        <Text style={btnStyles.text}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const btnStyles = StyleSheet.create({
  btn: {
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
    position: "relative",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: "10%",
    width: "30%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ skewX: "-20deg" }],
  },
  icon: { fontSize: 15 },
  text: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.4 },
});

/* ── Stat card for the dashboard ─────────────────────────────────────────── */
export const StatCard = ({
  label,
  value,
  accent,
  isDark,
  wide,
}: {
  label: string;
  value: string;
  accent?: boolean;
  isDark: boolean;
  wide?: boolean;
}) => {
  const t = shopTheme(isDark);
  return (
    <View
      style={[
        statStyles.card,
        {
          width: wide ? "100%" : "48%",
          backgroundColor: accent ? GREEN : t.card,
          borderColor: accent ? GREEN : t.border,
        },
      ]}
    >
      <Text
        style={[
          statStyles.value,
          { color: accent ? "#fff" : t.text },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          statStyles.label,
          { color: accent ? "rgba(255,255,255,0.85)" : t.subText },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const statStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
    marginBottom: 12,
  },
  value: { fontSize: 26, fontWeight: "900", letterSpacing: -0.6 },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
});
