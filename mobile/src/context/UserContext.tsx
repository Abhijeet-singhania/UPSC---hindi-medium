import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { User } from '../types';

interface UserContextType {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    initUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEVICE_ID_KEY = '@device_id';

// Generate a simple unique ID
const generateDeviceId = (): string => {
    return 'device_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const initUser = async () => {
        try {
            let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

            if (!deviceId) {
                deviceId = generateDeviceId();
                await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
            }

            const userData = await api.createOrGetUser(deviceId);
            setUser(userData as User);
        } catch (error) {
            console.error('Failed to init user:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, setUser, initUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
