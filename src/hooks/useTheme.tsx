// Theme hook for React components

import React, { createContext, useContext, useEffect, useState } from 'react';

import { getTheme, setTheme, Theme, toggleTheme } from '../utils/theme';

export interface ThemeContextValue {
  readonly isDark: boolean;
  readonly isLight: boolean;
  readonly set: (theme: Theme) => void;
  readonly theme: Theme;
  readonly toggle: () => Theme;
}

/**
 * Custom hook for managing theme state in React components
 */
export function useTheme(): ThemeContextValue {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());

  useEffect((): (() => void) => {
    // Keep local state in sync with storage
    const handleStorageChange = (): void => {
      setThemeState(getTheme());
    };

    window.addEventListener('storage', handleStorageChange);
    return (): void => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggle = (): Theme => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
    return newTheme;
  };

  const set = (newTheme: Theme): void => {
    setTheme(newTheme);
    setThemeState(newTheme);
  };

  return {
    isDark: true,
    isLight: false,
    set,
    theme,
    toggle,
  };
}

/**
 * Theme context for providing theme state to the entire app
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  readonly children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeValue = useTheme();
  return <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>;
};

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
