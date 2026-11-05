import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { autoDetectBackend } from './src/utils/api';
import theme from './src/styles/theme';

/**
 * Vulnerable Bank Mobile App
 * 
 * This app is intentionally built with security vulnerabilities for educational purposes.
 * It demonstrates common security issues in mobile banking applications.
 */
const App = () => {
  // Find a reachable backend at startup so the phone/watch connect without the
  // user having to configure the URL by hand (see autoDetectBackend).
  useEffect(() => {
    autoDetectBackend();
  }, []);

  return (
    <AuthProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.COLORS.backgroundDark} 
      />
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;
