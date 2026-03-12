import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Modal } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    FadeInRight,
    FadeOutRight,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/theme';

// Tab icons mapping
const ICONS: Record<string, string> = {
    Home: '🏠',
    QA: '💬',
    Leaderboard: '🛡️',
    Profile: '👧'
};

const AnimatedTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [isFeaturesMenuOpen, setIsFeaturesMenuOpen] = useState(false);

    const tabs = state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = t(`tabs.${route.name}`, { defaultValue: route.name });

        const isFocused = state.index === index;

        const onPress = () => {
            const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
                // If they navigate away, close the menu
                setIsFeaturesMenuOpen(false);
                navigation.navigate(route.name);
            }
        };

        const icon = ICONS[route.name] || '📌';

        return (
            <TabItem
                key={route.key}
                isFocused={isFocused && !isFeaturesMenuOpen}
                icon={icon}
                label={label as string}
                onPress={onPress}
            />
        );
    });

    const featuresButton = (
        <TabItem
            key="features"
            isFocused={isFeaturesMenuOpen}
            icon="✨"
            label={t('tabs.Features', { defaultValue: 'Features' })}
            onPress={() => setIsFeaturesMenuOpen(!isFeaturesMenuOpen)}
        />
    );

    // Insert features button right in the middle (index 2 out of 4)
    tabs.splice(2, 0, featuresButton);

    return (
        <View style={[styles.containerWrapper, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
            <View style={styles.container}>
                {tabs}
            </View>

            <Modal visible={isFeaturesMenuOpen} transparent animationType="fade" onRequestClose={() => setIsFeaturesMenuOpen(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsFeaturesMenuOpen(false)}>

                    {/* The semi-circle background docked to the bottom */}
                    <Animated.View style={[styles.radialBgContainer]} />

                    <View style={[styles.radialMenuCenter, { bottom: 40 }]}>
                        {/* 🦉 Silent Library Button */}
                        <FeaturesMenuItem
                            icon="🦉"
                            label="Silent Library"
                            translateY={-120}
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

const FeaturesMenuItem = ({ icon, label, onPress, translateY = -100 }: any) => {
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
                <Text style={styles.featureIcon}>{icon}</Text>
            </TouchableOpacity>
            <View style={styles.featureLabelContainer}>
                <Text style={styles.featureLabel}>{label}</Text>
            </View>
        </Animated.View>
    );
};

// Enhanced Animated TabItem
const TabItem = ({ isFocused, icon, label, onPress }: any) => {
    const flexVal = useSharedValue(isFocused ? 1 : 0);

    React.useEffect(() => {
        flexVal.value = withTiming(isFocused ? 1 : 0, { duration: 300 });
    }, [isFocused]);

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            flex: 1 + flexVal.value, // expands from flex 1 to flex 2
            backgroundColor: isFocused ? Colors.primary : Colors.backgroundOffset,
        };
    });

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: 1 + (flexVal.value * 0.15) }], // scales icon slightly up when active
        };
    });

    return (
        <Animated.View style={[styles.tabItemWrapper, animatedContainerStyle]}>
            <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.8}
                onPress={onPress}
                style={styles.tabTouchable}
            >
                <Animated.Text style={[styles.icon, animatedIconStyle]}>
                    {icon}
                </Animated.Text>

                {isFocused && (
                    <Animated.Text
                        entering={FadeInRight.duration(300)}
                        exiting={FadeOutRight.duration(200)}
                        style={styles.label}
                        numberOfLines={1}
                    >
                        {label}
                    </Animated.Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    containerWrapper: {
        backgroundColor: 'transparent',
        paddingHorizontal: Spacing.xl,
        // Allows taps to pass through transparent padding
        pointerEvents: 'box-none',
        zIndex: 10,
    },
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.borderLight,
        borderBottomWidth: 4,
        borderBottomColor: Colors.borderMuted,
        borderRadius: BorderRadius.round,
        padding: 6,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    tabItemWrapper: {
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
    },
    tabTouchable: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8, // reduced slightly to fit 5 items
    },
    icon: {
        fontSize: 20,
    },
    label: {
        ...Typography.bodyBold,
        color: Colors.white,
        marginLeft: 4,
        fontSize: 12, // reduced slightly to fit 5 items
    },
    // Radial Menu Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        alignItems: 'center',
    },
    radialBgContainer: {
        position: 'absolute',
        bottom: "10%",
        width: 200,
        height: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderTopLeftRadius: 200,
        borderTopRightRadius: 200,
        borderWidth: 2,
        borderColor: Colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        alignItems: 'center',
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
        width: 40,
        height: 40,
        borderRadius: 30,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.secondary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 6,
    },
    featureIcon: {
        fontSize: 20,
    },
    featureLabelContainer: {
        marginTop: 6,
        backgroundColor: Colors.white,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.borderLight,
        borderBottomWidth: 3,
        borderBottomColor: Colors.borderMuted,
    },
    featureLabel: {
        ...Typography.bodyBold,
        fontSize: 10,
        color: Colors.textMain,
    }
});

export default AnimatedTabBar;
