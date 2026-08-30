import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

interface AgeVerificationState {
  isVerified: boolean;
  verifyAge: () => void;
  resetVerification: () => void;
}

import { safeStorage } from './safe-storage';

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
