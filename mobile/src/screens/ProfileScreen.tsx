import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/theme';
import DuolingoButton from '../components/DuolingoButton';

const ProfileScreen = ({ navigation }: any) => {
    const { t, i18n } = useTranslation();
    const { user, setUser } = useUser();
    const [name, setName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);

    // Mock Badges for visual layout using translations
    const BADGES = [
        { title: t('profile.badges.perfectWeek'), icon: '🔥', locked: false },
        { title: t('profile.badges.earlyBird'), icon: '🌅', locked: false },
        { title: t('profile.badges.scholar'), icon: '📖', locked: true },
        { title: t('profile.badges.streak30'), icon: '🗓️', locked: true },
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            if (user) {
                const updated = await api.updateUser(user.id, { name });
                setUser(updated as any);
                Alert.alert(t('profile.success'), t('profile.profileUpdated'));
            }
        } catch (error) {
            Alert.alert(t('profile.error'), t('profile.updateFailed'));
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        setUser(null);
    };

    const toggleLanguage = () => {
        const currentLang = i18n.language;
        const newLang = currentLang === 'hi' ? 'en' : 'hi';
        i18n.changeLanguage(newLang);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header: Avatar and Status */}
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarEmoji}>🧑‍🎓</Text>
                            <View style={[styles.levelBadge, { borderColor: Colors.secondaryShadow }]}>
                                <Text style={styles.levelBadgeText}>Lvl 5</Text>
                            </View>
                        </View>
                        <Text style={styles.nameHeader}>{user?.name || 'User'}</Text>
                        <Text style={styles.joinedText}>{t('profile.joined')}</Text>

                        {/* High level stats pills */}
                        <View style={styles.statsRow}>
                            <View style={styles.statPill}>
                                <Text style={styles.statIcon}>🔥</Text>
                                <Text style={styles.statText}>{t('profile.daysStreak', { count: 12 })}</Text>
                            </View>
                            <View style={styles.statPill}>
                                <Text style={styles.statIcon}>⚡</Text>
                                <Text style={styles.statText}>{user?.reputation} {t('leaderboard.xp')}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                    </View>

                    {/* Stats Box */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('profile.stats')}</Text>
                        <View style={styles.statsGrid}>
                            {[t('profile.totalAnswers'), t('profile.bestStreak'), t('profile.rank')].map((label, idx) => (
                                <View key={idx} style={styles.statBox}>
                                    <View style={styles.statBoxIconRow}>
                                        <Text style={styles.statBoxIcon}>{idx === 0 ? '📝' : idx === 1 ? '🔥' : '🛡️'}</Text>
                                    </View>
                                    <Text style={styles.statBoxValue}>{idx === 0 ? '45' : idx === 1 ? '15' : '124'}</Text>
                                    <Text style={styles.statBoxLabel}>{label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.divider} />

                    {/* Achievements */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('profile.achievements')}</Text>
                        <View style={styles.badgesWrapper}>
                            {BADGES.map((badge, idx) => (
                                <View key={idx} style={[styles.badgeItem, badge.locked && styles.badgeLocked]}>
                                    <View style={styles.badgeIconWrap}>
                                        <Text style={[styles.badgeIcon, badge.locked && { opacity: 0.3 }]}>{badge.icon}</Text>
                                    </View>
                                    <Text style={styles.badgeLabel} numberOfLines={2}>{badge.title}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.divider} />

                    {/* Settings Form */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('profile.accountSettings')}</Text>

                        <View style={styles.inputWrap}>
                            <Text style={styles.inputLabel}>{t('profile.name')}</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <DuolingoButton
                            title={saving ? t('profile.saving') : t('profile.save')}
                            color="primary"
                            onPress={handleSave}
                            disabled={saving}
                            style={{ marginTop: Spacing.xl, marginBottom: Spacing.xl }}
                        />

                        {/* Language Toggle */}
                        <DuolingoButton
                            title={i18n.language === 'hi' ? "Switch to English" : "हिंदी में स्विच करें"}
                            color="secondary"
                            onPress={toggleLanguage}
                            style={{ marginBottom: Spacing.xl }}
                        />

                        <DuolingoButton
                            title={t('profile.logout')}
                            color="gray"
                            onPress={handleLogout}
                        />
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Spacing.xl,
    },
    divider: {
        height: 2,
        backgroundColor: Colors.borderLight,
        marginVertical: Spacing.xxl,
        marginHorizontal: Spacing.xl,
    },

    // Header
    profileHeader: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.backgroundOffset,
        borderWidth: 4,
        borderColor: Colors.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
        position: 'relative',
    },
    avatarEmoji: {
        fontSize: 50,
    },
    levelBadge: {
        position: 'absolute',
        bottom: -10,
        backgroundColor: Colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: BorderRadius.round,
        borderWidth: 2,
        borderBottomWidth: 4, // 3D mini effect
    },
    levelBadgeText: {
        ...Typography.caption,
        color: Colors.white,
        fontWeight: '900',
    },
    nameHeader: {
        ...Typography.hero,
        marginBottom: 4,
    },
    joinedText: {
        ...Typography.caption,
        marginBottom: Spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.round,
        ...Shadows.card3D,
    },
    statIcon: {
        marginRight: 6,
        fontSize: 18,
    },
    statText: {
        ...Typography.bodyBold,
    },

    // Sections
    section: {
        paddingHorizontal: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.h2,
        marginBottom: Spacing.lg,
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statBox: {
        flex: 1,
        minWidth: '45%',
        padding: Spacing.lg,
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.borderLight,
        borderRadius: BorderRadius.xl,
        borderBottomWidth: 4, // 3D box
        borderBottomColor: Colors.borderMuted,
    },
    statBoxIconRow: {
        marginBottom: 8,
    },
    statBoxIcon: {
        fontSize: 24,
    },
    statBoxValue: {
        ...Typography.h2,
        fontVariant: ['tabular-nums'],
    },
    statBoxLabel: {
        ...Typography.small,
    },

    // Badges
    badgesWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    badgeItem: {
        width: '45%',
        alignItems: 'center',
    },
    badgeLocked: {
        opacity: 0.6,
    },
    badgeIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFC800', // Gold border for achievement
        marginBottom: 8,
    },
    badgeIcon: {
        fontSize: 40,
    },
    badgeLabel: {
        ...Typography.bodyBold,
        textAlign: 'center',
    },

    // Form
    inputWrap: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        ...Typography.caption,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.backgroundOffset,
        borderWidth: 2,
        borderColor: Colors.borderLight,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Typography.bodyBold,
    }
});

export default ProfileScreen;
