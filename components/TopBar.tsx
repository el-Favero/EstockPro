// components/TopBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, layout } from '../styles/tokens';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = 'StockPro' }: TopBarProps) {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.displayName || user?.email || 'Usuário');

  const handleMenuPress = () => {
    Alert.alert(
      'StockPro',
      'Escolha uma opção',
      [
        { text: 'Perfil', onPress: () => {} },
        { text: 'Configurações', onPress: () => {} },
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={handleMenuPress} style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: layout.topbarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.bgBase,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderSubtle,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});