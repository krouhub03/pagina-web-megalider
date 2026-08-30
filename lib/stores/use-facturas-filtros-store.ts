import { create } from "zustand";

interface FacturasFiltrosState {
  busqueda: string;
  fechaInicio: string;
  fechaFin: string;
  proveedorFiltro: string;

  // Acciones
  setBusqueda: (busqueda: string) => void;
  setFechaInicio: (fechaInicio: string) => void;
  setFechaFin: (fechaFin: string) => void;
  setProveedorFiltro: (proveedorFiltro: string) => void;
  resetFiltros: () => void;
}

const initialState = {
  busqueda: "",
  fechaInicio: "",
  fechaFin: "",
  proveedorFiltro: "",
};

export const useFacturasFiltrosStore = create<FacturasFiltrosState>((set) => ({
  ...initialState,

  setBusqueda: (busqueda) => set({ busqueda }),
  setFechaInicio: (fechaInicio) => set({ fechaInicio }),
  setFechaFin: (fechaFin) => set({ fechaFin }),
  setProveedorFiltro: (proveedorFiltro) => set({ proveedorFiltro }),
  resetFiltros: () => set(initialState),
}));
