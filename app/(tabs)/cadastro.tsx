// app/(tabs)/cadastro.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEstoque } from "../../context/estoqueStorage";
import { useTheme } from "../../context/ThemeContext";
import { formatarDataInput } from "../../utils/validadeUtils";
import { toast } from "../../utils/toast";

type Step = 1 | 2 | 3;

interface FormData {
  nome: string;
  categoria: string;
  codigoBarras: string;
  validade: string;
  quantidadeUnidades: string;
  quantidadeKg: string;
  descricao: string;
}

export default function CadastroProduto() {
  const { colors } = useTheme();
  const { cadastrarProdutoComLote } = useEstoque();

  const [step, setStep] = useState<Step>(1);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState<FormData>({
    nome: '',
    categoria: '',
    codigoBarras: '',
    validade: '',
    quantidadeUnidades: '',
    quantidadeKg: '',
    descricao: '',
  });

  const updateForm = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const canGoNext = () => {
    if (step === 1) {
      return form.nome.trim() && form.categoria.trim();
    }
    if (step === 2) {
      return form.validade.trim() && (form.quantidadeUnidades || form.quantidadeKg);
    }
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (step < 3) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  async function salvarProduto() {
    const unidades = Number(form.quantidadeUnidades.replace(',', '.')) || 0;
    const kg = Number(form.quantidadeKg.replace(',', '.')) || 0;

    if (unidades <= 0 && kg <= 0) {
      toast.error('Informe a quantidade');
      return;
    }

    setSalvando(true);
    try {
      await cadastrarProdutoComLote({
        nome: form.nome.trim(),
        categoria: form.categoria.trim(),
        descricao: form.descricao.trim() || undefined,
        validade: form.validade,
        quantidadeUnidades: unidades,
        quantidadeKg: kg > 0 ? kg : undefined,
        codigoBarras: form.codigoBarras.trim() || undefined,
      });
      toast.success('Produto cadastrado!');
      setForm({
        nome: '',
        categoria: '',
        codigoBarras: '',
        validade: '',
        quantidadeUnidades: '',
        quantidadeKg: '',
        descricao: '',
      });
      setStep(1);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      toast.error(msg || 'Erro ao cadastrar');
    } finally {
      setSalvando(false);
    }
  }

  const styles = createStyles(colors);

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            step >= s && styles.stepCircleActive,
            step === s && styles.stepCircleCurrent,
          ]}>
            {step > s ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : (
              <Text style={styles.stepNumber}>{s}</Text>
            )}
          </View>
          <Text style={[
            styles.stepLabel,
            step >= s && styles.stepLabelActive,
          ]}>
            {s === 1 ? 'Identificação' : s === 2 ? 'Estoque' : 'Confirmação'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Identificação do produto</Text>
      <Text style={styles.stepDescription}>Informe os dados básicos para identificar o produto</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nome do produto <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={form.nome}
            onChangeText={(v) => updateForm('nome', v)}
            placeholder="Ex.: Fubá, Frango, Óleo..."
            placeholderTextColor={colors.subtitle}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Categoria <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={form.categoria}
            onChangeText={(v) => updateForm('categoria', v)}
            placeholder="Ex.: Grãos, Carnes, Limpeza..."
            placeholderTextColor={colors.subtitle}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Código de barras</Text>
        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <TextInput
              style={styles.input}
              value={form.codigoBarras}
              onChangeText={(v) => updateForm('codigoBarras', v)}
              placeholder="EAN / código do produto"
              placeholderTextColor={colors.subtitle}
            />
          </View>
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={() => router.push('/escanear')}
          >
            <Ionicons name="camera-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Estoque e validade</Text>
      <Text style={styles.stepDescription}>Defina a quantidade inicial e a data de validade</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Data de validade <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={form.validade}
            onChangeText={(v) => updateForm('validade', formatarDataInput(v))}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={colors.subtitle}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
      </View>

      <Text style={[styles.inputLabel, { marginTop: 16 }]}>Quantidade em estoque <Text style={styles.required}>*</Text></Text>
      <Text style={styles.inputHint}>Preencha ao menos um dos campos</Text>

      <View style={styles.quantityRow}>
        <View style={styles.quantityBox}>
          <Text style={styles.quantityLabel}>Unidades</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.quantityInput]}
              value={form.quantidadeUnidades}
              onChangeText={(v) => updateForm('quantidadeUnidades', v)}
              placeholder="0"
              placeholderTextColor={colors.subtitle}
              keyboardType="numeric"
            />
            <Text style={styles.quantitySuffix}>un</Text>
          </View>
        </View>

        <View style={styles.quantityBox}>
          <Text style={styles.quantityLabel}>Peso (kg)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.quantityInput]}
              value={form.quantidadeKg}
              onChangeText={(v) => updateForm('quantidadeKg', v)}
              placeholder="0"
              placeholderTextColor={colors.subtitle}
              keyboardType="numeric"
            />
            <Text style={styles.quantitySuffix}>kg</Text>
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Observações</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.descricao}
            onChangeText={(v) => updateForm('descricao', v)}
            placeholder="Anote detalhes importantes..."
            placeholderTextColor={colors.subtitle}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => {
    const unidades = Number(form.quantidadeUnidades) || 0;
    const kg = Number(form.quantidadeKg) || 0;

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Confirme os dados</Text>
        <Text style={styles.stepDescription}>Revise as informações antes de salvar</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Nome</Text>
            <Text style={styles.summaryValue}>{form.nome}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Categoria</Text>
            <Text style={styles.summaryValue}>{form.categoria}</Text>
          </View>
          {form.codigoBarras && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Código</Text>
              <Text style={styles.summaryValue}>{form.codigoBarras}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Validade</Text>
            <Text style={styles.summaryValue}>{form.validade}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantidade</Text>
            <Text style={styles.summaryValue}>
              {unidades > 0 && `${unidades} un`}
              {unidades > 0 && kg > 0 && ' + '}
              {kg > 0 && `${kg} kg`}
            </Text>
          </View>
          {form.descricao && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Obs</Text>
              <Text style={styles.summaryValue}>{form.descricao}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.icon} />
            </Pressable>
          </View>
          <Text style={styles.title}>Novo Produto</Text>
          <Text style={styles.subtitle}>Cadastro em 3 etapas</Text>
        </View>

        {renderStepIndicator()}

        <View style={styles.formCard}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View style={styles.buttonRow}>
            {step > 1 && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={18} color={colors.text} />
                <Text style={styles.backButtonText}>Voltar</Text>
              </TouchableOpacity>
            )}

            {step < 3 ? (
              <TouchableOpacity 
                style={[styles.nextButton, !canGoNext() && styles.nextButtonDisabled]}
                onPress={handleNext}
                disabled={!canGoNext()}
              >
                <Text style={styles.nextButtonText}>Próximo</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.submitButton, salvando && styles.submitButtonDisabled]}
                onPress={salvarProduto}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.submitButtonText}>Salvar produto</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  header: { marginBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.subtitle },
  
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: colors.icon,
    borderColor: colors.icon,
  },
  stepCircleCurrent: {
    borderWidth: 2,
    borderColor: colors.accent || colors.icon,
  },
  stepNumber: { fontSize: 13, fontWeight: '600', color: colors.subtitle },
  stepLabel: { fontSize: 11, color: colors.subtitle },
  stepLabelActive: { color: colors.text, fontWeight: '500' },
  
  formCard: { 
    backgroundColor: colors.card, 
    borderRadius: 20, 
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 },
  stepDescription: { fontSize: 13, color: colors.subtitle, marginBottom: 20 },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  inputHint: { fontSize: 12, color: colors.subtitle, marginBottom: 12 },
  required: { color: colors.danger },
  
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: colors.background, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: colors.border,
  },
  input: { 
    flex: 1,
    paddingVertical: 14, 
    paddingHorizontal: 14, 
    color: colors.text,
    fontSize: 15,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  
  row: { flexDirection: 'row', gap: 10 },
  scanButton: { 
    width: 52, 
    height: 52, 
    backgroundColor: colors.icon, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  
  quantityRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  quantityBox: { flex: 1 },
  quantityLabel: { fontSize: 12, color: colors.subtitle, marginBottom: 8 },
  quantityInput: { paddingRight: 40 },
  quantitySuffix: {
    position: 'absolute',
    right: 14,
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: '500',
  },
  
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: { fontSize: 13, color: colors.subtitle },
  summaryValue: { fontSize: 13, color: colors.text, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: { color: colors.text, fontWeight: '500', fontSize: 15 },
  
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.icon,
    borderRadius: 12,
    paddingVertical: 14,
  },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success || colors.icon,
    borderRadius: 12,
    paddingVertical: 14,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});