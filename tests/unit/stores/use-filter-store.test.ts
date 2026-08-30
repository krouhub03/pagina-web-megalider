import { describe, it, expect, beforeEach } from 'vitest';
import { useFilterStore } from '@/lib/stores/use-filter-store';

describe('FilterStore (Zustand)', () => {
  beforeEach(() => {
    useFilterStore.getState().resetFilters();
  });

  it('debe iniciar con filtros por defecto', () => {
    const state = useFilterStore.getState();
    expect(state.searchQuery).toBe('');
    expect(state.selectedCategory).toBeNull();
    expect(state.minPrice).toBeNull();
    expect(state.maxPrice).toBeNull();
    expect(state.sortBy).toBe('destacados');
    expect(state.onlyInStock).toBe(false);
  });

  it('debe actualizar la consulta de búsqueda', () => {
    useFilterStore.getState().setSearchQuery('Aguardiente');
    expect(useFilterStore.getState().searchQuery).toBe('Aguardiente');
  });

  it('debe actualizar la categoría seleccionada', () => {
    useFilterStore.getState().setSelectedCategory('licores');
    expect(useFilterStore.getState().selectedCategory).toBe('licores');
  });

  it('debe actualizar el rango de precios', () => {
    useFilterStore.getState().setPriceRange(10000, 50000);
    expect(useFilterStore.getState().minPrice).toBe(10000);
    expect(useFilterStore.getState().maxPrice).toBe(50000);
  });

  it('debe restablecer todos los filtros a su estado inicial', () => {
    useFilterStore.getState().setSearchQuery('Ron');
    useFilterStore.getState().setSelectedCategory('licores');
    useFilterStore.getState().setPriceRange(20000, 80000);
    useFilterStore.getState().setSortBy('precio-asc');
    useFilterStore.getState().setOnlyInStock(true);

    useFilterStore.getState().resetFilters();

    const state = useFilterStore.getState();
    expect(state.searchQuery).toBe('');
    expect(state.selectedCategory).toBeNull();
    expect(state.minPrice).toBeNull();
    expect(state.sortBy).toBe('destacados');
    expect(state.onlyInStock).toBe(false);
  });
});
