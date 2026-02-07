import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // This allows describe, it, expect without imports
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts', // Changed from jest.setup.ts
    css: true,
    include: ['**/*.{test,spec}.{ts,tsx}'], // Tell Vitest where to find tests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});