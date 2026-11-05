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
import PinPadModal from '../components/PinPadModal';
import { ScreenType } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { ENDPOINTS, post } from '../utils/api';
import theme from '../styles/theme';
import {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
  IS_WATCH_DEVICE,
} from '../styles/globalStyles';

const { COLORS, SIZES, SHADOWS } = theme;

interface TransferScreenProps {
  onNavigate: (screen: ScreenType) => void;
  params?: {
    prefillRecipient?: string;
    prefillAmount?: number;
  };
}

const TransferScreen: React.FC<TransferScreenProps> = ({ onNavigate, params }) => {
  const { user } = useAuth();
  const [toAccount, setToAccount] = useState(params?.prefillRecipient || '');
  const [amount, setAmount] = useState(
    params?.prefillAmount ? params.prefillAmount.toString() : '50'
  );
  const [loading, setLoading] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);

  const quickAmounts = ['10', '50', '100', '500'];
  const quickRecipients = ['ACC_BOB88', 'ACC_ALICE12', 'HACKER99'];

  const initiateTransfer = () => {
    if (!toAccount || !amount) {
      Alert.alert('Error', 'Please select recipient and amount');
      return;
    }
    if (isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Amount must be a valid number');
      return;
    }
    setPinModalVisible(true);
  };

  const handlePinAndExecute = async (pin: string) => {
    setPinModalVisible(false);
    setLoading(true);

    try {
      const response = await post(
        ENDPOINTS.transfer,
        {
          from_account: user?.accountNumber || 'ADMIN001',
          to_account: toAccount,
          amount: parseFloat(amount),
          description: `Wear OS Quick Transfer [PIN:${pin}]`,
        },
        user?.token
      );

      if (response.ok) {
        Alert.alert(
          'Transfer Successful',
          `Sent $${amount} to ${toAccount} successfully!`,
          [{ text: 'OK', onPress: () => onNavigate('dashboard') }]
        );
      } else {
        // Fallback for demo when backend is offline
        Alert.alert(
          'Simulated Success',
          `[Offline Demo] Sent $${amount} to ${toAccount}. (Backend status: ${response.status || 'offline'})`,
          [{ text: 'OK', onPress: () => onNavigate('dashboard') }]
        );
      }
    } catch {
      Alert.alert(
        'Simulated Transfer',
        `Transfer of $${amount} to ${toAccount} executed locally for pentest demo.`,
        [{ text: 'Done', onPress: () => onNavigate('dashboard') }]
      );
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
      <View style={styles.card}>
        <Text style={styles.title}>Send Money</Text>

        {/* Recipient Input */}
        <Text style={styles.label}>Recipient Account</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. ACC_BOB88"
          placeholderTextColor={COLORS.textLight}
          value={toAccount}
          onChangeText={setToAccount}
          autoCapitalize="none"
        />

        {/* Quick Recipient Pills */}
        <View style={styles.chipRow}>
          {quickRecipients.map((rec) => (
            <TouchableOpacity
              key={rec}
              style={[
                styles.chip,
                toAccount === rec && styles.chipActive,
              ]}
              onPress={() => setToAccount(rec)}
            >
              <Text
                style={[
                  styles.chipText,
                  toAccount === rec && styles.chipTextActive,
                ]}
              >
                {rec}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount Input */}
        <Text style={[styles.label, { marginTop: 8 }]}>Amount ($ USD)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor={COLORS.textLight}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        {/* Quick Amount Pills */}
        <View style={styles.chipRow}>
          {quickAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[
                styles.chip,
                amount === amt && styles.chipActive,
              ]}
              onPress={() => setAmount(amt)}
            >
              <Text
                style={[
                  styles.chipText,
                  amount === amt && styles.chipTextActive,
                ]}
              >
                ${amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
        ) : (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={initiateTransfer}
          >
            <Icon name="paper-plane" size={SIZES.small} color={COLORS.black} />
            <Text style={styles.sendButtonText}>Send ${amount || '0'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.cancelLink}
        onPress={() => onNavigate('dashboard')}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      {/* 3x4 PIN Pad Modal */}
      <PinPadModal
        visible={pinModalVisible}
        title="Confirm Transfer"
        subtitle={`Send $${amount} to ${toAccount}`}
        onPinSubmit={handlePinAndExecute}
        onCancel={() => setPinModalVisible(false)}
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
    paddingTop: CIRCULAR_PADDING_TOP,
    paddingBottom: CIRCULAR_PADDING_BOTTOM,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: IS_WATCH_DEVICE ? 6 : 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  title: {
    fontSize: IS_WATCH_DEVICE ? 12 : 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: IS_WATCH_DEVICE ? 2 : SIZES.spacing.xs,
  },
  label: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    fontWeight: 'bold',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.white,
    paddingVertical: IS_WATCH_DEVICE ? 4 : 10,
    paddingHorizontal: IS_WATCH_DEVICE ? 8 : 14,
    borderRadius: SIZES.radius.md,
    fontSize: IS_WATCH_DEVICE ? 10 : 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: IS_WATCH_DEVICE ? 32 : 46,
  },
  amountInput: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.primary,
    fontSize: IS_WATCH_DEVICE ? 16 : 24,
    fontWeight: 'bold',
    paddingVertical: IS_WATCH_DEVICE ? 4 : 10,
    paddingHorizontal: IS_WATCH_DEVICE ? 8 : 14,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'center',
    minHeight: IS_WATCH_DEVICE ? 36 : 52,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: IS_WATCH_DEVICE ? 3 : 8,
    marginBottom: IS_WATCH_DEVICE ? 2 : 6,
  },
  chip: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: IS_WATCH_DEVICE ? 6 : 12,
    paddingVertical: IS_WATCH_DEVICE ? 3 : 6,
    borderRadius: SIZES.radius.round,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: IS_WATCH_DEVICE ? 9 : 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.black,
    fontWeight: 'bold',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.round,
    paddingVertical: IS_WATCH_DEVICE ? 6 : 12,
    marginTop: IS_WATCH_DEVICE ? 4 : SIZES.spacing.sm,
    minHeight: SIZES.touchTarget,
    ...SHADOWS.small,
  },
  sendButtonText: {
    fontSize: IS_WATCH_DEVICE ? 10 : 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 6,
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: IS_WATCH_DEVICE ? 6 : 12,
  },
  cancelText: {
    fontSize: IS_WATCH_DEVICE ? 10 : 13,
    color: COLORS.textLight,
  },
});

export default TransferScreen;
