import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import CustomButton from '../components/CustomButton';
import { ScreenType } from '../navigation/types';
import globalStyles, {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
  IS_WATCH_DEVICE,
} from '../styles/globalStyles';
import theme, { scaleFont, scaleSpace } from '../styles/theme';

const { COLORS, SIZES } = theme;

// Continuous, device-derived sizes so the hero fits every Wear OS size
// (small round 1.2" → large square) and scales up cleanly on phones/tablets.
const EMBLEM = scaleSpace(58);
const EMBLEM_ICON = EMBLEM * 0.5;

interface WelcomeScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.logoContainer}>
        <View style={styles.iconEmblem}>
          <Icon name="shield" size={EMBLEM_ICON} color={COLORS.primary} />
        </View>
        <Text style={styles.appName}>Nexora Bank</Text>
        <Text style={styles.tagline}>
          Next-Gen Autonomous Digital Banking
        </Text>
      </View>
      
      <Text style={styles.description} numberOfLines={IS_WATCH_DEVICE ? 2 : undefined}>
        {IS_WATCH_DEVICE
          ? 'Contactless pay and biometric authorization, right on your wrist.'
          : 'Seamless contactless payments, glanceable wrist balances, and high-value biometric authorization across your phone and smartwatch.'}
      </Text>
      
      <View style={styles.buttonContainer}>
        <CustomButton 
          title="Sign In" 
          onPress={() => onNavigate('login')} 
          isFullWidth 
        />
        <View style={{ height: 10 }} />
        <CustomButton 
          title="Open New Account" 
          onPress={() => onNavigate('register')} 
          isFullWidth 
          variant="outline"
        />
      </View>

      <TouchableOpacity 
        style={styles.auditorFooter}
        onPress={() => onNavigate('pentestLab')}
        hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
      >
        <Icon name="lock" size={scaleFont(11)} color={COLORS.textMuted} />
        <Text style={styles.auditorFooterText}>Security Research Lab & Compliance</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: IS_WATCH_DEVICE ? ROUND_INSET : SIZES.spacing.lg,
    paddingTop: IS_WATCH_DEVICE ? CIRCULAR_PADDING_TOP : SIZES.spacing.xl,
    paddingBottom: IS_WATCH_DEVICE ? CIRCULAR_PADDING_BOTTOM + 24 : SIZES.spacing.xl,
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  iconEmblem: {
    width: EMBLEM,
    height: EMBLEM,
    borderRadius: EMBLEM / 2,
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.3)',
    marginBottom: SIZES.spacing.sm,
  },
  appName: {
    fontSize: IS_WATCH_DEVICE ? SIZES.xLarge : SIZES.xxLarge,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: IS_WATCH_DEVICE ? 14 : 18,
    marginBottom: IS_WATCH_DEVICE ? SIZES.spacing.sm : SIZES.spacing.lg,
    paddingHorizontal: SIZES.spacing.sm,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: SIZES.spacing.md,
  },
  auditorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: SIZES.spacing.md,
  },
  auditorFooterText: {
    fontSize: scaleFont(10),
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});

export default WelcomeScreen;
