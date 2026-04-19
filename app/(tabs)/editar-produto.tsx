// app/(tabs)/editar-produto.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEstoque } from '../../context/estoqueStorage';
import { useTheme } from '../../context/ThemeContext';
import { Produto } from '../../types/produto';
import { FEEDBACK } from '../../constants/feedbackMessages';
import { toast } from '../../utils/toast';

export default function EditarProdutoScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { produtos, editarProduto } = useEstoque();
  
  const [loading, setLoading] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [quantidadeKg, setQuantidadeKg] = useState('');
  const [validade, setValidade] = useState('');
  const [estoqueMinimoUnidades, setEstoqueMinimoUnidades] = useState('');
  const [estoqueMinimoKg, setEstoqueMinimoKg] = useState('');
  const [alertaAtivo, setAlertaAtivo] = useState(true);
  const [codigoBarras, setCodigoBarras] = useState('');

  // Carregar produto quando a tela abrir
  useEffect(() => {
    const produtoEncontrado = produtos.find(p => p.id === id);
    if (produtoEncontrado) {
      setNome(produtoEncontrado.nome || '');
      setCategoria(produtoEncontrado.categoria || '');
      setDescricao(produtoEncontrado.descricao || '');
      setQuantidade(produtoEncontrado.quantidade?.toString() || '');
      setQuantidadeKg(produtoEncontrado.quantidadeKg?.toString() || '');
      setValidade(produtoEncontrado.validade || '');
      
      // ✅ Usando type assertion para acessar os novos campos
      const produtoComCamposNovos = produtoEncontrado as Produto & {
        estoqueMinimoUnidades?: number;
        estoqueMinimoKg?: number;
        alertaAtivo: boolean;
      };
      
      setEstoqueMinimoUnidades(produtoComCamposNovos.estoqueMinimoUnidades?.toString() || '');
      setEstoqueMinimoKg(produtoComCamposNovos.estoqueMinimoKg?.toString() || '');
      setAlertaAtivo(produtoComCamposNovos.alertaAtivo ?? true);
      setCodigoBarras(produtoEncontrado.codigoBarras || '');
    }
  }, [id, produtos]);

  const handleSalvar = async () => {
    if (!nome.trim() || !categoria.trim() || !quantidade.trim()) {
      toast.error(FEEDBACK.error.camposObrigatoriosEdicao);
      return;
    }

    setLoading(true);
    try {
      // ✅ Usando type assertion para incluir os novos campos
      const updates: Partial<Omit<Produto, "id">> & {
        estoqueMinimoUnidades?: number;
        estoqueMinimoKg?: number;
        alertaAtivo: boolean;
      } = {
        nome: nome.trim(),
        categoria: categoria.trim(),
        descricao: descricao.trim() || undefined,
        quantidade: Number(quantidade),
        quantidadeKg: quantidadeKg ? Number(quantidadeKg) : undefined,
        validade: validade || new Date().toISOString().split('T')[0],
        estoqueMinimoUnidades: estoqueMinimoUnidades ? Number(estoqueMinimoUnidades) : undefined,
        estoqueMinimoKg: estoqueMinimoKg ? Number(estoqueMinimoKg) : undefined,
        alertaAtivo,
        codigoBarras: codigoBarras.trim() || undefined,
      };
      
      await editarProduto(id as string, updates);
      
      toast.success(FEEDBACK.success.produtoAtualizado);
      router.back();
    } catch {
      toast.error(FEEDBACK.error.atualizarProduto);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
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
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.title,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: colors.text,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    halfInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: colors.text,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: colors.icon,
      borderRadius: 6,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.icon,
    },
    checkboxText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    checkboxLabel: {
      fontSize: 16,
      color: colors.title,
    },
    button: {
      backgroundColor: colors.icon,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 40,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerTop}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </Pressable>
      </View>
      <Text style={styles.title}>Editar Produto</Text>

      <Text style={styles.label}>Nome *</Text>
      <TextInput
        style={styles.input}
        value={nome}
        onChangeText={setNome}
        placeholder="Ex.: Arroz"
        placeholderTextColor={colors.subtitle}
      />

      <Text style={styles.label}>Categoria *</Text>
      <TextInput
        style={styles.input}
        value={categoria}
        onChangeText={setCategoria}
        placeholder="Ex.: Alimentos"
        placeholderTextColor={colors.subtitle}
      />

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={styles.input}
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Opcional"
        placeholderTextColor={colors.subtitle}
        multiline
      />

      <Text style={styles.label}>Código de barras (opcional)</Text>
      <TextInput
        style={styles.input}
        value={codigoBarras}
        onChangeText={setCodigoBarras}
        placeholder="EAN / código"
        placeholderTextColor={colors.subtitle}
        keyboardType="default"
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Unidades *</Text>
          <TextInput
            style={styles.halfInput}
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.subtitle}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.halfInput}
            value={quantidadeKg}
            onChangeText={setQuantidadeKg}
            keyboardType="numeric"
            placeholder="0.0"
            placeholderTextColor={colors.subtitle}
          />
        </View>
      </View>

      <Text style={styles.label}>Validade</Text>
      <TextInput
        style={styles.input}
        value={validade}
        onChangeText={setValidade}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.subtitle}
      />

      <Text style={[styles.label, { marginTop: 20 }]}>Estoque Mínimo (Alertas)</Text>
      
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Unidades</Text>
          <TextInput
            style={styles.halfInput}
            value={estoqueMinimoUnidades}
            onChangeText={setEstoqueMinimoUnidades}
            keyboardType="numeric"
            placeholder="Mínimo em unidades"
            placeholderTextColor={colors.subtitle}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Kg</Text>
          <TextInput
            style={styles.halfInput}
            value={estoqueMinimoKg}
            onChangeText={setEstoqueMinimoKg}
            keyboardType="numeric"
            placeholder="Mínimo em kg"
            placeholderTextColor={colors.subtitle}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setAlertaAtivo(!alertaAtivo)}
      >
        <View style={[styles.checkbox, alertaAtivo && styles.checkboxChecked]}>
          {alertaAtivo && <Text style={styles.checkboxText}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Ativar alertas para este produto</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSalvar}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Salvar Alterações</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}