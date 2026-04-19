// components/StatusBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, typography } from '../styles/tokens';

type StatusType = 'ok' | 'critical' | 'zero';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig = {
  ok: { bg: colors.statusOkBg, text: colors.statusOk, label: 'OK' },
  critical: { bg: colors.statusWarnBg, text: colors.statusWarn, label: 'Crítico' },
  zero: { bg: colors.statusDangerBg, text: colors.statusDanger, label: 'Zerado' },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{label || config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  text: {
    fontSize: typography.badge.fontSize,
    fontWeight: typography.badge.fontWeight,
  },
});