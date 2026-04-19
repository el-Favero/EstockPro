// app/_layout.tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth, AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { SettingsProvider } from '../context/SettingsContext';
import { NetworkStatusListener } from '../components/NetworkStatusListener';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Mostrar login apenas quando loading terminar E não houver usuário
  useEffect(() => {
    if (!loading) {
      setShowLogin(!user);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#378ADD" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {showLogin ? (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="escanear"
            options={{ presentation: 'fullScreenModal', headerShown: false, animation: 'slide_from_bottom' }}
          />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <RootLayoutNav />
          <NetworkStatusListener />
          <Toast />
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1420',
  },
  loadingText: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
});