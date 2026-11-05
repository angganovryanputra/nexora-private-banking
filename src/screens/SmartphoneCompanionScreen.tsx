import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { ScreenType } from '../navigation/types';
import { dispatchWearableEvent, getWearablePackets, pairWearable, verifyCardlessCash, generateCardlessCash, getApiBase, pingBackend } from '../utils/api';
import { watchOSBridge } from '../utils/watchOSBridge';
import theme, { scaleFont } from '../styles/theme';
import {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
  IS_WATCH_DEVICE,
} from '../styles/globalStyles';

const { COLORS, SIZES, SHADOWS } = theme;

interface SmartphoneCompanionScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

const SmartphoneCompanionScreen: React.FC<SmartphoneCompanionScreenProps> = ({ onNavigate }) => {
  const [targetDeviceId, setTargetDeviceId] = useState('watch_9201');
  const [watchSyncStatus, setWatchSyncStatus] = useState('⌚ Watch Linked (watch_9201)');
  const [lastAction, setLastAction] = useState('Idle');
  const [isLoading, setIsLoading] = useState(false);
  const [packetCount, setPacketCount] = useState(0);
  const [backendStatus, setBackendStatus] = useState<string>('Checking backend…');

  // Shows the actual target URL so a failed relay is diagnosable at a glance.
  const showRelayWarning = () => {
    Alert.alert(
      'Relay Warning',
      `Backend unreachable at:\n${getApiBase()}\n\nStart the relay (python backend/server.py) and confirm the URL. On a physical watch/phone use your PC's LAN IP — set & verify it in Pentest Lab → API → Local Backend Target → Test Connection.`
    );
  };

  // Live reachability check so the researcher sees backend status immediately.
  useEffect(() => {
    let active = true;
    pingBackend().then((r) => {
      if (active) {
        setBackendStatus(r.ok ? `🟢 Backend online · ${r.base}` : `🔴 Unreachable · ${r.base}`);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Sync Balance to Watch (V-B01 / V-B02)
  const handleSyncBalanceToWatch = async () => {
    setIsLoading(true);
    try {
      // Dispatches via backend relay and native WatchConnectivity bridge (Apple Watch & Wear OS)
      await watchOSBridge.sendMessageToWatch({
        action: 'UPDATE_BALANCE',
        payload: { amount: 888888000.0, currency: 'IDR' },
      });
      const res = await dispatchWearableEvent(targetDeviceId, 'UPDATE_BALANCE', {
        amount: 888888000.0,
        currency: 'IDR',
        timestamp: Date.now(),
      });
      if (res.ok) {
        setLastAction(`Transmitted UPDATE_BALANCE (Rp 888.888.000) -> ${targetDeviceId}`);
        Alert.alert(
          '📶 BLE & WCSession Sync Dispatched (V-B01)',
          `Transmitted to wearable bridge & backend relay:\nTarget: ${targetDeviceId}\nAction: UPDATE_BALANCE\nAmount: Rp 888.888.000\n\n[V-B01] No HMAC signature or timestamp freshness check. Watch balance will update in real time!`
        );
      } else {
        showRelayWarning();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Push 2FA Alert to Watch (V-W09 / V-AP04)
  const handlePush2FAToWatch = async (amount = 50000000.0, merchant = 'CyberStore Inc.') => {
    setIsLoading(true);
    try {
      await watchOSBridge.sendMessageToWatch({
        action: 'TRIGGER_HIGH_VALUE_2FA',
        payload: { tx_id: 'TX-HIGHVAL-9921', amount, recipient: merchant },
      });
      const res = await dispatchWearableEvent(targetDeviceId, 'PUSH_2FA', {
        amount,
        merchant,
        otp: '992104',
        timestamp: Date.now(),
      });
      if (res.ok) {
        setLastAction(`Pushed 2FA Authorization (Rp ${amount.toLocaleString('id-ID')}) -> ${targetDeviceId}`);
        Alert.alert(
          '🔔 Push 2FA Sent to Watch (V-W09 / V-AP04)',
          `Broadcast sent to smartwatch:\nTarget: ${targetDeviceId}\nMerchant: ${merchant}\nDebit: Rp ${amount.toLocaleString('id-ID')}\nOTP: 992104\n\n[V-W09] Plaintext authorization card will pop up on the watch screen in real time!`
        );
      } else {
        showRelayWarning();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Inject Quick Pay Transfer (V-W06)
  const handleInjectTransfer = async () => {
    setIsLoading(true);
    try {
      await watchOSBridge.sendMessageToWatch({
        action: 'QUICK_PAY',
        payload: { amount: 50000.0, recipient: 'HACKER_CORP' },
      });
      const res = await dispatchWearableEvent(targetDeviceId, 'QUICK_PAY', {
        amount: 50000.0,
        recipient: 'HACKER_CORP',
        timestamp: Date.now(),
      });
      if (res.ok) {
        setLastAction(`Injected Quick Pay (Rp 50.000.000) -> ${targetDeviceId}`);
        Alert.alert(
          '⚡ Quick Pay Injected (V-W06)',
          `Transmitted to smartwatch:\nTarget: ${targetDeviceId}\nRecipient: HACKER_CORP\nAmount: Rp 50.000.000\n\nExecuted without smartwatch PIN verification!`
        );
      } else {
        showRelayWarning();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate Merchant QRIS POS Checkout (V-06 / V-AP06 Replay Attack)
  const handleSimulateMerchantQRISScan = async () => {
    setIsLoading(true);
    try {
      await watchOSBridge.sendMessageToWatch({
        action: 'QRIS_PAYMENT_COMPLETED',
        payload: { amount: 75000.0, merchant: 'NEXORA DIGITAL MERCH 001' },
      });
      const res = await dispatchWearableEvent(targetDeviceId, 'QRIS_PAYMENT_COMPLETED', {
        amount: 75000.0,
        merchant: 'NEXORA DIGITAL MERCH 001',
        timestamp: Date.now(),
      });
      if (res.ok) {
        setLastAction(`Executed Merchant QRIS Checkout (Rp 75.000) -> ${targetDeviceId}`);
        Alert.alert(
          '💳 Merchant QRIS Scanned (V-06 / V-AP06)',
          `Simulated POS checkout from Smartwatch:\nDebit: Rp 75.000\nMerchant: NEXORA DIGITAL MERCH 001\nStatus: APPROVED\n\n[V-06 Replay Attack Demo]: Tap this button again without generating a new QR code on the watch. Notice both transactions succeed because of static transaction ID!`
        );
      } else {
        showRelayWarning();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate ATM Terminal Cash Withdrawal (Gap 1 Parity)
  const handleSimulateAtmWithdrawal = async () => {
    setIsLoading(true);
    try {
      // Real flow: generate a fresh 6-digit cardless-cash token on the backend,
      // then redeem it at the "ATM". (The old hardcoded '839201' never existed in
      // the DB, so verify always failed.)
      const gen = await generateCardlessCash('NX-8492014', 250000.0);
      if (!gen.ok || !gen.data?.token) {
        showRelayWarning();
        return;
      }
      const token = gen.data.token;
      const res = await verifyCardlessCash(token);
      if (res.ok) {
        const amt = res.data?.amount || 250000;
        setLastAction(`ATM Cash Dispensed (Rp ${amt.toLocaleString('id-ID')}) — code ${token}`);
        Alert.alert(
          '🏧 ATM Terminal Cash Dispensed! 💵',
          `ATM Terminal: ATM-NEXORA-008\nGenerated code: ${token}\nDispensed: Rp ${amt.toLocaleString('id-ID')}\nAccount: NX-8492014\n\n[Gap 1 Parity] 6-digit wearable cash token generated then redeemed at the ATM terminal.`
        );
      } else {
        Alert.alert('ATM Error', res.data?.message || 'Invalid or expired withdrawal code.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sniff Raw Wearable Sync Packets (V-B03)
  const handleSniffPackets = async () => {
    try {
      const res = await getWearablePackets();
      if (res.ok && res.data?.packets) {
        const packets = res.data.packets;
        setPacketCount(packets.length);
        const latest = packets[0];
        Alert.alert(
          '📡 Sniffed Wearable Packets (V-B03)',
          `Captured ${packets.length} unencrypted packets!\n\nLatest Packet:\nFrom: ${latest?.source_device}\nTo: ${latest?.target_device}\nAction: ${latest?.action}\nPayload: ${latest?.payload?.substring(0, 80)}...\n\n[V-B03] Demonstrates cleartext BLE/Relay data interception!`
        );
      } else {
        Alert.alert('Packet Sniffer', 'No packets captured yet. Trigger a sync action first.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Icon name="mobile" size={20} color={COLORS.secondary} />
        <Text style={styles.title}>Companion Manager</Text>
        <Text style={styles.subtitle}>Smartphone to Smartwatch Bridge</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{watchSyncStatus}</Text>
      </View>

      <TouchableOpacity onPress={() => onNavigate('pentestLab')} activeOpacity={0.7}>
        <Text style={styles.backendStatusText} numberOfLines={1}>{backendStatus}</Text>
        <Text style={styles.backendHintText} numberOfLines={1}>Tap to set / test backend URL →</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Cross-Device Pentest Triggers</Text>

      {/* Trigger 1: Sync Balance */}
      <TouchableOpacity
        style={styles.triggerCard}
        onPress={handleSyncBalanceToWatch}
        disabled={isLoading}
      >
        <View style={[styles.iconCircle, { backgroundColor: COLORS.primary }]}>
          <Icon name="refresh" size={12} color={COLORS.black} />
        </View>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerTitle}>Sync Balance to Watch</Text>
          <Text style={styles.triggerSub}>V-B01: Insecure BLE packet injection (Rp 888.888.000)</Text>
        </View>
        <Icon name="chevron-right" size={10} color={COLORS.textLight} />
      </TouchableOpacity>

      {/* Trigger 2: Push Standard 2FA */}
      <TouchableOpacity
        style={styles.triggerCard}
        onPress={() => handlePush2FAToWatch(250000.0, 'CyberStore Inc.')}
        disabled={isLoading}
      >
        <View style={[styles.iconCircle, { backgroundColor: COLORS.warning }]}>
          <Icon name="bell" size={12} color={COLORS.black} />
        </View>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerTitle}>Push 2FA Alert to Watch</Text>
          <Text style={styles.triggerSub}>V-W09: Plaintext OTP snooping (Rp 250.000)</Text>
        </View>
        <Icon name="chevron-right" size={10} color={COLORS.textLight} />
      </TouchableOpacity>

      {/* Trigger 2B: High-Value OOB 2FA Approval ($50,000 / Rp 50 Juta) */}
      <TouchableOpacity
        style={[styles.triggerCard, { borderColor: 'rgba(255, 68, 68, 0.5)' }]}
        onPress={() => handlePush2FAToWatch(50000000.0, 'Offshore Escrow Ltd.')}
        disabled={isLoading}
      >
        <View style={[styles.iconCircle, { backgroundColor: COLORS.danger }]}>
          <Icon name="shield" size={12} color={COLORS.white} />
        </View>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerTitle}>High-Value 2FA (Rp 50 Juta OOB)</Text>
          <Text style={styles.triggerSub}>Enterprise Out-of-Band Auth without Nonce</Text>
        </View>
        <Icon name="chevron-right" size={10} color={COLORS.textLight} />
      </TouchableOpacity>

      {/* Trigger 3: Quick Pay Hijack */}
      <TouchableOpacity
        style={styles.triggerCard}
        onPress={handleInjectTransfer}
        disabled={isLoading}
      >
        <View style={[styles.iconCircle, { backgroundColor: COLORS.danger }]}>
          <Icon name="bolt" size={12} color={COLORS.white} />
        </View>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerTitle}>Inject Watch Payment</Text>
          <Text style={styles.triggerSub}>V-W06: Unauthorized Quick Pay (Rp 50.000.000)</Text>
        </View>
        <Icon name="chevron-right" size={10} color={COLORS.textLight} />
      </TouchableOpacity>

      {/* Trigger 3B: Simulate Merchant POS QRIS Checkout & Replay */}
      <TouchableOpacity
        style={[styles.triggerCard, { borderColor: 'rgba(0, 229, 153, 0.4)' }]}
        onPress={handleSimulateMerchantQRISScan}
        disabled={isLoading}
      >
        <View style={[styles.iconCircle, { backgroundColor: COLORS.primary }]}>
          <Icon name="qrcode" size={12} color={COLORS.black} />
        </View>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerTitle}>Merchant POS Scan (QRIS Replay)</Text>
          <Text style={styles.triggerSub}>V-06 / V-AP06: Simulate POS Scan & Replay</Text>
        </View>
        <Icon name="chevron-right" size={10} color={COLORS.textLight} />
      </TouchableOpacity>

      {/* Trigger 3C: Simulate ATM Terminal Dispense */}
      <TouchableOpacity
        style={[styles.triggerCard, { borderColor: 'rgba(255, 215, 0, 0.4)' }]}
        onPress={() => handleSimulateAtmWithdrawal()}
        disabled={isLoading}
      >
        <View style={[styles.iconCircle, { backgroundColor: '#FFD700' }]}>
          <Icon name="money" size={12} color={COLORS.black} />
        </View>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerTitle}>Simulate ATM Terminal Dispense</Text>
          <Text style={styles.triggerSub}>Gap 1: Redeem 6-digit wearable code at ATM</Text>
        </View>
        <Icon name="chevron-right" size={10} color={COLORS.textLight} />
      </TouchableOpacity>

      {/* Trigger 4: Packet Sniffer */}
      <TouchableOpacity
        style={[styles.triggerCard, { borderColor: 'rgba(0, 229, 153, 0.4)' }]}
        onPress={handleSniffPackets}
      >
        <View style={[styles.iconCircle, { backgroundColor: '#00C2FF' }]}>
          <Icon name="rss" size={12} color={COLORS.black} />
        </View>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerTitle}>Sniff Wearable Packets</Text>
          <Text style={styles.triggerSub}>V-B03: Inspect unencrypted relay traffic</Text>
        </View>
        <Icon name="chevron-right" size={10} color={COLORS.textLight} />
      </TouchableOpacity>

      {isLoading && (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 8 }} />
      )}

      <View style={styles.logCard}>
        <Text style={styles.logLabel}>Last Transmitted Action:</Text>
        <Text style={styles.logValue}>{lastAction}</Text>
      </View>

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
    paddingHorizontal: IS_WATCH_DEVICE ? ROUND_INSET : 16,
    paddingTop: IS_WATCH_DEVICE ? CIRCULAR_PADDING_TOP : (Platform.OS === 'ios' ? 48 : 20),
    paddingBottom: IS_WATCH_DEVICE ? CIRCULAR_PADDING_BOTTOM : (Platform.OS === 'ios' ? 36 : 32),
  },
  header: {
    alignItems: 'center',
    marginBottom: IS_WATCH_DEVICE ? 4 : 12,
  },
  title: {
    fontSize: IS_WATCH_DEVICE ? 12 : 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 2,
  },
  subtitle: {
    fontSize: IS_WATCH_DEVICE ? 9 : 13,
    color: COLORS.textLight,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.round,
    paddingVertical: IS_WATCH_DEVICE ? 4 : 10,
    paddingHorizontal: IS_WATCH_DEVICE ? 8 : 16,
    marginBottom: IS_WATCH_DEVICE ? 6 : 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: IS_WATCH_DEVICE ? 6 : 10,
    height: IS_WATCH_DEVICE ? 6 : 10,
    borderRadius: IS_WATCH_DEVICE ? 3 : 5,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  statusText: {
    fontSize: IS_WATCH_DEVICE ? 9 : 13,
    color: COLORS.white,
    fontWeight: '600',
  },
  backendStatusText: {
    fontSize: IS_WATCH_DEVICE ? 8 : 11,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: IS_WATCH_DEVICE ? 1 : 2,
    fontFamily: 'monospace',
  },
  backendHintText: {
    fontSize: scaleFont(10),
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  sectionTitle: {
    fontSize: IS_WATCH_DEVICE ? 9 : 13,
    color: COLORS.textMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: IS_WATCH_DEVICE ? 3 : 8,
    marginLeft: 2,
  },
  triggerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: IS_WATCH_DEVICE ? SIZES.radius.md : 14,
    padding: IS_WATCH_DEVICE ? 6 : 14,
    marginBottom: IS_WATCH_DEVICE ? 4 : 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: IS_WATCH_DEVICE ? 22 : 38,
    height: IS_WATCH_DEVICE ? 22 : 38,
    borderRadius: IS_WATCH_DEVICE ? 11 : 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: IS_WATCH_DEVICE ? 6 : 12,
  },
  triggerInfo: {
    flex: 1,
  },
  triggerTitle: {
    fontSize: IS_WATCH_DEVICE ? 10 : 15,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  triggerSub: {
    fontSize: IS_WATCH_DEVICE ? 8 : 12,
    color: COLORS.textLight,
  },
  logCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: IS_WATCH_DEVICE ? SIZES.radius.sm : 12,
    padding: IS_WATCH_DEVICE ? 6 : 14,
    marginTop: IS_WATCH_DEVICE ? 4 : 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logLabel: {
    fontSize: IS_WATCH_DEVICE ? 8 : 12,
    color: COLORS.warning,
    fontWeight: 'bold',
  },
  logValue: {
    fontSize: IS_WATCH_DEVICE ? 9 : 13,
    color: COLORS.white,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: IS_WATCH_DEVICE ? 8 : 16,
  },
  backBtnText: {
    fontSize: IS_WATCH_DEVICE ? 11 : 14,
    color: COLORS.textLight,
  },
});

export default SmartphoneCompanionScreen;

