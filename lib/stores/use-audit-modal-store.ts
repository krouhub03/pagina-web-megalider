import { create } from 'zustand';

export type AuditTab = 'general' | 'items' | 'historial';

interface AuditModalState {
  isFacturaModalOpen: boolean;
  isItemModalOpen: boolean;
  editingFacturaId: number | null;
  editingItemId: number | null;
  activeTab: AuditTab;

  // Acciones
  openFacturaModal: (facturaId: number, initialTab?: AuditTab) => void;
  closeFacturaModal: () => void;
  openItemModal: (itemId: number) => void;
  closeItemModal: () => void;
  setActiveTab: (tab: AuditTab) => void;
  closeAllModals: () => void;
}

export const useAuditModalStore = create<AuditModalState>((set) => ({
  isFacturaModalOpen: false,
  isItemModalOpen: false,
  editingFacturaId: null,
  editingItemId: null,
  activeTab: 'general',

  openFacturaModal: (editingFacturaId, activeTab = 'general') =>
    set({ isFacturaModalOpen: true, editingFacturaId, activeTab }),

  closeFacturaModal: () =>
    set({ isFacturaModalOpen: false, editingFacturaId: null }),

  openItemModal: (editingItemId) =>
    set({ isItemModalOpen: true, editingItemId }),

  closeItemModal: () =>
    set({ isItemModalOpen: false, editingItemId: null }),

  setActiveTab: (activeTab) => set({ activeTab }),

  closeAllModals: () =>
    set({
      isFacturaModalOpen: false,
      isItemModalOpen: false,
      editingFacturaId: null,
      editingItemId: null,
    }),
}));
