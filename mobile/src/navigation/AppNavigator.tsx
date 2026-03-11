import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import QAScreen from '../screens/QAScreen';
import SilentLibraryScreen from '../screens/SilentLibraryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DailyAnswerScreen from '../screens/DailyAnswerScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import SplashScreen from '../screens/SplashScreen';
import AnimatedTabBar from '../components/AnimatedTabBar';
import { Colors } from '../theme/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Switched to Light Theme for authentic Duolingo look
const LightTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: Colors.background, // Pure White
        card: Colors.white, // Tab bar background
        text: Colors.textMain, // Dark gray
        border: Colors.borderLight, // Light gray
    },
};

const TabNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <AnimatedTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ tabBarLabel: 'होम' }} // Changed from 'Home'
            />
            {/* QA not strictly needed, but kept as 'Feed' in this metaphor */}
            <Tab.Screen
                name="QA"
                component={QAScreen}
                options={{ tabBarLabel: 'प्रश्न' }}
            />
            <Tab.Screen
                name="Leaderboard"
                component={LeaderboardScreen}
                options={{ tabBarLabel: 'रैंकिंग' }} // Leaderboard / Leagues
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'प्रोफाइल' }}
            />
        </Tab.Navigator>
    );
};

// DailyAnswer and SilentLibrary pulled UP into the stack so they hide the tab bar (like starting a lesson)
const AppNavigator = () => {
    return (
        <NavigationContainer theme={LightTheme}>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_bottom', // Duolingo lessons typically slide up
                }}>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen name="DailyAnswer" component={DailyAnswerScreen} />
                <Stack.Screen name="SilentLibrary" component={SilentLibraryScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
