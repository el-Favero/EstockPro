import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { findProdutoPorCodigoBarras } from '../services/produtoService';
import { toast } from '../utils/toast';

type ReturnTo = 'estoque' | 'movimentacao';

export default function EscanearScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const dest: ReturnTo = returnTo === 'movimentacao' ? 'movimentacao' : 'estoque';

  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleBarcode = useCallback(
    async (data: string) => {
      if (busy || scanned || !data?.trim()) return;
      setBusy(true);
      setScanned(true);
      try {
        const produto = await findProdutoPorCodigoBarras(data.trim());
        if (produto) {
          if (dest === 'movimentacao') {
            router.replace({
              pathname: '/(tabs)/movimentacao',
              params: { selecionarProdutoId: produto.id },
            });
          } else {
            router.replace({
              pathname: '/(tabs)/estoque',
              params: { busca: produto.nome },
            });
          }
        } else {
          router.replace({
            pathname: '/(tabs)/cadastro',
            params: { codigoBarras: data.trim() },
          });
        }
      } catch {
        toast.error('Não foi possível buscar o produto. Tente de novo.');
        setScanned(false);
      } finally {
        setBusy(false);
      }
    },
    [busy, scanned, dest, router]
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.title, textAlign: 'center', padding: 24 }}>
          O scanner de código não está disponível na versão web. Use o app no celular.
        </Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.icon }]} onPress={() => router.back()}>
          <Text style={styles.btnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.icon} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.title, marginBottom: 16, textAlign: 'center', paddingHorizontal: 24 }}>
          Precisamos da câmera para ler o código de barras.
        </Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.icon }]} onPress={() => requestPermission()}>
          <Text style={styles.btnText}>Permitir câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
          <Text style={{ color: colors.subtitle }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr', 'codabar'],
        }}
        onBarcodeScanned={
          scanned || busy
            ? undefined
            : ({ data }) => {
                void handleBarcode(data);
              }
        }
      />
      <View style={styles.overlayTop}>
        <TouchableOpacity style={styles.closePill} onPress={() => router.back()}>
          <Text style={styles.closePillText}>Fechar</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Aponte para o código de barras</Text>
      </View>
      {busy && (
        <View style={styles.busy}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlayTop: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 12,
  },
  closePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  closePillText: { color: '#fff', fontWeight: '600' },
  hint: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  busy: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  btn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
});
