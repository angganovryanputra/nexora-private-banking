import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import CustomButton from '../components/CustomButton';
import { ScreenType } from '../navigation/types';
import { ENDPOINTS, post } from '../utils/api';
import globalStyles, {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
  IS_WATCH_DEVICE,
} from '../styles/globalStyles';
import theme from '../styles/theme';

const { COLORS, SIZES, SHADOWS } = theme;

interface ResetPasswordScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!username || !resetPin || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await post(
        ENDPOINTS.resetPassword.reset,
        { 
          username,
          reset_pin: resetPin,
          new_password: newPassword,
        }
      );

      if (response.ok) {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been updated. You can now login with your new credentials.',
          [
            {
              text: 'Sign In',
              onPress: () => onNavigate('login'),
            },
          ]
        );
      } else {
        Alert.alert('Reset Failed', response.data?.message || 'Invalid username or reset PIN');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Network error or server unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Icon name="key" size={IS_WATCH_DEVICE ? 18 : 26} color={COLORS.accentGold} />
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your 3-digit PIN and new password</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Username (e.g. admin)"
            placeholderTextColor={COLORS.textLight}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            accessibilityLabel="Username input"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Reset PIN</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="3-digit PIN (e.g. 123)"
            placeholderTextColor={COLORS.textLight}
            value={resetPin}
            onChangeText={setResetPin}
            keyboardType="number-pad"
            maxLength={3}
            accessibilityLabel="Reset PIN input"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="New password"
            placeholderTextColor={COLORS.textLight}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            accessibilityLabel="New password input"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
        ) : (
          <CustomButton
            title="Reset Password"
            onPress={handleResetPassword}
            isFullWidth
            variant="primary"
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.footer}
        onPress={() => onNavigate('login')}
        accessibilityRole="button"
        accessibilityLabel="Return to sign in"
      >
        <Text style={styles.footerText}>
          Remember your password? <Text style={styles.loginText}>Sign In</Text>
        </Text>
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
    paddingHorizontal: ROUND_INSET,
    paddingTop: CIRCULAR_PADDING_TOP,
    paddingBottom: CIRCULAR_PADDING_BOTTOM + 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.xSmall,
    color: COLORS.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    backgroundColor: COLORS.cardDark,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.spacing.sm,
    ...SHADOWS.small,
  },
  inputContainer: {
    marginBottom: SIZES.spacing.xs,
  },
  label: {
    fontSize: SIZES.xSmall,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 2,
  },
  loader: {
    marginVertical: SIZES.spacing.sm,
  },
  footer: {
    paddingVertical: SIZES.spacing.xs,
  },
  footerText: {
    fontSize: SIZES.xSmall,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  loginText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default ResetPasswordScreen;
