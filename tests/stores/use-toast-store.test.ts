import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore } from '@/lib/stores/use-toast-store';

describe('ToastStore (Zustand)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.getState().clearToasts();
  });

  it('debe iniciar sin mensajes de toast', () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it('debe agregar un toast con id autogenerado', () => {
    const id = useToastStore.getState().addToast({
      type: 'success',
      title: 'Producto agregado',
      message: 'Se agregó al carrito de compras',
      durationMs: 0, // No auto dismiss en test
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].title).toBe('Producto agregado');
  });

  it('debe eliminar automáticamente el toast tras la duración indicada', () => {
    useToastStore.getState().addToast({
      type: 'info',
      title: 'Alerta temporal',
      durationMs: 3000,
    });

    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(3100);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('debe remover manualmente un toast por id', () => {
    const id1 = useToastStore.getState().addToast({ type: 'warning', title: 'Aviso 1', durationMs: 0 });
    const id2 = useToastStore.getState().addToast({ type: 'error', title: 'Error 2', durationMs: 0 });

    useToastStore.getState().removeToast(id1);

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].id).toBe(id2);
  });
});
