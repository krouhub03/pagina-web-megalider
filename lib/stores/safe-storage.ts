import { StateStorage } from 'zustand/middleware';

const memoryStorage = new Map<string, string>();

/**
 * Adaptador safeStorage para Zustand middleware/persist.
 * Previene errores de SSR e hydration mismatch en Next.js App Router,
 * así como fallos en entornos Node.js / Vitest donde `window.localStorage` no está definido.
 */
export const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(name);
    }
    return memoryStorage.get(name) || null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(name, value);
    } else {
      memoryStorage.set(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(name);
    } else {
      memoryStorage.delete(name);
    }
  },
};
