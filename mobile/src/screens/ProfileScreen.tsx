import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/theme';

const { width } = Dimensions.get('window');

// Using a custom darker green to match the image precisely
const HEADER_GREEN = '#1e7f41'; 
const BACKGROUND_GRAY = '#F5F7FA';

const ProfileScreen = ({ navigation }: any) => {
    const { t } = useTranslation();
    const { user } = useUser();

    // Stats Grid Data based on image
    const statsData = [
        { value: '42', label: '🔥 STREAK' },
        { value: '1,240', label: '⚡ TOTAL XP' },
        { value: '87', label: '✍️ उत्तर' },
        { value: '156', label: '💬 Q&A' },
        { value: '48h', label: '📚 LIBRARY' },
        { value: '#7', label: '🏆 RANK' },
    ];

    // Badges Data based on image
    const badgesData = [
        { icon: '🔥', label: '30-Day\nStreak', color: '#FFF3E0' },
        { icon: '✍️', label: 'First\nAnswer', color: '#E8F5E9' },
        { icon: '💬', label: 'Helpful 50', color: '#E3F2FD' },
        { icon: '📚', label: 'Silent 10hr', color: '#FCE4EC' },
        { icon: '🏆', label: 'Top 5', color: '#FFFFFF', hasBorder: true },
        // Second row item
        { icon: '💎', label: '1000 XP', color: '#FFFFFF', hasBorder: true, locked: true },
    ];

    // Progress Chart Data based on image
    const chartData = [
        { label: 'सो', height: 30, color: '#66BB6A' }, // Light green
        { label: 'मं', height: 60, color: '#1E88E5' }, // Need to change to dark green like #1B873F, let's look at image again. Image: So=light green, Mon=dark green, Wed=light green, Thu=dark green, Fri=light green, Sat=orange, Sun=grey.
        { label: 'बु', height: 40, color: '#66BB6A' }, // Actually wed=मं in hindi, short for Mangal, Budh=बु? Image has "सो", "मं", "मं", wait, "सो", "मं", "बु", "गु", "शु", "श", "आज" - the image has labels "सो, मं, मं, गु, शु, श, आज" (Monday, Tuesday, Wednesday... maybe a typo in the mock? I'll use conventional "सो, मं, बु, गु, शु, श, आज".)
    ];
    
    // Corrected Chart Data
    const chartBars = [
        { label: 'सो', height: 20, color: '#66BB6A' },
        { label: 'मं', height: 40, color: '#1B5E20' }, // Dark green
        { label: 'बु', height: 25, color: '#81C784' }, // Light-ish green
        { label: 'गु', height: 50, color: '#1B5E20' },
        { label: 'शु', height: 35, color: '#66BB6A' },
        { label: 'श', height: 45, color: '#FFA000' }, // Orange
        { label: 'आज', height: 10, color: '#E0E0E0', textColor: '#FFA000' }, // Grey bar
    ];

    const maxChartHeight = 60;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header Section */}
                    <View style={styles.headerContainer}>
                        {/* Decorative background circles */}
                        <View style={styles.circleTopRight} />
                        <View style={styles.circleBottomLeft} />

                        <View style={styles.headerContent}>
                            <View style={styles.avatarWrapper}>
                                <Text style={styles.avatarEmoji}>🧑‍🎓</Text>
                            </View>

                            <Text style={styles.nameText}>{user?.name || 'Rahul Kumar'}</Text>
                            
                            <View style={styles.leagueRow}>
                                <Text style={styles.leagueText}>🥇 Gold League • पटना, बिहार</Text>
                            </View>

                            <View style={styles.tagsRow}>
                                <View style={styles.tagPill}>
                                    <Text style={styles.tagText}>✍️ Mains Aspirant</Text>
                                </View>
                                <View style={styles.tagPill}>
                                    <Text style={styles.tagText}>📅 2nd Attempt</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Body Content */}
                    <View style={styles.bodyContainer}>

                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            {statsData.map((stat, idx) => (
                                <View key={idx} style={styles.statCard}>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Badges Collection */}
                        <View style={styles.cardSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>बैज संग्रह 🥇</Text>
                                <Text style={styles.seeAllText}>सभी देखें</Text>
                            </View>

                            <View style={styles.badgesGrid}>
                                {badgesData.map((badge, idx) => (
                                    <View key={idx} style={styles.badgeItem}>
                                        <View style={[
                                            styles.badgeCircle, 
                                            { backgroundColor: badge.color },
                                            badge.hasBorder && styles.badgeBorder,
                                            badge.locked && styles.badgeLocked
                                        ]}>
                                            <Text style={[styles.badgeIcon, badge.locked && styles.lockedIcon]}>{badge.icon}</Text>
                                        </View>
                                        <Text style={[styles.badgeLabel, badge.locked && styles.lockedText]} numberOfLines={2}>
                                            {badge.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Progress Chart */}
                        <View style={styles.cardSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { fontSize: 16 }]}>📊 इस सप्ताह की प्रगति</Text>
                            </View>

                            <View style={styles.chartContainer}>
                                {chartBars.map((bar, idx) => {
                                    const heightRatio = bar.height / maxChartHeight;
                                    const renderedHeight = heightRatio * 70; // 70 is max visual height in px
                                    return (
                                        <View key={idx} style={styles.barColumn}>
                                            <View style={styles.barTrack}>
                                                <View style={[
                                                    styles.barFill, 
                                                    { height: Math.max(renderedHeight, 8), backgroundColor: bar.color }
                                                ]} />
                                            </View>
                                            <Text style={[
                                                styles.barLabel, 
                                                bar.textColor && { color: bar.textColor, fontWeight: '700' }
                                            ]}>
                                                {bar.label}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Spacer at bottom */}
                        <View style={{ height: 100 }} />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: HEADER_GREEN, // Top part is green
    },
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_GRAY, // Bottom part is light gray
    },
    scrollContent: {
        flexGrow: 1,
    },
    
    // Header
    headerContainer: {
        backgroundColor: HEADER_GREEN,
        width: '100%',
        paddingBottom: 30,
        position: 'relative',
        overflow: 'hidden',
    },
    // Decorative Circles
    circleTopRight: {
        position: 'absolute',
        top: -40,
        right: -30,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    circleBottomLeft: {
        position: 'absolute',
        bottom: -50,
        left: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    
    headerContent: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: Spacing.xl,
        zIndex: 2,
    },
    avatarWrapper: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
        ...Shadows.card3D, // Gives a nice pop
        borderBottomWidth: 0,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    avatarEmoji: {
        fontSize: 50,
    },
    nameText: {
        ...Typography.h1,
        color: Colors.white,
        marginBottom: 4,
    },
    leagueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    leagueText: {
        ...Typography.bodyBold,
        color: '#123A1E', // Dark green text from mock
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    tagPill: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.round,
    },
    tagText: {
        ...Typography.small,
        color: Colors.white,
        fontWeight: 'bold',
    },

    // Body
    bodyContainer: {
        backgroundColor: BACKGROUND_GRAY,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: Spacing.xl,
        paddingHorizontal: Spacing.xl,
        marginTop: -20, // Overlap the header slightly
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 16,
        marginBottom: Spacing.xl,
    },
    statCard: {
        width: (width - Spacing.xl * 2 - 16) / 3, // 3 columns
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card3D,
        borderBottomWidth: 3,
        borderColor: '#F0F0F0',
        elevation: 3,
    },
    statValue: {
        ...Typography.h2,
        marginBottom: 4,
        color: '#212121', // Dark black
    },
    statLabel: {
        ...Typography.small,
        fontSize: 10,
        color: '#8E9AAB',
        textTransform: 'uppercase',
    },

    // Card Section General
    cardSection: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        ...Shadows.card3D,
        borderColor: '#F0F0F0',
        borderBottomWidth: 3,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        ...Typography.h3,
        color: '#212121',
    },
    seeAllText: {
        ...Typography.bodyBold,
        fontSize: 14,
        color: Colors.orange,
    },

    // Badges
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        columnGap: 16,
        rowGap: 24,
    },
    badgeItem: {
        width: (width - Spacing.xl * 2 - Spacing.lg * 2 - 16 * 4) / 5, // Fit 5 per row dynamically
        alignItems: 'center',
        minWidth: 50,
    },
    badgeCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    badgeBorder: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    badgeLocked: {
        backgroundColor: '#F5F5F5',
        opacity: 0.5,
    },
    badgeIcon: {
        fontSize: 26,
    },
    lockedIcon: {
        opacity: 0.5,
    },
    badgeLabel: {
        ...Typography.small,
        fontSize: 10,
        color: '#8E9AAB',
        textAlign: 'center',
        lineHeight: 12,
    },
    lockedText: {
        opacity: 0.5,
    },

    // Progress Chart
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100, // Total height for bars + labels
    },
    barColumn: {
        alignItems: 'center',
        flex: 1,
    },
    barTrack: {
        height: 70, // Max height of the bar
        justifyContent: 'flex-end',
        width: '100%',
        alignItems: 'center',
        marginBottom: 8,
    },
    barFill: {
        width: '60%', // Relative to the column
        borderRadius: 4,
    },
    barLabel: {
        ...Typography.small,
        color: '#8E9AAB',
        fontSize: 11,
    },
});

export default ProfileScreen;
