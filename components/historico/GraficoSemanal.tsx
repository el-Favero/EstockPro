// components/historico/GraficoSemanal.tsx
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useEstoque } from '../../context/estoqueStorage';
import { MesHistorico } from '../../types/historico';
import { calcularConsumoSemanal } from '../../types/utils/histoticoUtils';

interface Props {
  mes: MesHistorico;
}

export default function GraficoSemanal({ mes }: Props) {
  const { colors } = useTheme();
  const { produtos } = useEstoque();

  const semanas = useMemo(() => {
    return calcularConsumoSemanal(mes, produtos);
  }, [mes, produtos]);

  // Pegar top 5 produtos do mês
  const topProdutos = mes.totalProdutos.slice(0, 5);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    titulo: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.title,
      marginBottom: 12,
    },
    subtitulo: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.subtitle,
      marginTop: 16,
      marginBottom: 8,
    },
    graficoContainer: {
      marginVertical: 8,
    },
    barraContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    semanaLabel: {
      width: 70,
      fontSize: 14,
      color: colors.text,
    },
    barraWrapper: {
      flex: 1,
      height: 30,
      backgroundColor: colors.border + '40',
      borderRadius: 8,
      overflow: 'hidden',
    },
    barra: {
      height: '100%',
      backgroundColor: colors.icon,
      borderRadius: 8,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    barraTexto: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    valorBarra: {
      width: 50,
      fontSize: 14,
      color: colors.text,
      textAlign: 'right',
      marginLeft: 8,
    },
    produtoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '40',
    },
    produtoNome: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    produtoValor: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.title,
    },
    produtoCategoria: {
      fontSize: 12,
      color: colors.subtitle,
      marginLeft: 8,
    },
    produtoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>📈 Consumo Semanal - {mes.mes}</Text>

      {/* Gráfico de barras por semana */}
      <View style={styles.graficoContainer}>
        {semanas.map((semana) => {
          const maxValor = Math.max(...semanas.map(s => s.totalKg + s.totalUnidades));
          const valorSemana = semana.totalKg + semana.totalUnidades;
          const porcentagem = maxValor > 0 ? (valorSemana / maxValor) * 100 : 0;

          return (
            <View key={semana.semana} style={styles.barraContainer}>
              <Text style={styles.semanaLabel}>{semana.label}</Text>
              <View style={styles.barraWrapper}>
                <View style={[styles.barra, { width: `${porcentagem}%` }]}>
                  {porcentagem > 20 && (
                    <Text style={styles.barraTexto}>{valorSemana}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.valorBarra}>{valorSemana}</Text>
            </View>
          );
        })}
      </View>

      {/* Top produtos do mês */}
      <Text style={styles.subtitulo}>🥇 Mais consumidos</Text>
      {topProdutos.map((produto) => (
        <View key={produto.id} style={styles.produtoItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.produtoNome}>{produto.nome}</Text>
            <Text style={styles.produtoCategoria}>{produto.categoria}</Text>
          </View>
          <View style={styles.produtoRow}>
            {produto.totalKg > 0 && (
              <Text style={styles.produtoValor}>{produto.totalKg} kg</Text>
            )}
            {produto.totalUnidades > 0 && (
              <Text style={styles.produtoValor}> {produto.totalUnidades} un</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}