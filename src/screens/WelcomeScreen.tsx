import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import CustomButton from '../components/CustomButton';
import { ScreenType } from '../navigation/types';
import globalStyles from '../styles/globalStyles';
import theme from '../styles/theme';

const { COLORS, SIZES } = theme;

interface WelcomeScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconEmblem}>
          <Icon name="shield" size={SIZES.xxLarge * 1.4} color={COLORS.primary} />
        </View>
        <Text style={styles.appName}>Nexora Bank</Text>
        <Text style={styles.tagline}>
          Next-Gen Autonomous Digital Banking
        </Text>
      </View>
      
      <Text style={styles.description}>
        Seamless contactless payments, glanceable wrist balances, and high-value biometric authorization across your phone and smartwatch.
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
        <Icon name="lock" size={11} color={COLORS.textMuted} />
        <Text style={styles.auditorFooterText}>Security Research Lab & Compliance</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    backgroundColor: COLORS.backgroundDark,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  iconEmblem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.3)',
    marginBottom: SIZES.spacing.md,
  },
  appName: {
    fontSize: SIZES.xxLarge,
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
    lineHeight: 18,
    marginBottom: SIZES.spacing.xl,
    paddingHorizontal: SIZES.spacing.md,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: SIZES.spacing.lg,
  },
  auditorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  auditorFooterText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});

export default WelcomeScreen;
