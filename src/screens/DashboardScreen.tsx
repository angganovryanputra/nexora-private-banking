import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, DeviceEventEmitter } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { ScreenType } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { ENDPOINTS, get, pollWearableEvents, resolveWearableEvent } from '../utils/api';
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
  const [balance, setBalance] = useState('$999,999.00');
  const [sim2FAVisible, setSim2FAVisible] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ eventId?: number; amount: number; merchant: string } | null>(null);

  const isAdmin = user?.isAdmin || false;

  // 1. Fetch initial account balance
  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      try {
        const res = await get(ENDPOINTS.checkBalance(user?.accountNumber || 'ADMIN001'), user?.token);
        if (res.ok && res.data?.balance !== undefined && isMounted) {
          const num = Number(res.data.balance);
          setBalance(`$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        }
      } catch {}
    };
    fetchBalance();
    return () => { isMounted = false; };
  }, [user]);

  // 2. Listen to native Android BluetoothSyncEvent broadcast
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('BluetoothSyncEvent', (evt: any) => {
      if (evt && evt.action === 'UPDATE_BALANCE' && evt.amount !== undefined) {
        const num = Number(evt.amount);
        setBalance(`$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        Alert.alert('📶 BLE Sync Injected', `Watch balance updated to $${num} via BluetoothSync.`);
      }
    });
    return () => sub.remove();
  }, []);

  // 3. Poll wearable events from local backend relay (Cross-device real-time sync)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await pollWearableEvents('watch_9201');
        if (res.ok && res.data?.events && res.data.events.length > 0) {
          for (const ev of res.data.events) {
            if (ev.action === 'UPDATE_BALANCE') {
              const amt = Number(ev.payload?.amount || 0);
              setBalance(`$${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
              await resolveWearableEvent(ev.id, 'APPLIED');
              Alert.alert('📶 Remote Sync Received', `Balance updated to $${amt} from Smartphone Companion.`);
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
                '💳 QRIS Payment Success',
                `Payment of $${debit}.00 to ${ev.payload?.merchant || 'VULNBANK MERCH 001'} approved.\nRef: SNAP-QRIS-9921\nRemaining Balance Deducted.`
              );
              fetchBalance();
            } else if (ev.action === 'QUICK_PAY') {
              await resolveWearableEvent(ev.id, 'APPLIED');
              Alert.alert(
                '⚡ Quick Pay Injected',
                `Transfer of $${ev.payload?.amount || 50000} to ${ev.payload?.recipient || 'HACKER_CORP'} executed without PIN!`
              );
            }
          }
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const quickPills = [
    { title: 'QR Pay', icon: 'qrcode', screen: 'qrPay', color: COLORS.primary },
    { title: 'Transfer', icon: 'paper-plane', screen: 'transfer', color: COLORS.secondary },
    { title: 'Cards', icon: 'credit-card', screen: 'cards', color: '#00C2FF' },
    { title: 'Balance', icon: 'database', screen: 'balance', color: COLORS.accentGold },
    { title: 'Phone Bridge', icon: 'mobile', screen: 'companionManager', color: '#B388FF' },
    { title: 'History', icon: 'history', screen: 'transactions', color: '#80D8FF' },
    { title: 'Health', icon: 'heartbeat', screen: 'health', color: '#FF4081' },
    { title: 'Loans', icon: 'bank', screen: 'loans', color: COLORS.warning },
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
      {/* Pentest Lab Banner */}
      <TouchableOpacity
        style={styles.pentestBanner}
        onPress={() => onNavigate('pentestLab')}
      >
        <View style={styles.pentestBadge}>
          <Icon name="bug" size={11} color={COLORS.black} />
          <Text style={styles.pentestBadgeText}>PENTEST LAB</Text>
        </View>
        <Text style={styles.pentestTitle}>14 Active Exploit Vectors</Text>
        <Icon name="chevron-right" size={10} color={COLORS.warning} />
      </TouchableOpacity>

      {/* Glanceable Balance Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.userGreeting} numberOfLines={1}>
            Hi, {user?.username || 'Admin'}
          </Text>
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

        <Text style={styles.balanceAmount}>
          {hideBalance ? '••••••••' : balance}
        </Text>
        <Text style={styles.accountNumber} numberOfLines={1}>
          Acct: {user?.accountNumber || 'ADMIN001'}
        </Text>
      </View>

      {/* Quick Action Grid (Pills with Min 48dp Touch Targets) */}
      <Text style={styles.sectionHeader}>Quick Actions</Text>
      <View style={styles.pillGrid}>
        {quickPills.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.pillButton}
            onPress={() => onNavigate(item.screen as ScreenType)}
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
            <Text style={styles.twoFactorTitle}>Push 2FA Approval</Text>
          </View>
          <Text style={styles.twoFactorDesc}>
            Authorize {twoFactorData?.amount ? `$${twoFactorData.amount.toFixed(2)}` : '$250.00'} debit to {twoFactorData?.merchant || 'CyberStore'}?
          </Text>
          <View style={styles.twoFactorActions}>
            <TouchableOpacity
              style={[styles.twoFactorBtn, styles.twoFactorDeny]}
              onPress={() => handle2FAAction(false)}
            >
              <Text style={styles.twoFactorBtnText}>Deny</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.twoFactorBtn, styles.twoFactorApprove]}
              onPress={() => handle2FAAction(true)}
            >
              <Text style={styles.twoFactorBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Profile Link */}
      <TouchableOpacity
        style={styles.profileLink}
        onPress={() => onNavigate('profile')}
      >
        <Icon name="user-circle" size={16} color={COLORS.primary} />
        <Text style={styles.profileText}>Account Profile</Text>
        <Icon name="chevron-right" size={12} color={COLORS.textLight} />
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
    paddingBottom: CIRCULAR_PADDING_BOTTOM,
  },
  pentestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 176, 32, 0.12)',
    borderRadius: SIZES.radius.round,
    paddingHorizontal: IS_WATCH_DEVICE ? 6 : 12,
    paddingVertical: IS_WATCH_DEVICE ? 3 : 8,
    marginBottom: IS_WATCH_DEVICE ? 4 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.3)',
  },
  pentestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    borderRadius: SIZES.radius.round,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 4,
  },
  pentestBadgeText: {
    fontSize: IS_WATCH_DEVICE ? 8 : 11,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 2,
  },
  pentestTitle: {
    flex: 1,
    fontSize: IS_WATCH_DEVICE ? 9 : 13,
    color: COLORS.warning,
    fontWeight: '600',
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
    marginBottom: 2,
  },
  userGreeting: {
    fontSize: IS_WATCH_DEVICE ? 10 : 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 3,
  },
  balanceAmount: {
    fontSize: IS_WATCH_DEVICE ? 16 : 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  accountNumber: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  sectionHeader: {
    fontSize: IS_WATCH_DEVICE ? 9 : 13,
    fontWeight: 'bold',
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
    fontSize: IS_WATCH_DEVICE ? 10 : 13,
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
    fontSize: IS_WATCH_DEVICE ? 10 : 14,
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
    fontSize: IS_WATCH_DEVICE ? 9 : 13,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    paddingVertical: IS_WATCH_DEVICE ? 6 : 12,
    paddingHorizontal: IS_WATCH_DEVICE ? 8 : 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: SIZES.touchTarget,
  },
  profileText: {
    flex: 1,
    fontSize: IS_WATCH_DEVICE ? 10 : 14,
    color: COLORS.white,
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default DashboardScreen;
