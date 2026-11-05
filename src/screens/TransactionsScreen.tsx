import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { ScreenType } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { ENDPOINTS, get } from '../utils/api';
import globalStyles, {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
  IS_WATCH_DEVICE,
} from '../styles/globalStyles';
import theme from '../styles/theme';

const { COLORS, SIZES, SHADOWS } = theme;

interface TransactionsScreenProps {
  onNavigate: (screen: ScreenType, params?: any) => void;
  params?: {
    filterByType?: 'sent' | 'received';
  };
}

interface Transaction {
  id: number;
  from_account: string;
  to_account: string;
  amount: number;
  timestamp: string;
  description?: string;
}

const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ onNavigate, params }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
  const accountNumber = user?.accountNumber || '';
  const filterType = params?.filterByType;

  const fetchTransactions = async () => {
    if (!user || !accountNumber) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await get(
        ENDPOINTS.transactions(accountNumber),
        user.token
      );
      
      if (response.ok && response.data.transactions) {
        let filteredTransactions = response.data.transactions;
        
        // Apply filter if specified
        if (filterType === 'sent') {
          filteredTransactions = filteredTransactions.filter(
            (t: Transaction) => t.from_account === accountNumber
          );
        } else if (filterType === 'received') {
          filteredTransactions = filteredTransactions.filter(
            (t: Transaction) => t.to_account === accountNumber
          );
        }
        
        setTransactions(filteredTransactions);
      } else {
        setError(response.data.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error("Transactions fetch error:", error);
      setError('Network error or server unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, accountNumber, filterType]);

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="exchange" size={SIZES.xLarge} color={COLORS.textLight} />
      <Text style={styles.emptyText}>No transactions found</Text>
    </View>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isSender = item.from_account === accountNumber;
    const otherParty = isSender ? item.to_account : item.from_account;
    const formattedDate = new Date(item.timestamp).toLocaleString();
    
    return (
      <TouchableOpacity 
        style={styles.transactionCard}
        onPress={() => setSelectedTx(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionIconContainer}>
          <Icon 
            name={isSender ? "arrow-up" : "arrow-down"} 
            size={SIZES.medium} 
            color={isSender ? COLORS.danger : COLORS.success} 
          />
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>
            {isSender ? 'Sent to' : 'Received from'}: {otherParty}
          </Text>
          
          <Text style={styles.transactionDate}>{formattedDate}</Text>
          
          {item.description && (
            <Text style={styles.transactionDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        
        <Text style={[
          styles.transactionAmount,
          isSender ? styles.amountSent : styles.amountReceived
        ]}>
          {isSender ? '-' : '+'}Rp {Math.abs(item.amount).toLocaleString('id-ID')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
        
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by:</Text>
          <View style={styles.filterButtons}>
            <Text 
              style={[
                styles.filterButton, 
                !filterType && styles.filterButtonActive
              ]}
              onPress={() => onNavigate('transactions', {})}
            >
              All
            </Text>
            <Text 
              style={[
                styles.filterButton, 
                filterType === 'sent' && styles.filterButtonActive
              ]}
              onPress={() => onNavigate('transactions', { filterByType: 'sent' })}
            >
              Sent
            </Text>
            <Text 
              style={[
                styles.filterButton, 
                filterType === 'received' && styles.filterButtonActive
              ]}
              onPress={() => onNavigate('transactions', { filterByType: 'received' })}
            >
              Received
            </Text>
          </View>
        </View>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Loading transactions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="exclamation-circle" size={SIZES.large} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransaction}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[COLORS.primary]} 
            />
          }
          contentContainerStyle={
            transactions.length === 0 ? { flex: 1 } : { paddingBottom: SIZES.spacing.xl }
          }
        />
      )}

      {/* Official Transaction Advice / E-Receipt Modal */}
      <Modal
        visible={!!selectedTx}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <Icon name="university" size={14} color={COLORS.accentGold} />
              <Text style={styles.receiptBank}>NEXORA PRIVATE BANKING</Text>
            </View>
            <Text style={styles.receiptTagline}>OFFICIAL TRANSACTION ADVICE</Text>
            <View style={styles.receiptDivider} />

            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Reference No</Text>
                <Text style={styles.receiptValue}>TX-92014-{selectedTx?.id}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Status</Text>
                <Text style={[styles.receiptValue, { color: COLORS.primary }]}>SETTLED (SUCCESS)</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Amount (IDR)</Text>
                <Text style={[styles.receiptValue, { fontWeight: 'bold' }]}>
                  Rp {selectedTx ? Math.abs(selectedTx.amount).toLocaleString('id-ID') : '0'}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>From Account</Text>
                <Text style={styles.receiptValue}>{selectedTx?.from_account}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>To Account</Text>
                <Text style={styles.receiptValue}>{selectedTx?.to_account}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date & Time</Text>
                <Text style={styles.receiptValue}>
                  {selectedTx ? new Date(selectedTx.timestamp).toLocaleString('id-ID') : ''}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Description</Text>
                <Text style={styles.receiptValue}>{selectedTx?.description || 'Interbank Transfer'}</Text>
              </View>

              <View style={styles.hashContainer}>
                <Text style={styles.hashLabel}>Client Verification Stamp (Unsigned):</Text>
                <Text style={styles.hashText}>
                  SHA256: 8a4f9102c918{selectedTx?.id}bf190e29401a
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeReceiptBtn}
              onPress={() => setSelectedTx(null)}
            >
              <Text style={styles.closeReceiptBtnText}>Dismiss Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    paddingHorizontal: ROUND_INSET,
    paddingTop: CIRCULAR_PADDING_TOP,
    paddingBottom: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SIZES.spacing.sm,
  },
  filterContainer: {
    marginTop: SIZES.spacing.sm,
  },
  filterLabel: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginBottom: SIZES.spacing.xs,
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.xs,
    marginRight: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.cardDark,
    color: COLORS.textLight,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
  },
  emptyText: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SIZES.spacing.md,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    marginTop: SIZES.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
  },
  errorText: {
    fontSize: SIZES.medium,
    color: COLORS.danger,
    textAlign: 'center',
    marginTop: SIZES.spacing.md,
  },
  transactionCard: {
    flexDirection: 'row',
    padding: SIZES.spacing.md,
    marginHorizontal: SIZES.spacing.md,
    marginTop: SIZES.spacing.md,
    backgroundColor: COLORS.cardDark,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  transactionIconContainer: {
    width: SIZES.xLarge,
    height: SIZES.xLarge,
    borderRadius: SIZES.xLarge / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: SIZES.medium,
    fontWeight: '500',
    color: COLORS.white,
  },
  transactionDate: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginTop: 2,
    fontStyle: 'italic',
  },
  transactionAmount: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
  },
  amountSent: {
    color: COLORS.danger,
  },
  amountReceived: {
    color: COLORS.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.md,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0F121C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    padding: SIZES.spacing.md,
    alignItems: 'center',
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  receiptBank: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.accentGold,
    marginLeft: 6,
    letterSpacing: 1,
  },
  receiptTagline: {
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  receiptDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: SIZES.spacing.sm,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 3,
  },
  receiptLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  receiptValue: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '500',
    maxWidth: 160,
    textAlign: 'right',
  },
  hashContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    padding: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  hashLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
  hashText: {
    fontSize: 8,
    color: COLORS.primary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  closeReceiptBtn: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  closeReceiptBtnText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: '600',
  },
});

export default TransactionsScreen;
