// components/historico/TotalCategoria.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MesHistorico } from '../../types/historico';

interface Props {
  mes: MesHistorico;
}

export default function TotalCategoria({ mes }: Props) {
  const { colors } = useTheme();
  const [expandido, setExpandido] = useState(true);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    titulo: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.title,
    },
    expandIcon: {
      fontSize: 16,
      color: colors.subtitle,
    },
    categoriaItem: {
      marginBottom: 12,
    },
    categoriaNome: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.subtitle,
      marginBottom: 6,
    },
    produtoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
      paddingLeft: 12,
    },
    produtoNome: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    produtoTotal: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.title,
    },
    totalCategoria: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.icon,
      textAlign: 'right',
      marginTop: 4,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: colors.border + '40',
    },
  });

  // Agrupar produtos por categoria
  const produtosPorCategoria = mes.totalProdutos.reduce((acc, produto) => {
    if (!acc[produto.categoria]) {
      acc[produto.categoria] = [];
    }
    acc[produto.categoria].push(produto);
    return acc;
  }, {} as Record<string, typeof mes.totalProdutos>);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpandido(!expandido)}>
        <Text style={styles.titulo}>📦 Consumo por categoria</Text>
        <Text style={styles.expandIcon}>{expandido ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expandido && (
        <View>
          {Object.entries(produtosPorCategoria).map(([categoria, produtos]) => {
            const totalKg = produtos.reduce((acc, p) => acc + p.totalKg, 0);
            const totalUn = produtos.reduce((acc, p) => acc + p.totalUnidades, 0);

            return (
              <View key={categoria} style={styles.categoriaItem}>
                <Text style={styles.categoriaNome}>{categoria}</Text>
                {produtos.map((produto) => (
                  <View key={produto.id} style={styles.produtoRow}>
                    <Text style={styles.produtoNome}>{produto.nome}</Text>
                    <Text style={styles.produtoTotal}>
                      {produto.totalKg > 0 ? `${produto.totalKg} kg ` : ''}
                      {produto.totalUnidades > 0 ? `${produto.totalUnidades} un` : ''}
                    </Text>
                  </View>
                ))}
                {(totalKg > 0 || totalUn > 0) && (
                  <Text style={styles.totalCategoria}>
                    Total: {totalKg > 0 ? `${totalKg} kg ` : ''}
                    {totalUn > 0 ? `${totalUn} un` : ''}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}