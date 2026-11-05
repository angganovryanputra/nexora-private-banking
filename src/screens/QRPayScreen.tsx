import React, { useState, useEffect } from 'react';
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
import { post } from '../utils/api';
import theme from '../styles/theme';
import {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
  IS_WATCH_DEVICE,
} from '../styles/globalStyles';

const { COLORS, SIZES, SHADOWS } = theme;

interface QRPayScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

/**
 * REAL SMARTWATCH BANKING COMPONENT:
 * Rotating QRIS / Contactless Barcode Payment Screen.
 *
 * INTENTIONALLY VULNERABLE:
 *  - V-W15: QR Token Sniffing & Replay.
 *    The QR payload ('NEXORA-QRIS-992144-TOKEN') is static and lacks a dynamic
 *    HMAC signature, allowing shoulder surfers or rogue cameras to replay it.
 */
const QRPayScreen: React.FC<QRPayScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(120);
  const [tokenCode, setTokenCode] = useState('8839-2144-0192');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Rotate mock token
          const rand = Math.floor(1000 + Math.random() * 9000);
          setTokenCode(`8839-${rand}-0192`);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSimulateScan = () => {
    Alert.alert(
      'SNAP QRIS Terminal Detected',
      `Merchant: NEXORA DIGITAL MERCH 001\nNMID: ID1020029988112\nAmount: Rp 75.000 ($35.50)\nToken: ${tokenCode}\n\n[V-W15] SNAP QRIS verified without cryptographic HMAC timestamp freshness.`,
      [
        {
          text: 'Authorize Payment',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const res = await post(
                '/api/qris/checkout',
                {
                  account_number: user?.accountNumber || 'ADMIN001',
                  amount: 75.00,
                  merchant_name: 'NEXORA DIGITAL MERCH 001',
                  qr_payload: `00020101021226610016ID.NEXORA.WWW01189360099800000000015204581253033605802ID5920NEXORA DIGITAL MERCH6007JAKARTA62070703A016304E8A2`,
                },
                user?.token
              );
              if (res.ok) {
                const rrn = res.data?.rrn || 'RRN-992144';
                Alert.alert(
                  '💳 Payment Successful (SNAP QRIS)',
                  `Merchant: NEXORA DIGITAL MERCH 001\nAmount: Rp 75.000 ($35.50)\nRRN: ${rrn}\nStatus: APPROVED\nRemaining balance deducted on backend.\n\n[V-W15 Replay Attack]: Tap "Simulate Terminal Scan" again to re-debit using the same static token!`,
                  [{ text: 'OK', onPress: () => onNavigate('dashboard') }]
                );
              } else {
                Alert.alert(
                  'Offline Demo',
                  `Payment of Rp 75.000 executed locally.\n\n[V-W15] Replayable static token.`
                );
              }
            } catch {
              Alert.alert('Payment Recorded', 'Payment of Rp 75.000 sent.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Icon name="qrcode" size={18} color={COLORS.primary} />
        <Text style={styles.title}>Contactless QR Pay</Text>
        <Text style={styles.subtitle}>Hold watch near cashier scanner</Text>
      </View>

      {/* High-Contrast Rotating QR Widget */}
      <View style={styles.qrCard}>
        <View style={styles.qrBox}>
          {/* Simulated High-Contrast QR Matrix Pattern */}
          <View style={styles.qrRow}>
            <View style={[styles.qrPixel, styles.qrCorner]} />
            <View style={styles.qrPixel} />
            <View style={[styles.qrPixel, styles.qrCorner]} />
          </View>
          <View style={styles.qrRow}>
            <View style={styles.qrPixel} />
            <View style={[styles.qrPixel, { backgroundColor: COLORS.primary }]} />
            <View style={styles.qrPixel} />
          </View>
          <View style={styles.qrRow}>
            <View style={[styles.qrPixel, styles.qrCorner]} />
            <View style={styles.qrPixel} />
            <View style={[styles.qrPixel, styles.qrCorner]} />
          </View>
        </View>

        <Text style={styles.tokenText}>{tokenCode}</Text>
        <View style={styles.timerBadge}>
          <Icon name="clock-o" size={10} color={COLORS.warning} />
          <Text style={styles.timerText}>Refreshes in {countdown}s</Text>
        </View>
      </View>

      {/* 1-Tap Simulation Button */}
      <TouchableOpacity style={styles.scanBtn} onPress={handleSimulateScan}>
        <Icon name="check-circle" size={14} color={COLORS.black} />
        <Text style={styles.scanBtnText}>Simulate Terminal Scan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => onNavigate('dashboard')}
      >
        <Text style={styles.backBtnText}>Dashboard</Text>
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
    paddingTop: CIRCULAR_PADDING_TOP - 16,
    paddingBottom: CIRCULAR_PADDING_BOTTOM,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.xs,
  },
  title: {
    fontSize: IS_WATCH_DEVICE ? 12 : 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 2,
  },
  subtitle: {
    fontSize: IS_WATCH_DEVICE ? 9 : 13,
    color: COLORS.textLight,
  },
  qrCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: IS_WATCH_DEVICE ? 6 : 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.spacing.xs,
    ...SHADOWS.small,
  },
  qrBox: {
    width: IS_WATCH_DEVICE ? 74 : 140,
    height: IS_WATCH_DEVICE ? 74 : 140,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.md,
    padding: IS_WATCH_DEVICE ? 5 : 10,
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  qrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qrPixel: {
    width: IS_WATCH_DEVICE ? 16 : 30,
    height: IS_WATCH_DEVICE ? 16 : 30,
    backgroundColor: COLORS.black,
    borderRadius: 3,
  },
  qrCorner: {
    backgroundColor: COLORS.black,
    borderWidth: 2,
    borderColor: '#333',
  },
  tokenText: {
    fontSize: IS_WATCH_DEVICE ? 10 : 15,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 1,
    marginTop: 3,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
    paddingHorizontal: IS_WATCH_DEVICE ? 5 : 10,
    paddingVertical: IS_WATCH_DEVICE ? 2 : 4,
    borderRadius: SIZES.radius.round,
    marginTop: 3,
  },
  timerText: {
    fontSize: IS_WATCH_DEVICE ? 8 : 12,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: 4,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.round,
    paddingVertical: IS_WATCH_DEVICE ? 6 : 12,
    minHeight: SIZES.touchTarget,
    marginTop: 2,
  },
  scanBtnText: {
    fontSize: IS_WATCH_DEVICE ? 10 : 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 6,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: IS_WATCH_DEVICE ? 6 : 12,
  },
  backBtnText: {
    fontSize: IS_WATCH_DEVICE ? 10 : 14,
    color: COLORS.textLight,
  },
});

export default QRPayScreen;

