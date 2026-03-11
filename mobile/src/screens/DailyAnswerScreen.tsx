import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    FadeInUp,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Shadows, BorderRadius, AnimationConfig } from '../theme/theme';
import DuolingoButton from '../components/DuolingoButton';
import XPProgressBar from '../components/XPProgressBar'; // Re-use the XP bar for lesson progress
import api from '../services/api';
import { useUser } from '../context/UserContext';

const DailyAnswerScreen = ({ navigation }: any) => {
    const { user } = useUser();
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    // UI states: 'writing' -> 'submitted_feedback' -> 'peer_review'
    const [lessonState, setLessonState] = useState<'writing' | 'submitted_feedback' | 'peer_review'>('writing');
    
    // Peer Review States
    const [peerRating, setPeerRating] = useState<number | null>(null);
    const [isHighlighted, setIsHighlighted] = useState(false);

    // Bottom modal pop-up animation
    const feedbackTranslateY = useSharedValue(200);

    const handleCheck = async () => {
        if (!answer.trim()) return;

        setSubmitting(true);
        // Simulate network / AI grading delay
        setTimeout(() => {
            setSubmitting(false);
            
            // Simple validation
            const passed = answer.trim().length > 20;
            if (passed) {
                setLessonState('submitted_feedback');
                feedbackTranslateY.value = withSpring(0, AnimationConfig.springSnappy);
            } else {
                Alert.alert("कृपया थोड़ा और विस्तार से लिखें।");
            }
        }, 1200);
    };

    const handleContinueToReview = () => {
        // Hide feedback modal
        feedbackTranslateY.value = withTiming(200, { duration: 300 });
        setTimeout(() => {
            setLessonState('peer_review');
        }, 300);
    };

    const handleFinishReview = () => {
        Alert.alert("धन्यवाद!", "आपका पीयर रिव्यू दर्ज कर लिया गया है।");
        navigation.goBack();
    };

    const feedbackStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: feedbackTranslateY.value }],
    }));

    // Header close / skip
    const handleQuit = () => {
        Alert.alert(
            "क्या आप वाक़ई छोड़ना चाहते हैं?",
            "आपकी प्रगति खो जाएगी।",
            [
                { text: "जारी रखें", style: "cancel" },
                { text: "छोड़ें", style: "destructive", onPress: () => navigation.goBack() }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Bar (Progress) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleQuit} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>✖</Text>
                </TouchableOpacity>
                <View style={styles.progressWrap}>
                    <XPProgressBar 
                        progress={lessonState === 'writing' ? 0.33 : lessonState === 'submitted_feedback' ? 0.66 : 1.0} 
                        color={lessonState === 'peer_review' ? Colors.gold : Colors.primary} 
                        height={16} 
                    />
                </View>
                <View style={styles.heartsWrap}>
                    <Text style={styles.heartEmoji}>❤️</Text>
                    <Text style={styles.heartText}>5</Text>
                </View>
            </View>

            <KeyboardAvoidingView 
                style={styles.flex} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Lesson Content Area */}
                <View style={styles.content}>
                    <Animated.Text entering={FadeInUp.delay(200)} style={styles.taskTitle}>
                        {lessonState === 'peer_review' ? "पीयर रिव्यू" : "दैनिक उत्तर लिखें"}
                    </Animated.Text>

                    {/* Question Bubble */}
                    <Animated.View entering={FadeInUp.delay(400)} style={styles.questionBubble}>
                        <Text style={styles.questionBubbleText}>
                            "भारतीय स्वतंत्रता संग्राम में महात्मा गांधी के योगदान का आलोचनात्मक मूल्यांकन करें।"
                        </Text>
                        <View style={styles.triangle} />
                    </Animated.View>

                    {/* Character Avatar */}
                    {lessonState !== 'peer_review' && (
                        <Animated.View entering={FadeInUp.delay(500)} style={styles.avatarSlot}>
                            <Text style={styles.avatarEmoji}>🐻</Text>
                        </Animated.View>
                    )}

                    {/* Dynamic Work Area */}
                    {lessonState === 'peer_review' ? (
                        <Animated.View entering={FadeInUp.delay(300)} style={{ flex: 1 }}>
                            <Text style={styles.reviewInstruct}>अन्य छात्र का उत्तर पढ़ें और समीक्षा करें:</Text>
                            
                            {/* Interactive Mock Canvas Box */}
                            <TouchableOpacity 
                                activeOpacity={0.9} 
                                onPress={() => setIsHighlighted(!isHighlighted)}
                                style={[styles.peerAnswerBox, isHighlighted && styles.peerAnswerBoxHighlighted]}
                            >
                                <Text style={styles.peerText}>
                                    "महात्मा गांधी ने स्वतंत्रता संग्राम को जन आंदोलन बना दिया। उनके अहिंसा और सत्याग्रह के सिद्धांत..."
                                </Text>
                                {isHighlighted && (
                                    <View style={styles.highlightTag}>
                                        <Text style={styles.highlightTagText}>उत्कृष्ट बिंदु</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* 3D Rating Sliders / Buttons */}
                            <View style={styles.ratingBox}>
                                <Text style={styles.ratingTitle}>इस उत्तर को रेट करें</Text>
                                <View style={styles.ratingRow}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity 
                                            key={star} 
                                            activeOpacity={0.7}
                                            onPress={() => setPeerRating(star)}
                                            style={[
                                                styles.starBtn, 
                                                peerRating === star ? styles.starBtnActive : null,
                                                peerRating && peerRating > star ? styles.starBtnPast : null
                                            ]}
                                        >
                                            <Text style={styles.starEmoji}>⭐</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </Animated.View>
                    ) : (
                        <Animated.View entering={FadeInUp.delay(600)} style={styles.answerContainer}>
                            <TextInput
                                style={styles.textInput}
                                multiline
                                placeholder="अपना उत्तर यहाँ टाइप करें..."
                                placeholderTextColor={Colors.textMuted}
                                value={answer}
                                onChangeText={setAnswer}
                                editable={lessonState === 'writing'}
                                autoFocus
                            />
                        </Animated.View>
                    )}
                </View>

                {/* Bottom Bar (Check / Feedback) */}
                <View style={styles.bottomArea}>
                    {/* The action button wrapper */}
                    <View style={styles.stickBottomButton}>
                        {lessonState === 'writing' && (
                            <DuolingoButton
                                title={submitting ? "प्रोसेसिंग..." : "चेक करें"}
                                color={answer.trim() ? "primary" : "gray"}
                                onPress={handleCheck}
                                disabled={!answer.trim() || submitting}
                            />
                        )}
                        {lessonState === 'peer_review' && (
                            <DuolingoButton
                                title="समीक्षा सबमिट करें"
                                color={peerRating ? "primary" : "gray"}
                                onPress={handleFinishReview}
                                disabled={!peerRating}
                            />
                        )}
                    </View>

                    {/* Feedback Popup (Overlaying bottom area) */}
                    <Animated.View 
                        style={[
                            styles.feedbackModal, 
                            styles.correctModal,
                            feedbackStyle
                        ]}
                    >
                        <View style={styles.feedbackHeader}>
                            <View style={styles.feedbackIconWrap}>
                                <Text style={styles.feedbackIcon}>✔️</Text>
                            </View>
                            <Text style={[styles.feedbackTitle, { color: '#58A700' }]}>
                                लाजवाब! शानदार उत्तर।
                            </Text>
                        </View>
                        
                        <DuolingoButton
                            title="पीयर रिव्यू करें"
                            color="primary"
                            onPress={handleContinueToReview}
                        />
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    flex: {
        flex: 1,
    },
    
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
    },
    closeBtn: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: 20,
        color: Colors.textMuted,
        fontWeight: 'bold',
    },
    progressWrap: {
        flex: 1,
        marginHorizontal: Spacing.lg,
    },
    heartsWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    heartEmoji: {
        fontSize: 20,
    },
    heartText: {
        ...Typography.bodyBold,
        color: Colors.coral,
    },

    // Content
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
    },
    taskTitle: {
        ...Typography.h1,
        marginBottom: Spacing.xl,
    },
    questionBubble: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.card3D,
        marginBottom: 8,
        position: 'relative',
    },
    questionBubbleText: {
        ...Typography.bodyBold,
        fontSize: 18,
        lineHeight: 26,
    },
    triangle: {
        position: 'absolute',
        bottom: -10,
        left: 30,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: Colors.borderLight, // matches border
    },
    avatarSlot: {
        width: 60,
        height: 60,
        marginLeft: 20,
        marginBottom: Spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarEmoji: {
        fontSize: 48,
    },

    // Answer Input
    answerContainer: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        backgroundColor: '#F7F7F7',
        ...Shadows.card3D,
        marginBottom: Spacing.xl,
    },
    textInput: {
        ...Typography.body,
        padding: Spacing.lg,
        height: '100%',
        textAlignVertical: 'top',
    },

    // Peer Review Feature Styles
    reviewInstruct: {
        ...Typography.bodyBold,
        marginBottom: 12,
        color: Colors.textMuted,
    },
    peerAnswerBox: {
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.borderLight,
        borderBottomWidth: 6,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        minHeight: 150,
        marginBottom: Spacing.xxl,
        position: 'relative',
    },
    peerAnswerBoxHighlighted: {
        borderColor: Colors.secondary,
        borderBottomColor: Colors.secondaryShadow,
        backgroundColor: 'rgba(28, 176, 246, 0.05)',
    },
    peerText: {
        ...Typography.body,
        fontSize: 16,
        lineHeight: 24,
    },
    highlightTag: {
        position: 'absolute',
        top: -12,
        right: 12,
        backgroundColor: Colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: BorderRadius.round,
        borderWidth: 2,
        borderColor: 'white',
    },
    highlightTagText: {
        ...Typography.caption,
        color: Colors.white,
        fontWeight: '900',
    },
    ratingBox: {
        alignItems: 'center',
    },
    ratingTitle: {
        ...Typography.bodyBold,
        marginBottom: 16,
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 12,
    },
    starBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.white,
        borderBottomWidth: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    starBtnActive: {
        backgroundColor: '#FFEC99',
        borderColor: Colors.gold,
        borderBottomColor: Colors.goldShadow,
        borderBottomWidth: 2, // Pressed state
        transform: [{ translateY: 4 }]
    },
    starBtnPast: {
        backgroundColor: '#FFF4C2',
        borderColor: Colors.gold,
        borderBottomColor: Colors.goldShadow,
    },
    starEmoji: {
        fontSize: 24,
    },

    // Bottom Area
    bottomArea: {
        minHeight: 100,
        justifyContent: 'center',
        borderTopWidth: 2,
        borderTopColor: Colors.borderLight,
    },
    stickBottomButton: {
        padding: Spacing.xl,
    },

    // Feedback Modal Overlay
    feedbackModal: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.xl,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 180,
        justifyContent: 'space-between',
        zIndex: 50,
    },
    correctModal: {
        backgroundColor: '#D7FFB8', // Light vibrant green bg
    },
    incorrectModal: {
        backgroundColor: '#FFD3D3', // Light pink/red bg
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: Spacing.xl,
    },
    feedbackIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedbackIcon: {
        fontSize: 16,
    },
    feedbackTitle: {
        ...Typography.h2,
    }
});

export default DailyAnswerScreen;
