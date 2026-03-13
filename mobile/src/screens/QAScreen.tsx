import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/theme';

const BLUE_HEADER = '#1DA1F2'; // Vivid blue header

const TABS = ['सभी', 'GS-1', 'GS-2', 'GS-3', 'GS-4', 'CSAT'];

const MOCK_QUESTIONS = [
    {
        id: '1',
        initials: 'RK',
        name: 'Ramesh Kumar',
        time: '2 घंटे पहले • पटना',
        tag: 'राजव्यवस्था',
        tagColor: '#E1F5FE',
        tagTextColor: '#0288D1',
        avatarColor: '#FF9800',
        title: 'संसदीय विशेषाधिकार क्या है? इसे सामान्य नागरिकों के मौलिक अधिकारों से किस प्रकार अलग किया जाता है?',
        upvotes: 32,
        answers: 14,
    },
    {
        id: '2',
        initials: 'PS',
        name: 'Priya Singh',
        time: '5 घंटे पहले • लखनऊ',
        tag: 'इतिहास',
        tagColor: '#FFF3E0',
        tagTextColor: '#E65100',
        avatarColor: '#03A9F4',
        title: '1857 के विद्रोह के आर्थिक कारणों पर संक्षिप्त चर्चा करें। ब्रिटिश नीतियों ने इसे किस प्रकार प्रभावित किया?',
        upvotes: 58,
        answers: 27,
    },
    {
        id: '3',
        initials: 'AV',
        name: 'Ankit Verma',
        time: '1 दिन पहले • जयपुर',
        tag: 'भूगोल',
        tagColor: '#E8F5E9',
        tagTextColor: '#2E7D32',
        avatarColor: '#4CAF50',
        title: 'मानसून की उत्पत्ति और उसके भारतीय कृषि पर प्रभाव को विस्तारपूर्वक समझाइए।',
        upvotes: 91,
        answers: 43,
    },
];

const QAScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [selectedTab, setSelectedTab] = useState('सभी');

    const renderQuestion = ({ item }: { item: typeof MOCK_QUESTIONS[0] }) => (
        <View style={styles.card}>
            {/* Card Header (User Info + Tag) */}
            <View style={styles.cardHeader}>
                <View style={styles.userInfoRow}>
                    <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
                        <Text style={styles.avatarInitials}>{item.initials}</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.userTime}>{item.time}</Text>
                    </View>
                </View>
                <View style={[styles.tagPill, { backgroundColor: item.tagColor }]}>
                    <Text style={[styles.tagText, { color: item.tagTextColor }]}>{item.tag}</Text>
                </View>
            </View>

            {/* Question Title */}
            <Text style={styles.questionTitle}>
                {item.title}
            </Text>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionIcon}>👍</Text>
                    <Text style={[styles.actionText, { color: '#2E7D32' }]}>{item.upvotes}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={[styles.actionText, { color: '#0288D1' }]}>{item.answers} उत्तर</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionIcon}>🔖</Text>
                    <Text style={[styles.actionText, { color: '#E65100' }]}>सहेजें</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header Area */}
            <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
                <View style={styles.headerTextRow}>
                    <Text style={styles.headerTitle}>Q&A फ़ीड</Text>
                    <Text style={styles.headerTitleEmoji}> 💬</Text>
                </View>
                <Text style={styles.headerSubtitle}>समुदाय के प्रश्न और उत्तर</Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScrollContent}
                    style={styles.tabsScrollView}
                >
                    {TABS.map(tab => {
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
                </ScrollView>
            </View>

            {/* Main Content Area */}
            <FlatList
                data={MOCK_QUESTIONS}
                renderItem={renderQuestion}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <TouchableOpacity
                        style={styles.askButtonContainer}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('AskQuestion')}
                    >
                        <View style={styles.askButtonRow}>
                            <Text style={styles.askIcon}>✏️</Text>
                            <View style={styles.askTexts}>
                                <Text style={styles.askTitle}>नया प्रश्न पूछें</Text>
                                <Text style={styles.askSubtitle}>समुदाय से जुड़ें • +10 XP मिलेगा</Text>
                            </View>
                            <Text style={styles.askArrow}>→</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },

    // Header Styles
    headerContainer: {
        backgroundColor: BLUE_HEADER,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    headerTextRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        ...Typography.hero,
        color: Colors.white,
        marginBottom: 2,
    },
    headerTitleEmoji: {
        fontSize: 28,
        marginLeft: 4,
    },
    headerSubtitle: {
        ...Typography.body,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: Spacing.xl,
    },

    // Horizontal Tabs
    tabsScrollView: {
        marginHorizontal: -Spacing.xl, // Allow ScrollView to go edge to edge but maintain padding
    },
    tabsScrollContent: {
        paddingHorizontal: Spacing.xl,
        gap: 8,
        paddingBottom: 4,
    },
    tabButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
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
        color: BLUE_HEADER,
    },

    // List Styles
    listContent: {
        padding: Spacing.xl,
        paddingBottom: 100, // Space for the bottom tab bar
    },

    // Ask Button Banner
    askButtonContainer: {
        backgroundColor: BLUE_HEADER,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        ...Shadows.card3D,
        borderColor: '#1988cc',
        borderBottomWidth: 4,
        elevation: 4,
    },
    askButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    askIcon: {
        fontSize: 32,
        marginRight: 12,
        transform: [{ rotate: '-45deg' }], // Match the tipped pencil look
    },
    askTexts: {
        flex: 1,
    },
    askTitle: {
        ...Typography.h3,
        color: Colors.white,
        marginBottom: 2,
    },
    askSubtitle: {
        ...Typography.small,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: 'bold',
    },
    askArrow: {
        color: Colors.white,
        fontSize: 24,
    },

    // Cards
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.card3D,
        borderColor: '#F0F0F0',
        borderBottomWidth: 3,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarInitials: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    userName: {
        ...Typography.bodyBold,
        color: '#212121',
        fontSize: 15,
    },
    userTime: {
        ...Typography.small,
        color: '#8E9AAB',
        fontSize: 11,
    },
    tagPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.round,
        marginLeft: 8,
    },
    tagText: {
        ...Typography.small,
        fontWeight: 'bold',
        fontSize: 11,
    },
    questionTitle: {
        ...Typography.bodyBold,
        color: '#212121',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: Spacing.lg,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: BorderRadius.round,
        gap: 6,
    },
    actionIcon: {
        fontSize: 16,
    },
    actionText: {
        ...Typography.bodyBold,
        fontSize: 13,
    },
});

export default QAScreen;
