import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Inspired by Duolingo & Matiks: Highly vibrant, high-contrast, light-mode base
export const Colors = {
    // Backgrounds
    background: '#FFFFFF', // Clean white base
    backgroundOffset: '#F7F7F7', // Slightly gray for contrast areas
    
    // Brand / Primary Colors (Vibrant, saturated)
    primary: '#58CC02', // "Feather Green"
    primaryShadow: '#58A700', // 3D depth border for green
    
    secondary: '#1CB0F6', // "Feather Blue"
    secondaryShadow: '#1899D6',
    
    accent: '#CE82FF', // "Brain Purple"
    accentShadow: '#A568CC',
    
    coral: '#FF4B4B', // "Heart Red"
    coralShadow: '#CC3C3C',
    
    orange: '#FF9600', // "Fire Orange"
    orangeShadow: '#CC7800',

    gold: '#FFC800', // "Crown Gold"
    goldShadow: '#CC9900',

    // Text & Borders
    textMain: '#4B4B4B', // Dark charcoal/gray for main text (not pure black)
    textMuted: '#AFB2B8', // Muted text for placeholders
    borderLight: '#E5E5E5', // Light gray for flat borders
    borderMuted: '#D3D3D3', // Darker gray for 3D depth on white cards
    
    white: '#FFFFFF',
    transparent: 'transparent',
};

// Flat, bold gradients (used sparingly, Duolingo relies more on solid colors)
export const Gradients = {
    primary: [Colors.primary, '#46A302'] as [string, string],
    secondary: [Colors.secondary, Colors.secondaryShadow] as [string, string],
    accent: [Colors.accent, Colors.accentShadow] as [string, string],
    gold: [Colors.gold, Colors.goldShadow] as [string, string],
};

export const Typography = {
    hero: {
        fontSize: 32,
        fontWeight: '900' as const,
        color: Colors.textMain,
    },
    h1: {
        fontSize: 28,
        fontWeight: '800' as const,
        color: Colors.textMain,
    },
    h2: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: Colors.textMain,
    },
    h3: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.textMain,
    },
    bodyBold: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.textMain,
    },
    body: {
        fontSize: 16,
        fontWeight: '500' as const,
        color: Colors.textMain,
    },
    caption: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: Colors.textMuted,
    },
    small: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: Colors.textMuted,
    },
    // Chunky numbers for stats/streaks
    stat: {
        fontSize: 24,
        fontWeight: '800' as const,
        fontVariant: ['tabular-nums'] as any,
        color: Colors.textMain,
    }
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

// Super rounded corners are key to the cartoonish feel
export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
};

// Depth effects (No smooth shadows, hard bottom borders instead)
export const Shadows = {
    // Used for standard flat cards sitting on the background
    card3D: {
        borderWidth: 2,
        borderColor: Colors.borderLight,
        borderBottomWidth: 4,
        borderBottomColor: Colors.borderMuted,
    },
    // Used for active/selected states
    active3D: {
        borderWidth: 2,
        borderColor: Colors.secondary,
        backgroundColor: 'rgba(28, 176, 246, 0.1)',
        borderBottomWidth: 4,
        borderBottomColor: Colors.secondaryShadow,
    },
};

// Bouncing spring configurations for interactables
export const AnimationConfig = {
    springBouncy: {
        damping: 15,
        stiffness: 250,
        mass: 1,
    },
    springSnappy: {
        damping: 20,
        stiffness: 350,
        mass: 1,
    },
    // For popping in items
    popIn: {
        damping: 12,
        stiffness: 280,
    }
};

export const Layout = {
    window: {
        width,
        height,
    },
};
