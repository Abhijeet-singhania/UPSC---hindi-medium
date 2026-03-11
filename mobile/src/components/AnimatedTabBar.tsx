import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, AnimationConfig } from '../theme/theme';

const AnimatedIcon = Animated.createAnimatedComponent(Text);

const AnimatedTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom || 10 }]}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel !== undefined
                    ? options.tabBarLabel
                    : options.title !== undefined
                        ? options.title
                        : route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                let icon = '';
                if (route.name === 'Home') icon = '🏠';
                if (route.name === 'QA') icon = '💬';
                if (route.name === 'Leaderboard') icon = '🛡️';
                if (route.name === 'Profile') icon = '👧';

                return (
                    <TabItem
                        key={index}
                        isFocused={isFocused}
                        icon={icon}
                        onPress={onPress}
                    />
                );
            })}
        </View>
    );
};

// Extracted TabItem for individual animation state
const TabItem = ({ isFocused, icon, onPress }: any) => {
    // We bounce the icon when focused
    const scale = useSharedValue(isFocused ? 1.2 : 1);
    
    // React to focus changes
    React.useEffect(() => {
        scale.value = withSpring(isFocused ? 1.2 : 1, AnimationConfig.springBouncy);
    }, [isFocused]);

    const style = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: isFocused ? 1 : 0.5,
        };
    });

    return (
        <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={1}
            onPress={onPress}
            style={styles.tabItem}
        >
            <AnimatedIcon style={[styles.icon, style]}>
                {icon}
            </AnimatedIcon>
            {isFocused && <View style={styles.activeDot} />}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderTopWidth: 2,
        borderTopColor: Colors.borderLight,
        paddingTop: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
    },
    icon: {
        fontSize: 28, // Big juicy icons
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.secondary, // Blue dot for active state
        marginTop: 4,
    }
});

export default AnimatedTabBar;
