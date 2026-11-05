import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import theme from '../styles/theme';
import { ROUND_INSET, IS_WATCH_DEVICE } from '../styles/globalStyles';

const { COLORS, SIZES } = theme;

interface HeaderProps {
  title?: string;
  onBackPress: () => void;
  onMenuPress: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title = 'VulnBank',
  onBackPress,
  onMenuPress,
}) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onBackPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="chevron-left" size={IS_WATCH_DEVICE ? 10 : 16} color={COLORS.primary} />
      </TouchableOpacity>

      <Text style={styles.titleText} numberOfLines={1}>
        {title}
      </Text>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onMenuPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="bars" size={IS_WATCH_DEVICE ? 10 : 16} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ROUND_INSET,
    paddingTop: IS_WATCH_DEVICE ? 6 : 14,
    paddingBottom: IS_WATCH_DEVICE ? 4 : 10,
    backgroundColor: COLORS.backgroundDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionBtn: {
    width: IS_WATCH_DEVICE ? 26 : 38,
    height: IS_WATCH_DEVICE ? 26 : 38,
    borderRadius: IS_WATCH_DEVICE ? 13 : 19,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: IS_WATCH_DEVICE ? 12 : 17,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
});

export default Header;
