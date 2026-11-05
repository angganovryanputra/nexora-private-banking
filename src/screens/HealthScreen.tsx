import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { ScreenType } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import CustomButton from '../components/CustomButton';
import theme from '../styles/theme';
import { API_BASE } from '../utils/api';

const { COLORS, SIZES, SHADOWS } = theme;

// Native module backed by the watch heart-rate sensor (with a simulator
// fallback for emulators that lack the virtual sensor).
const HeartRate = NativeModules.HeartRate as
  | {
      start: () => void;
      stop: () => void;
      getHistory: () => Promise<string>;
      clearHistory: () => Promise<void>;
    }
  | undefined;

interface HeartRateScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

interface Reading {
  bpm: number;
  timestamp: number;
}

const HealthScreen: React.FC<HeartRateScreenProps> = () => {
  const { user } = useAuth();
  const [monitoring, setMonitoring] = useState(false);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  const refreshHistory = async () => {
    if (!HeartRate) return;
    try {
      const raw = await HeartRate.getHistory();
      setHistory(JSON.parse(raw));
    } catch (e) {
      // swallow
    }
  };

  useEffect(() => {
    refreshHistory();

    if (!HeartRate) return undefined;

    const emitter = new NativeEventEmitter(NativeModules.HeartRate);
    subscriptionRef.current = emitter.addListener('HeartRate', (reading: Reading) => {
      setCurrentBpm(reading.bpm);
    });

    return () => {
      subscriptionRef.current?.remove?.();
      HeartRate.stop();
    };
  }, []);

  const startMonitoring = async () => {
    if (!HeartRate) {
      Alert.alert('Unavailable', 'HeartRate native module not available.');
      return;
    }
    if (Platform.OS === 'android') {
      // Best-effort permission request. NOTE (intentionally vulnerable):
      // monitoring still proceeds when the permission is denied — a classic
      // wearable flaw where health telemetry keeps flowing regardless.
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
        );
      } catch (e) {
        // ignored on purpose
      }
    }
    HeartRate.start();
    setMonitoring(true);
  };

  const stopMonitoring = () => {
    HeartRate?.stop();
    setMonitoring(false);
    refreshHistory();
  };

  // V-W4: unauthenticated "health sync" — sends the full heart-rate history
  // together with the user's username to a server endpoint. No consent,
  // no auth header needed, payload observable in any proxy.
  const syncHealthData = async () => {
    setSyncStatus('Syncing...');
    try {
      const payload = {
        username: user?.username,
        account_number: user?.accountNumber,
        readings: history,
      };
      await fetch(`${API_BASE}/debug/heart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setSyncStatus(`Sent ${history.length} readings (unauthenticated)`);
    } catch (e: any) {
      setSyncStatus('Network error — payload still attempted');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.bpmCard}>
        <Icon
          name="heartbeat"
          size={SIZES.xLarge}
          color={currentBpm ? COLORS.danger : COLORS.textLight}
        />
        <Text style={styles.bpmValue}>
          {currentBpm !== null ? `${currentBpm}` : '--'}
        </Text>
        <Text style={styles.bpmUnit}>BPM</Text>
      </View>

      <View style={styles.buttonRow}>
        <CustomButton
          title={monitoring ? 'Stop' : 'Start'}
          onPress={monitoring ? stopMonitoring : startMonitoring}
        />
        <CustomButton title="Sync" onPress={syncHealthData} />
      </View>

      {syncStatus && <Text style={styles.syncStatus}>{syncStatus}</Text>}

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>
          History ({history.length}) — stored in plaintext
        </Text>
        {history.slice(-20).reverse().map((r, i) => (
          <View key={i} style={styles.historyRow}>
            <Icon name="heart" size={SIZES.xSmall} color={COLORS.danger} />
            <Text style={styles.historyBpm}>{r.bpm} BPM</Text>
            <Text style={styles.historyTime}>
              {new Date(r.timestamp * 1000).toLocaleTimeString()}
            </Text>
          </View>
        ))}
        {history.length === 0 && (
          <Text style={styles.emptyText}>No readings yet</Text>
        )}
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
    padding: SIZES.spacing.sm,
  },
  bpmCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardDark,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
    ...SHADOWS.medium,
  },
  bpmValue: {
    fontSize: SIZES.xxLarge,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: SIZES.spacing.xs,
  },
  bpmUnit: {
    fontSize: SIZES.xSmall,
    color: COLORS.textLight,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.sm,
  },
  syncStatus: {
    fontSize: SIZES.xSmall,
    color: COLORS.warning,
    textAlign: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  historySection: {
    backgroundColor: COLORS.cardDark,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.sm,
  },
  sectionTitle: {
    fontSize: SIZES.xSmall,
    color: COLORS.textLight,
    marginBottom: SIZES.spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  historyBpm: {
    flex: 1,
    fontSize: SIZES.xSmall,
    color: COLORS.white,
    marginLeft: SIZES.spacing.xs,
  },
  historyTime: {
    fontSize: SIZES.xSmall,
    color: COLORS.textLight,
  },
  emptyText: {
    fontSize: SIZES.xSmall,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default HealthScreen;
