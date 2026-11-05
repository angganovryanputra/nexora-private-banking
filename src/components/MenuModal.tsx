import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import CustomButton from './CustomButton';
import theme from '../styles/theme';

const { COLORS, SIZES } = theme;

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  onMenuItemPress: (key: string) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

const MenuModal: React.FC<MenuModalProps> = ({ 
  visible, 
  onClose, 
  onMenuItemPress, 
  isAdmin, 
  onLogout 
}) => {
  const menuItems = [
    { key: 'dashboard', label: '🏠 Nexora Dashboard' },
    { key: 'qrPay', label: '⚡ Contactless SNAP QRIS' },
    { key: 'balance', label: '💰 Account Balance' },
    { key: 'transfer', label: '💸 Wire & Peer Transfer' },
    { key: 'cards', label: '💳 Cards & Emergency Kill-Switch' },
    { key: 'companionManager', label: '📱 Companion Watch Sync' },
    { key: 'lockout', label: '🔒 Test Wrist-Off Lock' },
    { key: 'transactions', label: '📜 Transaction History' },
    { key: 'health', label: '❤️ Health & Biometrics' },
    { key: 'profile', label: '👤 Client Profile' },
    { key: 'pentestLab', label: '🛡️ Security Diagnostics (Pentest)', highlight: true },
  ];

  if (isAdmin) {
    menuItems.push({ key: 'admin', label: '🔐 Executive Admin', highlight: false });
  }

  return (
    <Modal 
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.menuHeader}>Navigation</Text>
          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <TouchableOpacity 
                key={item.key} 
                style={[
                  styles.menuItem,
                  item.highlight && styles.highlightMenuItem
                ]} 
                onPress={() => onMenuItemPress(item.key)}
              >
                <Text style={[
                  styles.menuItemText,
                  item.highlight && styles.highlightText
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={onLogout}
            >
              <Text style={styles.logoutText}>🚪 Logout</Text>
            </TouchableOpacity>
          </ScrollView>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.sm,
  },
  content: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  menuHeader: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SIZES.spacing.xs,
  },
  scrollList: {
    width: '100%',
    maxHeight: 240,
  },
  menuItem: {
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  highlightMenuItem: {
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
    borderRadius: SIZES.radius.sm,
    borderBottomWidth: 0,
    marginVertical: 2,
  },
  highlightText: {
    color: COLORS.warning,
    fontWeight: 'bold',
  },
  menuItemText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    marginVertical: SIZES.spacing.xs,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: SIZES.small,
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: SIZES.spacing.xs,
    paddingVertical: SIZES.spacing.xs,
    paddingHorizontal: SIZES.spacing.md,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: SIZES.radius.round,
  },
  closeButtonText: {
    fontSize: SIZES.xSmall,
    color: COLORS.textLight,
  },
});

export default MenuModal;
