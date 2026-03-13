import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/theme';

const { width } = Dimensions.get('window');

const ORANGE_BG = '#FFA000'; // matching the gold/orange header
const LIGHT_ORANGE = '#FFF8E1'; // matching current user bg

// Dummy data mirroring the image
const PODIUM_DATA = [
    { rank: 2, name: 'Priya S.', initials: 'PS', xp: '3,840', color: '#03A9F4', medal: '🥈' },
    { rank: 1, name: 'Amit K.', initials: 'AK', xp: '5,210', color: '#FFC107', medal: '👑' },
    { rank: 3, name: 'Neha M.', initials: 'NM', xp: '3,120', color: '#9C27B0', medal: '🥉' },
];

const CURRENT_USER = {
    rank: 7,
    name: 'आप (Rahul K.)',
    initials: 'RK',
    location: 'पटना, बिहार',
    xp: '1,240',
    isCurrent: true
};

const LIST_DATA = [
    { rank: 4, name: 'Vivek Tiwari', initials: 'VT', location: 'इलाहाबाद, UP', xp: '2,980', color: '#388E3C' },
    { rank: 5, name: 'Sonal Kumari', initials: 'SK', location: 'पटना, बिहार', xp: '2,750', color: '#F44336' },
    { rank: 6, name: 'Manish Rana', initials: 'MR', location: 'जयपुर, राजस्थान', xp: '1,980', color: '#424242' },
    { rank: 8, name: 'Deepak Kumar', initials: 'DK', location: 'वाराणसी, UP', xp: '1,100', color: '#9C27B0' },
];

