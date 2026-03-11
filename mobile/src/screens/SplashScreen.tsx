import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withRepeat,
    withSpring,
    withDelay,
    Easing,
    runOnJS
} from 'react-native-reanimated';
import { Colors, Typography, AnimationConfig, Shadows } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define 4 mock UPSC subjects for the 3D tiles
const SUBJECTS = [
    { id: 'history', title: 'इतिहास', icon: '🏛️', color: Colors.primary, shadow: '#58A700', angle: -15, initX: -60, initY: -100 },
    { id: 'polity', title: 'संविधान', icon: '⚖️', color: Colors.secondary, shadow: '#1899D6', angle: 10, initX: 70, initY: -70 },
    { id: 'geo', title: 'भूगोल', icon: '🌍', color: Colors.orange, shadow: '#CC7800', angle: 25, initX: -80, initY: 60 },
    { id: 'eco', title: 'अर्थव्यवस्था', icon: '📈', color: Colors.accent, shadow: '#A568CC', angle: -20, initX: 60, initY: 90 },
];

const SplashScreen = ({ navigation }: any) => {

    // Center logo scale
    const logoScale = useSharedValue(0);

    // Navigate to Home once animation sequence finishes
    const finishSplash = () => {
        navigation.replace('MainTabs'); 
    };

    useEffect(() => {
        // Trigger center logo pop after all tiles have collapsed (approx 1800ms)
        logoScale.value = withDelay(
            1800,
            withSequence(
                withSpring(1.2, AnimationConfig.springBouncy),
                withSpring(1, AnimationConfig.springSnappy, (finished) => {
                    if (finished) {
                        // Hold for 1 second before navigating away
                        setTimeout(() => {
                            runOnJS(finishSplash)();
                        }, 1000);
                    }
                })
            )
        );
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
    }));

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            
            {/* Subject Tiles */}
            {SUBJECTS.map((sub, idx) => (
                <SubjectTile 
                    key={sub.id} 
                    subject={sub} 
                    delay={idx * 150} // Stagger initialization slightly
                />
            ))}

            {/* Main App Logo (Revealed at end) */}
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                <View style={[styles.logoBadge, { borderColor: Colors.goldShadow }]}>
                    <Text style={styles.logoEmoji}>🦁</Text> 
                </View>
                <Text style={styles.logoTitle}>UPSC Hindi</Text>
            </Animated.View>

        </View>
    );
};

// Extracted Tile Component for individual complex animations
const SubjectTile = ({ subject, delay }: { subject: any, delay: number }) => {
    
    // Initial states offset from center
    const x = useSharedValue(subject.initX);
    const y = useSharedValue(subject.initY);
    const rotate = useSharedValue(subject.angle);
    const scale = useSharedValue(0); // Starts invisible
    
    // Shake toggle
    const shakeOffset = useSharedValue(0);

    useEffect(() => {
        // 1. Pop In
        scale.value = withDelay(delay, withSpring(1, AnimationConfig.springBouncy));

        // 2. Shake violently after a brief pause
        shakeOffset.value = withDelay(
            delay + 600,
            withRepeat(
                withSequence(
                    withTiming(-8, { duration: 50, easing: Easing.linear }),
                    withTiming(8, { duration: 50, easing: Easing.linear }),
                    withTiming(0, { duration: 50, easing: Easing.linear })
                ),
                6 // Shake 6 times rapidly
            )
        );

        // 3. Black hole collapse (Translate to 0, Rotate randomly, Scale to 0)
        x.value = withDelay(delay + 1400, withTiming(0, { duration: 400, easing: Easing.in(Easing.exp) }));
        y.value = withDelay(delay + 1400, withTiming(0, { duration: 400, easing: Easing.in(Easing.exp) }));
        rotate.value = withDelay(delay + 1400, withTiming(subject.angle + 360, { duration: 400 }));
        scale.value = withDelay(delay + 1400, withTiming(0, { duration: 400, easing: Easing.in(Easing.exp) }));

    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateX: x.value + shakeOffset.value },
            { translateY: y.value },
            { rotate: `${rotate.value}deg` },
            { scale: scale.value }
        ],
    }));

    return (
        <Animated.View 
            style={[
                styles.tileContainer,
                style,
                { backgroundColor: subject.color, borderBottomColor: subject.shadow }
            ]}
        >
            <Text style={styles.tileEmoji}>{subject.icon}</Text>
            <Text style={styles.tileText}>{subject.title}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Tile Styles
    tileContainer: {
        position: 'absolute',
        width: 100,
        height: 120,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        borderBottomWidth: 8, // 3D thickness
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    tileEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    tileText: {
        ...Typography.caption,
        color: Colors.white,
        fontWeight: '900',
        textAlign: 'center',
    },

    // Final Logo Styles
    logoContainer: {
        alignItems: 'center',
        position: 'absolute',
        zIndex: 50,
    },
    logoBadge: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Colors.gold,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderBottomWidth: 10,
        marginBottom: 20,
    },
    logoEmoji: {
        fontSize: 70,
    },
    logoTitle: {
        ...Typography.hero,
        color: Colors.textMain,
    }
});

export default SplashScreen;
