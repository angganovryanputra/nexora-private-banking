import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import CustomButton from '../components/CustomButton';
import { ScreenType } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import globalStyles, {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
  IS_WATCH_DEVICE,
} from '../styles/globalStyles';
import theme from '../styles/theme';

const { COLORS, SIZES } = theme;

interface RegisterScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const result = await register(username, password);
      
      if (result.success) {
        Alert.alert('Success', result.message || 'Registration successful!', [
          { text: 'OK', onPress: () => onNavigate('login') }
        ]);
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started with Nexora Bank</Text>
      
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Choose a username"
            placeholderTextColor={COLORS.textLight}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Choose a password"
            placeholderTextColor={COLORS.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>
        
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
        ) : (
          <CustomButton
            title="Create Account"
            onPress={handleRegister}
            isFullWidth
          />
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text 
            style={styles.loginText}
            onPress={() => onNavigate('login')}
          >
            Sign In
          </Text>
        </Text>
      </View>
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
    paddingTop: IS_WATCH_DEVICE ? 8 : 30,
    paddingBottom: CIRCULAR_PADDING_BOTTOM,
    alignItems: 'center',
  },
  title: {
    fontSize: IS_WATCH_DEVICE ? 13 : 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: IS_WATCH_DEVICE ? 2 : 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: IS_WATCH_DEVICE ? 8.5 : 12,
    color: COLORS.textLight,
    marginBottom: IS_WATCH_DEVICE ? 8 : 20,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: IS_WATCH_DEVICE ? 8 : 20,
  },
  inputContainer: {
    marginBottom: IS_WATCH_DEVICE ? 6 : 14,
  },
  label: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    color: COLORS.white,
    marginBottom: IS_WATCH_DEVICE ? 2 : 6,
  },
  loader: {
    marginVertical: IS_WATCH_DEVICE ? 4 : 12,
  },
  footer: {
    marginTop: IS_WATCH_DEVICE ? 4 : 16,
  },
  footerText: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  loginText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
