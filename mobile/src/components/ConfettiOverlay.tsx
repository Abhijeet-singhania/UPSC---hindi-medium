import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLE_COLORS = [
  Colors.primary,
  Colors.gold,
  Colors.coral,
  Colors.accent,
  Colors.secondary,
  Colors.orange,
  '#FF69B4',
  '#00FF88',
];

const NUM_PARTICLES = 30;

interface ParticleProps {
  color: string;
  startX: number;
  delay: number;
  onComplete?: () => void;
  isLast: boolean;
}

const Particle: React.FC<ParticleProps> = ({ color, startX, delay, onComplete, isLast }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  const targetX = (Math.random() - 0.5) * SCREEN_WIDTH * 0.8;
  const targetY = -(Math.random() * SCREEN_HEIGHT * 0.5 + 100);

  useEffect(() => {
    scale.value = withDelay(delay, withTiming(1, { duration: 100 }));
    translateY.value = withDelay(
      delay,
      withTiming(targetY, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
    translateX.value = withDelay(
      delay,
      withTiming(targetX, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
    rotate.value = withDelay(
      delay,
      withTiming(Math.random() * 720 - 360, { duration: 1200 })
    );
    opacity.value = withDelay(
      delay + 600,
      withTiming(0, { duration: 600 }, (finished) => {
        if (finished && isLast && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const size = Math.random() * 8 + 4;
  const isCircle = Math.random() > 0.5;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          bottom: 100,
          width: size,
          height: isCircle ? size : size * 2,
          borderRadius: isCircle ? size / 2 : 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
};

interface ConfettiOverlayProps {
  visible: boolean;
  onComplete?: () => void;
}

const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({ visible, onComplete }) => {
  if (!visible) return null;

  const particles = Array.from({ length: NUM_PARTICLES }, (_, i) => ({
    id: i,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    startX: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 40,
    delay: Math.random() * 300,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, index) => (
        <Particle
          key={p.id}
          color={p.color}
          startX={p.startX}
          delay={p.delay}
          onComplete={onComplete}
          isLast={index === particles.length - 1}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
  },
});

export default ConfettiOverlay;
