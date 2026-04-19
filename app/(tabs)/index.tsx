// app/(tabs)/index.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart } from "react-native-chart-kit";
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEstoque } from '../../context/estoqueStorage';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useAlertasEstoque } from '../../hooks/useAlertasEstoque';
import { GraficoCategorias } from '../../components/GraficoCategorias';
import { colors as tokens } from '../../styles/tokens';

const screenWidth = Dimensions.get("window").width;

// Estilos definidos fora para evitar erro de referência
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1420' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  header: { marginBottom: 20 },
  saudacao: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  data: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  kpiCard: { 
    width: '47%', 
    backgroundColor: '#1A2332', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.06)',
  },
  kpiCardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  kpiIconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: 'rgba(55,138,221,0.15)', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiContent: { flex: 1 },
  kpiValue: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 2 },
  kpiLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  kpiTrend: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8 },
  kpiTrendUp: {},
  kpiTrendDown: {},
  kpiTrendText: { fontSize: 11, fontWeight: '600' },
  kpiTrendTextUp: { color: '#22c55e' },
  kpiTrendTextDown: { color: '#ef4444' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  sectionAction: { fontSize: 13, color: '#378ADD', fontWeight: '500' },
  
  graficoContainer: { 
    backgroundColor: '#1A2332', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.06)' 
  },
  
  alertaCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(239,68,68,0.15)', 
    marginBottom: 20, 
    padding: 14, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  alertaIconContainer: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: 'rgba(239,68,68,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12,
  },
  alertaText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '500' },
  alertaSubtext: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  
  atividade: { 
    backgroundColor: '#1A2332', 
    borderRadius: 16, 
    padding: 16, 
    marginTop: 20,
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.06)',
  },
  atividadeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  atividadeItemFirst: { marginTop: 0, paddingTop: 0, borderTopWidth: 0 },
  atividadeLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  atividadeValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entrada: { color: '#22c55e', fontWeight: '700', fontSize: 15 },
  saida: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 15, color: 'rgba(255,255,255,0.5)' },
});

