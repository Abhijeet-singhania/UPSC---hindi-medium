import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Modal, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../theme/theme';
import { Home, MessageSquare, PenTool, BarChart2, User, BookOpen } from 'lucide-react-native';

const AnimatedTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [isFeaturesMenuOpen, setIsFeaturesMenuOpen] = useState(false);

    const tabs = state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        let label = t(`tabs.${route.name}`, { defaultValue: route.name });
        let IconComponent = Home;

        if (route.name === 'Home') {
            label = 'होम';
            IconComponent = Home;
        } else if (route.name === 'QA') {
            label = 'Q&A';
            IconComponent = MessageSquare;
        } else if (route.name === 'Leaderboard') {
            label = 'रैंकिंग';
            IconComponent = BarChart2;
        } else if (route.name === 'Profile') {
            label = 'प्रोफाइल';
            IconComponent = User;
        }

        const isFocused = state.index === index;

        const onPress = () => {
            const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
                setIsFeaturesMenuOpen(false);
                navigation.navigate(route.name);
            }
        };

        return (
            <TabItem
                key={route.key}
                isFocused={isFocused && !isFeaturesMenuOpen}
                IconComponent={IconComponent}
                label={label}
                onPress={onPress}
            />
        );
    });

    const featuresButton = (
        <View key="features" style={styles.centerButtonWrapper}>
            <TouchableOpacity
                style={styles.centerButton}
                activeOpacity={0.8}
                onPress={() => setIsFeaturesMenuOpen(!isFeaturesMenuOpen)}
            >
                <PenTool color={Colors.white} size={24} />
            </TouchableOpacity>
            <Text style={styles.centerLabel}>{t('tabs.Features', { defaultValue: 'Features' })}</Text>
        </View>
    );

    tabs.splice(2, 0, featuresButton);

    return (
        <View style={styles.containerWrapper}>
            <View style={[styles.container, { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
                {tabs}
            </View>

            <Modal visible={isFeaturesMenuOpen} transparent animationType="fade" onRequestClose={() => setIsFeaturesMenuOpen(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsFeaturesMenuOpen(false)}>
                    <Animated.View style={styles.radialBgContainer} />
                    <View style={[styles.radialMenuCenter, { bottom: insets.bottom + 80 }]}>
                        <FeaturesMenuItem
                            IconComponent={BookOpen}
                            label="Silent Library"
                            translateY={-90}
                            onPress={() => {
                                setIsFeaturesMenuOpen(false);
                                navigation.navigate('SilentLibrary');
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const FeaturesMenuItem = ({ IconComponent, label, onPress, translateY = -100 }: any) => {
    const progress = useSharedValue(0);

    React.useEffect(() => {
        progress.value = withTiming(1, { duration: 250 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY * progress.value },
                { scale: 0.5 + 0.5 * progress.value }
            ],
            opacity: progress.value,
        };
    });

    return (
        <Animated.View style={[styles.radialItem, animatedStyle]}>
            <TouchableOpacity
                style={styles.featureButtonCircle}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <IconComponent color={Colors.secondary} size={24} />
            </TouchableOpacity>
            <View style={styles.featureLabelContainer}>
                <Text style={styles.featureLabel}>{label}</Text>
            </View>
        </Animated.View>
    );
};

const TabItem = ({ isFocused, IconComponent, label, onPress }: any) => {
    const flexVal = useSharedValue(isFocused ? 1 : 0);

    React.useEffect(() => {
        flexVal.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    }, [isFocused]);

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: 1 + (flexVal.value * 0.2) }],
        };
    });

    return (
        <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={onPress}
            style={styles.tabTouchable}
        >
            <Animated.View style={[
                animatedIconStyle,
                { opacity: isFocused ? 1 : 0.4, marginBottom: 4 }
            ]}>
                <IconComponent
                    color={isFocused ? Colors.orange : '#A0AAB8'}
                    size={24}
                    strokeWidth={isFocused ? 2.5 : 2}
                />
            </Animated.View>
            <Text style={[
                styles.label,
                isFocused ? styles.labelActive : styles.labelInactive
            ]}>
                {label}
            </Text>
            {isFocused && (
                <View style={styles.activeIndicator} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    containerWrapper: {
        backgroundColor: 'transparent',
        paddingHorizontal: Spacing.lg,
        paddingBottom: 24, // Space below the pill
    },
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderRadius: 40, // High border radius for floating pill
        ...Shadows.card3D, 
        borderWidth: 1,
        borderColor: Colors.borderLight,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    tabTouchable: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        position: 'relative',
    },
    label: {
        ...Typography.small,
        fontSize: 10,
        marginBottom: 6,
    },
    labelActive: {
        color: Colors.orange,
        fontWeight: 'bold',
    },
    labelInactive: {
        color: '#A0AAB8',
        fontWeight: '600',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -2,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.orange,
    },

    // Middle Purple Button
    centerButtonWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 50,
        position: 'relative',
    },
    centerButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.accent, // Purple
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: -46, // Pop out above the tab bar
        borderWidth: 4,
        borderColor: '#E1BEE7', // Lighter purple rim to match the floating look
        elevation: 5,
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
    centerLabel: {
        ...Typography.small,
        fontSize: 10,
        color: Colors.accent,
        fontWeight: 'bold',
        marginBottom: 6, // Align with other tabs text
    },

    // Radial Menu
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Lighter overlay matching the design
        alignItems: 'center',
    },
    radialBgContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 120,
        backgroundColor: 'transparent',
    },
    radialMenuCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radialItem: {
        alignItems: 'center',
        position: 'absolute',
    },
    featureButtonCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    featureLabelContainer: {
        marginTop: 8,
        backgroundColor: Colors.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    featureLabel: {
        ...Typography.bodyBold,
        fontSize: 12,
        color: Colors.textMain,
    }
});

export default AnimatedTabBar;
