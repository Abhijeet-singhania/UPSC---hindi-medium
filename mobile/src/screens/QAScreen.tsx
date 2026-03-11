import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { Question } from '../types';
import {
    Colors,
    Typography,
    Spacing,
    BorderRadius,
} from '../theme/theme';
import AnimatedCard from '../components/AnimatedCard';
import DuolingoButton from '../components/DuolingoButton';

const QAScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchQuestions = useCallback(async () => {
        try {
            const data = await api.getQuestions() as Question[];
            setQuestions(data);
        } catch (error) {
            console.error('Failed to fetch questions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchQuestions();
    };

    const renderQuestion = ({ item, index }: { item: Question; index: number }) => (
        <Animated.View entering={FadeInRight.delay(index * 60).springify().damping(15)}>
            <AnimatedCard
                style={styles.cardSpacing}
                onPress={() => navigation.navigate('QuestionDetail', { questionId: item.id })}
                // Add a thicker left border logic for "Solved"
                colorScheme={
                    item.is_solved
                        ? { border: Colors.primary, borderBottom: '#58A700', bg: '#F2FCE7' }
                        : { border: Colors.borderLight, borderBottom: Colors.borderMuted, bg: Colors.white }
                }
            >
                <View style={styles.questionHeader}>
                    <Text style={[styles.questionTitle, item.is_solved && { color: Colors.primary }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    {item.is_solved && (
                        <View style={styles.solvedBadge}>
                            <Text style={styles.solvedText}>✓</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.questionContent} numberOfLines={2}>
                    {item.content}
                </Text>

                <View style={styles.questionMeta}>
                    <View style={styles.tags}>
                        {item.tags.slice(0, 2).map(tag => (
                            <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.stats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>👍</Text>
                            <Text style={styles.statText}>{item.upvotes}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>💬</Text>
                            <Text style={styles.statText}>{item.answer_count}</Text>
                        </View>
                    </View>
                </View>
            </AnimatedCard>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.secondary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>चर्चा मंच</Text>
            </View>

            <FlatList
                data={questions}
                renderItem={renderQuestion}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.secondary}
                    />
                }
            />

            {/* Sticky Ask Button at the bottom */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
                <DuolingoButton
                    title="नया प्रश्न पूछें"
                    color="secondary"
                    icon={<Text style={{ fontSize: 18 }}>💬</Text>}
                    onPress={() => navigation.navigate('AskQuestion')}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundOffset, // Light gray so white cards pop
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.backgroundOffset,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        backgroundColor: Colors.white,
        borderBottomWidth: 2,
        borderBottomColor: Colors.borderLight,
        zIndex: 10,
    },
    headerTitle: {
        ...Typography.h1,
        color: Colors.textMain,
    },
    list: {
        padding: Spacing.lg,
        paddingBottom: 100, // Space for sticky bottom bar
    },
    cardSpacing: {
        marginBottom: 16,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    questionTitle: {
        flex: 1,
        ...Typography.bodyBold,
        marginRight: 8,
        lineHeight: 22,
    },
    solvedBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    solvedText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 14,
    },
    questionContent: {
        ...Typography.body,
        color: Colors.textMuted,
        lineHeight: 20,
        marginBottom: 12,
    },
    questionMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tags: {
        flexDirection: 'row',
        gap: 6,
        flex: 1,
        flexWrap: 'wrap',
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        backgroundColor: '#E5F6FF', // light blue
        borderWidth: 1,
        borderColor: '#B0E0FF',
    },
    tagText: {
        ...Typography.small,
        color: Colors.secondary,
        fontWeight: '700',
    },
    stats: {
        flexDirection: 'row',
        gap: 14,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statIcon: {
        fontSize: 16,
    },
    statText: {
        ...Typography.bodyBold,
        color: Colors.textMuted,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        backgroundColor: Colors.white,
        borderTopWidth: 2,
        borderTopColor: Colors.borderLight,
    }
});

export default QAScreen;
