// components/BottomNav.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, layout } from '../styles/tokens';

interface BottomNavProps {
  activeTab: 'home' | 'estoque' | 'movimentacao' | 'relatorio';
}

const tabs = [
  { key: 'home', label: 'Home', icon: '⌂', path: '/' as const },
  { key: 'estoque', label: 'Estoque', icon: '☰', path: '/estoque' as const },
  { key: 'movimentacao', label: 'Movimentação', icon: '⊕', path: '/movimentacao' as const },
  { key: 'relatorio', label: 'Relatórios', icon: '📊', path: '/relatorio' as const },
];

export function BottomNav({ activeTab }: BottomNavProps) {
  const handlePress = (path: string) => {
    router.replace(path as any);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => handlePress(tab.path)}
        >
          <Text style={[styles.icon, activeTab === tab.key && styles.activeIcon]}>
            {tab.icon}
          </Text>
          <Text style={[styles.label, activeTab === tab.key && styles.activeLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
      {/* Botão central de Movimentação */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => handlePress('/movimentacao')}
      >
        <Text style={styles.centerIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: layout.bottomNavHeight,
    backgroundColor: colors.bgNav,
    borderTopWidth: 0.5,
    borderTopColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {},
  icon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  activeIcon: {
    color: colors.accentBlue,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeLabel: {
    color: colors.accentBlue,
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
  },
  centerIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
});