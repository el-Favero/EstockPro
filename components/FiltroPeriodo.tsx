// components/FiltroPeriodo.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';

interface FiltroPeriodoProps {
  onFiltrar: (periodo: { inicio: string; fim: string }) => void;
}

export function FiltroPeriodo({ onFiltrar }: FiltroPeriodoProps) {
  const { colors } = useTheme();
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [showPicker, setShowPicker] = useState<'inicio' | 'fim' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(null);
    }
    
    if (selectedDate && showPicker) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      if (showPicker === 'inicio') {
        setInicio(dateStr);
      } else {
        setFim(dateStr);
      }
      
      // Atualizar filtro
      const novoInicio = showPicker === 'inicio' ? dateStr : inicio;
      const novoFim = showPicker === 'fim' ? dateStr : fim;
      onFiltrar({ inicio: novoInicio, fim: novoFim });
    }
  };

  const limparFiltros = () => {
    setInicio('');
    setFim('');
    onFiltrar({ inicio: '', fim: '' });
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.title,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    dateInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    button: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    buttonFiltrar: {
      backgroundColor: colors.icon,
    },
    buttonLimpar: {
      backgroundColor: colors.border,
    },
    buttonText: {
      color: '#fff',
      fontWeight: '600',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.card,
      margin: 20,
      borderRadius: 16,
      padding: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.title,
      marginBottom: 20,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filtrar por Período</Text>
      
      <View style={styles.row}>
        <TouchableOpacity 
          style={{ flex: 1 }}
          onPress={() => setShowPicker('inicio')}
        >
          <TextInput
            style={styles.dateInput}
            placeholder="Data inicial"
            placeholderTextColor={colors.subtitle}
            value={inicio}
            editable={false}
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={{ flex: 1 }}
          onPress={() => setShowPicker('fim')}
        >
          <TextInput
            style={styles.dateInput}
            placeholder="Data final"
            placeholderTextColor={colors.subtitle}
            value={fim}
            editable={false}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonFiltrar]}
          onPress={() => onFiltrar({ inicio, fim })}
        >
          <Text style={styles.buttonText}>Aplicar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonLimpar]}
          onPress={limparFiltros}
        >
          <Text style={styles.buttonText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showPicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={!!showPicker}
          onRequestClose={() => setShowPicker(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Selecionar {showPicker === 'inicio' ? 'Data Inicial' : 'Data Final'}
              </Text>
              
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                style={{ marginBottom: 20 }}
              />
              
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonFiltrar]}
                  onPress={() => setShowPicker(null)}
                >
                  <Text style={styles.buttonText}>Confirmar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}