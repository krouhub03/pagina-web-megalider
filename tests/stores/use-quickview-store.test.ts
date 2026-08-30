import { describe, it, expect, beforeEach } from 'vitest';
import { useQuickViewStore } from '@/lib/stores/use-quickview-store';

describe('QuickViewStore (Zustand)', () => {
  beforeEach(() => {
    useQuickViewStore.getState().closeQuickView();
  });

  it('debe iniciar cerrado y sin producto', () => {
    const state = useQuickViewStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.product).toBeNull();
  });

  it('debe abrir la vista previa con el producto seleccionado', () => {
    const product = {
      id: 'prod-100',
      nombre: 'Cerveza Club Colombia 330ml',
      precio: 4500,
      imagenUrl: '/images/club.jpg',
      categoria: 'Bebidas',
      descripcion: 'Cerveza dorada de malta',
    };

    useQuickViewStore.getState().openQuickView(product);

    const state = useQuickViewStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.product).toEqual(product);
  });

  it('debe cerrar la vista previa y limpiar el producto', () => {
    const product = {
      id: 'prod-100',
      nombre: 'Cerveza Club Colombia 330ml',
      precio: 4500,
      imagenUrl: '/images/club.jpg',
      categoria: 'Bebidas',
    };

    useQuickViewStore.getState().openQuickView(product);
    useQuickViewStore.getState().closeQuickView();

    const state = useQuickViewStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.product).toBeNull();
  });
});
