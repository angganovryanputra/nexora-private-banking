import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import theme from '../styles/theme';
import { IS_WATCH_DEVICE } from '../styles/globalStyles';

const { COLORS, SIZES, SHADOWS } = theme;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface PinPadModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onPinSubmit: (pin: string) => void;
  onCancel: () => void;
}

const PinPadModal: React.FC<PinPadModalProps> = ({
  visible,
  title = 'Quick PIN',
  subtitle = 'Enter 4-digit PIN (default: 1234)',
  onPinSubmit,
  onCancel,
}) => {
  const [pin, setPin] = useState('');

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          onPinSubmit(nextPin);
          setPin('');
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClose = () => {
    setPin('');
    onCancel();
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['cancel', '0', 'backspace'],
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.dialContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>

          {/* 4-Digit PIN Indicators */}
          <View style={styles.dotContainer}>
            {[0, 1, 2, 3].map(i => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  i < pin.length && styles.pinDotFilled,
                ]}
              />
            ))}
          </View>

          {/* 3x4 Grid Keypad */}
          <View style={styles.grid}>
            {keys.map((row, rIdx) => (
              <View key={rIdx} style={styles.row}>
                {row.map(k => {
                  if (k === 'cancel') {
                    return (
                      <TouchableOpacity
                        key={k}
                        style={[styles.keyButton, styles.actionButton]}
                        onPress={handleClose}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="times" size={SIZES.small} color={COLORS.danger} />
                      </TouchableOpacity>
                    );
                  }
                  if (k === 'backspace') {
                    return (
                      <TouchableOpacity
                        key={k}
                        style={[styles.keyButton, styles.actionButton]}
                        onPress={handleBackspace}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="arrow-left" size={SIZES.small} color={COLORS.textLight} />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={k}
                      style={styles.keyButton}
                      onPress={() => handleKeyPress(k)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.keyText}>{k}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialContainer: {
    width: IS_WATCH_DEVICE ? SCREEN_WIDTH * 0.90 : 340,
    alignItems: 'center',
    paddingVertical: IS_WATCH_DEVICE ? 2 : SIZES.spacing.sm,
  },
  title: {
    fontSize: IS_WATCH_DEVICE ? 12 : 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: IS_WATCH_DEVICE ? 9 : 13,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: IS_WATCH_DEVICE ? 2 : SIZES.spacing.xs,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: IS_WATCH_DEVICE ? 3 : SIZES.spacing.xs,
  },
  pinDot: {
    width: IS_WATCH_DEVICE ? 7 : 12,
    height: IS_WATCH_DEVICE ? 7 : 12,
    borderRadius: IS_WATCH_DEVICE ? 4 : 6,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginHorizontal: IS_WATCH_DEVICE ? 4 : 6,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: COLORS.primary,
  },
  grid: {
    width: '100%',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: IS_WATCH_DEVICE ? 1 : 4,
  },
  keyButton: {
    width: SIZES.pinKeySize,
    height: SIZES.pinKeySize,
    borderRadius: SIZES.pinKeySize / 2,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: IS_WATCH_DEVICE ? 3 : 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  actionButton: {
    backgroundColor: COLORS.surface,
  },
  keyText: {
    fontSize: IS_WATCH_DEVICE ? 13 : 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

export default PinPadModal;

