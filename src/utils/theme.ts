// Theme Management Utilities

import { setStorage } from './storage';

const THEME_KEY = 'codeweaver-theme';
const LIGHT_CLASS = 'theme-light';

/**
 * Theme type
 */
export type Theme = 'dark' | 'light';

/**
 * Get the current theme from localStorage or system preference
 */
export function getTheme(): Theme {
  return 'dark';
}

/**
 * Set the theme and persist to localStorage
 */
export function setTheme(theme: Theme): void {
  setStorage<Theme>(THEME_KEY, theme);
  updateThemeClass();
}

/**
 * Toggle between dark and light themes
 */
export function toggleTheme(): Theme {
  return 'dark';
}

/**
 * Update the HTML element class based on theme
 * Note: Dark theme is default (no class needed), light theme is disabled
 */
function updateThemeClass(): void {
  const html = document.documentElement;
  html.classList.remove(LIGHT_CLASS);
}

/**
 * Initialize theme on page load
 */
export function initializeTheme(): void {
  updateThemeClass();
}

/**
 * Listen for system theme changes (disabled)
 */
export function setupThemeListener(): void {
  // No-op
}
