import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { Colors, AnimationConfig } from '../theme/theme';

interface LearningPathNodeProps {
    id: string;
    status: 'locked' | 'active' | 'completed';
    icon: string;
    offset: number; // Horizontal offset (-50 to 50) to create the snake path
    onPress: () => void;
    color?: string; // e.g. primary for daily, secondary for QA
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const LearningPathNode: React.FC<LearningPathNodeProps> = ({ 
    status, 
    icon, 
    offset, 
    onPress,
    color = Colors.primary
}) => {
    // Constant bounce for active node
    const activeScale = useSharedValue(1);
    // Squish on press
    const pressScale = useSharedValue(1);

    useEffect(() => {
        if (status === 'active') {
            activeScale.value = withRepeat(
                withSequence(
                    withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        } else {
            activeScale.value = withTiming(1);
        }
    }, [status]);

    const handlePressIn = () => {
        if (status !== 'locked') {
            pressScale.value = withSpring(0.9, AnimationConfig.springSnappy);
        }
    };

    const handlePressOut = () => {
        if (status !== 'locked') {
            pressScale.value = withSpring(1, AnimationConfig.springBouncy);
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: activeScale.value },
            { scale: pressScale.value }
        ],
        marginLeft: offset, // offset from center
    }));

    // Theme based on status
    let bgColor = color;
    let shadowColor = '';
    let iconOpacity = 1;

    // determine shadow based on color map (naive lookup for demo, can be improved)
    if (color === Colors.primary) shadowColor = '#58A700';
    if (color === Colors.secondary) shadowColor = '#1899D6';
    if (color === Colors.accent) shadowColor = '#A568CC';
    if (color === Colors.gold) shadowColor = '#CC9900';

    if (status === 'locked') {
        bgColor = '#E5E5E5';
        shadowColor = '#D3D3D3';
        iconOpacity = 0.5;
    }

    if (status === 'completed') {
        bgColor = '#FFC800'; // Gold crown for done
        shadowColor = '#CC9900';
        iconOpacity = 0.9;
    }

    return (
        <View style={styles.nodeContainer}>
            <AnimatedTouchable
                activeOpacity={1}
                onPress={status !== 'locked' ? onPress : undefined}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.nodeBase,
                    { 
                        backgroundColor: bgColor,
                        borderBottomColor: shadowColor,
                    },
                    animatedStyle
                ]}
            >
                {/* Visual Crown for completed, default icon otherwise */}
                {status === 'completed' && <View style={styles.crownDeco}><Text>👑</Text></View>}
                <Text style={[styles.icon, { opacity: iconOpacity }]}>{icon}</Text>
            </AnimatedTouchable>
        </View>
    );
};

const styles = StyleSheet.create({
    nodeContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 12, // Space between nodes in the path
    },
    nodeBase: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 32,
    },
    crownDeco: {
        position: 'absolute',
        top: -15,
        right: -10,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 2,
        borderWidth: 2,
        borderColor: '#E5E5E5',
    }
});

export default LearningPathNode;
