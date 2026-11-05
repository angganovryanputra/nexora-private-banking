import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import theme from '../styles/theme';

const { COLORS, SIZES, SHADOWS } = theme;

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  iconName?: string;
  isFullWidth?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success';
  disabled?: boolean;
  style?: any;
}

const CustomButton: React.FC<CustomButtonProps> = ({ 
  title, 
  onPress, 
  iconName, 
  isFullWidth = false,
  variant = 'primary',
  disabled = false,
  style,
}) => {
  const getButtonStyle = () => {
    const list: any[] = [styles.button];

    if (isFullWidth) {
      list.push({ alignSelf: 'stretch', width: '100%' });
    }

    if (variant === 'outline') {
      list.push(styles.outlineButton);
    } else {
      const bgMap = {
        primary: COLORS.primary,
        secondary: COLORS.secondary,
        danger: COLORS.danger,
        success: COLORS.success,
      };
      list.push({ backgroundColor: bgMap[variant] || COLORS.primary });
    }

    if (disabled) {
      list.push(styles.disabled);
    }

    if (style) {
      list.push(style);
    }

    return list;
  };

  const getTextColor = () => {
    if (variant === 'outline') return COLORS.primary;
    if (variant === 'primary' || variant === 'success') return COLORS.black;
    return COLORS.white;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      {iconName && (
        <Icon 
          name={iconName} 
          size={SIZES.small} 
          color={getTextColor()} 
          style={styles.icon} 
        />
      )}
      <Text style={[styles.buttonText, { color: getTextColor() }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: SIZES.touchTarget,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    borderRadius: SIZES.radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: 4,
    ...SHADOWS.small,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  buttonText: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  icon: {
    marginRight: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default CustomButton;
