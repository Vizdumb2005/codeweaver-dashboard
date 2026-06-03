import './styles/global.scss';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

// Log environment info in development
if (__ENV__ === 'development' && import.meta.env.VITE_DEBUG === 'true') {
  console.warn('[CodeWeaver Dashboard]', {
    env: __ENV__,
    version: __APP_VERSION__,
    name: __APP_NAME__,
    api: import.meta.env.VITE_API_BASE_URL,
  });
}

// Render the application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
