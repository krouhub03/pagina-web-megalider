import { describe, it, expect, beforeEach } from 'vitest';
import { useAgeVerificationStore } from '@/lib/stores/use-age-verification-store';

describe('AgeVerificationStore (Zustand)', () => {
  beforeEach(() => {
    useAgeVerificationStore.getState().resetVerification();
  });

  it('debe iniciar sin verificar por defecto', () => {
    expect(useAgeVerificationStore.getState().isVerified).toBe(false);
  });

  it('debe confirmar la mayoría de edad', () => {
    useAgeVerificationStore.getState().verifyAge();
    expect(useAgeVerificationStore.getState().isVerified).toBe(true);
  });

  it('debe reiniciar la verificación', () => {
    useAgeVerificationStore.getState().verifyAge();
    useAgeVerificationStore.getState().resetVerification();
    expect(useAgeVerificationStore.getState().isVerified).toBe(false);
  });
});
