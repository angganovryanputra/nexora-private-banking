import { Dimensions, PixelRatio, Platform, ScaledSize } from 'react-native';

/**
 * Nexora OmniWear — Responsive Design System
 * ------------------------------------------------------------------
 * One token system that adapts continuously to the real viewport so the
 * same screens look correct on:
 *   • Wear OS round / square watches of ANY size (≈180dp small → 480px XL)
 *   • Every Android / iOS phone (compact → large)
 *   • Tablets / foldables (used as a large-phone layout)
 *
 * The previous system switched on a single `IS_WATCH ? a : b` boolean, so
 * all watches rendered identically. Here the type scale, spacing and touch
 * targets are derived from the device's shortest side and clamped, so a
 * 192px watch and a 454px watch each get proportionate, legible sizing.
 */

const win: ScaledSize = Dimensions.get('window');
const WIN_W = win.width;
const WIN_H = win.height;

const SHORT = Math.min(WIN_W, WIN_H); // shortest side — the dimension that constrains layout
const LONG = Math.max(WIN_W, WIN_H);
const ASPECT = SHORT / LONG; // 1.0 = perfect square (round watch), ~0.46 = tall phone

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// ---------------------------------------------------------------------------
// Device classification
// ---------------------------------------------------------------------------
// A Wear OS watch is near-square and physically small. Phones are tall.
export const IS_WATCH = ASPECT >= 0.68 && SHORT <= 480 && LONG <= 620;
// Round watches are effectively square in dp; square watches are a touch wider.
export const IS_ROUND = IS_WATCH && ASPECT >= 0.92;
export const IS_SQUARE_WATCH = IS_WATCH && !IS_ROUND;
export const IS_TABLET = !IS_WATCH && SHORT >= 600;
export const IS_PHONE = !IS_WATCH && !IS_TABLET;

// Watch size buckets (by shortest side, in dp) for fine-grained tuning.
export type WatchSize = 'small' | 'medium' | 'large';
export const WATCH_SIZE: WatchSize = !IS_WATCH
  ? 'large'
  : SHORT <= 200
  ? 'small'
  : SHORT <= 240
  ? 'medium'
  : 'large';

// ---------------------------------------------------------------------------
// Continuous scale ratios (relative to reference devices)
// ---------------------------------------------------------------------------
// Reference watch ≈ 196dp shortest side; reference phone ≈ 390dp width.
const WATCH_RATIO = clamp(SHORT / 196, 0.82, 1.7);
const PHONE_RATIO = clamp((IS_TABLET ? LONG * 0.42 : SHORT) / 390, 0.9, 1.45);

/**
 * `dv` (device value) returns a watch-tuned or phone-tuned number, each scaled
 * continuously by the device ratio. Passing the current reference values keeps
 * visual parity with the previous design at 196dp / 390dp while scaling cleanly
 * to every other size.
 */
const dv = (watchVal: number, phoneVal: number) =>
  IS_WATCH ? Math.round(watchVal * WATCH_RATIO) : Math.round(phoneVal * PHONE_RATIO);

// ---------------------------------------------------------------------------
// Public scaling helpers (kept for backwards-compatibility + direct use)
// ---------------------------------------------------------------------------
export const scaleFont = (size: number) => {
  if (IS_WATCH) {
    return clamp(Math.round(size * 0.72 * WATCH_RATIO), 8, 30);
  }
  return Math.round(size * PHONE_RATIO);
};

export const scaleSpace = (space: number) => {
  if (IS_WATCH) {
    return Math.max(2, Math.round(space * 0.55 * WATCH_RATIO));
  }
  return Math.round(space * PHONE_RATIO);
};

export const scaleRadius = (radius: number) => {
  if (IS_WATCH) {
    return Math.max(4, Math.round(radius * 0.62 * WATCH_RATIO));
  }
  return Math.round(radius * clamp(PHONE_RATIO, 1, 1.2));
};

// Normalised font that also respects the platform pixel grid (crisp text).
export const normFont = (size: number) => {
  const v = scaleFont(size);
  return Platform.OS === 'ios' ? v : Math.round(PixelRatio.roundToNearestPixel(v));
};

