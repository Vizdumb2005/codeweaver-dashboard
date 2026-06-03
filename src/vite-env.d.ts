/// <reference types="vite/client" />

// Environment Variables Type Declarations
// All environment variables prefixed with VITE_ are available here

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_BASE_PATH: string;
  readonly VITE_PORT: string;
  readonly VITE_HOST: string;
  readonly VITE_OPEN_BROWSER: string;
  readonly VITE_SOURCEMAP: string;
  readonly VITE_MINIFY: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_BASE_URL: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_LOGGING: string;
  readonly VITE_ENABLE_MOCKS: string;
  readonly VITE_DEBUG: string;
  readonly VITE_ENV_META: string;
  readonly VITE_SITEMAP_URL: string;
  readonly VITE_PREVIEW_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global constants defined in vite.config.ts
declare const __APP_VERSION__: string;
declare const __APP_NAME__: string;
declare const __ENV__: 'development' | 'staging' | 'production';

// Global types
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}
