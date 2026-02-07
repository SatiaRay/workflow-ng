import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom';

if (typeof import.meta === 'undefined') {
  globalThis.import = {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'mock-anon-key',
        MODE: 'test',
        DEV: true,
        PROD: false,
      }
    }
  } as any;
}

// Clean up after each test
afterEach(() => {
  cleanup();
});