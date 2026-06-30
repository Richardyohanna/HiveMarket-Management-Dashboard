/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform, StyleSheet } from 'react-native';

type ThemeType = {
  background: string;
  text: string;
  subText: string;
  primary: string;
  sectionBackground: string;
  screenBackground: string;
  iconBackground: string;
  borderColor: string;
  readColor: string;
  read: string;
  productColor: string;
}

type ThemeFontSize = {
  xsm: number;
  sm: number;
  md: number;
  lg: number;
  xlg: number;
  xxlg: number;
  xxxlg: number;
  
}

export const PRIMARY      = "#008100";
export const PRIMARY_SOFT = "#e8f5e9";
export const PRIMARY_DARK = "#1a3a1a";
export const PRODUCTS_PER_BLOCK   =   12;
export const RECENT_PREVIEW_COUNT = 4;
export const BLOCKS_BEFORE_REFETCH = 1;
export const FETCH_COOLDOWN_MS     = 30_000;

export const CARD_W = "48%";

export const generalStyle = StyleSheet.create({
  container:       { width: "100%", gap: 14 },
  feedContainer:   { gap: 20},
  sectionHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleAccent:     { width: 4, height: 20, borderRadius: 2 },
  sectionTitle:    { fontWeight: "800", letterSpacing: -0.3 },
  sectionCount:    { fontSize: 13, fontWeight: "600" },

  gridBlock: { gap: 10},
  gridRow:   { flexDirection: "row", gap: 10, justifyContent: "space-between" },

  card: {
    flex: 1, maxWidth: "49%", borderRadius: 14, borderWidth: 1, overflow: "hidden",
    shadowColor: PRIMARY, shadowOpacity: 0.07, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3
  },
  cardImgWrapper: { position: "relative" },
  cardImg:        { width: "100%", height: 155 },
  conditionPill:  { position: "absolute", bottom: 7, left: 7, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  conditionText:  { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  wishlistBtn:    { position: "absolute", top: 7, right: 7, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  cardBody:       { padding: 9, gap: 4 , },
  cardName:       { fontSize: 12, fontWeight: "600", lineHeight: 17},
  locationRow:    { flexDirection: "row", alignItems: "center", gap: 2 },
  locationPin:    { fontSize: 10 },
  locationText:   { fontSize: 10, flex: 1 },
  cardPrice:      { fontSize: 14, fontWeight: "800" },
  metaRow:        { flexDirection: "row", alignItems: "center", gap: 3 },
  star:           { color: "#EAB308", fontSize: 11 },
  ratingVal:      { fontSize: 11, fontWeight: "600" },
  viewCount:      { fontSize: 10 },
  buyBtn:         { backgroundColor: PRIMARY, borderRadius: 8, paddingVertical: 8, alignItems: "center", marginTop: 2 },
  buyBtnText:     { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  cardPlaceholder:{ flex: 1, maxWidth: "49%" },

  stripOuter:     { padding: 14, gap: 10, borderRadius: 14 },
  stripHeader:    { flexDirection: "row", alignItems: "center", gap: 8 },
  stripAccent:    { width: 4, height: 17, borderRadius: 2, backgroundColor: PRIMARY },
  stripTitle:     { fontSize: 14, fontWeight: "700" },
  stripList:      { gap: 10, paddingBottom: 2 },
  stripCard:      { width: 130, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  stripImg:       { width: "100%", height: 95 },
  stripCardInfo:  { padding: 7, gap: 3 },
  stripCardName:  { fontSize: 11, fontWeight: "600" },
  stripCardPrice: { fontSize: 12, fontWeight: "800" },

  loaderBlock: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loaderText:  { fontSize: 13, fontWeight: "500" },
});

export const FontSize = {
  size: {
    xsm: 10,
    sm: 12,
    md: 16,
    lg: 18,
    xlg_md: 23,
    xlg: 30,    
    xxlg: 45,
    xxxlg: 55,
  }
}
export const Colors: {
  light: ThemeType;
  dark: ThemeType;
  splashLight: ThemeType;
  splashDark: ThemeType
} = {
  light: {
    background: "#ffffff",
    text: "#000000",
    subText: "#008100",
    primary: "#fff",
    sectionBackground: "#f2f2f26e",
    screenBackground: "white",
    iconBackground: "#2ecc702f",
    borderColor: "#9a9a9a",
    readColor: "#00000078",
    read: "#00000078",
    productColor: "#ffffff"
  },
  dark: {
    background: "#000",
    text: "#ffffffc5",
    subText: "#008100",
    primary: "#171616",
    sectionBackground: "#1E293B" ,
    screenBackground: "#0B120E",
    iconBackground: "#2ecc702f",
    borderColor: "#9a9a9a",
    readColor: "#c9c9c978",
    read: "#dadada78",
    productColor:"#1E293B"
  },
  splashDark: {
    background: "#000",
    text: "#ffffffc5",
    subText: "#008100",
    primary: "#171616",
    sectionBackground: "#f2f2f26e",
    screenBackground: "#0B120E",
    iconBackground: "#2ecc702f",
    borderColor: "#9a9a9a",
    readColor: "#00000078",
    read: "#00000078",
    productColor:"#1E293B"
  } ,
  splashLight: {
    background: "#ffffff",
    text: "#000000",
    subText: "#008100",
    primary: "#fff",
    sectionBackground: "#1E293B" ,
    screenBackground:"white",
    iconBackground: "#2ecc702f",
    borderColor: "#9a9a9a",
    readColor: "#ffffff78",
    read: "#00000078",
    productColor:"#ffffff"
  }
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
