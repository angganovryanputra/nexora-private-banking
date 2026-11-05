import { Dimensions, PixelRatio } from 'react-native';

const { width: WIN_WIDTH, height: WIN_HEIGHT } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Dynamic Device Detection (Wear OS Smartwatch vs Smartphone)
// ---------------------------------------------------------------------------
// Wear OS devices typically have square/circular aspect ratios (width/height >= 0.70)
// and dimensions <= 480x520. Smartphones have tall aspect ratios (e.g. 16:9, 20:9 -> < 0.65).
export const IS_WATCH = (WIN_WIDTH / WIN_HEIGHT >= 0.70) && (WIN_WIDTH <= 480 && WIN_HEIGHT <= 520);

// Base scaling:
// On Watch: baseline width is 220dp (typical density-adjusted Wear OS viewport)
// On Phone: baseline width is 390dp
const BASE_WIDTH = IS_WATCH ? 220 : 390;
const rawScale = WIN_WIDTH / BASE_WIDTH;
const autoScale = Math.min(Math.max(rawScale, 0.8), 1.25);

// Responsive scaling helpers
export const scaleFont = (size: number) => {
  if (IS_WATCH) {
    const scaled = Math.round(size * 0.70 * autoScale);
    return Math.max(8, Math.min(scaled, 20));
  }
  return Math.round(size * Math.min(Math.max(WIN_WIDTH / 390, 0.95), 1.2));
};

export const scaleSpace = (space: number) => {
  if (IS_WATCH) {
    return Math.max(2, Math.round(space * 0.50 * autoScale));
  }
  return Math.round(space * Math.min(Math.max(WIN_WIDTH / 390, 0.95), 1.2));
};

export const scaleRadius = (radius: number) => {
  if (IS_WATCH) {
    return Math.max(4, Math.round(radius * 0.60 * autoScale));
  }
  return radius;
};

export const COLORS = {
  // Nexora Luxury Smartwatch Fintech Palette
  primary: '#00E599',       // Nexora Electric Emerald (Growth, Success, Liquid Balance)
  primaryDark: '#00B377',
  secondary: '#00D2FF',     // Nexora Cyan Frost (Cards, Transfers, Contactless)
  accentGold: '#FFD700',    // Royal Champagne Gold (VIP Tier, Platinum Balance)
  danger: '#FF334B',        // Crimson Alert (Lockout, High-risk 2FA)
  warning: '#FFB020',       // Amber Alert (Pentest / Exploit trigger)
  success: '#00E599',
  info: '#00D2FF',

  // High contrast text for smartwatch legibility
  text: '#FFFFFF',
  textLight: '#94A3B8',
  textDark: '#070A11',
  textMuted: '#64748B',

  // AMOLED Pure Black Backgrounds & Obsidian Glass
  background: '#000000',
  backgroundDark: '#000000',
  surface: '#0F1420',
  surfaceElevated: '#161C2C',
  border: '#222A3E',
  card: '#0F1420',
  cardDark: '#0B0F19',

  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.75)',

  // Pentest Lab colors
  pentestLab: '#FFB020',
  vulnBadge: '#FF334B',
  exploitSuccess: '#00E599',

  // Status colors
  statusPending: '#FFB020',
  statusApproved: '#00E599',
  statusRejected: '#FF334B',
};

export const FONTS = {
  regular: {
    fontFamily: 'System',
    fontWeight: 'normal' as const,
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500' as const,
  },
  bold: {
    fontFamily: 'System',
    fontWeight: 'bold' as const,
  },
  light: {
    fontFamily: 'System',
    fontWeight: '300' as const,
  },
};

export const SIZES = {
  // Font sizes scaled dynamically based on device type
  xSmall: IS_WATCH ? 9 : 12,
  small: IS_WATCH ? 11 : 14,
  medium: IS_WATCH ? 13 : 16,
  large: IS_WATCH ? 15 : 20,
  xLarge: IS_WATCH ? 18 : 26,
  xxLarge: IS_WATCH ? 22 : 32,

  // Responsive Touch Targets & Keypad standards
  touchTarget: IS_WATCH ? 34 : 48,
  pinKeySize: IS_WATCH ? 36 : 58,
  headerHeight: IS_WATCH ? 34 : 52,
  iconCircleSize: IS_WATCH ? 24 : 38,

  // Spacing
  spacing: {
    xs: scaleSpace(4),
    sm: scaleSpace(6),
    md: scaleSpace(10),
    lg: scaleSpace(14),
    xl: scaleSpace(20),
    xxl: scaleSpace(26),
  },

  // Border radius for curved watch aesthetics vs smartphone
  radius: {
    xs: scaleRadius(4),
    sm: scaleRadius(8),
    md: scaleRadius(12),
    lg: scaleRadius(18),
    round: 999,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
};

export default {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
};
