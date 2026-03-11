import React, { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { Colors, BorderRadius, AnimationConfig, Typography } from '../theme/theme';

interface DuolingoButtonProps {
    title: string;
    onPress: () => void;
    color?: 'primary' | 'secondary' | 'coral' | 'gold' | 'gray';
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    icon?: React.ReactNode;
}

const colorMap = {
    primary: { main: Colors.primary, shadow: '#58A700', text: '#FFFFFF' },
    secondary: { main: Colors.secondary, shadow: '#1899D6', text: '#FFFFFF' },
    coral: { main: Colors.coral, shadow: '#CC3C3C', text: '#FFFFFF' },
    gold: { main: Colors.gold, shadow: '#CC9900', text: '#FFFFFF' },
    gray: { main: '#E5E5E5', shadow: '#D3D3D3', text: '#AFB2B8' },
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const DuolingoButton: React.FC<DuolingoButtonProps> = ({
    title,
    onPress,
    color = 'primary',
    disabled = false,
    style,
    textStyle,
    icon
}) => {
    // Controls the "squash" depth. 
    // Button rests at Y=0. On press, it translates down by 4px (the border width).
    const translateY = useSharedValue(0);

    const theme = disabled ? colorMap.gray : colorMap[color];
    const BORDER_WIDTH = 4;

    const handlePressIn = useCallback(() => {
        if (!disabled) {
            translateY.value = withSpring(BORDER_WIDTH, AnimationConfig.springSnappy);
        }
    }, [disabled]);

    const handlePressOut = useCallback(() => {
        if (!disabled) {
            translateY.value = withSpring(0, AnimationConfig.springBouncy);
        }
    }, [disabled]);

    // The animated style applies to the whole button, pushing it down.
    // To maintain layout height without shifting neighbors, we wrap the animated part in a fixed-height container or rely on margins.
    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // The border is technically part of the button background, but when pressed, we reduce the apparent height 
    // to complete the illusion of depth.
    const innerStyle = useAnimatedStyle(() => ({
        borderBottomWidth: disabled ? BORDER_WIDTH : BORDER_WIDTH - translateY.value,
        marginTop: translateY.value,
    }));

    return (
        <View style={[styles.wrapper, style]}>
            <AnimatedTouchable
                activeOpacity={1}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                style={[
                    styles.buttonBase,
                    { backgroundColor: theme.main, borderColor: theme.shadow },
                    containerStyle
                ]}
            >
                {icon && <View style={styles.iconWrap}>{icon}</View>}
                <Text style={[styles.text, { color: theme.text }, textStyle]}>
                    {title}
                </Text>
            </AnimatedTouchable>
        </View>
    );
};

// We use a bottom margin trick. The Touchable has a thick bottom border.
// When translated down, it covers the original space.
const styles = StyleSheet.create({
    wrapper: {
        // paddingBottom gives physical space for the button to depress into
        paddingBottom: 4, 
    },
    buttonBase: {
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: BorderRadius.xl,
        borderBottomWidth: 4, // 3D depth border
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        ...Typography.bodyBold,
        letterSpacing: 0.5,
        textTransform: 'uppercase', // Duolingo style boldness
    },
    iconWrap: {
        marginRight: 8,
    }
});

export default DuolingoButton;
