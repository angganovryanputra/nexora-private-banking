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
import PinPadModal from '../components/PinPadModal';
import { ScreenType } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import globalStyles, {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
  IS_WATCH_DEVICE,
} from '../styles/globalStyles';
import theme from '../styles/theme';

const { COLORS, SIZES, SHADOWS } = theme;

interface LoginScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinPadVisible, setPinPadVisible] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (userToLogin?: string, passToLogin?: string) => {
    const u = userToLogin ?? username;
    const p = passToLogin ?? password;

    if (!u || !p) {
      Alert.alert('Error', 'Please fill in both fields or use Quick PIN');
      return;
    }

    setLoading(true);
    try {
      const success = await login(u, p);
      if (success) {
        onNavigate('dashboard');
      } else {
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error or backend unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    setPinPadVisible(false);
    // V-W10: Quick PIN verification against local reversible MD5 hash (1234)
    if (pin === '1234') {
      Alert.alert('⚡ Quick PIN Accepted', 'Authenticated as Alexander Vance (Obsidian VIP)');
      await handleLogin('alexander.vance', 'Password123!');
    } else {
      Alert.alert('Invalid PIN', 'Authorized PIN is 1234');
    }
  };

  const handleAutoFillAdmin = () => {
    setUsername('alexander.vance');
    setPassword('Password123!');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Icon name="university" size={IS_WATCH_DEVICE ? 20 : 32} color={COLORS.primary} />
        <Text style={styles.title}>Nexora Bank</Text>
        <Text style={styles.subtitle}>Next-Gen Autonomous Banking</Text>
      </View>

      {/* V-W10: Quick PIN Button (Wear OS Ergonomic Alternative) */}
      <TouchableOpacity
        style={styles.quickPinButton}
        onPress={() => setPinPadVisible(true)}
      >
        <Icon name="key" size={IS_WATCH_DEVICE ? 11 : 16} color={COLORS.black} />
        <Text style={styles.quickPinText}>Quick PIN Access (1234)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickPinButton, { backgroundColor: COLORS.secondary, marginTop: 4 }]}
        onPress={() => onNavigate('companionPairing')}
      >
        <Icon name="link" size={IS_WATCH_DEVICE ? 11 : 16} color={COLORS.black} />
        <Text style={styles.quickPinText}>Link Phone Companion (839-201)</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR PASSWORD</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Standard Credentials Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={COLORS.textLight}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.autofillButton}
          onPress={handleAutoFillAdmin}
        >
          <Text style={styles.autofillText}>Fill Demo Credentials (admin)</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
        ) : (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => handleLogin()}
          >
            <Text style={styles.loginBtnText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => onNavigate('forgotPassword')}>
          <Text style={styles.linkText}>Forgot PIN/Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate('register')} style={{ marginTop: 6 }}>
          <Text style={styles.signupText}>
            No account? <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3x4 Keypad Modal */}
      <PinPadModal
        visible={pinPadVisible}
        onPinSubmit={handlePinSubmit}
        onCancel={() => setPinPadVisible(false)}
      />
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
    paddingTop: IS_WATCH_DEVICE ? 6 : 20,
    paddingBottom: CIRCULAR_PADDING_BOTTOM,
  },
  header: {
    alignItems: 'center',
    marginBottom: IS_WATCH_DEVICE ? 4 : 12,
  },
  title: {
    fontSize: IS_WATCH_DEVICE ? 13 : 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: IS_WATCH_DEVICE ? 2 : 4,
  },
  subtitle: {
    fontSize: IS_WATCH_DEVICE ? 8.5 : 12,
    color: COLORS.textLight,
  },
  quickPinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.round,
    paddingVertical: IS_WATCH_DEVICE ? 5 : 12,
    marginVertical: IS_WATCH_DEVICE ? 2 : 6,
    minHeight: IS_WATCH_DEVICE ? 30 : 46,
    ...SHADOWS.small,
  },
  quickPinText: {
    fontSize: IS_WATCH_DEVICE ? 9.5 : 13,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: IS_WATCH_DEVICE ? 4 : 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: IS_WATCH_DEVICE ? 8 : 10,
    color: COLORS.textMuted,
    marginHorizontal: 6,
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.white,
    paddingVertical: IS_WATCH_DEVICE ? 4 : 10,
    paddingHorizontal: IS_WATCH_DEVICE ? 8 : 14,
    borderRadius: SIZES.radius.md,
    fontSize: IS_WATCH_DEVICE ? 10 : 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: IS_WATCH_DEVICE ? 4 : 8,
    minHeight: IS_WATCH_DEVICE ? 30 : 44,
  },
  autofillButton: {
    alignSelf: 'center',
    paddingVertical: IS_WATCH_DEVICE ? 2 : 6,
    marginBottom: IS_WATCH_DEVICE ? 4 : 8,
  },
  autofillText: {
    fontSize: IS_WATCH_DEVICE ? 8.5 : 11,
    color: COLORS.warning,
    textDecorationLine: 'underline',
  },
  loginBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: SIZES.radius.round,
    paddingVertical: IS_WATCH_DEVICE ? 6 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: IS_WATCH_DEVICE ? 30 : 46,
  },
  loginBtnText: {
    fontSize: IS_WATCH_DEVICE ? 10 : 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  loader: {
    marginVertical: 6,
  },
  footer: {
    alignItems: 'center',
    marginTop: IS_WATCH_DEVICE ? 4 : 12,
  },
  linkText: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    color: COLORS.textLight,
  },
  signupText: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    color: COLORS.textLight,
  },
});

export default LoginScreen;
