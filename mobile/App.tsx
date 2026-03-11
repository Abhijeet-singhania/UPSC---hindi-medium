import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from './src/context/UserContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <AppNavigator />
      </UserProvider>
    </SafeAreaProvider>
  );
};

export default App;
