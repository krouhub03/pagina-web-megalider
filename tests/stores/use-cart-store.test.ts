import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/lib/stores/use-cart-store';

describe('CartStore (Zustand)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('debe iniciar con el carrito vacío', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.getTotalItems()).toBe(0);
    expect(state.getTotalPrice()).toBe(0);
  });

  it('debe agregar un item al carrito', () => {
    const product = {
      id: 'prod-1',
      nombre: 'Aguardiente Néctar',
      precio: 45000,
      imagenUrl: '/images/nectar.jpg',
      categoria: 'Licores',
    };

    useCartStore.getState().addItem(product);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ ...product, cantidad: 1 });
    expect(useCartStore.getState().getTotalItems()).toBe(1);
    expect(useCartStore.getState().getTotalPrice()).toBe(45000);
  });

  it('debe incrementar la cantidad si el item ya existe', () => {
    const product = {
      id: 'prod-1',
      nombre: 'Aguardiente Néctar',
      precio: 45000,
      imagenUrl: '/images/nectar.jpg',
      categoria: 'Licores',
    };

    useCartStore.getState().addItem(product);
    useCartStore.getState().addItem(product);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].cantidad).toBe(2);
    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(useCartStore.getState().getTotalPrice()).toBe(90000);
  });

  it('debe remover un item del carrito', () => {
    const product = {
      id: 'prod-1',
      nombre: 'Aguardiente Néctar',
      precio: 45000,
      imagenUrl: '/images/nectar.jpg',
      categoria: 'Licores',
    };

    useCartStore.getState().addItem(product);
    useCartStore.getState().removeItem('prod-1');

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().getTotalItems()).toBe(0);
  });

  it('debe actualizar la cantidad de un item', () => {
    const product = {
      id: 'prod-1',
      nombre: 'Aguardiente Néctar',
      precio: 45000,
      imagenUrl: '/images/nectar.jpg',
      categoria: 'Licores',
    };

    useCartStore.getState().addItem(product);
    useCartStore.getState().updateQuantity('prod-1', 5);

    expect(useCartStore.getState().items[0].cantidad).toBe(5);
    expect(useCartStore.getState().getTotalPrice()).toBe(225000);
  });

  it('debe eliminar el item si la cantidad se establece en 0 o menos', () => {
    const product = {
      id: 'prod-1',
      nombre: 'Aguardiente Néctar',
      precio: 45000,
      imagenUrl: '/images/nectar.jpg',
      categoria: 'Licores',
    };

    useCartStore.getState().addItem(product);
    useCartStore.getState().updateQuantity('prod-1', 0);

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('debe alternar la visibilidad del drawer del carrito', () => {
    expect(useCartStore.getState().isOpen).toBe(false);
    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isOpen).toBe(true);
    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isOpen).toBe(false);
  });
});
