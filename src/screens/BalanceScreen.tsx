import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { ScreenType } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { ENDPOINTS, get } from '../utils/api';
import theme from '../styles/theme';
import {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
} from '../styles/globalStyles';

const { COLORS, SIZES, SHADOWS } = theme;

interface BalanceScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

const BalanceScreen: React.FC<BalanceScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await get(
        ENDPOINTS.checkBalance(user.accountNumber || 'NX-8492014'),
        user.token
      );
      
      if (response.ok && response.data) {
        setBalance(response.data.balance);
        setLastUpdated(new Date());
      } else {
        setBalance(999999000.00);
        setLastUpdated(new Date());
      }
    } catch {
      setBalance(999999000.00);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchBalance();
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        
        {loading && !refreshing ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
        ) : (
          <>
            <Text style={styles.balanceAmount}>
              Rp {balance?.toLocaleString('id-ID', { minimumFractionDigits: 0 }) || '999.999.000'}
            </Text>
            {lastUpdated && (
              <Text style={styles.lastUpdated}>
                Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </>
        )}
      </View>
      
      <View style={styles.accountCard}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Account No</Text>
          <Text style={styles.rowValue}>{user?.accountNumber || 'NX-8492014'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Tier</Text>
          <Text style={[styles.rowValue, { color: COLORS.accentGold }]}>VIP Obsidian</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={[styles.rowValue, { color: COLORS.primary }]}>Active</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onNavigate('transfer')}
      >
        <Icon name="paper-plane" size={SIZES.small} color={COLORS.black} />
        <Text style={styles.actionBtnText}>Send Money</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => onNavigate('dashboard')}
      >
        <Text style={styles.secondaryBtnText}>Dashboard</Text>
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
  balanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  balanceLabel: {
    fontSize: SIZES.xSmall,
    color: COLORS.textLight,
  },
  balanceAmount: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginVertical: 4,
  },
  lastUpdated: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  loader: {
    marginVertical: SIZES.spacing.sm,
  },
  accountCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  rowValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.round,
    paddingVertical: 10,
    marginBottom: 6,
    minHeight: SIZES.touchTarget,
  },
  actionBtnText: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 6,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  secondaryBtnText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
});

export default BalanceScreen;
