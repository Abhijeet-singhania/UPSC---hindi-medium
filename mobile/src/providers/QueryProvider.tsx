import React, { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
            retry: (failureCount) => failureCount < 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 1500 * attemptIndex), // attempt * 1500ms approx, fallback standard
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
});

// Create the persister using AsyncStorage
const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
});

export const QueryProvider = ({ children }: { children: ReactNode }) => {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: asyncStoragePersister }}
        >
            {children}
        </PersistQueryClientProvider>
    );
};
