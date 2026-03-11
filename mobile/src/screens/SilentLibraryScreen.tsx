import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated as RNAnimated,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/theme';
import DuolingoButton from '../components/DuolingoButton';

const SilentLibraryScreen = ({ navigation }: any) => {
    const { user } = useUser();
    const insets = useSafeAreaInsets();
    const [isStudying, setIsStudying] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [activePeers, setActivePeers] = useState<any[]>([]); // New state
    const timerRef = useRef<any>(null);

    // Mascot float animation
    const mascotY = useSharedValue(0);

    // Mock fetching active peers
    useEffect(() => {
        // In a real app, this would poll the `api.getActiveUsers()` endpoint
        setActivePeers([
            { id: 1, name: 'Rahul_99', studying: true, avatar: '👨‍🎓' },
            { id: 2, name: 'Priya_IAS', studying: true, avatar: '👩‍🎓' },
            { id: 3, name: 'Amit_Kumar', studying: true, avatar: '👨‍🏫' }
        ]);

        mascotY.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(10, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const mascotStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: mascotY.value }],
    }));

    useEffect(() => {
        if (isStudying) {
            timerRef.current = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isStudying]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        setIsStudying(!isStudying);
    };

    const closeLesson = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>साइलेंट लाइब्रेरी</Text>
                <DuolingoButton
                    title="X"
                    color="gray"
                    onPress={closeLesson}
                    style={{ width: 60 }}
                />
            </View>

            {/* Timer Area */}
            <View style={styles.timerSection}>
                {/* Mascot */}
                <Animated.View style={[styles.mascotContainer, mascotStyle]}>
                    <Text style={styles.mascotEmoji}>🦉</Text>
                    {isStudying && (
                        <View style={styles.bubble}>
                            <Text style={styles.bubbleText}>Shhh... Focus!</Text>
                            <View style={styles.bubbleTail} />
                        </View>
                    )}
                </Animated.View>

                {/* Chunky Timer Ring */}
                <View style={[styles.timerRing, isStudying && { borderColor: Colors.accent, borderBottomWidth: 12 }]}>
                    <Text style={[styles.timerText, isStudying && { color: Colors.accent }]}>
                        {formatTime(elapsed)}
                    </Text>
                    <Text style={styles.timerLabel}>
                        {isStudying ? "पढ़ाई जारी है..." : "तैयार हैं?"}
                    </Text>
                </View>
                
                {/* Active Peers List */}
                <View style={styles.peersContainer}>
                    <Text style={styles.peersTitle}>अब अध्ययनरत: {activePeers.length}</Text>
                    <View style={styles.peersList}>
                        {activePeers.map(peer => (
                            <View key={peer.id} style={styles.peerPill}>
                                <Text style={styles.peerAvatar}>{peer.avatar}</Text>
                                <Text style={styles.peerName}>{peer.name}</Text>
                                <View style={styles.onlineDot} />
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Bottom Actions */}
            <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 20 }]}>
                <DuolingoButton
                    title={isStudying ? "रोकें" : "शुरू करें"}
                    color={isStudying ? "coral" : "secondary"}
                    onPress={toggleTimer}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 2,
        borderBottomColor: Colors.borderLight,
    },
    headerTitle: {
        ...Typography.h2,
    },
    timerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    mascotContainer: {
        marginBottom: 40,
        position: 'relative',
    },
    mascotEmoji: {
        fontSize: 100,
    },
    bubble: {
        position: 'absolute',
        top: -30,
        right: -80,
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BorderRadius.xl,
        ...Shadows.card3D,
    },
    bubbleText: {
        ...Typography.bodyBold,
        color: Colors.accent,
    },
    bubbleTail: {
        position: 'absolute',
        bottom: -10,
        left: 20,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: Colors.borderLight,
    },
    timerRing: {
        width: 240,
        height: 240,
        borderRadius: 120,
        borderBottomWidth: 8,
        borderBottomColor: Colors.borderMuted,
        backgroundColor: Colors.backgroundOffset,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerText: {
        fontSize: 64,
        fontWeight: '900',
        color: Colors.textMuted,
        fontVariant: ['tabular-nums'],
    },
    timerLabel: {
        ...Typography.bodyBold,
        color: Colors.textMuted,
        marginTop: 8,
    },
    bottomArea: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        borderTopWidth: 2,
        borderTopColor: Colors.borderLight,
    },
    
    // Peers styling
    peersContainer: {
        marginTop: 40,
        width: '100%',
        alignItems: 'center',
    },
    peersTitle: {
        ...Typography.bodyBold,
        color: Colors.textMuted,
        marginBottom: 12,
    },
    peersList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    peerPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.round,
        borderWidth: 2,
        borderColor: Colors.borderLight,
        borderBottomWidth: 4,
    },
    peerAvatar: {
        fontSize: 16,
        marginRight: 6,
    },
    peerName: {
        ...Typography.caption,
        fontWeight: 'bold',
        marginRight: 8,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary, // Green dot
    }
});

export default SilentLibraryScreen;
