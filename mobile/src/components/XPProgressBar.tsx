import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors, BorderRadius } from '../theme/theme';

interface XPProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
  color?: string;
  delay?: number;
  height?: number;
}

const XPProgressBar: React.FC<XPProgressBarProps> = ({
  progress,
  label,
  color = Colors.primary,
  delay = 300,
  height = 12,
}) => {
  const width = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(Math.min(progress, 1), {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );
    glowOpacity.value = withDelay(
      delay + 600,
      withTiming(0.7, { duration: 400 })
    );
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as any,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: color, height },
            barStyle,
          ]}
        >
          <Animated.View
            style={[
              styles.glow,
              { backgroundColor: color },
              glowStyle,
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  track: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: '100%',
    borderRadius: BorderRadius.round,
  },
});

export default XPProgressBar;
