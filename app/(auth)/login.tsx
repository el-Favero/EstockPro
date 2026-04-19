// app/(auth)/login.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from '../../utils/toast';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const { colors } = useTheme();

  // Não redirecionar enquanto está carregando
  useEffect(() => {
    if (!authLoading && user) {
      try {
        router.replace('/(tabs)');
      } catch (e) {
        console.log("Erro router:", e);
      }
    }
  }, [user, authLoading]);

  // Mostrar tela de login enquanto auth está carregando
  if (authLoading) {
    const styles = createStyles(colors);
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors?.icon || '#378ADD'} />
        <Text style={styles.loadingText}>Verificando sessão...</Text>
      </View>
    );
  }

  const handleAuth = async () => {
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (!isLogin && password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        toast.success('Conta criada! Faça login.');
        setIsLogin(true);
      }
    } catch (error: any) {
      let mensagem = 'Erro ao autenticar';
      
      const code = error.code || error?.message || '';
      if (code.includes('user-not-found') || code.includes('auth/user-not-found')) {
        mensagem = 'Usuário não encontrado';
      } else if (code.includes('wrong-password') || code.includes('auth/wrong-password')) {
        mensagem = 'Senha incorreta';
      } else if (code.includes('email-already-in-use') || code.includes('auth/email-already-in-use')) {
        mensagem = 'Email já cadastrado';
      } else if (code.includes('invalid-email') || code.includes('auth/invalid-email')) {
        mensagem = 'Email inválido';
      } else if (code.includes('invalid-credential') || code.includes('auth/invalid-credential')) {
        mensagem = 'Email ou senha incorretos';
      } else if (code.includes('weak-password') || code.includes('auth/weak-password')) {
        mensagem = 'Senha muito fraca (mínimo 6 caracteres)';
      } else if (code.includes('too-many-requests')) {
        mensagem = 'Muitas tentativas. Aguarde alguns minutos';
      }
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Logo/Brand */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="cube" size={48} color={colors.icon} />
          </View>
          <Text style={styles.brandName}>StockPro</Text>
          <Text style={styles.brandTagline}>Controle de estoque simplificado</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
          </Text>
          <Text style={styles.formSubtitle}>
            {isLogin ? 'Entre com suas credenciais' : 'Preencha os dados para continuar'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color={colors.subtitle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={colors.subtitle}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.subtitle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.subtitle}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity 
                style={styles.eyeButton} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={18} 
                  color={colors.subtitle} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {isLogin && (
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isLogin ? 'Entrar' : 'Cadastrar'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setPassword('');
            }}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.versionText}>v1.0.0</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.subtitle,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.title,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 14,
    color: colors.subtitle,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
  },
  eyeButton: {
    padding: 14,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    color: colors.icon,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: colors.icon,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: colors.subtitle,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    color: colors.subtitle,
  },
});