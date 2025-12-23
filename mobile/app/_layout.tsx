import React, { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, AppState, AppStateStatus } from 'react-native';
import { getAuthUser } from '../src/services/auth';
import { initializeSocket } from '../src/services/socket';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  const checkAuth = async () => {
    try {
      const user = await getAuthUser();
      const authenticated = !!user;
      setIsAuthenticated(authenticated);
      
      if (authenticated && user) {
        // Initialize socket connection
        await initializeSocket();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Check auth when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkAuth();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);


  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === '(auth)';
      
      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to login if not authenticated
        router.replace('/(auth)/login');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to home if authenticated
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, segments, isLoading, router]);

  // Re-check auth when navigating to tabs (in case login just happened)
  useEffect(() => {
    if (!isLoading && segments[0] === '(tabs)' && !isAuthenticated) {
      // Quick re-check - user might have just logged in
      getAuthUser().then(user => {
        if (user) {
          setIsAuthenticated(true);
          checkAuth();
        }
      });
    }
  }, [segments, isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f59e0b' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Routes are automatically discovered from (auth) and (tabs) folders */}
      {/* Only define custom screen options if needed */}
      {__DEV__ && (
        <Stack.Screen 
          name="(auth)/test-connection" 
          options={{ 
            headerShown: true, 
            title: 'Test Connection',
            presentation: 'modal',
          }} 
        />
      )}
    </Stack>
  );
}
