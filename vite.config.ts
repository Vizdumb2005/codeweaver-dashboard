/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import zlib from 'zlib';
import fs from 'fs';

function compressionPlugin() {
  return {
    name: 'gzip-brotli-compression',
    apply: 'build' as const,
    async closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(outDir)) return;
      const getFilesRecursive = (dir: string): string[] => {
        const results: string[] = [];
        const list = fs.readdirSync(dir);
        list.forEach((file) => {
          const fullPath = path.resolve(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat && stat.isDirectory()) {
            results.push(...getFilesRecursive(fullPath));
          } else {
            results.push(fullPath);
          }
        });
        return results;
      };
      
      const files = getFilesRecursive(outDir);
      for (const file of files) {
        if (/\.(js|css|html|svg|json)$/.test(file)) {
          const content = fs.readFileSync(file);
          // Gzip
          const gzipContent = zlib.gzipSync(content);
          fs.writeFileSync(`${file}.gz`, gzipContent);
          // Brotli
          if (zlib.brotliCompressSync) {
            const brotliContent = zlib.brotliCompressSync(content);
            fs.writeFileSync(`${file}.br`, brotliContent);
          }
        }
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Project root
    root: process.cwd(),

    // Base public path (for deployment)
    base: env.VITE_BASE_PATH || '/',

    // Plugins
    plugins: [react(), compressionPlugin()],

    // Resolve aliases for clean imports
    resolve: {
      alias: {
        // Absolute imports from src/
        '@': path.resolve(__dirname, 'src'),
        // Assets
        '@assets': path.resolve(__dirname, 'src/assets'),
        // Components
        '@components': path.resolve(__dirname, 'src/components'),
        // Pages
        '@pages': path.resolve(__dirname, 'src/pages'),
        // Styles
        '@styles': path.resolve(__dirname, 'src/styles'),
        // Utils
        '@utils': path.resolve(__dirname, 'src/utils'),
        // Services/API
        '@services': path.resolve(__dirname, 'src/services'),
        // Hooks (React)
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        // Types
        '@types': path.resolve(__dirname, 'src/types'),
      },
    },

    // Build configuration
    build: {
      // Output directory
      outDir: 'dist',
      
      // Sourcemap generation
      sourcemap: env.VITE_SOURCEMAP === 'true',

      // Minification
      minify: env.VITE_MINIFY === 'false' ? false : 'esbuild',

      // Rollup options
      rollupOptions: {
        treeshake: true,
        // Manual chunks for better code splitting
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor';
              }
              return 'vendor-other';
            }
            if (id.includes('js/components/')) {
              const parts = id.split('js/components/');
              const name = parts[parts.length - 1].replace(/\.js$/, '');
              return `screen-${name}`;
            }
            if (id.includes('js/')) {
              const parts = id.split('js/');
              const name = parts[parts.length - 1].replace(/\.js$/, '');
              return `core-${name}`;
            }
          },
        },
      },

      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },

    // Server configuration
    server: {
      port: parseInt(env.VITE_PORT || '3000'),
      host: env.VITE_HOST || 'localhost',
      open: env.VITE_OPEN_BROWSER === 'true',
      
      // Proxy configuration (extend as needed)
      proxy: {
        // Example: proxy API requests
        // '/api': {
        //   target: env.VITE_API_BASE_URL,
        //   changeOrigin: true,
        // },
      },
    },

    // Preview server
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT || '4173'),
      host: env.VITE_HOST || 'localhost',
    },

    // Environment variables prefix
    envPrefix: 'VITE_',

    // CSS preprocessing
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@styles/variables.scss";',
        },
      },
    },

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME || 'CodeWeaver Dashboard'),
      __ENV__: JSON.stringify(mode),
    },

    // Vitest Configuration
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      include: ['tests/core.test.ts', 'tests/vitals.test.ts', 'tests/sentry.test.ts', 'tests/performance.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  };
});
