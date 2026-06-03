# CodeWeaver Dashboard - Project Scaffold

## Overview
This is a Vite-powered Single Page Application (SPA) scaffold with clean module boundaries, TypeScript support, and environment-based configuration.

## Project Structure

```
codeweaver-dashboard/
├── public/                    # Static assets (not processed by Vite)
│   ├── favicon.svg            # App icon
│   └── robots.txt            # SEO configuration
│
├── src/                      # Source code
│   ├── assets/               # Processed assets
│   │   ├── data/             # JSON data files
│   │   ├── fonts/            # Custom fonts
│   │   └── images/           # Images (optimized by Vite)
│   │
│   ├── components/           # React components
│   │   ├── common/           # Reusable UI components
│   │   └── layout/           # Layout components (Header, Sidebar, etc.)
│   │
│   ├── hooks/                # Custom React hooks
│   │
│   ├── pages/                # Page-level components (routes)
│   │
│   ├── services/             # API services and external integrations
│   │
│   ├── styles/               # Global styles
│   │   ├── global.scss       # Global styles and reset
│   │   ├── mixins.scss       # SCSS mixins
│   │   └── variables.scss    # SCSS variables and theme
│   │
│   ├── types/                # TypeScript type definitions
│   │   ├── api.d.ts          # API response types
│   │   ├── components.d.ts   # Component prop types
│   │   └── index.ts          # Type exports
│   │
│   ├── utils/                # Utility functions
│   │   ├── api.ts            # API client utilities
│   │   ├── formatters.ts     # Formatting utilities
│   │   ├── index.ts          # Utility exports
│   │   ├── storage.ts        # LocalStorage/sessionStorage utilities
│   │   └── validators.ts     # Validation utilities
│   │
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Entry point
│   └── vite-env.d.ts         # Vite environment type declarations
│
├── .editorconfig              # Editor configuration
├── .env.development          # Development environment variables
├── .env.production           # Production environment variables
├── .env.staging              # Staging environment variables
├── .eslintrc.json            # ESLint configuration
├── .gitignore                # Git ignore rules
├── .prettierrc               # Prettier configuration
├── index.html                # HTML entry point
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tsconfig.node.json        # TypeScript config for node files
└── vite.config.ts            # Vite configuration
```

## Module Boundaries

### @/ (src/)
Root source directory. Import anything from here using absolute paths.

### @assets/
Processed assets (images, fonts, data). These are bundled and optimized by Vite.

### @components/
UI components organized by category:
- **common/**: Reusable components (Button, Input, Modal, Card, etc.)
- **layout/**: Layout components (Header, Sidebar, Footer, MainLayout)

### @pages/
Page-level components that correspond to routes.

### @styles/
Global styling:
- **variables.scss**: Theme variables (colors, typography, spacing, etc.)
- **mixins.scss**: SCSS mixins for reusable style patterns
- **global.scss**: Global styles, reset, and utility classes

### @utils/
Utility functions:
- **api.ts**: API client with request methods
- **formatters.ts**: Date, number, currency formatting
- **storage.ts**: LocalStorage/sessionStorage wrappers
- **validators.ts**: Input validation functions

### @services/
External service integrations (API clients, analytics, etc.)

### @hooks/
Custom React hooks (useLocalStorage, useDebounce, useFetch, etc.)

### @types/
TypeScript type definitions:
- **api.d.ts**: API response/error types
- **components.d.ts**: Component prop interfaces

## Environment Configuration

Three environment files are provided:

### .env.development
Used during development (`npm run dev`)
- Debug mode enabled
- Source maps enabled
- Mock data enabled
- Local API endpoints

### .env.staging
Used for staging builds (`npm run build:staging`)
- Source maps enabled
- Debug mode enabled
- Staging API endpoints

### .env.production
Used for production builds (`npm run build`)
- Source maps disabled
- Minification enabled
- Production API endpoints

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Application name | CodeWeaver Dashboard |
| `VITE_BASE_PATH` | Base URL path | `/` |
| `VITE_PORT` | Development server port | 3000 |
| `VITE_HOST` | Server host | localhost |
| `VITE_OPEN_BROWSER` | Open browser on start | true (dev) |
| `VITE_SOURCEMAP` | Generate source maps | true (dev) |
| `VITE_MINIFY` | Minify output | false (dev) |
| `VITE_API_BASE_URL` | API base URL | http://localhost:8000/api |
| `VITE_WS_BASE_URL` | WebSocket base URL | ws://localhost:8000 |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | false (dev) |
| `VITE_ENABLE_LOGGING` | Enable logging | true (dev) |
| `VITE_ENABLE_MOCKS` | Enable mock data | true (dev) |
| `VITE_DEBUG` | Debug mode | true (dev) |

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:staging` | Build for staging |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |

## Path Aliases

The following path aliases are configured in both Vite and TypeScript:

```typescript
// Instead of this:
import { Button } from '../../../components/common/Button';

// Use this:
import { Button } from '@components/common/Button';

// Available aliases:
// @ -> src/
// @assets -> src/assets/
// @components -> src/components/
// @pages -> src/pages/
// @styles -> src/styles/
// @utils -> src/utils/
// @services -> src/services/
// @hooks -> src/hooks/
// @types -> src/types/
```

## File Organization Guidelines

1. **Components**: Each component should be in its own directory with:
   - `ComponentName.tsx` - Component implementation
   - `ComponentName.stories.tsx` - Storybook stories (optional)
   - `ComponentName.test.tsx` - Unit tests (optional)
   - `index.ts` - Barrel export

2. **Pages**: Each page should be in its own directory with:
   - `PageName.tsx` - Page component
   - `PageName.styles.scss` - Page-specific styles (optional)
   - `index.ts` - Barrel export

3. **Hooks**: Each hook should be in its own file with:
   - `useHookName.ts` - Hook implementation
   - Export at the end of the file

4. **Utils**: Group related utilities together in files by domain.

5. **Types**: Define types close to where they're used, export from index.ts for external use.

## TypeScript Configuration

- Strict mode enabled
- ES2020 target
- Module resolution: bundler
- Path aliases configured

## Styling

- SCSS support with global variable injection
- CSS Modules support with camelCase naming
- Utility classes available in global.scss
- Responsive breakpoints defined in variables.scss

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## Notes

- The scaffold uses React 18 with TypeScript
- Vite provides fast development and optimized production builds
- ESLint and Prettier are configured for code quality
- All existing files have been preserved with .backup extensions
