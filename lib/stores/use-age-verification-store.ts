import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

interface AgeVerificationState {
  isVerified: boolean;
  verifyAge: () => void;
  resetVerification: () => void;
}

const memoryStorage = new Map<string, string>();

const safeStorage: StateStorage = {
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

export const useAgeVerificationStore = create<AgeVerificationState>()(
  persist(
    (set) => ({
      isVerified: false,
      verifyAge: () => set({ isVerified: true }),
      resetVerification: () => set({ isVerified: false }),
    }),
    {
      name: 'megalider-age-verification',
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
    }
  )
);
