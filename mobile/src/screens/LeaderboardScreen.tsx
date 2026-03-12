import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    FadeInUp,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/theme';
import AnimatedCard from '../components/AnimatedCard';

// Dummy data for visual layout testing
const MOCK_LEAGUES = [
    { id: 'bronze', name: 'Bronze', color: '#CD7F32' },
    { id: 'silver', name: 'Silver', color: '#C0C0C0' },
    { id: 'gold', name: 'Gold', color: Colors.gold },
];

const LeaderboardScreen = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pulse animation for the current user's row
    const highlightOpacity = useSharedValue(0.1);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await api.getLeaderboard('reputation', 'weekly');
                setLeaderboardData(data as any[]);
            } catch (error) {
                console.error('Failed to load leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();

        highlightOpacity.value = withRepeat(
            withSequence(
                withTiming(0.4, { duration: 1000 }),
                withTiming(0.1, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    const highlightStyle = useAnimatedStyle(() => ({
        backgroundColor: `rgba(28, 176, 246, ${highlightOpacity.value})`, // Pulse secondary color
    }));

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* The League Shield Area */}
            <View style={styles.shieldContainer}>
                <View style={[styles.shield, { borderColor: Colors.goldShadow, backgroundColor: Colors.gold }]}>
                    <Text style={styles.shieldEmoji}>🛡️</Text>
                </View>
                <Text style={styles.leagueTitle}>{t('leaderboard.goldLeague')}</Text>
                <Text style={styles.leagueSubtitle}>{t('leaderboard.promotionText')}</Text>
            </View>
            <View style={styles.divider} />
        </View>
    );

    const renderItem = ({ item, index }: any) => {
        const isCurrentUser = item.id === user?.id;
        const isTop3 = index < 3;

        let rankColor = Colors.textMuted;
        if (index === 0) rankColor = Colors.gold;
        if (index === 1) rankColor = '#C0C0C0';
        if (index === 2) rankColor = '#CD7F32';

        return (
            <Animated.View entering={FadeInUp.delay(index * 50).springify().damping(15)}>
                <View style={[
                    styles.rowContainer,
                    isCurrentUser && styles.currentUserRow
                ]}>
                    <Text style={[styles.rankText, { color: rankColor }, isTop3 && { fontSize: 24, fontWeight: '900' }]}>
                        {index + 1}
                    </Text>

                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarEmoji}>🧑‍🎓</Text>
                    </View>

                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, isCurrentUser && { color: Colors.secondary }]}>
                            {item.name || `User${item.id}`}
                        </Text>
                    </View>

                    <View style={styles.xpContainer}>
                        <Text style={styles.xpText}>{item.reputation}</Text>
                        <Text style={styles.xpLabel}>{t('leaderboard.xp')}</Text>
                    </View>
                </View>

                {/* Thin internal separator */}
                {index < leaderboardData.length - 1 && <View style={styles.separator} />}
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.secondary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            <FlatList
                data={leaderboardData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        paddingTop: Spacing.xxl,
        alignItems: 'center',
    },
    shieldContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    shield: {
        width: 100,
        height: 120,
        borderRadius: 20,
        // Shield specific shaping trick
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
        borderWidth: 4,
        borderBottomWidth: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    shieldEmoji: {
        fontSize: 48,
    },
    leagueTitle: {
        ...Typography.h1,
        color: Colors.gold,
        marginBottom: 4,
    },
    leagueSubtitle: {
        ...Typography.bodyBold,
        color: Colors.textMuted,
    },
    divider: {
        height: 2,
        backgroundColor: Colors.borderLight,
        width: '100%',
    },
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 100, // Space for tab bar
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: BorderRadius.lg,
    },
    currentUserRow: {
        backgroundColor: 'rgba(28, 176, 246, 0.1)', // Light blue tint
    },
    separator: {
        height: 2,
        backgroundColor: Colors.borderLight,
        marginLeft: 50, // Indent past rank
        marginRight: 10,
    },
    rankText: {
        ...Typography.h2,
        width: 40,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.backgroundOffset,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: Colors.borderLight,
    },
    avatarEmoji: {
        fontSize: 24,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        ...Typography.bodyBold,
        fontSize: 18,
    },
    xpContainer: {
        alignItems: 'flex-end',
    },
    xpText: {
        ...Typography.bodyBold,
        fontSize: 18,
        color: Colors.textMain,
        fontVariant: ['tabular-nums'],
    },
    xpLabel: {
        ...Typography.small,
        color: Colors.textMuted,
    }
});

export default LeaderboardScreen;
