// app/(tabs)/movimentacao.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MovimentacaoInput } from '../../services/movimentacao/types'; 
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEstoque } from '../../context/estoqueStorage';
import { useTheme } from '../../context/ThemeContext';
import { FEEDBACK } from '../../constants/feedbackMessages';
import { toast } from '../../utils/toast';
import { Produto } from '../../types/produto';

export default function Movimentacao() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selecionarProdutoId?: string | string[] }>();
  const selecionarId = Array.isArray(params.selecionarProdutoId) ? params.selecionarProdutoId[0] : params.selecionarProdutoId;

  const { colors } = useTheme();
  const { produtos, registrarMovimentacao, produtosLoading, carregarProdutos, carregarMovimentacoes } = useEstoque();
  
  const [tipo, setTipo] = useState<'retirada' | 'retorno'>('retirada');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [quantidadeUnidades, setQuantidadeUnidades] = useState('');
  const [quantidadeKg, setQuantidadeKg] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [validade, setValidade] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    if (!selecionarId || !produtos.length) return;
    const p = produtos.find((x) => x.id === selecionarId);
    if (p) {
      setProdutoSelecionado(p);
      setBuscaProduto(p.nome);
    }
  }, [selecionarId, produtos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([carregarProdutos({ showLoading: false }), carregarMovimentacoes({ showLoading: false })]);
    } finally {
      setRefreshing(false);
    }
  }, [carregarProdutos, carregarMovimentacoes]);

  const produtosFiltrados = useMemo(() => {
    if (!produtos || !produtos.length) return [];
    if (!buscaProduto.trim()) return produtos;
    return produtos.filter(p => 
      p && p.nome && p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
      (p.categoria || '').toLowerCase().includes(buscaProduto.toLowerCase())
    );
  }, [produtos, buscaProduto]);

  const handleSelecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setBuscaProduto(produto.nome);
    setModalVisible(false);
    setQuantidadeUnidades('');
    setQuantidadeKg('');
    setValidade('');
  };

  const handleTipoChange = (novoTipo: 'retirada' | 'retorno') => {
    setTipo(novoTipo);
    if (novoTipo === 'retirada') {
      setValidade('');
    }
  };

  const executarMovimentacao = async (movimentacaoData: MovimentacaoInput) => {
    setSalvando(true);
    try {
      await registrarMovimentacao(movimentacaoData);
      toast.success('Movimentação registrada com sucesso!');
      setQuantidadeUnidades('');
      setQuantidadeKg('');
      setFinalidade('');
      setProdutoSelecionado(null);
      setBuscaProduto('');
      setValidade('');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      toast.error(msg || 'Erro ao registrar movimentação');
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmar = () => {
    if (!produtoSelecionado) {
      toast.error('Selecione um produto');
      return;
    }

    const temUnidades = quantidadeUnidades.trim() !== '';
    const temKg = quantidadeKg.trim() !== '';

    if (!temUnidades && !temKg) {
      toast.error('Informe a quantidade');
      return;
    }

    if (temUnidades && (!/^\d+$/.test(quantidadeUnidades) || Number(quantidadeUnidades) <= 0)) {
      toast.error('Informe um número válido de unidades');
      return;
    }

    if (temKg && (!/^\d*\.?\d+$/.test(quantidadeKg) || Number(quantidadeKg) <= 0)) {
      toast.error('Informe um valor válido em kg');
      return;
    }

    if (tipo === 'retirada' && !finalidade.trim()) {
      toast.error('Informe a finalidade');
      return;
    }

    const unidades = Number(quantidadeUnidades || 0);
    const kg = Number(quantidadeKg || 0);

    if (tipo === 'retirada') {
      if (unidades > produtoSelecionado.quantidade) {
        toast.error(`Estoque insuficiente: ${produtoSelecionado.quantidade} un`);
        return;
      }
      if (produtoSelecionado.quantidadeKg && kg > produtoSelecionado.quantidadeKg) {
        toast.error(`Estoque insuficiente: ${produtoSelecionado.quantidadeKg} kg`);
        return;
      }
    }

    const movimentacaoData: MovimentacaoInput = {
      tipo,
      produtoId: produtoSelecionado.id,
      finalidade: tipo === 'retirada' ? finalidade.trim() : undefined,
    };
    if (temUnidades) movimentacaoData.quantidadeUnidades = unidades;
    if (temKg) movimentacaoData.quantidadeKg = kg;
    if (tipo === 'retorno' && validade.trim()) movimentacaoData.observacao = validade.trim();

    const resumoUn = temUnidades ? `${unidades} un` : '';
    const resumoKg = temKg ? `${kg} kg` : '';
    const resumoQtd = [resumoUn, resumoKg].filter(Boolean).join(' + ');
    const acao = tipo === 'retirada' ? 'Retirada' : 'Retorno';

    Alert.alert(
      'Confirmar movimentação',
      `${acao}: ${produtoSelecionado.nome}\nQuantidade: ${resumoQtd}${tipo === 'retirada' ? `\nFinalidade: ${finalidade.trim()}` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => void executarMovimentacao(movimentacaoData) },
      ]
    );
  };

  const TipoToggle = ({ tipo, onChange }: { tipo: 'retirada' | 'retorno'; onChange: (t: 'retirada' | 'retorno') => void }) => (
    <View style={styles.toggleContainer}>
      <Pressable 
        style={[styles.toggleButton, tipo === 'retirada' && styles.toggleButtonAtivo]}
        onPress={() => onChange('retirada')}
      >
        <Ionicons 
          name="arrow-up-circle-outline" 
          size={18} 
          color={tipo === 'retirada' ? '#fff' : colors.subtitle} 
        />
        <Text style={[styles.toggleText, tipo === 'retirada' && styles.toggleTextAtivo]}>Retirada</Text>
      </Pressable>
      <Pressable 
        style={[styles.toggleButton, tipo === 'retorno' && styles.toggleButtonAtivoRetorno]}
        onPress={() => onChange('retorno')}
      >
        <Ionicons 
          name="arrow-down-circle-outline" 
          size={18} 
          color={tipo === 'retorno' ? '#fff' : colors.subtitle} 
        />
        <Text style={[styles.toggleText, tipo === 'retorno' && styles.toggleTextAtivo]}>Retorno</Text>
      </Pressable>
    </View>
  );

  const ProdutoItem = ({ produto, onSelect }: { produto: Produto; onSelect: () => void }) => (
    <Pressable 
      style={styles.produtoItem} 
      onPress={onSelect}
    >
      <View style={styles.produtoItemLeft}>
        <View style={styles.produtoItemIcon}>
          <Ionicons name="cube-outline" size={16} color={colors.icon} />
        </View>
        <View>
          <Text style={styles.produtoItemNome}>{produto.nome}</Text>
          <Text style={styles.produtoItemCategoria}>{produto.categoria}</Text>
        </View>
      </View>
      <View style={styles.produtoItemRight}>
        <Text style={styles.produtoItemQtd}>{produto.quantidade} un</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.subtitle} />
      </View>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.icon]} tintColor={colors.icon} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Movimentação</Text>
          <Text style={styles.subtitle}>{tipo === 'retirada' ? 'Registre a saída de produtos' : 'Registre a entrada de produtos'}</Text>
        </View>

        <TipoToggle tipo={tipo} onChange={handleTipoChange} />

        <View style={styles.card}>
          <View style={styles.produtoSelector}>
            <View style={styles.produtoInputWrapper}>
              <Text style={styles.label}>Produto</Text>
              <Pressable onPress={() => setModalVisible(true)}>
                <View pointerEvents="none">
                  <TextInput
                    style={styles.input}
                    placeholder="Toque para buscar..."
                    placeholderTextColor={colors.subtitle}
                    value={buscaProduto}
                    onChangeText={setBuscaProduto}
                    onFocus={() => setModalVisible(true)}
                  />
                </View>
              </Pressable>
            </View>
            <Pressable style={styles.scanButton} onPress={() => router.push({ pathname: '/escanear', params: { returnTo: 'movimentacao' } })}>
              <Ionicons name="camera-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          {produtoSelecionado && (
            <View style={styles.produtoInfo}>
              <View style={styles.produtoInfoHeader}>
                <View style={styles.produtoInfoIcon}>
                  <Ionicons name="cube" size={16} color={colors.icon} />
                </View>
                <Text style={styles.produtoInfoNome}>{produtoSelecionado.nome}</Text>
                <Pressable style={styles.produtoInfoRemove} onPress={() => { setProdutoSelecionado(null); setBuscaProduto(''); }}>
                  <Ionicons name="close-circle" size={20} color={colors.subtitle} />
                </Pressable>
              </View>
              <Text style={styles.produtoInfoEstoque}>
                Estoque: {produtoSelecionado.quantidade} un
                {produtoSelecionado.quantidadeKg ? ` / ${produtoSelecionado.quantidadeKg} kg` : ''}
              </Text>
            </View>
          )}

          <Text style={styles.label}>Quantidade em unidades</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.inputFlex}
              placeholder="0"
              placeholderTextColor={colors.subtitle}
              keyboardType="numeric"
              value={quantidadeUnidades}
              onChangeText={setQuantidadeUnidades}
            />
            <View style={styles.unitBadge}>
              <Text style={styles.unitBadgeText}>un</Text>
            </View>
          </View>

          <Text style={styles.label}>Quantidade em kg</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.inputFlex}
              placeholder="0"
              placeholderTextColor={colors.subtitle}
              keyboardType="numeric"
              value={quantidadeKg}
              onChangeText={setQuantidadeKg}
            />
            <View style={styles.unitBadge}>
              <Text style={styles.unitBadgeText}>kg</Text>
            </View>
          </View>

          <Text style={styles.hint}>Preencha ao menos um dos campos acima</Text>

          {tipo === 'retorno' && (
            <>
              <Text style={styles.label}>Validade do lote</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.subtitle}
                value={validade}
                onChangeText={setValidade}
                keyboardType="number-pad"
                maxLength={10}
              />
              <Text style={[styles.hint, { marginTop: 4 }]}>Data de validade do produto. Se vazio, usa hoje + 30 dias.</Text>
            </>
          )}

          {tipo === 'retirada' && (
            <>
              <Text style={styles.label}>Finalidade</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Polenta, Doação, Venda..."
                placeholderTextColor={colors.subtitle}
                value={finalidade}
                onChangeText={setFinalidade}
              />
            </>
          )}

          <Pressable
            style={[
              styles.submitButton,
              tipo === 'retirada' ? styles.submitButtonRetirada : styles.submitButtonRetorno,
              salvando && styles.submitButtonDisabled,
            ]}
            onPress={handleConfirmar}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={tipo === 'retirada' ? 'arrow-up-circle' : 'arrow-down-circle'} size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {tipo === 'retirada' ? 'Confirmar Retirada' : 'Confirmar Retorno'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Produto</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={colors.subtitle} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar produto..."
                placeholderTextColor={colors.subtitle}
                value={buscaProduto}
                onChangeText={setBuscaProduto}
                autoFocus
              />
            </View>

            {produtosLoading && produtos.length === 0 ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.icon} />
              </View>
            ) : (
              <FlatList
                data={produtosFiltrados}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <Text style={{ textAlign: 'center', color: colors.subtitle, padding: 24 }}>
                    Nenhum produto encontrado
                  </Text>
                }
                renderItem={({ item }) => (
                  <ProdutoItem produto={item} onSelect={() => handleSelecionarProduto(item)} />
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.subtitle },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 },
  toggleButtonAtivo: { backgroundColor: colors.danger },
  toggleButtonAtivoRetorno: { backgroundColor: colors.success },
  toggleText: { fontSize: 15, fontWeight: '600', color: colors.subtitle },
  toggleTextAtivo: { color: '#fff' },
  
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, color: colors.text, fontSize: 15 },
  
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 16 },
  inputFlex: { flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, color: colors.text, fontSize: 16, fontWeight: '600' },
  unitBadge: { backgroundColor: colors.border, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12 },
  unitBadgeText: { color: colors.subtitle, fontSize: 14, fontWeight: '600' },
  
  produtoSelector: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  produtoInputWrapper: { flex: 1 },
  scanButton: { width: 52, height: 52, backgroundColor: colors.icon, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  
  produtoInfo: { backgroundColor: `${colors.icon}15`, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: `${colors.icon}30` },
  produtoInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  produtoInfoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: `${colors.icon}20`, alignItems: 'center', justifyContent: 'center' },
  produtoInfoNome: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  produtoInfoEstoque: { fontSize: 13, color: colors.subtitle },
  produtoInfoRemove: { padding: 4 },
  
  hint: { textAlign: 'center', color: colors.subtitle, fontSize: 12, marginTop: 8, marginBottom: 16 },
  
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  submitButtonRetirada: { backgroundColor: colors.danger },
  submitButtonRetorno: { backgroundColor: colors.success },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, color: colors.text, fontSize: 15 },
  
  produtoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  produtoItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  produtoItemIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: `${colors.icon}20`, alignItems: 'center', justifyContent: 'center' },
  produtoItemNome: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  produtoItemCategoria: { fontSize: 12, color: colors.subtitle },
  produtoItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  produtoItemQtd: { fontSize: 13, color: colors.subtitle },
});