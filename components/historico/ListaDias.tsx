// components/historico/ListaDias.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useEstoque } from '../../context/estoqueStorage';
import { DiaHistorico } from '../../types/historico';
import ObservacaoDia from './ObservacaoDia';

interface Props {
  dias: DiaHistorico[];
}

export default function ListaDias({ dias }: Props) {
  const { colors } = useTheme();
  const { observacoesPorDia } = useEstoque();
  const [diaExpandido, setDiaExpandido] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      gap: 12,
    },
    diaCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    diaHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
    },
    diaInfo: {
      flex: 1,
    },
    diaData: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.title,
    },
    diaSemana: {
      fontSize: 12,
      color: colors.subtitle,
      marginTop: 2,
    },
    diaTotal: {
      fontSize: 14,
      color: colors.icon,
      fontWeight: '500',
    },
    expandButton: {
      padding: 4,
    },
    expandIcon: {
      fontSize: 18,
      color: colors.subtitle,
    },
    diaContent: {
      padding: 12,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: colors.border + '40',
    },
    movItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '20',
    },
    movIcon: {
      fontSize: 16,
      width: 24,
      textAlign: 'center',
    },
    movInfo: {
      flex: 1,
      marginLeft: 8,
    },
    movNome: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    movDetalhes: {
      fontSize: 12,
      color: colors.subtitle,
      marginTop: 2,
    },
    movQuantidade: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.title,
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      {dias.map((dia) => (
        <View key={dia.data} style={styles.diaCard}>
          <TouchableOpacity
            style={styles.diaHeader}
            onPress={() => setDiaExpandido(diaExpandido === dia.data ? null : dia.data)}
          >
            <View style={styles.diaInfo}>
              <Text style={styles.diaData}>{dia.dataFormatada} • {dia.diaSemana}</Text>
              <Text style={styles.diaTotal}>
                {dia.totalKg > 0 ? `${dia.totalKg} kg ` : ''}
                {dia.totalUnidades > 0 ? `${dia.totalUnidades} un` : ''}
              </Text>
            </View>
            <View style={styles.expandButton}>
              <Text style={styles.expandIcon}>
                {diaExpandido === dia.data ? '▼' : '▶'}
              </Text>
            </View>
          </TouchableOpacity>

          {diaExpandido === dia.data && (
            <View style={styles.diaContent}>
              {dia.movimentacoes.map((mov) => (
                <View key={mov.id} style={styles.movItem}>
                  <Text style={styles.movIcon}>
                    {mov.tipo === 'retirada' ? '🔴' : '🟢'}
                  </Text>
                  <View style={styles.movInfo}>
                    <Text style={styles.movNome}>{mov.nomeProduto}</Text>
                    <Text style={styles.movDetalhes}>
                      {mov.finalidade && `📝 ${mov.finalidade}`}
                    </Text>
                  </View>
                  <Text style={styles.movQuantidade}>
                    {mov.quantidadeUnidades ? `${mov.quantidadeUnidades} un` : ''}
                    {mov.quantidadeKg ? `${mov.quantidadeKg} kg` : ''}
                  </Text>
                </View>
              ))}
              
              <ObservacaoDia
                data={dia.data}
                observacao={observacoesPorDia[dia.data] ?? dia.observacao}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}