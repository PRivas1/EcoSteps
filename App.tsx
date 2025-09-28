import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { store, RootState, AppDispatch } from './src/store';
import { useAuth } from './src/hooks/useAuth';
import { setLocationEnabled } from './src/store/slices/locationSlice';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import LocationService from './src/services/locationService';
import LocalStorageService from './src/services/localStorageService';
import SyncService from './src/services/syncService';
import { ThemeProvider } from './src/contexts/ThemeContext';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
);

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  
  // Use our custom auth hook to handle Firebase authentication
  useAuth();

  // Initialize app services
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize services
        const locationService = LocationService.getInstance();
        const localStorageService = LocalStorageService.getInstance();
        const syncService = SyncService.getInstance();

        // Check location permissions silently
        const hasLocationPermission = await locationService.checkPermissions();
        dispatch(setLocationEnabled(hasLocationPermission));
        
        // Save permission state
        await localStorageService.savePermissionState(hasLocationPermission);

        // Initialize background sync if user is authenticated
        if (isAuthenticated) {
          syncService.initializeBackgroundSync();
        }

        console.log('App initialization completed');
        console.log('Location permission:', hasLocationPermission ? 'granted' : 'not granted');
        
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      const syncService = SyncService.getInstance();
      syncService.cleanup();
    };
  }, [dispatch, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <ThemeProvider>
          <StatusBar style="auto" />
          <AppContent />
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});
