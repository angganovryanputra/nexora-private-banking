import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import theme from '../styles/theme';
import { IS_WATCH_DEVICE } from '../styles/globalStyles';

const { COLORS, SIZES, SHADOWS } = theme;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface LockoutModalProps {
  visible: boolean;
  onUnlock: () => void;
}

const LockoutModal: React.FC<LockoutModalProps> = ({ visible, onUnlock }) => {
  const [pin, setPin] = useState('');

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        if (nextPin === '1234') {
          setTimeout(() => {
            setPin('');
            onUnlock();
          }, 150);
        } else {
          Alert.alert('Incorrect PIN', 'Default PIN is 1234');
          setPin('');
        }
      }
    }
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'backspace'],
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Icon name="lock" size={20} color={COLORS.danger} />
          <Text style={styles.title}>Session Locked</Text>
          <Text style={styles.subtitle}>Off-Wrist sensor triggered</Text>

          {/* Dots */}
          <View style={styles.dotRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < pin.length && styles.dotFilled,
                ]}
              />
            ))}
          </View>

          {/* Keypad */}
          <View style={styles.grid}>
            {keys.map((row, rIdx) => (
              <View key={rIdx} style={styles.row}>
                {row.map((k) => {
                  if (k === 'clear') {
                    return (
                      <TouchableOpacity
                        key={k}
                        style={[styles.key, styles.specialKey]}
                        onPress={() => setPin('')}
                      >
                        <Text style={styles.specialText}>C</Text>
                      </TouchableOpacity>
                    );
                  }
                  if (k === 'backspace') {
                    return (
                      <TouchableOpacity
                        key={k}
                        style={[styles.key, styles.specialKey]}
                        onPress={() => setPin((prev) => prev.slice(0, -1))}
                      >
                        <Icon name="arrow-left" size={10} color={COLORS.textLight} />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={k}
                      style={styles.key}
                      onPress={() => handleKeyPress(k)}
                    >
                      <Text style={styles.keyText}>{k}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <Text style={styles.exploitNote}>
            [V-W11] Vulnerable: ADB am start bypasses this lock
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: IS_WATCH_DEVICE ? SCREEN_WIDTH * 0.90 : 340,
    alignItems: 'center',
    paddingVertical: IS_WATCH_DEVICE ? 4 : 12,
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
  dotRow: {
    flexDirection: 'row',
    marginVertical: IS_WATCH_DEVICE ? 4 : 8,
  },
  dot: {
    width: IS_WATCH_DEVICE ? 7 : 12,
    height: IS_WATCH_DEVICE ? 7 : 12,
    borderRadius: IS_WATCH_DEVICE ? 4 : 6,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    marginHorizontal: IS_WATCH_DEVICE ? 4 : 6,
  },
  dotFilled: {
    backgroundColor: COLORS.danger,
  },
  grid: {
    width: '100%',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    marginVertical: IS_WATCH_DEVICE ? 1 : 4,
  },
  key: {
    width: SIZES.pinKeySize,
    height: SIZES.pinKeySize,
    borderRadius: SIZES.pinKeySize / 2,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: IS_WATCH_DEVICE ? 3 : 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  specialKey: {
    backgroundColor: COLORS.surface,
  },
  keyText: {
    fontSize: IS_WATCH_DEVICE ? 13 : 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  specialText: {
    fontSize: IS_WATCH_DEVICE ? 10 : 14,
    fontWeight: 'bold',
    color: COLORS.warning,
  },
  exploitNote: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default LockoutModal;

