import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from './src/context/UserContext';
import AppNavigator from './src/navigation/AppNavigator';
import { QueryProvider } from './src/providers/QueryProvider';

const App = () => {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <UserProvider>
          <AppNavigator />
        </UserProvider>
      </SafeAreaProvider>
    </QueryProvider>
  );
};

export default App;
