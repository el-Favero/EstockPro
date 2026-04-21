// app/_layout.tsx
// 📍 DESTINO: app/_layout.tsx (fora de (tabs)!)
// ✅ CORREÇÃO: EstoqueProvider adicionado — estava faltando e causava crash em todas as telas.

import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth, AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { SettingsProvider } from '../context/SettingsContext';
import { EstoqueProvider } from '../context/estoqueStorage'; // ← LINHA ADICIONADA
import { NetworkStatusListener } from '../components/NetworkStatusListener';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';

// Decide qual stack mostrar. Precisa estar dentro do AuthProvider.
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Só decide após o Firebase terminar de checar a sessão (loading=false)
  useEffect(() => {
    if (!loading) {
      setShowLogin(!user);
    }
  }, [loading, user]);

  // Spinner enquanto Firebase verifica sessão salva no dispositivo
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
        // Não logado → abre app/(auth)/
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : (
        <>
          {/* Logado → abre app/(tabs)/ */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Scanner abre como modal por cima das tabs */}
          <Stack.Screen
            name="escanear"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
        </>
      )}
    </Stack>
  );
}

// Providers de fora pra dentro — o mais externo fica disponível para todos os internos
export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <EstoqueProvider>       {/* ← ADICIONADO */}
            <RootLayoutNav />
            <NetworkStatusListener />
            <Toast />
          </EstoqueProvider>      {/* ← ADICIONADO */}
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