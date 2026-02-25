// vitest.setup.ts
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { act } from 'react';

// Suppress act warnings in tests
const originalError = console.error;
console.error = (...args: any[]) => {
  if (args[0]?.includes?.('act(') || args[0]?.includes?.('was not wrapped in act')) {
    return;
  }
  originalError.call(console, ...args);
};

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

// Mock pointer capture methods
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};