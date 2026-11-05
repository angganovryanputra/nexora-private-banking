import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { ScreenType } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { pairWearable } from '../utils/api';
import theme from '../styles/theme';
import {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
  IS_WATCH_DEVICE,
} from '../styles/globalStyles';

const { COLORS, SIZES, SHADOWS } = theme;

interface CompanionPairingScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

const CompanionPairingScreen: React.FC<CompanionPairingScreenProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [pairingCode] = useState('839-201');
  const [isPaired, setIsPaired] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSimulateCompanionSync = async () => {
    setLoading(true);
    try {
      const res = await pairWearable(pairingCode, 'Galaxy Watch 6 (480x480)', 'WEAR_OS_WATCH');
      setIsPaired(true);
      const devId = res.ok && res.data?.device_id ? res.data.device_id : 'watch_9201';
      Alert.alert(
        'Companion Linked! ⌚📱',
        `Linked to VulnBank Mobile App!\nDevice ID: ${devId}\nPaired Account: ADMIN001\n\n[V-B01] No cryptographic signature required. Token received over HTTP/BLE!`,
        [
          {
            text: 'Open Wallet',
            onPress: async () => {
              await login('admin', 'admin123');
              onNavigate('dashboard');
            },
          },
        ]
      );
    } catch {
      await login('admin', 'admin123');
      onNavigate('dashboard');
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
      <View style={styles.header}>
        <Icon name="link" size={16} color={COLORS.secondary} />
        <Text style={styles.title}>Companion Pairing</Text>
        <Text style={styles.subtitle}>Link watch to VulnBank Mobile App</Text>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>6-DIGIT DEVICE CODE</Text>
        <Text style={styles.codeText}>{pairingCode}</Text>
        <Text style={styles.codeHint}>
          Enter this code in your smartphone app
        </Text>
      </View>

      <TouchableOpacity
        style={styles.pairBtn}
        onPress={handleSimulateCompanionSync}
      >
        <Icon name="bluetooth" size={12} color={COLORS.black} />
        <Text style={styles.pairBtnText}>Simulate Phone Link (V-B01)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.offlineBtn}
        onPress={() => onNavigate('login')}
      >
        <Text style={styles.offlineBtnText}>Use Offline Quick PIN (1234)</Text>
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
    paddingTop: IS_WATCH_DEVICE ? 6 : 24,
    paddingBottom: CIRCULAR_PADDING_BOTTOM,
  },
  header: {
    alignItems: 'center',
    marginBottom: IS_WATCH_DEVICE ? 4 : 12,
  },
  title: {
    fontSize: IS_WATCH_DEVICE ? 13 : 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 2,
  },
  subtitle: {
    fontSize: IS_WATCH_DEVICE ? 8.5 : 12,
    color: COLORS.textLight,
  },
  codeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: IS_WATCH_DEVICE ? 6 : 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondary,
    marginVertical: IS_WATCH_DEVICE ? 4 : 12,
    ...SHADOWS.small,
  },
  codeLabel: {
    fontSize: IS_WATCH_DEVICE ? 8 : 11,
    fontWeight: 'bold',
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  codeText: {
    fontSize: IS_WATCH_DEVICE ? 16 : 26,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
    marginVertical: IS_WATCH_DEVICE ? 3 : 8,
  },
  codeHint: {
    fontSize: IS_WATCH_DEVICE ? 8 : 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  pairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radius.round,
    paddingVertical: IS_WATCH_DEVICE ? 6 : 12,
    minHeight: IS_WATCH_DEVICE ? 30 : 46,
    marginTop: IS_WATCH_DEVICE ? 3 : 8,
  },
  pairBtnText: {
    fontSize: IS_WATCH_DEVICE ? 9.5 : 13,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 6,
  },
  offlineBtn: {
    alignItems: 'center',
    paddingVertical: IS_WATCH_DEVICE ? 6 : 12,
  },
  offlineBtnText: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default CompanionPairingScreen;

