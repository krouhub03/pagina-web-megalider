import { create } from 'zustand';

export interface QuickViewProduct {
  id: string;
  nombre: string;
  precio: number;
  imagenUrl: string;
  categoria: string;
  descripcion?: string;
  stockActual?: number;
  destacado?: boolean;
}

interface QuickViewState {
  isOpen: boolean;
  product: QuickViewProduct | null;

  // Acciones
  openQuickView: (product: QuickViewProduct) => void;
  closeQuickView: () => void;
}

export const useQuickViewStore = create<QuickViewState>((set) => ({
  isOpen: false,
  product: null,

  openQuickView: (product) => set({ isOpen: true, product }),
  closeQuickView: () => set({ isOpen: false, product: null }),
}));
