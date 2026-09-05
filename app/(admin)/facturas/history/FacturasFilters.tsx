"use client";

import { Search, RotateCcw, Wallet, ShieldCheck, Clock } from "lucide-react";
import { TipoOperacion, MedioPago } from "./types";

interface FacturasFiltersProps {
  kpis: {
    totalRegistros: number;
    montoTotal: number;
    totalConciliadas: number;
    montoConciliadas: number;
    totalPendientes: number;
  };
  search: string;
  setSearch: (val: string) => void;
  filtroTipoOp: string;
  setFiltroTipoOp: (val: string) => void;
  filtroEstadoContable: string;
  setFiltroEstadoContable: (val: string) => void;
  filtroMedioPago: string;
  setFiltroMedioPago: (val: string) => void;
  tiposOperacion: TipoOperacion[];
  mediosPago: MedioPago[];
  hasActiveFilters: boolean;
  onLimpiarFiltros: () => void;
}

export default function FacturasFilters({
  kpis,
  search,
  setSearch,
  filtroTipoOp,
  setFiltroTipoOp,
  filtroEstadoContable,
  setFiltroEstadoContable,
  filtroMedioPago,
  setFiltroMedioPago,
  tiposOperacion,
  mediosPago,
  hasActiveFilters,
  onLimpiarFiltros,
}: FacturasFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Grid asimétrico: Fila 1 para Total (ancho completo), Fila 2 dividida en 2 columnas para Conciliadas y Pendientes */}
      <div className="grid grid-cols-2 gap-2">
        {/* KPI 1: Total Facturado (Ocupa toda la fila 1 en móvil/tablet y se adapta limpiamente) */}
        <div className="col-span-2 bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400 truncate">Total Compras Aprobadas</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1 font-sans truncate">
              ${kpis.montoTotal.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">{kpis.totalRegistros} documentos registrados</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-[#067335] flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* KPI 2: Conciliadas en Tesorería (Columna 1 de la Fila 2) */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between border-l-3 sm:border-l-4 border-l-[#067335]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#067335] truncate">Conciliadas</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-[#067335] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-emerald-950 font-sans tracking-tight truncate">
              {kpis.totalConciliadas}
            </p>
            <p className="text-[10px] sm:text-[11px] text-[#53A677] font-medium truncate mt-0.5">Asentada</p>
          </div>
        </div>

        {/* KPI 3: Pendientes de Conciliación (Columna 2 de la Fila 2) */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between border-l-3 sm:border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-600 truncate">Pendientes</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-amber-900 font-sans tracking-tight truncate">
              {kpis.totalPendientes}
            </p>
            <p className="text-[10px] sm:text-[11px] text-amber-700 truncate mt-0.5">Sin cuenta</p>
          </div>
        </div>
      </div>

      {/* Filtros Contables Limpios y Adaptados */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 truncate">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">Filtros del Historial</span>
          </span>
          {hasActiveFilters && (
            <button
              onClick={onLimpiarFiltros}
              className="text-xs font-semibold text-[#067335] hover:text-[#038C3E] transition flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Buscador de Texto */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1 truncate">Buscar Proveedor / N° Factura / CUFE</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Ej. Bavaria, 900123456..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#067335]/30 focus:border-[#067335] transition-all bg-gray-50/50 hover:bg-white truncate"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Tipo de Operación */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1 truncate">Tipo de Operación</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#067335]/30 focus:border-[#067335] transition-all bg-gray-50/50 hover:bg-white truncate cursor-pointer"
              value={filtroTipoOp}
              onChange={(e) => setFiltroTipoOp(e.target.value)}
            >
              <option value="todos">Todos los Tipos de Operación</option>
              {tiposOperacion.map((op) => (
                <option key={op.id} value={String(op.id)}>
                  {op.nombre} [{op.cuentaPucDebito}]
                </option>
              ))}
            </select>
          </div>

          {/* Estado Contable */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1 truncate">Estado Contable</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#067335]/30 focus:border-[#067335] transition-all bg-gray-50/50 hover:bg-white truncate cursor-pointer"
              value={filtroEstadoContable}
              onChange={(e) => setFiltroEstadoContable(e.target.value)}
            >
              <option value="todos">Todos los Estados</option>
              <option value="CONCILIADA">Conciliada</option>
              <option value="PENDIENTE_CONCILIACION">Por Conciliar</option>
            </select>
          </div>

          {/* Medio de Pago */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1 truncate">Medio de Pago</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#067335]/30 focus:border-[#067335] transition-all bg-gray-50/50 hover:bg-white truncate cursor-pointer"
              value={filtroMedioPago}
              onChange={(e) => setFiltroMedioPago(e.target.value)}
            >
              <option value="todos">Todos los Medios de Pago</option>
              {mediosPago.map((mp) => (
                <option key={mp.id} value={String(mp.id)}>
                  {mp.nombre || (mp as any).nombreCuenta || mp.codigo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}