import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Gradients, Typography, Spacing } from '../theme/theme';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  colors?: string[];
  style?: ViewStyle;
}

const GradientHeader: React.FC<GradientHeaderProps> = ({
  title,
  subtitle,
  rightElement,
  colors = Gradients.primary,
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 16 }, style]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightElement && <View>{rightElement}</View>}
      </View>
      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.h1,
    color: Colors.textMain,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 4,
  },
  // Decorative floating circles for depth
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  circle1: {
    width: 120,
    height: 120,
    top: -30,
    right: -20,
  },
  circle2: {
    width: 80,
    height: 80,
    bottom: -20,
    left: 30,
  },
  circle3: {
    width: 50,
    height: 50,
    top: 20,
    right: 80,
  },
});

export default GradientHeader;
