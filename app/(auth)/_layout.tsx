// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { ThemeProvider, useTheme as useThemeContext } from '../../context/ThemeContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';

function AuthContent() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function AuthLayout() {
  return (
    <ThemeProvider>
      <AuthContent />
    </ThemeProvider>
  );
}