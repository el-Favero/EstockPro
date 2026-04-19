// components/GraficoCategorias.tsx
import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useEstoque } from '../context/estoqueStorage';
import { useTheme } from '../context/ThemeContext';

export function GraficoCategorias() {
  const { colors } = useTheme();
  const { produtos } = useEstoque();
  
  // Agrupar produtos por categoria
  const categorias = produtos.reduce((acc, produto) => {
    const cat = produto.categoria;
    if (!acc[cat]) {
      acc[cat] = {
        quantidade: 0,
        kg: 0,
        count: 0
      };
    }
    acc[cat].quantidade += produto.quantidade;
    acc[cat].kg += produto.quantidadeKg || 0;
    acc[cat].count += 1;
    return acc;
  }, {} as Record<string, { quantidade: number; kg: number; count: number }>);

  // Cores para o gráfico
  const cores = [
    '#4f46e5', // índigo
    '#f59e0b', // laranja
    '#10b981', // verde
    '#ef4444', // vermelho
    '#8b5cf6', // roxo
    '#ec4899', // rosa
    '#14b8a6', // teal
    '#f97316', // laranja escuro
  ];

  // Preparar dados para o gráfico
  const dados = Object.entries(categorias).map(([nome, dados], index) => ({
    name: nome,
    population: dados.quantidade + (dados.kg * 10), // peso aproximado para comparação
    color: cores[index % cores.length],
    legendFontColor: colors.text,
    legendFontSize: 12,
    quantidade: dados.quantidade,
    kg: dados.kg,
    count: dados.count,
  }));

  if (dados.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.subtitle }]}>
          Nenhuma categoria cadastrada
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.title }]}>
        Produtos por Categoria
      </Text>
      
      <PieChart
        data={dados}
        width={Dimensions.get('window').width - 32}
        height={220}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => colors.text,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />

      {/* Legenda detalhada */}
      <View style={styles.legendaContainer}>
        {dados.map((cat, index) => (
          <View key={cat.name} style={styles.legendaItem}>
            <View style={[styles.legendaCor, { backgroundColor: cat.color }]} />
            <Text style={[styles.legendaTexto, { color: colors.text }]}>
              {cat.name}: {cat.quantidade} un {cat.kg > 0 ? `/ ${cat.kg} kg` : ''} ({cat.count} itens)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  legendaContainer: {
    marginTop: 16,
    width: '100%',
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendaCor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendaTexto: {
    fontSize: 12,
    flex: 1,
  },
});