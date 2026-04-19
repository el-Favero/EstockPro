// components/KpiCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../styles/tokens';

interface KpiCardProps {
  icon: string;
  value: number | string;
  label: string;
  variation?: string;
  accentColor: string;
}

export function KpiCard({ icon, value, label, variation, accentColor }: KpiCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {variation && (
        <Text style={[styles.variation, { color: variation.startsWith('+') ? colors.statusOk : colors.statusWarn }]}>
          {variation}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minWidth: '45%',
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.boxBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconText: {
    fontSize: 16,
  },
  value: {
    fontSize: typography.kpiValue.fontSize,
    fontWeight: typography.kpiValue.fontWeight,
    marginBottom: 2,
  },
  label: {
    fontSize: typography.sectionLabel.fontSize,
    fontWeight: typography.sectionLabel.fontWeight,
    color: colors.textSecondary,
  },
  variation: {
    fontSize: 11,
    marginTop: spacing.xs,
  },
});