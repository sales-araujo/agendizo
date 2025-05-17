import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import tsconfigPaths from 'vite-tsconfig-paths'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      './__tests__/vitest.d.ts',
      './__tests__/setup.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'v8'
    },
    deps: {
      optimizer: {
        web: {
          include: ['vitest-canvas-mock']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'test': path.resolve(__dirname, './__tests__')
    }
  },
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  },
  define: {
    'import.meta.vitest': 'undefined'
  }
}) 