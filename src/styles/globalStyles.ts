import { StyleSheet, Dimensions } from 'react-native';
import theme from './theme';

const { COLORS, SIZES, SHADOWS } = theme;

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;
export const IS_WATCH_DEVICE = (SCREEN_WIDTH / SCREEN_HEIGHT >= 0.70) && (SCREEN_WIDTH <= 480 && SCREEN_HEIGHT <= 520);

// Auto-proportioned safe padding for Wear OS circular screens vs rectangular smartphones
export const ROUND_INSET = IS_WATCH_DEVICE ? Math.round(SCREEN_WIDTH * 0.07) : 16;
export const CIRCULAR_PADDING_TOP = IS_WATCH_DEVICE ? Math.round(SCREEN_HEIGHT * 0.07) : 12;
export const CIRCULAR_PADDING_BOTTOM = IS_WATCH_DEVICE ? Math.round(SCREEN_HEIGHT * 0.10) : 20;

export default StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  // Circular scrollable container: keeps top and bottom items safely away from bezel curvature
  contentContainer: {
    paddingHorizontal: ROUND_INSET,
    paddingTop: CIRCULAR_PADDING_TOP,
    paddingBottom: CIRCULAR_PADDING_BOTTOM,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ROUND_INSET,
    paddingVertical: SIZES.spacing.sm,
    backgroundColor: COLORS.backgroundDark,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Text styles
  title: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SIZES.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.textLight,
    marginBottom: SIZES.spacing.sm,
    textAlign: 'center',
  },
  text: {
    fontSize: SIZES.small,
    color: COLORS.white,
  },
  textLight: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: SIZES.small,
    color: COLORS.danger,
    textAlign: 'center',
    marginTop: SIZES.spacing.xs,
  },

  // Input styles (Watch-friendly high-contrast dark field)
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.white,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
    borderRadius: SIZES.radius.md,
    width: '100%',
    fontSize: SIZES.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: SIZES.touchTarget,
  },

  // Button styles (Watch-friendly touch targets min 48dp)
  button: {
    backgroundColor: COLORS.primary,
    minHeight: SIZES.touchTarget,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    borderRadius: SIZES.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.spacing.xs,
    ...SHADOWS.small,
  },
  buttonText: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceElevated,
    minHeight: SIZES.touchTarget,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    borderRadius: SIZES.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.spacing.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Card styles (Obsidian surface)
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ROUND_INSET,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: COLORS.backgroundDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerText: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    flex: 1,
  },

  // Menu styles (Full-screen overlay for Wear OS)
  menuContainer: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: {
    paddingVertical: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    marginTop: SIZES.spacing.sm,
    borderRadius: SIZES.radius.md,
    borderBottomWidth: 0,
  },
  logoutText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
