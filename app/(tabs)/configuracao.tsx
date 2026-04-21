// app/(tabs)/configuracao.tsx
// 📍 DESTINO: app/(tabs)/configuracao.tsx
// ✅ CORREÇÃO: seção "Preferências" adicionada com toggles usando useSettings()

import React from 'react';
import {
  Alert, Linking, ScrollView, StyleSheet,
  Switch, Text, View, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext'; // ← ADICIONADO
import { toast } from '../../utils/toast';

const versaoApp = '1.0.0';

const C = {
  bg: '#0B1420', card: '#142035', border: 'rgba(255,255,255,0.07)',
  text: '#FFFFFF', textSec: 'rgba(255,255,255,0.5)', textHint: 'rgba(255,255,255,0.25)',
  accent: '#378ADD', danger: '#ef4444',
};

// Item de menu normal com seta
function MenuItem({ icon, iconColor = C.accent, label, value, onPress, danger = false, isFirst = false }: {
  icon: string; iconColor?: string; label: string; value?: string;
  onPress: () => void; danger?: boolean; isFirst?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, !isFirst && styles.menuItemBorder, pressed && styles.menuItemPressed]}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon as any} size={18} color={danger ? C.danger : iconColor} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: C.danger }]}>{label}</Text>
      <View style={styles.menuRight}>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}
        {!danger && <Ionicons name="chevron-forward" size={16} color={C.textHint} />}
      </View>
    </Pressable>
  );
}

// Item com toggle on/off — usa Switch do React Native
// value vem do SettingsContext, onToggle salva via updateSetting()
function ToggleItem({ icon, iconColor = C.accent, label, sublabel, value, onToggle, isFirst = false }: {
  icon: string; iconColor?: string; label: string; sublabel?: string;
  value: boolean; onToggle: (v: boolean) => void; isFirst?: boolean;
}) {
  return (
    <View style={[styles.menuItem, !isFirst && styles.menuItemBorder]}>
      <View style={[styles.menuIconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: C.accent + '80' }}
        thumbColor={value ? C.accent : '#888'}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function Configuracoes() {
  const { logout, user, enviarRedefinicaoSenha } = useAuth();
  const { settings, updateSetting } = useSettings(); // ← ADICIONADO

  const handleSair = () => {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          try { await logout(); }
          catch { toast.error('Não foi possível sair. Tente novamente.'); }
        },
      },
    ]);
  };

  const handleAlterarSenha = () => {
    const email = user?.email?.trim();
    if (!email) { toast.error('E-mail não encontrado.'); return; }
    Alert.alert('Redefinir senha', `Enviaremos um link para:\n${email}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Enviar',
        onPress: async () => {
          try {
            await enviarRedefinicaoSenha(email);
            toast.success('Verifique sua caixa de entrada.');
          } catch { toast.error('Não foi possível enviar.'); }
        },
      },
    ]);
  };

  const primeiroNome = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';
  const email = user?.email || '—';

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configurações</Text>
        </View>

        <Pressable style={styles.profileCard} onPress={() => Alert.alert('Sua conta', `Nome: ${primeiroNome}\nE-mail: ${email}`)}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{primeiroNome.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{primeiroNome}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textHint} />
        </Pressable>

        <Section title="Conta">
          <MenuItem icon="lock-closed-outline" label="Alterar senha" onPress={handleAlterarSenha} isFirst />
          <MenuItem icon="log-out-outline" iconColor={C.danger} label="Sair da conta" onPress={handleSair} danger />
        </Section>

        {/* Seção adicionada — conecta os toggles ao SettingsContext */}
        <Section title="Preferências">
          <ToggleItem
            icon="notifications-outline"
            label="Notificações"
            sublabel="Alertas de estoque baixo e validade"
            value={settings.notificacoes}
            onToggle={(v) => updateSetting('notificacoes', v)}
            isFirst
          />
          <ToggleItem
            icon="volume-medium-outline"
            label="Sons"
            sublabel="Sons ao registrar movimentações"
            value={settings.som}
            onToggle={(v) => updateSetting('som', v)}
          />
          <ToggleItem
            icon="phone-portrait-outline"
            label="Vibração"
            sublabel="Vibrar ao escanear código de barras"
            value={settings.vibracao}
            onToggle={(v) => updateSetting('vibracao', v)}
          />
        </Section>

        <Section title="Dados">
          <MenuItem icon="cloud-upload-outline" label="Importar produtos (CSV)" onPress={() => router.push('/importar' as any)} isFirst />
          <MenuItem icon="share-outline" label="Exportar relatório" onPress={() => router.push('/relatorio' as any)} />
        </Section>

        <Section title="Suporte">
          <MenuItem icon="help-circle-outline" label="Ajuda" onPress={() => Linking.openURL('https://meuestoqueapp.com/ajuda')} isFirst />
          <MenuItem icon="document-text-outline" label="Termos de uso" onPress={() => Linking.openURL('https://meuestoqueapp.com/termos')} />
        </Section>

        <Section title="Sobre">
          <MenuItem icon="information-circle-outline" label="Versão do app" value={versaoApp}
            onPress={() => Alert.alert('StockPro', `Versão ${versaoApp}`)} isFirst />
        </Section>

        <Text style={styles.footer}>StockPro v{versaoApp}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: C.bg },
  scrollContent:     { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 },
  header:            { marginBottom: 20 },
  headerTitle:       { fontSize: 26, fontWeight: '700', color: C.text },
  profileCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: C.border, gap: 14 },
  profileAvatar:     { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(55,138,221,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profileAvatarText: { fontSize: 22, fontWeight: '700', color: C.accent },
  profileInfo:       { flex: 1, minWidth: 0 },
  profileName:       { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 2 },
  profileEmail:      { fontSize: 13, color: C.textSec },
  section:           { marginBottom: 20 },
  sectionTitle:      { fontSize: 12, fontWeight: '600', color: C.textSec, letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  sectionCard:       { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  menuItem:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  menuItemBorder:    { borderTopWidth: 1, borderTopColor: C.border },
  menuItemPressed:   { backgroundColor: 'rgba(255,255,255,0.04)' },
  menuIconWrap:      { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuLabel:         { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
  menuSublabel:      { fontSize: 12, color: C.textSec, marginTop: 1 },
  menuRight:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue:         { fontSize: 14, color: C.textSec },
  footer:            { textAlign: 'center', fontSize: 12, color: C.textHint, marginTop: 8 },
});