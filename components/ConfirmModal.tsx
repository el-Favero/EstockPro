// components/ConfirmModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  icon?: string;
  iconColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const C = {
  bg: '#0B1420',
  card: '#142035',
  border: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  textSec: 'rgba(255,255,255,0.5)',
  accent: '#378ADD',
  danger: '#ef4444',
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmColor = C.accent,
  icon,
  iconColor = C.accent,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          {icon && (
            <View style={[styles.iconWrap, { backgroundColor: iconColor + '20' }]}>
              <Ionicons name={icon as any} size={28} color={iconColor} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <Pressable
              style={[styles.btn, styles.btnCancel]}
              onPress={onCancel}
            >
              <Text style={styles.btnCancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
            >
              <Text style={styles.btnConfirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: C.textSec,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: C.border,
  },
  btnCancelText: {
    color: C.text,
    fontWeight: '600',
    fontSize: 15,
  },
  btnConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});