// components/historico/CardMes.tsx
import React from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { MesHistorico } from '../../types/historico';
import ListaDias from './ListaDias';
import TotalCategoria from './Totalcategoria';

// Ativar animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  mes: MesHistorico;
  expanded: boolean;
  onToggle: () => void;
}

export default function CardMes({ mes, expanded, onToggle }: Props) {
  const { colors } = useTheme();

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    headerLeft: {
      flex: 1,
    },
    mesTitulo: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.title,
      marginBottom: 4,
    },
    totalGeral: {
      fontSize: 14,
      color: colors.subtitle,
    },
    expandIcon: {
      fontSize: 24,
      color: colors.icon,
      width: 32,
      textAlign: 'center',
    },
    content: {
      padding: 16,
      paddingTop: 0,
    },
    divisor: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={handleToggle} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Text style={styles.mesTitulo}>{mes.mes}</Text>
          <Text style={styles.totalGeral}>
            Total: {mes.totais.kg > 0 ? `${mes.totais.kg} kg ` : ''}
            {mes.totais.unidades > 0 ? `${mes.totais.unidades} un` : ''}
          </Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {/* Totais por categoria */}
          <TotalCategoria mes={mes} />
          
          <View style={styles.divisor} />
          
          {/* Lista de dias */}
          <ListaDias dias={mes.dias} />
        </View>
      )}
    </View>
  );
}