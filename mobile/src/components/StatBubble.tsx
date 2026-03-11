import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Colors, Shadows, AnimationConfig } from '../theme/theme';

interface StatBubbleProps {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
  delay?: number;
  size?: 'small' | 'medium';
}

const StatBubble: React.FC<StatBubbleProps> = ({
  value,
  label,
  icon,
  color = Colors.primary,
  delay = 0,
  size = 'medium',
}) => {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, AnimationConfig.springBouncy));
    translateY.value = withDelay(delay, withSpring(0, AnimationConfig.springSnappy));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const isSmall = size === 'small';

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View
        style={[
          styles.bubble,
          isSmall && styles.bubbleSmall,
          { borderColor: color },
        ]}
      >
        {icon && <Text style={[styles.icon, isSmall && styles.iconSmall]}>{icon}</Text>}
        <Text style={[styles.value, isSmall && styles.valueSmall, { color }]}>
          {value}
        </Text>
        <Text style={[styles.label, isSmall && styles.labelSmall]}>{label}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 95,
  },
  bubbleSmall: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 70,
    borderRadius: 16,
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  iconSmall: {
    fontSize: 16,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
  },
  valueSmall: {
    fontSize: 18,
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 10,
  },
});

export default StatBubble;
