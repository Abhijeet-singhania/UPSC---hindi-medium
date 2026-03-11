import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    StatusBar,
    Image,
    SafeAreaView
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useUser } from '../context/UserContext';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../theme/theme';
import LearningPathNode from '../components/LearningPathNode';

const HomeScreen = ({ navigation }: any) => {
    const { user } = useUser();
    const scrollViewRef = useRef<ScrollView>(null);

    // Heartbeat for streak icon
    const streakScale = useSharedValue(1);

    useEffect(() => {
        streakScale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 300, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Scroll gracefully to bottom on load to show path progression (assuming nodes are built from bottom up historically)
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 500);
    }, []);

    const streakStyle = useAnimatedStyle(() => ({
        transform: [{ scale: streakScale.value }],
    }));

    // Generate Path Data for Syllabus Tracker
    // Positive offsets go right, negative go left
    const GS1_NODES = [
        { id: '106', title: 'भूगोल', subtitle: 'विश्व का भूगोल', status: 'locked', icon: '🌍', color: Colors.textMuted, offset: -20, screen: undefined },
        { id: '105', title: 'भूगोल', subtitle: 'भारतीय भूगोल', status: 'locked', icon: '🏔️', color: Colors.textMuted, offset: 40, screen: undefined },
        { id: '104', title: 'समाज', subtitle: 'भारतीय समाज', status: 'locked', icon: '👥', color: Colors.primary, offset: 0, screen: undefined },
        { id: '103', title: 'इतिहास', subtitle: 'विश्व इतिहास', status: 'active', icon: '🌍', color: Colors.accent, offset: -40, screen: 'SilentLibrary' as any },
        { id: '102', title: 'इतिहास', subtitle: 'आधुनिक इतिहास', status: 'completed', icon: '✔️', color: '#FFC800', offset: 20, screen: 'DailyAnswer' as any },
        { id: '101', title: 'कला', subtitle: 'भारतीय कला', status: 'completed', icon: '✔️', color: '#FFC800', offset: -10, screen: 'DailyAnswer' as any },
    ] as const;

    const GS2_NODES = [
        { id: '203', title: 'IR', subtitle: 'अंतरराष्ट्रीय संबंध', status: 'locked', icon: '🌐', color: Colors.textMuted, offset: 30, screen: undefined },
        { id: '202', title: 'शासन', subtitle: 'सुशासन', status: 'locked', icon: '🏛️', color: Colors.textMuted, offset: -30, screen: undefined },
        { id: '201', title: 'संविधान', subtitle: 'भारतीय संविधान', status: 'locked', icon: '⚖️', color: Colors.textMuted, offset: 0, screen: undefined },
    ] as const;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Top Stats Bar */}
            <View style={styles.topBar}>
                {/* Course Indicator */}
                <View style={styles.courseBadge}>
                    <Text style={styles.courseEmoji}>🇮🇳</Text>
                </View>

                {/* Streak */}
                <View style={styles.statContainer}>
                    <Animated.Text style={[styles.statIcon, streakStyle]}>🔥</Animated.Text>
                    <Text style={[styles.statText, { color: Colors.orange }]}>1</Text>
                </View>

                {/* Gems/Rep */}
                <View style={styles.statContainer}>
                    <Text style={styles.statIcon}>💎</Text>
                    <Text style={[styles.statText, { color: Colors.secondary }]}>
                        {user?.reputation || 0}
                    </Text>
                </View>

                {/* Hearts / Health */}
                <View style={styles.statContainer}>
                    <Text style={styles.statIcon}>❤️</Text>
                    <Text style={[styles.statText, { color: Colors.coral }]}>5</Text>
                </View>
            </View>

            {/* Scrollable Map Path */}
            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* GS Paper 2 Header */}
                <View style={[styles.sectionHeader, { backgroundColor: Colors.secondary, borderBottomColor: Colors.secondaryShadow }]}>
                    <Text style={styles.sectionTitle}>GS Paper 2</Text>
                    <Text style={styles.sectionSubtitle}>शासन, संविधान, राजव्यवस्था</Text>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '0%', backgroundColor: Colors.gold }]} />
                    </View>
                </View>

                {/* GS 2 Path Nodes */}
                <View style={styles.pathContainer}>
                    {GS2_NODES.map((node, index) => {
                        const isLast = index === GS2_NODES.length - 1;
                        return (
                            <View key={node.id} style={styles.nodeWrapper}>
                                <LearningPathNode
                                    id={node.id}
                                    status={node.status as any}
                                    icon={node.icon}
                                    color={node.color}
                                    offset={node.offset}
                                    onPress={() => {
                                        if (node.screen) {
                                            navigation.navigate(node.screen);
                                        }
                                    }}
                                />
                                <View style={styles.nodeLabelWrap}>
                                    <Text style={[styles.nodeTitle, node.status === 'locked' && { color: Colors.textMuted }]}>{node.title}</Text>
                                    <Text style={styles.nodeSubtitle}>{node.subtitle}</Text>
                                </View>
                                {!isLast && (
                                    <View style={[
                                        styles.pathLine,
                                        { 
                                            left: '50%',
                                            transform: [{ translateX: -4 + node.offset / 2 }], 
                                            backgroundColor: (node.status as any) === 'completed' ? '#FFC800' : Colors.borderLight
                                        }
                                    ]} />
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Vertical Connector between Sections */}
                <View style={styles.sectionConnector} />

                {/* GS Paper 1 Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>GS Paper 1</Text>
                    <Text style={styles.sectionSubtitle}>भारतीय विरासत और इतिहास</Text>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '33%', backgroundColor: Colors.gold }]} />
                    </View>
                </View>

                {/* GS 1 Path Nodes */}
                <View style={styles.pathContainer}>
                    {GS1_NODES.map((node, index) => {
                        const isLast = index === GS1_NODES.length - 1;
                        return (
                            <View key={node.id} style={styles.nodeWrapper}>
                                <LearningPathNode
                                    id={node.id.toString()}
                                    status={node.status as any}
                                    icon={node.icon}
                                    color={node.color}
                                    offset={node.offset}
                                    onPress={() => {
                                        if (node.screen) {
                                            navigation.navigate(node.screen);
                                        }
                                    }}
                                />
                                <View style={styles.nodeLabelWrap}>
                                    <Text style={[styles.nodeTitle, node.status === 'locked' && { color: Colors.textMuted }]}>{node.title}</Text>
                                    <Text style={styles.nodeSubtitle}>{node.subtitle}</Text>
                                </View>
                                {!isLast && (
                                    <View style={[
                                        styles.pathLine,
                                        { 
                                            left: '50%',
                                            transform: [{ translateX: -4 + node.offset / 2 }], 
                                            backgroundColor: node.status === 'completed' ? '#FFC800' : Colors.borderLight
                                        }
                                    ]} />
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Bottom Padding for scroll */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    // Top Bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: 2,
        borderBottomColor: Colors.borderLight,
        backgroundColor: Colors.white,
        zIndex: 10,
    },
    courseBadge: {
        width: 36,
        height: 28,
        borderRadius: BorderRadius.md,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.borderMuted,
    },
    courseEmoji: {
        fontSize: 16,
    },
    statContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statIcon: {
        fontSize: 20,
    },
    statText: {
        ...Typography.bodyBold,
        fontSize: 16,
        fontVariant: ['tabular-nums'],
    },
    
    // Content
    scrollContent: {
        paddingTop: Spacing.xl,
    },
    sectionHeader: {
        backgroundColor: Colors.primary,
        marginHorizontal: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 2,
        borderColor: Colors.borderLight,
        borderBottomWidth: 4,
        borderBottomColor: '#58A700',
        marginBottom: Spacing.xxxl,
    },
    sectionTitle: {
        ...Typography.h2,
        color: Colors.white,
    },
    sectionSubtitle: {
        ...Typography.body,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
        marginBottom: 12,
    },
    progressBarBg: {
        width: '100%',
        height: 12,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    sectionConnector: {
        height: 60, // Space between tracks
    },

    // Path Map
    pathContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    nodeWrapper: {
        width: '100%',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 40, // Increased spacing to fit labels
    },
    nodeLabelWrap: {
        position: 'absolute',
        top: 20,
        left: '65%', // Positioned to the right of the node generally
        width: 120,
    },
    nodeTitle: {
        ...Typography.bodyBold,
        fontSize: 16,
    },
    nodeSubtitle: {
        ...Typography.caption,
        fontSize: 12,
    },
    pathLine: {
        position: 'absolute',
        width: 12, // Thick chunky connection line
        height: 40,
        bottom: -30,
        zIndex: -1,
        borderRadius: 6,
    }
});

export default HomeScreen;
