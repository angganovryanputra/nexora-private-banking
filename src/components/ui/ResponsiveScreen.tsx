import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
  RefreshControl,
} from 'react-native';
import theme from '../../styles/theme';
import {
  ROUND_INSET,
  CIRCULAR_PADDING_TOP,
  CIRCULAR_PADDING_BOTTOM,
  CONTENT_MAX_WIDTH,
  IS_WATCH_DEVICE,
} from '../../styles/globalStyles';

const { COLORS } = theme;

interface ResponsiveScreenProps {
  children: React.ReactNode;
  /** Vertically center content (used for auth / empty states). */
  center?: boolean;
  /** Disable scrolling and render a plain flex container instead. */
  scroll?: boolean;
  /** Pull-to-refresh handler (phones only; adds a RefreshControl). */
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The single layout primitive every screen sits in.
 *
 * Responsibilities (so individual screens stop re-implementing them):
 *  • Applies bezel-safe insets on round/square watches.
 *  • Caps content width + centers it on phones and tablets (CONTENT_MAX_WIDTH),
 *    so the UI reads like a real app on large screens instead of stretching.
 *  • Pure-black AMOLED background by default.
 */
const ResponsiveScreen: React.FC<ResponsiveScreenProps> = ({
  children,
  center = false,
  scroll = true,
  onRefresh,
  refreshing = false,
  style,
  contentStyle,
  testID,
}) => {
  const inner = (
    <View style={[styles.inner, contentStyle]}>{children}</View>
  );

  const padding: ViewStyle = {
    paddingHorizontal: ROUND_INSET,
    paddingTop: CIRCULAR_PADDING_TOP,
    paddingBottom: CIRCULAR_PADDING_BOTTOM,
  };

  if (!scroll) {
    return (
      <View
        testID={testID}
        style={[
          styles.container,
          padding,
          styles.centerHorizontal,
          center && styles.centerVertical,
          style,
        ]}
      >
        {inner}
      </View>
    );
  }

  return (
    <ScrollView
      testID={testID}
      style={[styles.container, style]}
      contentContainerStyle={[
        padding,
        styles.centerHorizontal,
        center && styles.grow,
        center && styles.centerVertical,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh && !IS_WATCH_DEVICE ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        ) : undefined
      }
    >
      {inner}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  centerHorizontal: {
    alignItems: 'center',
  },
  centerVertical: {
    justifyContent: 'center',
  },
  grow: {
    flexGrow: 1,
  },
  inner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
  },
});

export default ResponsiveScreen;
