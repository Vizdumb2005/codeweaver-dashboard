import './styles/global.scss';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { ToastProvider } from './hooks/useToast';
import { ThemeProvider } from './hooks/useTheme';
import { initializeTheme, setupThemeListener } from './utils/theme';
import { trackWebVitals } from './utils/vitals';
import './utils/performance';
import { sentry } from './services/sentry';
import { syncClient } from './services/sync';

import { AuthProvider } from './hooks/useAuth';

// Initialize theme from localStorage or system preference
initializeTheme();

// Initialize error tracking
sentry.init();

// Start Core Web Vitals tracking
trackWebVitals();

// Start real-time state synchronization
syncClient.connect();

// Listen for system theme changes
setupThemeListener();

// Log environment info in development
if (__ENV__ === 'development' && import.meta.env.VITE_DEBUG === 'true') {
  console.warn('[CodeWeaver Dashboard]', {
    env: __ENV__,
    version: __APP_VERSION__,
    name: __APP_NAME__,
    api: import.meta.env.VITE_API_BASE_URL,
  });
}

// Prepare mock services during development
async function prepareApp() {
  if (__ENV__ === 'development') {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
}

// Render the application
prepareApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
});

// Register Service Worker for offline support and caching (staging & production)
if ('serviceWorker' in navigator && __ENV__ !== 'development') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.warn('[ServiceWorker] Registration successful:', reg.scope))
      .catch((err) => console.warn('[ServiceWorker] Registration failed:', err));
  });
}
