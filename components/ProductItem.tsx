// components/ProductItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing } from '../styles/tokens';
import { StatusBadge } from './StatusBadge';
import type { Produto } from '../types/produto';

interface ProductItemProps {
  produto: Produto;
  onPress?: (produto: Produto) => void;
}

function getStatus(quantidade: number | undefined): 'ok' | 'critical' | 'zero' {
  if (!quantidade || quantidade <= 0) return 'zero';
  return 'ok';
}

export function ProductItem({ produto, onPress }: ProductItemProps) {
  const qtdDisplay = produto.quantidade ?? produto.quantidadeKg ?? 0;
  const status = getStatus(qtdDisplay);
  
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(produto)} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>📦</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={1}>{produto.nome}</Text>
        <Text style={styles.meta}>
          {produto.categoria}
          {produto.codigoBarras ? ` · ${produto.codigoBarras}` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.quantidade}>{qtdDisplay}</Text>
        <StatusBadge status={status} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.boxBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nome: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
  },
  quantidade: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
});