// ---------------------------------------------------------------------------
// Colour palette — Nexora luxury AMOLED fintech identity (IDR private bank)
// ---------------------------------------------------------------------------
export const COLORS = {
  primary: '#00E599', // Electric Emerald — balance, success, primary CTA
  primaryDark: '#00B377',
  primarySoft: 'rgba(0, 229, 153, 0.12)',
  secondary: '#00D2FF', // Cyan Frost — cards, transfers, contactless
  secondarySoft: 'rgba(0, 210, 255, 0.12)',
  accentGold: '#FFD700', // Champagne Gold — VIP tier / private wealth
  accentGoldSoft: 'rgba(255, 215, 0, 0.12)',
  danger: '#FF445E', // Crimson — lockout, high-risk 2FA
  dangerSoft: 'rgba(255, 68, 94, 0.14)',
  warning: '#FFB020', // Amber — alerts / security audit
  warningSoft: 'rgba(255, 176, 32, 0.12)',
  success: '#00E599',
  info: '#00D2FF',

  // High-contrast text for small-screen legibility
  text: '#FFFFFF',
  textLight: '#A5B0C2',
  textDark: '#070A11',
  textMuted: '#6B778C',

  // AMOLED depth stack (pure-black base saves watch battery + reads premium)
  background: '#000000',
  backgroundDark: '#000000',
  surface: '#10151F',
  surfaceElevated: '#19202F',
  surfaceHighlight: '#222B3D',
  border: '#232C40',
  borderSoft: 'rgba(255, 255, 255, 0.06)',
  card: '#10151F',
  cardDark: '#0B0F18',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.78)',

  // Pentest-lab accents (clearly distinct from the customer banking palette)
  pentestLab: '#FFB020',
  vulnBadge: '#FF445E',
  exploitSuccess: '#00E599',

  statusPending: '#FFB020',
  statusApproved: '#00E599',
  statusRejected: '#FF445E',
};

export const FONTS = {
  regular: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontWeight: 'normal' as const },
  medium: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', fontWeight: '500' as const },
  bold: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontWeight: '700' as const },
  light: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light', fontWeight: '300' as const },
};

// ---------------------------------------------------------------------------
// Sizing tokens — all responsive (scale with the real device)
// ---------------------------------------------------------------------------
export const SIZES = {
  // Type scale (watch reference, phone reference) → scaled per-device
  xSmall: dv(9, 12),
  small: dv(11, 14),
  medium: dv(13, 16),
  large: dv(15, 20),
  xLarge: dv(18, 26),
  xxLarge: dv(22, 32),
  display: dv(26, 40), // hero balance figure

  // Touch & component sizing (phone keeps ≥44dp per a11y guidance)
  touchTarget: IS_WATCH ? Math.max(32, Math.round(34 * WATCH_RATIO)) : 48,
  pinKeySize: IS_WATCH ? Math.max(34, Math.round(38 * WATCH_RATIO)) : 60,
  headerHeight: IS_WATCH ? Math.round(34 * WATCH_RATIO) : 54,
  iconCircleSize: IS_WATCH ? Math.round(24 * WATCH_RATIO) : 40,

  spacing: {
    xs: scaleSpace(4),
    sm: scaleSpace(6),
    md: scaleSpace(10),
    lg: scaleSpace(14),
    xl: scaleSpace(20),
    xxl: scaleSpace(26),
  },

  radius: {
    xs: scaleRadius(4),
    sm: scaleRadius(8),
    md: scaleRadius(12),
    lg: scaleRadius(18),
    xl: scaleRadius(24),
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
    shadowRadius: 6,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  glowPrimary: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
};

// Device metadata — handy for layout decisions inside screens.
export const DEVICE = {
  width: WIN_W,
  height: WIN_H,
  shortestSide: SHORT,
  longestSide: LONG,
  aspect: ASPECT,
  isWatch: IS_WATCH,
  isRound: IS_ROUND,
  isSquareWatch: IS_SQUARE_WATCH,
  isPhone: IS_PHONE,
  isTablet: IS_TABLET,
  watchSize: WATCH_SIZE,
  watchRatio: WATCH_RATIO,
  phoneRatio: PHONE_RATIO,
};

export default {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  DEVICE,
  IS_WATCH,
  IS_ROUND,
  scaleFont,
  scaleSpace,
  scaleRadius,
  normFont,
};
