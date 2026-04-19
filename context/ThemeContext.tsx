// context/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof lightColors;
}

const lightColors = {
  background: '#f5f3ff', // lilás claro
  card: '#ffffff',
  text: '#1e293b',
  title: '#1e40af', // azul escuro
  subtitle: '#64748b',
  border: '#e2e8f0',
  icon: '#4f46e5', // índigo
  success: '#22c55e',
  warning: '#f97316',
  danger: '#ef4444',
  info: '#3b82f6',
  accent: '#4f46e5',
  // Cores específicas para alertas
  alertaVermelho: '#ef4444',
  alertaLaranja: '#f97316',
  alertaAmarelo: '#eab308',
  alertaVerde: '#22c55e',
  alertaAzul: '#3b82f6',
};

const darkColors: typeof lightColors = {
  background: '#0f172a',
  card: '#1e293b',
  text: '#f1f5f9',
  title: '#818cf8',
  subtitle: '#94a3b8',
  border: '#334155',
  icon: '#818cf8',
  success: '#22c55e',
  warning: '#f97316',
  danger: '#ef4444',
  info: '#3b82f6',
  accent: '#818cf8',
  alertaVermelho: '#ef4444',
  alertaLaranja: '#f97316',
  alertaAmarelo: '#eab308',
  alertaVerde: '#22c55e',
  alertaAzul: '#3b82f6',
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

// Cores dark como padrão para evitar flash
const DEFAULT_COLORS = darkColors;

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [colors, setColors] = useState(darkColors);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@estoque:theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
        setColors(savedTheme === 'dark' ? darkColors : lightColors);
      }
    } catch (error) {
      console.log('Erro ao carregar tema:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setColors(newTheme === 'dark' ? darkColors : lightColors);
    try {
      await AsyncStorage.setItem('@estoque:theme', newTheme);
    } catch (error) {
      console.log('Erro ao salvar tema:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);