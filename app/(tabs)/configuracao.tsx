// app/(tabs)/configuracao.tsx
import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { toast } from '../../utils/toast';
import { HELP_URL, TERMS_URL } from '../../constants/appLinks';

export default function Configuracoes() {
  const { logout, user, enviarRedefinicaoSenha } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const { settings, updateSetting } = useSettings();
  const styles = createStyles(colors);

  const versaoApp = '1.0.0';

  const handleVoltar = () => {
    router.back();
  };

  const handleSair = () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            toast.success('Você saiu da conta');
          } catch {
            toast.error('Não foi possível sair');
          }
        },
      },
    ]);
  };

  const abrirUrl = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) {
        await Linking.openURL(url);
      } else {
        toast.error('Não foi possível abrir o link.');
      }
    } catch {
      toast.error('Não foi possível abrir o link.');
    }
  };

  const handlePerfil = () => {
    const nome = user?.displayName?.trim() || 'Não informado';
    const email = user?.email || '—';
    const provedores =
      user?.providerData
        ?.map((p) =>
          p.providerId === 'password'
            ? 'E-mail e senha'
            : p.providerId === 'google.com'
              ? 'Google'
              : p.providerId
        )
        .filter(Boolean)
        .join(', ') || '—';

    Alert.alert('Sua conta', `Nome: ${nome}\nE-mail: ${email}\n\nLogin: ${provedores}`);
  };

  const handleAlterarSenha = () => {
    const email = user?.email?.trim();
    if (!email) {
      toast.error('Não foi possível identificar seu e-mail.');
      return;
    }

    Alert.alert(
      'Redefinir senha',
      `Enviaremos um link de redefinição para:\n${email}\n\n(Se você usa só o Google, o link pode servir para criar uma senha no app.)`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar e-mail',
          onPress: async () => {
            try {
              await enviarRedefinicaoSenha(email);
              toast.success('Verifique sua caixa de entrada.');
            } catch {
              toast.error('Não foi possível enviar o e-mail.');
            }
          },
        },
      ]
    );
  };

  const handleExportarDados = () => {
    Alert.alert(
      'Exportar dados',
      'Seus dados ficam salvos na nuvem (Firebase).\n\n📤 Para exportar:\n• Vá na aba Relatórios\n• Gere o PDF ou compartilhe os dados\n\n⚠️ Exportação completa (JSON/CSV) em desenvolvimento.'
    );
  };

  const handleImportarDados = () => {
    Alert.alert(
      'Importar dados',
      '📥 Esta funcionalidade está em desenvolvimento.\n\nPlanejado para futuras versões:\n• Importar planilha (Excel/CSV)\n• Restaurar backup\n\nPor agora, cadastre os produtos manualmente.'
    );
  };

  const handleAjuda = () => {
    void abrirUrl(HELP_URL);
  };

  const handleTermos = () => {
    void abrirUrl(TERMS_URL);
  };

  const handleVersao = () => {
    Alert.alert('MeuEstoque', `Versão ${versaoApp}\n\nApp de controle de estoque.`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable onPress={handleVoltar} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.icon} />
            </Pressable>
          </View>
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.subtitle}>Personalize sua experiência</Text>
        </View>

        {/* Conta */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={colors.icon} />
            <Text style={styles.sectionTitle}>Conta</Text>
          </View>

          <TouchableOpacity style={styles.item} onPress={handlePerfil}>
            <View style={styles.itemLeft}>
              <Ionicons name="person-circle-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Perfil</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={handleAlterarSenha}>
            <View style={styles.itemLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Alterar senha</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.item, styles.logoutItem]} onPress={handleSair}>
            <View style={styles.itemLeft}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={[styles.itemText, styles.logoutText]}>Sair da conta</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Preferências */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color={colors.icon} />
            <Text style={styles.sectionTitle}>Aparência</Text>
          </View>

          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Ionicons name="moon-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Tema escuro</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: colors.icon }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notificações */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color={colors.icon} />
            <Text style={styles.sectionTitle}>Notificações</Text>
          </View>

          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Alertas de estoque</Text>
            </View>
            <Switch
              value={settings.notificacoes}
              onValueChange={(value) => updateSetting('notificacoes', value)}
              trackColor={{ false: '#cbd5e1', true: colors.icon }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Ionicons name="volume-medium-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Som</Text>
            </View>
            <Switch
              value={settings.som}
              onValueChange={(value) => updateSetting('som', value)}
              trackColor={{ false: '#cbd5e1', true: colors.icon }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.item, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Vibração</Text>
            </View>
            <Switch
              value={settings.vibracao}
              onValueChange={(value) => updateSetting('vibracao', value)}
              trackColor={{ false: '#cbd5e1', true: colors.icon }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Dados */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server-outline" size={20} color={colors.icon} />
            <Text style={styles.sectionTitle}>Dados</Text>
          </View>

          <TouchableOpacity style={styles.item} onPress={handleExportarDados}>
            <View style={styles.itemLeft}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Exportar dados</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={handleImportarDados}>
            <View style={styles.itemLeft}>
              <Ionicons name="cloud-download-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Importar dados</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <View style={[styles.item, { borderBottomWidth: 0 }]}>
            <View style={styles.itemLeft}>
              <Ionicons name="cloud-done-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Backup automático</Text>
            </View>
            <Switch
              value={settings.backupAutomatico}
              onValueChange={(value) => updateSetting('backupAutomatico', value)}
              trackColor={{ false: '#cbd5e1', true: colors.icon }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Sobre */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.icon} />
            <Text style={styles.sectionTitle}>Sobre</Text>
          </View>

          <TouchableOpacity style={styles.item} onPress={handleVersao}>
            <View style={styles.itemLeft}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Versão</Text>
            </View>
            <Text style={styles.itemValue}>{versaoApp}</Text>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={handleAjuda}>
            <View style={styles.itemLeft}>
              <Ionicons name="help-circle-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Ajuda</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.item, { borderBottomWidth: 0 }]} onPress={handleTermos}>
            <View style={styles.itemLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.icon} />
              <Text style={styles.itemText}>Termos de uso</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versaoText}>Versão {versaoApp}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
    },
    header: {
      marginBottom: 20,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      marginBottom: 8,
    },
    backButton: {
      padding: 4,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.title,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: 'center',
      marginTop: 4,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.title,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    itemText: {
      fontSize: 15,
      color: colors.text,
    },
    itemValue: {
      fontSize: 14,
      color: colors.subtitle,
      marginRight: 8,
    },
    itemArrow: {
      fontSize: 16,
      color: colors.subtitle,
    },
    logoutItem: {
      borderBottomWidth: 0,
    },
    logoutText: {
      color: '#ef4444',
    },
    footer: {
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 20,
    },
    versaoText: {
      fontSize: 13,
      color: colors.subtitle,
    },
  });
}