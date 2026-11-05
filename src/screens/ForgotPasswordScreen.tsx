import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
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

interface ForgotPasswordScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!username) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }

    setLoading(true);

    try {
      const response = await post(
        ENDPOINTS.resetPassword.request,
        { username }
      );

      if (response.ok) {
        setSuccess(true);
        Alert.alert(
          'Success',
          'Reset PIN has been sent to your registered email address.',
          [
            {
              text: 'OK',
              onPress: () => onNavigate('resetPassword')
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
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
    >
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your username to receive a reset PIN
      </Text>
      
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Enter your username"
            placeholderTextColor={COLORS.textLight}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading && !success}
          />
        </View>
        
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
        ) : (
          <CustomButton
            title="Request Reset PIN"
            onPress={handleSubmit}
            isFullWidth
            variant={success ? "success" : "primary"}
          />
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Remembered your password?{' '}
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

export default ForgotPasswordScreen;
