// context/SettingsContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsType {
  notificacoes: boolean;
  som: boolean;
  vibracao: boolean;
  backupAutomatico: boolean;
}

interface SettingsContextType {
  settings: SettingsType;
  updateSetting: <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => Promise<void>;
  loading: boolean;
}

const DEFAULT_SETTINGS: SettingsType = {
  notificacoes: true,
  som: true,
  vibracao: false,
  backupAutomatico: false,
};

const STORAGE_KEY = '@estoque:settings';

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.log('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.log('Erro ao salvar configuração:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);