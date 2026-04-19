import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView
} from 'react-native';
import { useAlertasEstoque } from '@/hooks/useAlertasEstoque';
import { useTheme } from '../context/ThemeContext';

export function AlertasBadge() {
  const { colors } = useTheme();
  const { 
    loading,
    alertasValidade,
    alertasEstoqueMinimo,
    todosAlertas,
    totalAlertas,
    totalVencendo,
    totalVencidos
  } = useAlertasEstoque();
  const [modalVisible, setModalVisible] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'todos' | 'estoque' | 'validade'>('todos');

  if (loading || totalAlertas === 0) return null;

  const getCorPorGravidade = (gravidade: string) => {
    switch (gravidade) {
      case 'alta': return '#ef4444'; // vermelho
      case 'media': return '#f59e0b'; // laranja
      case 'baixa': return '#eab308'; // amarelo
      default: return colors.icon;
    }
  };

  const filtrarAlertas = () => {
    switch (abaAtiva) {
      case 'estoque':
        return todosAlertas.filter(a => a.tipo === 'estoqueMinimo');
      case 'validade':
        return todosAlertas.filter(a => a.tipo === 'validade');
      default:
        return todosAlertas;
    }
  };

  const styles = StyleSheet.create({
    badge: {
      backgroundColor: '#ef4444',
      borderRadius: 16,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    badgeText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.title,
    },
    closeButton: {
      padding: 8,
    },
    closeText: {
      fontSize: 18,
      color: colors.subtitle,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabAtiva: {
      backgroundColor: colors.icon,
    },
    tabText: {
      color: colors.text,
      fontWeight: '500',
    },
    tabTextAtiva: {
      color: '#fff',
    },
    alertaItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 4,
    },
    alertaTitulo: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.title,
      marginBottom: 4,
    },
    alertaMensagem: {
      fontSize: 14,
      color: colors.text,
    },
    alertaSubtitulo: {
      fontSize: 12,
      color: colors.subtitle,
      marginTop: 4,
    },
    resumoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
    },
    resumoItem: {
      alignItems: 'center',
    },
    resumoValor: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.title,
    },
    resumoLabel: {
      fontSize: 12,
      color: colors.subtitle,
    },
  });

  return (
    <>
      <TouchableOpacity 
        style={styles.badge} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.badgeText}>⚠️ {totalAlertas}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alertas do Estoque</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Abas */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, abaAtiva === 'todos' && styles.tabAtiva]}
                onPress={() => setAbaAtiva('todos')}
              >
                <Text style={[styles.tabText, abaAtiva === 'todos' && styles.tabTextAtiva]}>
                  Todos ({alertasValidade.length + alertasEstoqueMinimo.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, abaAtiva === 'estoque' && styles.tabAtiva]}
                onPress={() => setAbaAtiva('estoque')}
              >
                <Text style={[styles.tabText, abaAtiva === 'estoque' && styles.tabTextAtiva]}>
                  Estoque ({todosAlertas.filter(a => a.tipo === 'estoqueMinimo').length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, abaAtiva === 'validade' && styles.tabAtiva]}
                onPress={() => setAbaAtiva('validade')}
              >
                <Text style={[styles.tabText, abaAtiva === 'validade' && styles.tabTextAtiva]}>
                  Validade ({alertasValidade.length})
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={abaAtiva === 'validade' ? alertasValidade : abaAtiva === 'estoque' ? alertasEstoqueMinimo : todosAlertas}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={[styles.alertaItem, { borderLeftColor: getCorPorGravidade(item.gravidade) }]}>
                  <Text style={styles.alertaTitulo}>{item.produto.nome}</Text>
                  <Text style={styles.alertaMensagem}>{item.mensagem}</Text>
                  <Text style={styles.alertaSubtitulo}>
                    Categoria: {item.produto.categoria} | 
                    Estoque: {item.produto.quantidade} un {item.produto.quantidadeKg ? `/ ${item.produto.quantidadeKg} kg` : ''}
                  </Text>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />

            {/* Resumo */}
            <View style={styles.resumoContainer}>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoValor}>{alertasEstoqueMinimo.length}</Text>
                <Text style={styles.resumoLabel}>Estoque baixo</Text>
              </View>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoValor}>{totalVencendo}</Text>
                <Text style={styles.resumoLabel}>A vencer</Text>
              </View>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoValor}>{totalVencidos}</Text>
                <Text style={styles.resumoLabel}>Vencidos</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}