// Componente de Card KPI moderno
function KpiCard({ 
  icon, 
  iconColor, 
  label, 
  value, 
  valueColor = '#fff',
  onPress,
  trend,
}: { 
  icon: string; 
  iconColor: string; 
  label: string; 
  value: string | number; 
  valueColor?: string;
  onPress?: () => void;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [styles.kpiCard, pressed && styles.kpiCardPressed]}
    >
      <View style={styles.kpiIconContainer}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={styles.kpiContent}>
        <Text style={[styles.kpiValue, valueColor !== '#fff' && { color: valueColor }]}>{value}</Text>
        <Text style={styles.kpiLabel}>{label}</Text>
      </View>
      {trend && (
        <View style={styles.kpiTrend}>
          <Ionicons 
            name={trend.isPositive ? 'arrow-up' : 'arrow-down'} 
            size={10} 
            color={trend.isPositive ? '#22c55e' : '#ef4444'} 
          />
          <Text style={[styles.kpiTrendText, trend.isPositive ? styles.kpiTrendTextUp : styles.kpiTrendTextDown]}>
            {trend.value}%
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// Seção com título
function SectionTitle({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function Dashboard() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    produtos,
    movimentacoes,
    produtosLoading,
    carregarProdutos,
    carregarMovimentacoes,
  } = useEstoque();
  const { totalAlertas, totalVencidos } = useAlertasEstoque();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        carregarProdutos({ showLoading: false }),
        carregarMovimentacoes({ showLoading: false }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [carregarProdutos, carregarMovimentacoes]);

  const dados = useMemo(() => {
    const hoje = new Date();
    const dataAtual = format(hoje, "EEEE, d 'de' MMMM", { locale: ptBR });
    const dataFormatada = dataAtual.charAt(0).toUpperCase() + dataAtual.slice(1);

    const totalProdutos = produtos.length;

    const ultimaMov = movimentacoes.length > 0
      ? movimentacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0]
      : null;

    const trintaDias = new Date();
    trintaDias.setDate(trintaDias.getDate() - 30);

    const movimentacoesMes = movimentacoes.filter(m => 
      new Date(m.data) >= trintaDias && m.tipo === 'retirada'
    );

    const consumoPorProduto: Record<string, number> = {};
    movimentacoesMes.forEach(mov => {
      const produto = produtos.find(p => p.id === mov.produtoId);
      if (!produto) return;
      if (!consumoPorProduto[produto.nome]) consumoPorProduto[produto.nome] = 0;
      consumoPorProduto[produto.nome] += mov.quantidadeUnidades || 0;
    });

    const totalConsumo = Object.values(consumoPorProduto).reduce((a, b) => a + b, 0);

    const topProdutos = Object.entries(consumoPorProduto)
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
        percentual: totalConsumo > 0 ? Math.round((quantidade / totalConsumo) * 100) : 0,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 4);

    const hojeStr = format(hoje, 'yyyy-MM-dd');
    const movHoje = movimentacoes.filter(m => m.data.startsWith(hojeStr));
    const entradasHoje = movHoje.filter(m => m.tipo === 'retorno').reduce((acc, m) => acc + (m.quantidadeUnidades || 0), 0);
    const saidasHoje = movHoje.filter(m => m.tipo === 'retirada').reduce((acc, m) => acc + (m.quantidadeUnidades || 0), 0);

    const mesAnterior = new Date();
    mesAnterior.setMonth(mesAnterior.getMonth() - 1);
    const movimentacoesMesAnterior = movimentacoes.filter(m => {
      const data = new Date(m.data);
      return data >= mesAnterior && data < trintaDias && m.tipo === 'retirada';
    });
    const consumoAnterior = movimentacoesMesAnterior.reduce((acc, m) => acc + (m.quantidadeUnidades || 0), 0);
    const tendencia = totalConsumo > 0 && consumoAnterior > 0 
      ? Math.round(((totalConsumo - consumoAnterior) / consumoAnterior) * 100)
      : null;

    return {
      saudacao: `Olá, ${user?.displayName?.split(' ')[0] || 'Gabriel'}!`,
      data: dataFormatada,
      totalProdutos,
      ultimaMovimentacao: ultimaMov
        ? {
            hora: format(new Date(ultimaMov.data), 'HH:mm'),
            produto: produtos.find(p => p.id === ultimaMov.produtoId)?.nome || '',
            quantidade: ultimaMov.quantidadeUnidades || 0,
          }
        : null,
      topProdutos,
      atividadeHoje: { entradas: entradasHoje, saidas: saidasHoje },
      tendencia,
    };
  }, [produtos, movimentacoes, user]);

  if (produtosLoading && produtos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#378ADD" />
          <Text style={styles.loadingText}>Carregando painel...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#378ADD"
            colors={['#378ADD']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.saudacao}>{dados.saudacao}</Text>
          <Text style={styles.data}>{dados.data}</Text>
        </View>

        <View style={styles.kpiGrid}>
          <KpiCard 
            icon="cube-outline" 
            iconColor="#378ADD"
            label="Produtos" 
            value={dados.totalProdutos} 
            onPress={() => router.push('/estoque')}
          />
          <KpiCard 
            icon="warning-outline" 
            iconColor="#f59e0b"
            label="Alertas" 
            value={totalAlertas} 
            valueColor={totalAlertas > 0 ? '#f59e0b' : '#fff'}
            onPress={() => router.push('/estoque')}
          />
          <KpiCard 
            icon="time-outline" 
            iconColor="#8b5cf6"
            label="Última Mov." 
            value={dados.ultimaMovimentacao?.hora || '--:--'} 
            onPress={() => router.push('/movimentacao')}
          />
          <KpiCard 
            icon="trending-up-outline" 
            iconColor="#22c55e"
            label="Consumo 30d" 
            value={dados.tendencia !== null ? `${dados.tendencia}%` : '0%'}
            valueColor={dados.tendencia && dados.tendencia > 0 ? '#22c55e' : '#fff'}
            trend={dados.tendencia !== null ? { value: Math.abs(dados.tendencia), isPositive: dados.tendencia >= 0 } : undefined}
          />
        </View>

        {totalVencidos > 0 && (
          <Pressable 
            style={styles.alertaCard}
            onPress={() => router.push('/estoque')}
          >
            <View style={styles.alertaIconContainer}>
              <Ionicons name="warning" size={18} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertaText}>{totalVencidos} produto(s) vencido(s)</Text>
              <Text style={styles.alertaSubtext}>Toque para visualizar no estoque</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
          </Pressable>
        )}

        {dados.topProdutos.length > 0 && (
          <>
            <SectionTitle 
              title="Produtos Mais Utilizados" 
              actionLabel="Ver todos"
              onAction={() => router.push('/relatorio')}
            />
            <View style={styles.graficoContainer}>
              <BarChart
                data={{
                  labels: dados.topProdutos.map(p => p.nome.length > 10 ? p.nome.substring(0, 10) + '...' : p.nome),
                  datasets: [{ data: dados.topProdutos.map(p => p.quantidade) }]
                }}
                width={screenWidth - 72}
                height={180}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: '#1A2332',
                  backgroundGradientTo: '#1A2332',
                  decimalPlaces: 0,
                  color: () => '#378ADD',
                  labelColor: () => 'rgba(255,255,255,0.5)',
                  style: { borderRadius: 12 },
                  propsForBackgroundLines: { strokeDasharray: '', stroke: 'rgba(255,255,255,0.06)' },
                }}
                style={{ marginVertical: 8, borderRadius: 12 }}
              />
            </View>
          </>
        )}

        <SectionTitle title="Atividade de Hoje" />
        <View style={styles.atividade}>
          <View style={[styles.atividadeItem, styles.atividadeItemFirst]}>
            <Text style={styles.atividadeLabel}>Entradas</Text>
            <View style={styles.atividadeValue}>
              <Ionicons name="arrow-up" size={14} color="#22c55e" />
              <Text style={styles.entrada}>{dados.atividadeHoje.entradas}</Text>
            </View>
          </View>
          <View style={styles.atividadeItem}>
            <Text style={styles.atividadeLabel}>Saídas</Text>
            <View style={styles.atividadeValue}>
              <Ionicons name="arrow-down" size={14} color="#ef4444" />
              <Text style={styles.saida}>{dados.atividadeHoje.saidas}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}