import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, DeviceEventEmitter, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { ScreenType } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { ENDPOINTS, get, pollWearableEvents, resolveWearableEvent, generateCardlessCash } from '../utils/api';
import { watchOSBridge } from '../utils/watchOSBridge';
import theme from '../styles/theme';
import {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
  IS_WATCH_DEVICE,
} from '../styles/globalStyles';

const { COLORS, SIZES, SHADOWS } = theme;

interface DashboardScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [balance, setBalance] = useState('Rp 99.999.000');
  const [currencyMode, setCurrencyMode] = useState<'IDR' | 'USD'>('IDR');
  const [sim2FAVisible, setSim2FAVisible] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ eventId?: number; amount: number; merchant: string } | null>(null);
  
  // ATM Cardless Cash Modal State
  const [atmModalVisible, setAtmModalVisible] = useState(false);
  const [atmCashToken, setAtmCashToken] = useState('839201');
  const [atmCashCountdown, setAtmCashCountdown] = useState(300);

  const isAdmin = user?.isAdmin || false;

  const fetchBalance = useCallback(async () => {
    try {
      const res = await get(ENDPOINTS.checkBalance(user?.accountNumber || 'ADMIN001'), user?.token);
      if (res.ok && res.data?.balance !== undefined) {
        const num = Number(res.data.balance);
        if (currencyMode === 'IDR') {
          setBalance(`Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`);
        } else {
          setBalance(`$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        }
      }
    } catch {}
  }, [user, currencyMode]);

  // 1. Fetch initial account balance
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // 2. Listen to native Android BluetoothSyncEvent broadcast
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('BluetoothSyncEvent', (evt: any) => {
      if (evt && evt.action === 'UPDATE_BALANCE' && evt.amount !== undefined) {
        const num = Number(evt.amount);
        setBalance(currencyMode === 'IDR' ? `Rp ${num.toLocaleString('id-ID')}` : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        Alert.alert('📶 Wear OS BLE Sync', `Watch balance synced to ${num} via Bluetooth LE.`);
      }
    });
    return () => sub.remove();
  }, [currencyMode]);

  // 2B. Listen to native iOS Apple Watch WCSession messages
  useEffect(() => {
    const sub = watchOSBridge.addMessageListener((evt: any) => {
      if (!evt) return;
      if (evt.action === 'UPDATE_BALANCE' && evt.payload?.amount !== undefined) {
        const num = Number(evt.payload.amount);
        setBalance(currencyMode === 'IDR' ? `Rp ${num.toLocaleString('id-ID')}` : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        Alert.alert('⌚ Apple Watch Sync', `Balance updated via WCSession dictionary.`);
      } else if (evt.action === 'RESOLVE_2FA' || evt.action === 'APPROVE_2FA') {
        const amt = Number(evt.amount || 50000);
        Alert.alert('💸 Apple Watch 2FA Approved', `Wire transfer of $${amt.toLocaleString()} authorized from Apple Watch!`);
        fetchBalance();
      } else if (evt.action === 'QRIS_PAYMENT_COMPLETED') {
        const debit = Number(evt.payload?.amount || 75.0);
        Alert.alert('💳 Apple Watch QRIS Debit', `SNAP QRIS payment of ${debit} approved on Apple Watch.`);
        fetchBalance();
      }
    });
    return () => sub.remove();
  }, [fetchBalance, currencyMode]);

  // 3. Poll wearable events from local backend relay (Cross-device real-time sync)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await pollWearableEvents('watch_9201');
        if (res.ok && res.data?.events && res.data.events.length > 0) {
          for (const ev of res.data.events) {
            if (ev.action === 'UPDATE_BALANCE') {
              const amt = Number(ev.payload?.amount || 0);
              setBalance(currencyMode === 'IDR' ? `Rp ${amt.toLocaleString('id-ID')}` : `$${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
              await resolveWearableEvent(ev.id, 'APPLIED');
              Alert.alert('📶 Remote Sync Received', `Balance updated to ${amt} from Smartphone Companion.`);
            } else if (ev.action === 'PUSH_2FA' || ev.action === 'TRIGGER_HIGH_VALUE_2FA') {
              setTwoFactorData({
                eventId: ev.id,
                amount: ev.payload?.amount || 50000.00,
                merchant: ev.payload?.merchant || ev.payload?.recipient || 'CyberStore Inc.',
              });
              setSim2FAVisible(true);
            } else if (ev.action === 'QRIS_PAYMENT_COMPLETED') {
              const debit = Number(ev.payload?.amount || 75.00);
              await resolveWearableEvent(ev.id, 'APPLIED');
              Alert.alert(
                '💳 SNAP QRIS Payment Success',
                `Payment of ${debit} to ${ev.payload?.merchant || 'NEXORA MERCH 001'} approved.\nRef: SNAP-QRIS-9921\nRemaining Balance Deducted.`
              );
              fetchBalance();
            } else if (ev.action === 'QUICK_PAY') {
              await resolveWearableEvent(ev.id, 'APPLIED');
              Alert.alert(
                '⚡ Quick Pay Injected',
                `Transfer of ${ev.payload?.amount || 50000} to ${ev.payload?.recipient || 'HACKER_CORP'} executed without PIN!`
              );
            }
          }
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [currencyMode]);

  const handleOpenAtmCash = async () => {
    try {
      const res = await generateCardlessCash(user?.accountNumber || 'ADMIN001', 250000.0);
      if (res.ok && res.data?.token) {
        setAtmCashToken(res.data.token);
        setAtmCashCountdown(300);
        setAtmModalVisible(true);
      } else {
        setAtmCashToken('839201');
        setAtmModalVisible(true);
      }
    } catch {
      setAtmCashToken('839201');
      setAtmModalVisible(true);
    }
  };

  const quickPills = [
    { title: 'SNAP QRIS', icon: 'qrcode', screen: 'qrPay', color: COLORS.primary },
    { title: 'Transfer', icon: 'paper-plane', screen: 'transfer', color: COLORS.secondary },
    { title: 'ATM Cash-Out', icon: 'money', action: handleOpenAtmCash, color: COLORS.accentGold },
    { title: 'Virtual Cards', icon: 'credit-card', screen: 'cards', color: '#00D2FF' },
    { title: 'History', icon: 'history', screen: 'transactions', color: '#80D8FF' },
    { title: 'Bills (PLN)', icon: 'bolt', screen: 'bills', color: '#FFD700' },
    { title: 'Phone Bridge', icon: 'exchange', screen: 'companionManager', color: '#B388FF' },
    { title: 'Biometrics', icon: 'heartbeat', screen: 'health', color: '#FF334B' },
  ];

  if (isAdmin) {
    quickPills.push({ title: 'Admin', icon: 'shield', screen: 'admin', color: '#E040FB' });
  }

  const handle2FAAction = async (approved: boolean) => {
    setSim2FAVisible(false);
    if (twoFactorData?.eventId) {
      await resolveWearableEvent(twoFactorData.eventId, approved ? 'APPLIED' : 'REJECTED');
    }
    if (approved) {
      Alert.alert('2FA Approved', `Payment of $${twoFactorData?.amount || 250}.00 to ${twoFactorData?.merchant || 'CyberStore'} approved from watch.`);
    } else {
      Alert.alert('2FA Rejected', 'Payment authorization was rejected.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Glanceable Balance Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.vipBadge}>
            <Icon name="diamond" size={9} color={COLORS.accentGold} />
            <Text style={styles.vipBadgeText}>PLATINUM PRIVATE</Text>
          </View>
          <View style={styles.headerControls}>
            <TouchableOpacity 
              style={styles.currencyToggle} 
              onPress={() => {
                setCurrencyMode(currencyMode === 'IDR' ? 'USD' : 'IDR');
              }}
            >
              <Text style={styles.currencyToggleText}>{currencyMode}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setHideBalance(!hideBalance)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={hideBalance ? 'eye-slash' : 'eye'}
                size={SIZES.small}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.userGreeting} numberOfLines={1}>
          Welcome, {user?.username || 'Client'}
        </Text>

        <Text style={styles.balanceAmount}>
          {hideBalance ? '••••••••••••' : balance}
        </Text>
        <Text style={styles.accountNumber} numberOfLines={1}>
          Acct: {user?.accountNumber || 'ADMIN001'} • Nexora Premier
        </Text>
      </View>

      {/* Quick Action Grid (Pills with Min 48dp Touch Targets) */}
      <Text style={styles.sectionHeader}>Quick Services</Text>
      <View style={styles.pillGrid}>
        {quickPills.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.pillButton}
            onPress={() => {
              if (item.action) {
                item.action();
              } else if (item.screen) {
                onNavigate(item.screen as ScreenType);
              }
            }}
          >
            <View style={[styles.pillIconCircle, { backgroundColor: item.color }]}>
              <Icon name={item.icon} size={14} color={COLORS.black} />
            </View>
            <Text style={styles.pillLabel}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Realistic Smartwatch Banking 2FA Simulation Prompt */}
      {sim2FAVisible && (
        <View style={styles.twoFactorCard}>
          <View style={styles.twoFactorHeader}>
            <Icon name="bell" size={12} color={COLORS.warning} />
            <Text style={styles.twoFactorTitle}>Out-of-Band 2FA Authorization</Text>
          </View>
          <Text style={styles.twoFactorDesc}>
            Authorize high-value debit of {twoFactorData?.amount ? `$${twoFactorData.amount.toFixed(2)}` : '$50,000.00'} to {twoFactorData?.merchant || 'OFFSHORE-CORP'}?
          </Text>
          <View style={styles.twoFactorActions}>
            <TouchableOpacity
              style={[styles.twoFactorBtn, styles.twoFactorDeny]}
              onPress={() => handle2FAAction(false)}
            >
              <Text style={styles.twoFactorBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.twoFactorBtn, styles.twoFactorApprove]}
              onPress={() => handle2FAAction(true)}
            >
              <Text style={styles.twoFactorBtnText}>Authorize</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Auditor & Security Telemetry Portal Card */}
      <TouchableOpacity
        style={styles.pentestBanner}
        onPress={() => onNavigate('pentestLab')}
      >
        <View style={styles.pentestBadge}>
          <Icon name="shield" size={10} color={COLORS.black} />
          <Text style={styles.pentestBadgeText}>AUDIT MODE</Text>
        </View>
        <Text style={styles.pentestTitle}>Security Research & Exploit Lab</Text>
        <Icon name="chevron-right" size={10} color={COLORS.warning} />
      </TouchableOpacity>

      {/* ATM Cardless Cash Modal */}
      <Modal
        visible={atmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAtmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.atmModalCard}>
            <View style={styles.atmModalHeader}>
              <Icon name="university" size={18} color={COLORS.accentGold} />
              <Text style={styles.atmModalTitle}>ATM Cardless Cash</Text>
            </View>
            
            <Text style={styles.atmModalDesc}>
              Enter this 6-digit dynamic code at any Nexora ATM terminal within 5 minutes:
            </Text>

            <View style={styles.otpBox}>
              <Text style={styles.otpText}>
                {atmCashToken.slice(0, 3)} {atmCashToken.slice(3)}
              </Text>
            </View>

            <Text style={styles.atmExpiryText}>
              Valid for: Rp 250.000 • Expires in 04:59
            </Text>

            <TouchableOpacity
              style={styles.closeAtmBtn}
              onPress={() => setAtmModalVisible(false)}
            >
              <Text style={styles.closeAtmBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: CIRCULAR_PADDING_BOTTOM,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: IS_WATCH_DEVICE ? 6 : 14,
    marginBottom: IS_WATCH_DEVICE ? 6 : 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  vipBadgeText: {
    fontSize: IS_WATCH_DEVICE ? 7 : 9,
    fontWeight: '700',
    color: COLORS.accentGold,
    letterSpacing: 0.5,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currencyToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currencyToggleText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userGreeting: {
    fontSize: IS_WATCH_DEVICE ? 10 : 13,
    color: COLORS.textLight,
    fontWeight: '500',
    marginTop: 2,
  },
  eyeBtn: {
    padding: 3,
  },
  balanceAmount: {
    fontSize: IS_WATCH_DEVICE ? 16 : 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginVertical: 2,
  },
  accountNumber: {
    fontSize: IS_WATCH_DEVICE ? 8 : 11,
    color: COLORS.textMuted,
  },
  sectionHeader: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: IS_WATCH_DEVICE ? 3 : 6,
    marginLeft: 2,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: IS_WATCH_DEVICE ? 4 : 10,
  },
  pillButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    paddingVertical: IS_WATCH_DEVICE ? 5 : 12,
    paddingHorizontal: IS_WATCH_DEVICE ? 6 : 12,
    marginBottom: IS_WATCH_DEVICE ? 4 : 8,
    minHeight: SIZES.touchTarget,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillIconCircle: {
    width: IS_WATCH_DEVICE ? 22 : 36,
    height: IS_WATCH_DEVICE ? 22 : 36,
    borderRadius: IS_WATCH_DEVICE ? 11 : 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  pillLabel: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
  },
  twoFactorCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: SIZES.radius.md,
    padding: IS_WATCH_DEVICE ? 6 : 14,
    marginBottom: IS_WATCH_DEVICE ? 6 : 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.4)',
  },
  twoFactorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  twoFactorTitle: {
    fontSize: IS_WATCH_DEVICE ? 10 : 13,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginLeft: 4,
  },
  twoFactorDesc: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    color: COLORS.white,
    marginBottom: 4,
  },
  twoFactorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  twoFactorBtn: {
    flex: 1,
    paddingVertical: IS_WATCH_DEVICE ? 4 : 10,
    borderRadius: SIZES.radius.sm,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  twoFactorDeny: {
    backgroundColor: 'rgba(255, 59, 48, 0.25)',
  },
  twoFactorApprove: {
    backgroundColor: COLORS.primary,
  },
  twoFactorBtnText: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  pentestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 176, 32, 0.08)',
    borderRadius: SIZES.radius.md,
    paddingHorizontal: IS_WATCH_DEVICE ? 6 : 12,
    paddingVertical: IS_WATCH_DEVICE ? 5 : 10,
    marginTop: IS_WATCH_DEVICE ? 2 : 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.25)',
  },
  pentestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    borderRadius: SIZES.radius.round,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 6,
  },
  pentestBadgeText: {
    fontSize: IS_WATCH_DEVICE ? 7 : 10,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 2,
  },
  pentestTitle: {
    flex: 1,
    fontSize: IS_WATCH_DEVICE ? 8 : 12,
    color: COLORS.warning,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  atmModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentGold,
  },
  atmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  atmModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  atmModalDesc: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  otpBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.accentGold,
    marginBottom: 8,
  },
  otpText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.accentGold,
    letterSpacing: 4,
  },
  atmExpiryText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  closeAtmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  closeAtmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },
});

export default DashboardScreen;
