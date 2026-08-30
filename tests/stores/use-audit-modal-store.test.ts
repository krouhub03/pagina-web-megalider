import { describe, it, expect, beforeEach } from 'vitest';
import { useAuditModalStore } from '@/lib/stores/use-audit-modal-store';

describe('AuditModalStore (Zustand)', () => {
  beforeEach(() => {
    useAuditModalStore.getState().closeAllModals();
  });

  it('debe iniciar con todos los modales cerrados', () => {
    const state = useAuditModalStore.getState();
    expect(state.isFacturaModalOpen).toBe(false);
    expect(state.isItemModalOpen).toBe(false);
    expect(state.editingFacturaId).toBeNull();
    expect(state.editingItemId).toBeNull();
  });

  it('debe abrir el modal de factura con la pestaña por defecto', () => {
    useAuditModalStore.getState().openFacturaModal(15);

    const state = useAuditModalStore.getState();
    expect(state.isFacturaModalOpen).toBe(true);
    expect(state.editingFacturaId).toBe(15);
    expect(state.activeTab).toBe('general');
  });

  it('debe abrir el modal de ítem individual', () => {
    useAuditModalStore.getState().openItemModal(42);

    const state = useAuditModalStore.getState();
    expect(state.isItemModalOpen).toBe(true);
    expect(state.editingItemId).toBe(42);
  });

  it('debe cerrar todos los modales y limpiar identificadores', () => {
    useAuditModalStore.getState().openFacturaModal(10, 'items');
    useAuditModalStore.getState().openItemModal(20);

    useAuditModalStore.getState().closeAllModals();

    const state = useAuditModalStore.getState();
    expect(state.isFacturaModalOpen).toBe(false);
    expect(state.isItemModalOpen).toBe(false);
    expect(state.editingFacturaId).toBeNull();
    expect(state.editingItemId).toBeNull();
  });
});
