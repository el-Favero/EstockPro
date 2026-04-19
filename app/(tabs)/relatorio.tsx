// app/(tabs)/relatorio.tsx
// Novo layout de relatório de movimentações com saldo real do estoque
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useEstoque } from '../../context/estoqueStorage';
import { generateAndSharePdf, generateAndShareCsv } from '../../utils/exportRelatorioUtils';
import { Produto } from '../../types/produto';

const COLORS = {
  primary: '#1a1a2e',
  accent: '#e8ff4a',
  entry: '#00b894',
  exit: '#6c5ce7',
  alert: '#e17055',
  white: '#ffffff',
  backgroundSecondary: '#f5f5f7',
  tertiary: '#666',
};

type PeriodTab = 'diario' | 'semanal' | 'mensal';

export default function RelatorioScreen() {
  const { colors } = useTheme();
  const { produtos, movimentacoes, carregarProdutos, carregarMovimentacoes } = useEstoque();
  
  const [periodTab, setPeriodTab] = useState<PeriodTab>('semanal');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      carregarMovimentacoes();
      carregarProdutos();
    }
  }, [isFocused, carregarMovimentacoes, carregarProdutos]);

  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 600;

  const getPeriodLabel = (tab: PeriodTab, inicio: Date, fim: Date): string => {
    const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const formatMonth = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    if (tab === 'diario') return `${formatDate(inicio)}`;
    if (tab === 'semanal') return `${formatDate(inicio)} - ${formatDate(fim)}`;
    return formatMonth(inicio);
  };

  const periodoAtual = useMemo(() => {
    const now = new Date();
    let inicio = new Date(now);
    let fim = new Date(now);
    
    if (periodTab === 'diario') {
      inicio.setDate(inicio.getDate() - periodOffset);
      fim.setDate(fim.getDate() - periodOffset);
    } else if (periodTab === 'semanal') {
      const diaSemana = inicio.getDay();
      const diff = periodOffset * 7;
      inicio.setDate(inicio.getDate() - diaSemana - diff);
      fim = new Date(inicio);
      fim.setDate(fim.getDate() + 6);
    } else {
      inicio.setMonth(inicio.getMonth() - periodOffset);
      inicio.setDate(1);
      fim = new Date(inicio);
      fim.setMonth(inicio.getMonth() + 1, 0);
    }
    
    return {
      inicio: inicio.toISOString().split('T')[0],
      fim: fim.toISOString().split('T')[0],
      label: getPeriodLabel(periodTab, inicio, fim),
    };
  }, [periodTab, periodOffset]);

  const movimentacoesFiltradas = useMemo(() => {
    if (!movimentacoes?.length) return [];
    return movimentacoes.filter(m => {
      const dataMov = new Date(m.data);
      const dataInicio = new Date(periodoAtual.inicio);
      const dataFim = new Date(periodoAtual.fim);
      dataInicio.setHours(0, 0, 0, 0);
      dataFim.setHours(23, 59, 59, 999);
      return dataMov >= dataInicio && dataMov <= dataFim;
    });
  }, [movimentacoes, periodoAtual]);

  const metricas = useMemo(() => {
    const entradas = movimentacoesFiltradas
      .filter(m => m.tipo === 'retorno')
      .reduce((acc, m) => acc + (m.quantidadeUnidades || 0), 0);
    
    const saidas = movimentacoesFiltradas
      .filter(m => m.tipo === 'retirada')
      .reduce((acc, m) => acc + (m.quantidadeUnidades || 0), 0);
    
    const produtosDistintos = new Set(
      movimentacoesFiltradas.map(m => m.produtoId)
    ).size;
    
    return {
      entradas,
      saidas,
      produtosDistintos,
    };
  }, [movimentacoesFiltradas]);

  const movimentacoesAgrupadas = useMemo(() => {
    const grupos: Record<string, typeof movimentacoesFiltradas> = {};
    
    movimentacoesFiltradas.forEach(m => {
      const data = new Date(m.data).toLocaleDateString('pt-BR');
      if (!grupos[data]) grupos[data] = [];
      grupos[data].push(m);
    });
    
    return Object.entries(grupos)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([data, lista]) => ({
        data,
        totalEntrada: lista.filter(m => m.tipo === 'retorno').reduce((acc, m) => acc + (m.quantidadeUnidades || 0), 0),
        totalSaida: lista.filter(m => m.tipo === 'retirada').reduce((acc, m) => acc + (m.quantidadeUnidades || 0), 0),
        lista,
      }));
  }, [movimentacoesFiltradas]);

  const handlePrevPeriod = () => {
    if (periodOffset < 3) setPeriodOffset(p => p + 1);
  };
  
  const handleNextPeriod = () => {
    if (periodOffset > 0) setPeriodOffset(p => p - 1);
  };
  
  const handleHoje = () => {
    setPeriodOffset(0);
    setPeriodTab('diario');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([carregarProdutos(), carregarMovimentacoes()]);
    } finally {
      setRefreshing(false);
    }
  }, [carregarProdutos, carregarMovimentacoes]);

  const handleExportar = async (tipo: 'pdf' | 'csv') => {
    if (exporting) return;
    setExporting(true);
    try {
      const produtosVencendo: { produto: Produto; diasRestantes: number }[] = [];
      const produtosVencidos: { produto: Produto; diasAtraso: number }[] = [];
      
      await generateAndSharePdf({
        tipo: 'movimentacoes',
        produtos: produtos || [],
        produtosVencendo,
        produtosVencidos,
        movimentacoes: movimentacoesFiltradas,
        periodoLabel: periodoAtual.label,
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportarCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const produtosVencendo: { produto: any; diasRestantes: number }[] = [];
      const produtosVencidos: { produto: any; diasAtraso: number }[] = [];
      
      await generateAndShareCsv({
        tipo: 'movimentacoes',
        produtos: produtos || [],
        produtosVencendo,
        produtosVencidos,
        movimentacoes: movimentacoesFiltradas,
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
    } finally {
      setExporting(false);
    }
  };

  const renderMetricaCard = (label: string, value: number, color: string, prefix: string = '') => (
    <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>
        {prefix}{value}
      </Text>
    </View>
  );

  const renderMovimentacaoCard = (mov: any, index: number) => {
    const produto = produtos?.find(p => p.id === mov.produtoId);
    const isEntry = mov.tipo === 'retorno';
    const saldo = mov.estoqueNovo?.quantidade ?? mov.estoqueNovo?.quantidadeKg ?? '—';
    const saldoColor = (typeof saldo === 'number' && saldo < 10) ? COLORS.alert : COLORS.primary;
    
    return (
      <View key={index} style={styles.cardRow}>
        <View style={styles.cardTop}>
          <View style={styles.cardProductInfo}>
            <Text style={styles.cardProductName} numberOfLines={1}>
              {produto?.nome || 'Produto'}
            </Text>
            <Text style={styles.cardProductSku}>
              {produto?.codigoBarras || produto?.id?.substring(0, 8) || '—'}
            </Text>
          </View>
          <View style={[styles.cardPill, isEntry ? styles.pillEntry : styles.pillExit]}>
            <Text style={[styles.cardPillText, isEntry ? styles.pillTextEntry : styles.pillTextExit]}>
              {isEntry ? 'Entrada' : 'Saída'}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardDataRow}>
          <View style={styles.cardDataField}>
            <Text style={styles.cardDataLabel}>Data</Text>
            <Text style={styles.cardDataValue}>
              {new Date(mov.data).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <View style={styles.cardDataField}>
            <Text style={styles.cardDataLabel}>Entrada</Text>
            <Text style={[styles.cardDataValue, { color: isEntry ? COLORS.entry : COLORS.tertiary }]}>
              {isEntry ? `+${mov.quantidadeUnidades || 0}` : '—'}
            </Text>
          </View>
          <View style={styles.cardDataField}>
            <Text style={styles.cardDataLabel}>Saída</Text>
            <Text style={[styles.cardDataValue, { color: !isEntry ? COLORS.exit : COLORS.tertiary }]}>
              {!isEntry ? `-${mov.quantidadeUnidades || 0}` : '—'}
            </Text>
          </View>
          <View style={styles.cardDataField}>
            <Text style={styles.cardDataLabel}>Saldo</Text>
            <Text style={[styles.cardDataValue, { color: saldoColor }]}>
              {typeof saldo === 'number' ? saldo : saldo}
            </Text>
          </View>
        </View>
        
        {(mov.finalidade || mov.observacao) && (
          <View style={styles.cardObs}>
            <Text style={styles.cardObsText} numberOfLines={1}>
              {mov.finalidade || mov.observacao}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 1. Cabeçalho */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View>
          <Text style={[styles.title, { color: COLORS.primary }, isMobile && styles.titleMobile]}>
            Movimentações
          </Text>
          <Text style={[styles.subtitle, isMobile && styles.subtitleMobile]}>
            {periodoAtual.label}
          </Text>
        </View>
        {!isMobile ? (
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.btnOutline, { borderColor: COLORS.primary }]}
              onPress={() => handleExportar('pdf')}
            >
              <Text style={[styles.btnText, { color: COLORS.primary }]}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btnFill, { backgroundColor: COLORS.primary }]}
              onPress={handleExportarCsv}
            >
              <Text style={[styles.btnText, { color: COLORS.accent }]}>Excel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.downloadBtn} onPress={() => {
            Alert.alert(
              'Exportar Relatório',
              'Escolha o formato de exportação',
              [
                { text: 'PDF', onPress: () => handleExportar('pdf') },
                { text: 'CSV (Excel)', onPress: () => handleExportarCsv() },
                { text: 'Cancelar', style: 'cancel' },
              ]
            );
          }}>
            <Text style={styles.downloadBtnText}>↓</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Abas de período */}
      <View style={styles.tabsContainer}>
        {(['diario', 'semanal', 'mensal'] as PeriodTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              periodTab === tab && styles.tabActive,
            ]}
            onPress={() => {
              setPeriodTab(tab);
              setPeriodOffset(0);
            }}
          >
            <Text style={[
              styles.tabText,
              periodTab === tab && styles.tabTextActive,
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. Navegação de período */}
      <View style={styles.navPeriod}>
        <TouchableOpacity 
          onPress={handlePrevPeriod} 
          style={[styles.navBtn, isMobile && styles.navBtnMobile]}
        >
          <Text style={[styles.navBtnText, isMobile && styles.navBtnTextMobile]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.navLabel, isMobile && styles.navLabelMobile]}>
          {periodoAtual.label}
        </Text>
        <TouchableOpacity onPress={handleHoje}>
          <Text style={[styles.todayBtn, isMobile && styles.todayBtnMobile]}>Hoje</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleNextPeriod} 
          style={[styles.navBtn, periodOffset === 0 && styles.navBtnDisabled, isMobile && styles.navBtnMobile]}
          disabled={periodOffset === 0}
        >
          <Text style={[styles.navBtnText, periodOffset === 0 && styles.navBtnTextDisabled, isMobile && styles.navBtnTextMobile]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Cards de métricas */}
      <View style={[styles.metricsGrid, isMobile && styles.metricsGridMobile]}>
        {renderMetricaCard('entradas', metricas.entradas, COLORS.entry, '+')}
        {renderMetricaCard('saídas', metricas.saidas, COLORS.exit, '−')}
        {renderMetricaCard('produtos', metricas.produtosDistintos, COLORS.exit)}
      </View>

      {/* 5. Registros detalhados */}
      <View style={styles.tableCard}>
        <Text style={styles.tableTitle}>Registros detalhados</Text>
        
        {movimentacoesAgrupadas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma movimentação neste período</Text>
          </View>
        ) : (
          movimentacoesAgrupadas.map((grupo, idx) => (
            <View key={idx} style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayDate}>{grupo.data}</Text>
                <View style={styles.daySummary}>
                  <Text style={[styles.daySummaryText, { color: COLORS.entry }]}>
                    +{grupo.totalEntrada}
                  </Text>
                  <Text style={[styles.daySummaryText, { color: COLORS.exit }]}>
                    −{grupo.totalSaida}
                  </Text>
                </View>
              </View>
              
              {isMobile ? (
                <View style={styles.cardsContainer}>
                  {grupo.lista.map(renderMovimentacaoCard)}
                </View>
              ) : (
                grupo.lista.map((mov, i) => {
                  const produto = produtos?.find(p => p.id === mov.produtoId);
                  const isEntry = mov.tipo === 'retorno';
                  const saldo = mov.estoqueNovo?.quantidade ?? '—';
                  
                  return (
                    <View key={i} style={styles.tableRow}>
                      <View style={styles.colProduto}>
                        <Text style={styles.produtoNome} numberOfLines={1}>
                          {produto?.nome || 'Produto'}
                        </Text>
                      </View>
                      <View style={[
                        styles.pill, 
                        isEntry ? styles.pillEntry : styles.pillExit
                      ]}>
                        <Text style={[
                          styles.pillText, 
                          isEntry ? styles.pillTextEntry : styles.pillTextExit
                        ]}>
                          {isEntry ? 'Entrada' : 'Saída'}
                        </Text>
                      </View>
                      <View style={styles.colValor}>
                        <Text style={[
                          styles.valorText, 
                          { color: isEntry ? COLORS.entry : COLORS.exit }
                        ]}>
                          {isEntry ? `+${mov.quantidadeUnidades || 0}` : `-${mov.quantidadeUnidades || 0}`}
                        </Text>
                      </View>
                      <View style={styles.colSaldo}>
                        <Text style={[
                          styles.saldoText,
                          { color: (typeof saldo === 'number' && saldo < 10) ? COLORS.alert : COLORS.primary }
                        ]}>
                          {typeof saldo === 'number' ? saldo : saldo}
                        </Text>
                      </View>
                      {mov.finalidade && (
                        <Text style={styles.obsText} numberOfLines={1}>
                          {mov.finalidade}
                        </Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ))
        )}
      </View>

      {/* 6. Rodapé */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {movimentacoesFiltradas.length} registros
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingBottom: 14,
  },
  headerMobile: {
    paddingBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  titleMobile: {
    fontSize: 17,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.tertiary,
  },
  subtitleMobile: {
    fontSize: 11,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  downloadBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnFill: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderColor: '#ddd',
    backgroundColor: COLORS.white,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.tertiary,
  },
  tabTextActive: {
    color: COLORS.accent,
    fontWeight: '500',
  },
  navPeriod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navBtn: {
    padding: 12,
  },
  navBtnMobile: {
    padding: 8,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    fontSize: 18,
    color: COLORS.primary,
  },
  navBtnTextMobile: {
    fontSize: 16,
  },
  navBtnTextDisabled: {
    color: '#999',
  },
  navLabel: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },
  navLabelMobile: {
    fontSize: 13,
  },
  todayBtn: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  todayBtnMobile: {
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  metricsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
  },
  metricCardMobile: {
    minWidth: '45%',
    padding: 14,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.tertiary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  tableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#eee',
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: COLORS.primary,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
  dayGroup: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayDate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  daySummary: {
    flexDirection: 'row',
    gap: 12,
  },
  daySummaryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  colProduto: {
    flex: 2,
    marginRight: 8,
  },
  produtoNome: {
    fontSize: 13,
    fontWeight: '500',
  },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  pillEntry: {
    backgroundColor: '#eafff8',
  },
  pillExit: {
    backgroundColor: '#f0eeff',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '500',
  },
  pillTextEntry: {
    color: '#0f6e56',
  },
  pillTextExit: {
    color: '#534ab7',
  },
  colValor: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  valorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  colSaldo: {
    width: 60,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  saldoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  obsText: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  cardsContainer: {
    gap: 8,
  },
  cardRow: {
    borderWidth: 0.5,
    borderRadius: 10,
    padding: 11,
    marginBottom: 8,
    borderColor: '#eee',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardProductInfo: {
    flex: 1,
    marginRight: 8,
  },
  cardProductName: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  cardProductSku: {
    fontSize: 10,
    color: COLORS.tertiary,
    marginTop: 2,
  },
  cardPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  cardPillText: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
  },
  cardDataField: {
    alignItems: 'center',
  },
  cardDataLabel: {
    fontSize: 10,
    color: COLORS.tertiary,
    marginBottom: 2,
  },
  cardDataValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardObs: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
  },
  cardObsText: {
    fontSize: 10,
    color: COLORS.tertiary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.tertiary,
  },
});
