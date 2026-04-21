
// ✅ CORREÇÃO: telas extras registradas com href: null para funcionar com router.push()

import { Tabs, router, usePathname } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

function TopBar({ initials, onAvatarPress }: { initials: string; onAvatarPress: () => void }) {
  return (
    <SafeAreaView edges={['top']} style={styles.topbar}>
      <View style={styles.topbarLeft}>
        <Ionicons name="cube-outline" size={22} color="#378ADD" />
        <View style={styles.topbarTitleContainer}>
          <Text style={styles.topbarTitle}>StockPro</Text>
        </View>
      </View>
      <Pressable
        onPress={onAvatarPress}
        style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
      >
        <View style={styles.avatarInner}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const NAV_ITEMS = [
  { route: '/',             label: 'Home',       iconName: 'home-outline'            as const, iconActive: 'home'            as const },
  { route: '/estoque',      label: 'Estoque',    iconName: 'cube-outline'            as const, iconActive: 'cube'            as const },
  { route: '/movimentacao', label: 'Movim.',     iconName: 'swap-horizontal-outline' as const, iconActive: 'swap-horizontal' as const },
  { route: '/relatorio',    label: 'Relatórios', iconName: 'bar-chart-outline'       as const, iconActive: 'bar-chart'       as const },
];

function BottomNav() {
  const pathname = usePathname();
  return (
    <SafeAreaView edges={ ['bottom']} style={styles.navSafe}>
      <View style={styles.navbar}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.route ||
            (item.route === '/' && pathname === '/index');
          return (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [styles.navTab, pressed && styles.navTabPressed]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isActive ? item.iconActive : item.iconName}
                  size={20}
                  color={isActive ? '#378ADD' : 'rgba(255,255,255,0.45)'}
                />
              </View>
              <View style={styles.labelContainer}>
                <Text style={[styles.label, isActive && styles.labelActive]}>
                  {item.label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  const { user } = useAuth();

  // Se não está logado, não mostra nada (o _layout raiz redireciona)
  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.displayName || user?.email || 'Usuário');
  const handleAvatarPress = () => router.push('/configuracao' as any);

  return (
    <View style={styles.root}>
      <TopBar initials={initials} onAvatarPress={handleAvatarPress} />
      <View style={styles.content}>
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
          {/* Telas com botão na BottomNav */}
          <Tabs.Screen name="index"        options={{ href: '/' }} />
          <Tabs.Screen name="estoque"      options={{ href: '/estoque' }} />
          <Tabs.Screen name="movimentacao" options={{ href: '/movimentacao' }} />
          <Tabs.Screen name="relatorio"    options={{ href: '/relatorio' }} />
          {/* Telas acessadas por router.push() mas sem botão na nav */}
          <Tabs.Screen name="configuracao"   options={{ href: null }} />
          <Tabs.Screen name="cadastro"       options={{ href: null }} />
          <Tabs.Screen name="editar-produto" options={{ href: null }} />
          <Tabs.Screen name="importar"       options={{ href: null }} />
        </Tabs>
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root:                 { flex: 1, backgroundColor: '#0B1420' },
  content:              { flex: 1 },
  topbar:               { height: 56, backgroundColor: '#0B1420', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, justifyContent: 'space-between' },
  topbarLeft:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topbarTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  topbarTitle:          { fontSize: 17, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.3 },
  avatar:               { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  avatarPressed:        { opacity: 0.8, transform: [{ scale: 0.95 }] },
  avatarInner:          { alignItems: 'center', justifyContent: 'center' },
  avatarText:           { color: '#5CA4F7', fontSize: 12, fontWeight: '600' },
  navSafe:              { backgroundColor: '#0D1929', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  navbar:               { height: 64, backgroundColor: '#0D1929', flexDirection: 'row', paddingTop: 8 },
  navTab:               { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 4 },
  navTabPressed:        { opacity: 0.6 },
  iconContainer:        { alignItems: 'center', justifyContent: 'center', height: 26 },
  labelContainer:       { alignItems: 'center', justifyContent: 'center', gap: 2 },
  label:                { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  labelActive:          { color: '#378ADD' },
  activeIndicator:      { width: 16, height: 3, backgroundColor: '#378ADD', borderRadius: 2, marginTop: 2 },
});