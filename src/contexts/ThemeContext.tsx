import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceSecondary: string;
    primary: string;
    primaryVariant: string;
    secondary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderLight: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    white: string;
    black: string;
    shadow: string;
    overlay: string;
    gradient: {
      primary: string[];
      secondary: string[];
      accent: string[];
    };
  };
  isDark: boolean;
}

const lightTheme: Theme = {
  colors: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F3F4',
    primary: '#4ECDC4',
    primaryVariant: '#44A08D',
    secondary: '#95A5A6',
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
    textTertiary: '#BDC3C7',
    border: '#E8E8E8',
    borderLight: '#F1F3F4',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    info: '#3498DB',
    white: '#FFFFFF',
    black: '#000000',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    gradient: {
      primary: ['#4ECDC4', '#44A08D'],
      secondary: ['#FFD93D', '#FF8C94'],
      accent: ['#FFABAB', '#FFC3A0'],
    },
  },
  isDark: false,
};

const darkTheme: Theme = {
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceSecondary: '#2D2D2D',
    primary: '#4ECDC4',
    primaryVariant: '#44A08D',
    secondary: '#95A5A6',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#7A7A7A',
    border: '#3A3A3A',
    borderLight: '#2D2D2D',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    info: '#3498DB',
    white: '#FFFFFF',
    black: '#000000',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.8)',
    gradient: {
      primary: ['#4ECDC4', '#44A08D'],
      secondary: ['#FFD93D', '#FF8C94'],
      accent: ['#FFABAB', '#FFC3A0'],
    },
  },
  isDark: true,
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@EcoSteps:theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(isDark));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    saveThemePreference(newTheme);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { lightTheme, darkTheme }; 