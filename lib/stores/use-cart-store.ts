import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  imagenUrl: string;
  categoria: string;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Acciones
  addItem: (product: Omit<CartItem, 'cantidad'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setIsOpen: (isOpen: boolean) => void;

  // Getters derivados
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

import { safeStorage } from './safe-storage';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((item) => item.id === product.id);

        if (existingIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            cantidad: updatedItems[existingIndex].cantidad + 1,
          };
          set({ items: updatedItems });
        } else {
          set({ items: [...currentItems, { ...product, cantidad: 1 }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, cantidad } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      setIsOpen: (isOpen) => set({ isOpen }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.cantidad, 0),
      getTotalPrice: () => get().items.reduce((total, item) => total + item.precio * item.cantidad, 0),
    }),
    {
      name: 'megalider-cart-storage',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
    }
  )
);
