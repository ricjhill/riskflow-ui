/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    proxy: {
      '/health': 'http://localhost:8000',
      '/schemas': 'http://localhost:8000',
      '/sessions': 'http://localhost:8000',
      '/sheets': 'http://localhost:8000',
      '/upload': 'http://localhost:8000',
      '/corrections': 'http://localhost:8000',
      '/jobs': 'http://localhost:8000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    reporters: ['default', 'junit'],
    outputFile: { junit: 'reports/unit.xml' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/types/**', '**/*.test.{ts,tsx}', '**/*.d.ts'],
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: 'reports/coverage',
    },
  },
})
