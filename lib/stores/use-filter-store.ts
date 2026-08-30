import { create } from 'zustand';

export type SortOption = 'destacados' | 'precio-asc' | 'precio-desc' | 'nombre-asc';

interface FilterState {
  searchQuery: string;
  selectedCategory: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: SortOption;
  onlyInStock: boolean;

  // Acciones
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setSortBy: (sort: SortOption) => void;
  setOnlyInStock: (inStock: boolean) => void;
  resetFilters: () => void;
}

const initialState = {
  searchQuery: '',
  selectedCategory: null,
  minPrice: null,
  maxPrice: null,
  sortBy: 'destacados' as SortOption,
  onlyInStock: false,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setPriceRange: (minPrice, maxPrice) => set({ minPrice, maxPrice }),
  setSortBy: (sortBy) => set({ sortBy }),
  setOnlyInStock: (onlyInStock) => set({ onlyInStock }),
  resetFilters: () => set(initialState),
}));