const LeaderboardScreen = () => {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState('इस सप्ताह');
    const tabs = ['इस सप्ताह', 'इस माह', 'सर्वकाल'];

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
                <Text style={styles.headerTitle}>Leaderboard 🏆</Text>
                <Text style={styles.headerSubtitle}>इस सप्ताह के सर्वश्रेष्ठ अभ्यासकर्ता</Text>
                
                {/* Tabs */}
                <View style={styles.tabsRow}>
                    {tabs.map((tab) => {
                        const isSelected = selectedTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                                onPress={() => setSelectedTab(tab)}
                            >
                                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Podium Card */}
            <View style={styles.podiumCard}>
                <View style={styles.podiumContainer}>
                    {PODIUM_DATA.map((item, index) => {
                        const isFirst = item.rank === 1;
                        return (
                            <View key={item.rank} style={[styles.podiumColumn, isFirst && styles.podiumColumnFirst]}>
                                <Text style={styles.medalEmoji}>{item.medal}</Text>
                                <View style={[
                                    styles.podiumAvatar, 
                                    { borderColor: item.color },
                                    isFirst && styles.podiumAvatarFirst
                                ]}>
                                    <Text style={[styles.podiumInitials, isFirst && { fontSize: 24 }]}>{item.initials}</Text>
                                </View>
                                <Text style={styles.podiumName}>{item.name}</Text>
                                <Text style={styles.podiumXP}>{item.xp} XP</Text>
                                
                                <View style={[
                                    styles.podiumBlock, 
                                    { backgroundColor: item.color },
                                    isFirst && styles.podiumBlockFirst,
                                    item.rank === 2 && styles.podiumBlockSecond,
                                    item.rank === 3 && styles.podiumBlockThird,
                                ]}>
                                    <Text style={styles.podiumRankText}>{item.rank}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );

    const renderCurrentUserHighlight = () => (
        <View style={styles.highlightWrapper}>
            <View style={styles.currentUserCard}>
                <Text style={styles.highlightRank}>{CURRENT_USER.rank}</Text>
                <View style={styles.highlightAvatar}>
                    <Text style={styles.highlightInitials}>{CURRENT_USER.initials}</Text>
                </View>
                <View style={styles.listUserInfo}>
                    <Text style={[styles.listName, { color: '#212121' }]}>{CURRENT_USER.name}</Text>
                    <Text style={styles.listLocation}>{CURRENT_USER.location}</Text>
                </View>
                <Text style={styles.highlightXP}>{CURRENT_USER.xp} XP</Text>
            </View>

            <View style={styles.dividerRow}>
                <Text style={styles.dividerDashes}>{"================="}</Text>
                <Text style={styles.dividerText}>अन्य प्रतिभागी</Text>
                <Text style={styles.dividerDashes}>{"================="}</Text>
            </View>
        </View>
    );

    const renderItem = ({ item }: any) => {
        return (
            <View style={styles.listCard}>
                <Text style={styles.listRank}>{item.rank}</Text>
                <View style={[styles.listAvatar, { backgroundColor: item.color }]}>
                    <Text style={styles.listInitials}>{item.initials}</Text>
                </View>
                <View style={styles.listUserInfo}>
                    <Text style={styles.listName}>{item.name}</Text>
                    <Text style={styles.listLocation}>{item.location}</Text>
                </View>
                <Text style={styles.listXP}>{item.xp} XP</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <FlatList
                data={LIST_DATA}
                renderItem={renderItem}
                keyExtractor={(item) => item.rank.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <>
                        {renderHeader()}
                        {renderCurrentUserHighlight()}
                    </>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA', // Matches bottom area
    },
    listContent: {
        paddingBottom: 100, // Space for tab bar
    },

    // Header styling
    headerContainer: {
        marginBottom: Spacing.xl,
    },
    headerTop: {
        backgroundColor: ORANGE_BG,
        paddingHorizontal: Spacing.xl,
        paddingTop: 20,
        paddingBottom: 60, // Space for the overlapping podium card
    },
    headerTitle: {
        ...Typography.hero,
        color: Colors.white,
        marginBottom: 4,
    },
    headerSubtitle: {
        ...Typography.bodyBold,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: Spacing.lg,
    },
    
    // Tabs
    tabsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    tabButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.round,
    },
    tabButtonActive: {
        backgroundColor: Colors.white,
    },
    tabText: {
        ...Typography.bodyBold,
        color: Colors.white,
    },
    tabTextActive: {
        color: ORANGE_BG,
    },

    // Podium Card
    podiumCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        marginHorizontal: Spacing.xl,
        marginTop: -40, // Pull it up into the orange header
        paddingTop: Spacing.xl,
        paddingHorizontal: Spacing.sm,
        ...Shadows.card3D,
        borderColor: '#F0F0F0',
        elevation: 4,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        height: 240, // Fixed height for alignment
    },
    podiumColumn: {
        flex: 1,
        alignItems: 'center',
    },
    podiumColumnFirst: {
        zIndex: 2, // Ensure 1st place is on top
    },
    medalEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    podiumAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#03A9F4', // Fallback
        marginBottom: 8,
    },
    podiumAvatarFirst: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFC107',
        borderWidth: 4,
    },
    podiumInitials: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 18,
    },
    podiumName: {
        ...Typography.bodyBold,
        fontSize: 13,
        textAlign: 'center',
        color: '#212121',
    },
    podiumXP: {
        ...Typography.small,
        color: '#8E9AAB',
        marginBottom: 12,
    },
    podiumBlock: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    podiumBlockFirst: {
        height: 100,
    },
    podiumBlockSecond: {
        height: 60,
    },
    podiumBlockThird: {
        height: 50,
    },
    podiumRankText: {
        ...Typography.h2,
        color: Colors.white,
    },

    // Current User Row
    highlightWrapper: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    currentUserCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: LIGHT_ORANGE,
        ...Shadows.card3D,
        borderColor: ORANGE_BG,
        borderWidth: 1.5,
        borderRadius: BorderRadius.xl,
        paddingVertical: 14,
        paddingHorizontal: Spacing.md,
        borderBottomColor: ORANGE_BG,
    },
    highlightRank: {
        ...Typography.h3,
        color: ORANGE_BG,
        width: 30,
        textAlign: 'center',
        marginRight: 8,
    },
    highlightAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: ORANGE_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    highlightInitials: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    highlightXP: {
        ...Typography.bodyBold,
        color: ORANGE_BG,
    },

    // Divider
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    dividerDashes: {
        color: '#B0BEC5',
        letterSpacing: 2,
        fontSize: 10,
    },
    dividerText: {
        ...Typography.small,
        color: '#8E9AAB',
        marginHorizontal: 8,
    },

    // Standard List Items
    listCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        paddingVertical: 14,
        paddingHorizontal: Spacing.md,
        marginHorizontal: Spacing.xl,
        marginBottom: 12,
        ...Shadows.card3D,
        borderColor: '#F0F0F0',
        elevation: 1,
    },
    listRank: {
        ...Typography.h3,
        color: '#B0BEC5',
        width: 30,
        textAlign: 'center',
        marginRight: 8,
    },
    listAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    listInitials: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    listUserInfo: {
        flex: 1,
    },
    listName: {
        ...Typography.bodyBold,
        color: '#212121',
        fontSize: 15,
    },
    listLocation: {
        ...Typography.caption,
        fontSize: 11,
    },
    listXP: {
        ...Typography.bodyBold,
        color: ORANGE_BG,
    },
});

export default LeaderboardScreen;
