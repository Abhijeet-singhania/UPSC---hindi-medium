import React, { useCallback } from 'react';
import { StyleSheet, ViewStyle, StyleProp, TouchableOpacity, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    FadeInUp,
} from 'react-native-reanimated';
import { Colors, Shadows, BorderRadius, AnimationConfig } from '../theme/theme';

interface AnimatedCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    delay?: number;
    onPress?: () => void;
    active?: boolean;
    colorScheme?: {
        border: string;
        borderBottom: string;
        bg?: string;
    };
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
    children, 
    style, 
    delay = 0, 
    onPress,
    active = false,
    colorScheme
}) => {
    // 3D Press effect (translates down by the border width)
    const translateY = useSharedValue(0);

    const handlePressIn = useCallback(() => {
        translateY.value = withSpring(2, AnimationConfig.springSnappy); // Press down slightly
    }, []);

    const handlePressOut = useCallback(() => {
        translateY.value = withSpring(0, AnimationConfig.springBouncy);
    }, []);

    const activeStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // Base styling
    const dynamicStyle = colorScheme ? {
        borderWidth: 2,
        borderColor: colorScheme.border,
        borderBottomWidth: 4,
        borderBottomColor: colorScheme.borderBottom,
        backgroundColor: colorScheme.bg || Colors.white,
    } : active ? Shadows.active3D : Shadows.card3D;

    const Component = onPress ? AnimatedTouchable : Animated.View;

    return (
        <Component
            entering={FadeInUp.delay(delay).springify().damping(15)}
            style={[styles.base, dynamicStyle, activeStyle, style]}
            onPress={onPress}
            onPressIn={onPress ? handlePressIn : undefined}
            onPressOut={onPress ? handlePressOut : undefined}
            activeOpacity={1}
        >
            {/* Wrapper to absorb the bottom border thickness internally so content doesn't shift */}
            <View style={styles.internalWrapper}>
                {children}
            </View>
        </Component>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.white,
        position: 'relative',
    },
    internalWrapper: {
        padding: 16,
    }
});

export default AnimatedCard;
