import { create } from "zustand";

export type TipoFiltroFecha = "todas" | "hoy" | "ayer" | "7dias" | "este_mes" | "personalizado";

interface FacturasFiltrosState {
  busqueda: string;
  fechaFiltro: TipoFiltroFecha;
  fechaInicio: string;
  fechaFin: string;
  proveedorFiltro: string;

  // Acciones
  setBusqueda: (busqueda: string) => void;
  setFechaFiltro: (fechaFiltro: TipoFiltroFecha) => void;
  setFechaInicio: (fechaInicio: string) => void;
  setFechaFin: (fechaFin: string) => void;
  setProveedorFiltro: (proveedorFiltro: string) => void;
  resetFiltros: () => void;
}

const initialState = {
  busqueda: "",
  fechaFiltro: "todas" as TipoFiltroFecha,
  fechaInicio: "",
  fechaFin: "",
  proveedorFiltro: "",
};

export const useFacturasFiltrosStore = create<FacturasFiltrosState>((set) => ({
  ...initialState,

  setBusqueda: (busqueda) => set({ busqueda }),
  setFechaFiltro: (fechaFiltro) => set({ fechaFiltro }),
  setFechaInicio: (fechaInicio) => set({ fechaInicio }),
  setFechaFin: (fechaFin) => set({ fechaFin }),
  setProveedorFiltro: (proveedorFiltro) => set({ proveedorFiltro }),
  resetFiltros: () => set(initialState),
}));
