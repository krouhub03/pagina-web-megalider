"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  BookOpen,
  Edit,
  Filter,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  RotateCcw,
  PieChart,
} from "lucide-react";
import {
  type PucCuentaItem,
  obtenerInfoClasePuc,
  obtenerTipoEstadoFinanciero,
} from "@/lib/puc-utils";
import ModalCrearEditarPuc from "./ModalCrearEditarPuc";
import BotonEliminarPuc from "./BotonEliminarPuc";

interface Props {
  cuentasIniciales: PucCuentaItem[];
}

export default function PucTablaInteractive({ cuentasIniciales }: Props) {
  const [search, setSearch] = useState("");
  const [filtroNivel, setFiltroNivel] = useState<number>(0);
  const [filtroNaturaleza, setFiltroNaturaleza] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [cuentaEditar, setCuentaEditar] = useState<PucCuentaItem | null>(null);

  const normalizeText = (str: string | null | undefined) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    filtroNivel !== 0 ||
    filtroNaturaleza !== "todos" ||
    filtroEstado !== "todos";

  const handleLimpiarFiltros = () => {
    setSearch("");
    setFiltroNivel(0);
    setFiltroNaturaleza("todos");
    setFiltroEstado("todos");
  };

  // Filtrado reactivo en el cliente
  const cuentasFiltradas = useMemo(() => {
    return cuentasIniciales.filter((item) => {
      // Búsqueda por código, nombre o descripción (insensible a tildes y mayúsculas)
      const q = normalizeText(search);
      const matchSearch =
        !q ||
        normalizeText(item.codigo).includes(q) ||
        normalizeText(item.nombre).includes(q) ||
        normalizeText(item.descripcion).includes(q);

      // Filtro de Nivel
      const matchNivel =
        filtroNivel === 0 || Number(item.nivel) === Number(filtroNivel);

      // Filtro de Naturaleza
      const natNorm = normalizeText(item.naturaleza);
      const filtroNatNorm = normalizeText(filtroNaturaleza);
      const matchNaturaleza =
        filtroNaturaleza === "todos" ||
        (natNorm !== "" &&
          (natNorm === filtroNatNorm ||
            natNorm.startsWith(filtroNatNorm.charAt(0))));

      // Filtro de Tipo de Estado (Balance General vs Estado de Resultados)
      const tipoEstadoItem = obtenerTipoEstadoFinanciero(item.codigo);
      const matchEstado =
        filtroEstado === "todos" || tipoEstadoItem === filtroEstado;

      return matchSearch && matchNivel && matchNaturaleza && matchEstado;
    });
  }, [cuentasIniciales, search, filtroNivel, filtroNaturaleza, filtroEstado]);

  const handleOpenCrear = () => {
    setCuentaEditar(null);
    setModalOpen(true);
  };

  const handleOpenEditar = (cuenta: PucCuentaItem) => {
    setCuentaEditar(cuenta);
    setModalOpen(true);
  };

  const getClaseBadge = (codigo: string) => {
    const infoClase = obtenerInfoClasePuc(codigo);
    if (!infoClase) return null;

    let bgClass = "bg-amber-100/80 text-amber-900 border-amber-300";
    if (infoClase.tipoEstado === "BALANCE_GENERAL") {
      bgClass = "bg-[#044a23]/10 text-[#044a23] border-[#044a23]/30";
    } else if (infoClase.tipoEstado === "CUENTAS_DE_ORDEN") {
      bgClass = "bg-purple-100 text-purple-900 border-purple-300";
    }

    return (
      <span
        title={infoClase.descripcion}
        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${bgClass}`}
      >
        C{infoClase.clase} - {infoClase.nombre}
      </span>
    );
  };

  const getNivelBadge = (nivel: number | null) => {
    switch (nivel) {
      case 1:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#044a23] text-white border border-[#067335]">
            Clase (Nivel 1)
          </span>
        );
      case 2:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#038C3E]/15 text-[#044a23] border border-[#038C3E]/30">
            Grupo (Nivel 2)
          </span>
        );
      case 3:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Cuenta (Nivel 3)
          </span>
        );
      case 4:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            Subcuenta (Nivel 4)
          </span>
        );
      case 5:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
            Auxiliar (Nivel 5)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600">
            Nivel {nivel || "N/A"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-gray-500 font-medium">
          Mostrando <strong className="text-gray-900 font-bold">{cuentasFiltradas.length}</strong> de{" "}
          <strong className="text-gray-900 font-bold">{cuentasIniciales.length}</strong> cuentas contables
        </div>
        <button
          onClick={handleOpenCrear}
          className="px-4 py-2.5 rounded-xl bg-[#038C3E] hover:bg-[#044a23] text-white text-xs font-semibold shadow-[#038C3E]/20 shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Cuenta PUC</span>
        </button>
      </div>

      {/* Filter and Search Bar Container */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full">
          {/* Input Búsqueda */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#038C3E]/20 focus:border-[#038C3E] transition-all"
            />
          </div>

          {/* Filtro Tipo de Estado (Balance vs Resultado) */}
          <div className="flex items-center gap-2">
            <PieChart className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-[#038C3E]/20 focus:border-[#038C3E] transition-all font-medium"
            >
              <option value="todos">Todos los Estados Financieros</option>
              <option value="BALANCE_GENERAL">Balance General (Clases 1, 2, 3)</option>
              <option value="ESTADO_RESULTADOS">Estado de Resultados (Clases 4, 5, 6, 7)</option>
              <option value="CUENTAS_DE_ORDEN">Cuentas de Orden (Clases 8, 9)</option>
            </select>
          </div>

          {/* Filtro Nivel */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(Number(e.target.value))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-[#038C3E]/20 focus:border-[#038C3E] transition-all"
            >
              <option value={0}>Todos los Niveles</option>
              <option value={1}>Nivel 1 (Clase)</option>
              <option value={2}>Nivel 2 (Grupo)</option>
              <option value={3}>Nivel 3 (Cuenta)</option>
              <option value={4}>Nivel 4 (Subcuenta)</option>
              <option value={5}>Nivel 5 (Auxiliar)</option>
            </select>
          </div>

          {/* Filtro Naturaleza */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={filtroNaturaleza}
              onChange={(e) => setFiltroNaturaleza(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-[#038C3E]/20 focus:border-[#038C3E] transition-all"
            >
              <option value="todos">Todas las Naturalezas</option>
              <option value="Débito">Débito</option>
              <option value="Crédito">Crédito</option>
            </select>
          </div>

          {/* Botón Limpiar Filtros */}
          {hasActiveFilters && (
            <button
              onClick={handleLimpiarFiltros}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto sm:ml-0"
              title="Restablecer búsqueda y filtros"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                <th className="py-3.5 px-4 cursor-help" title="Código numérico estandarizado de la cuenta contable en el Plan Único de Cuentas">Código PUC</th>
                <th className="py-3.5 px-4 cursor-help" title="Nombre oficial asignado a la cuenta contable">Nombre de la Cuenta</th>
                <th className="py-3.5 px-4 cursor-help" title="Clase a la que pertenece (Clases 1 a 3 para Balance General, Clases 4 a 7 para Estado de Resultados)">Clase PUC</th>
                <th className="py-3.5 px-4 cursor-help" title="Nivel jerárquico de la cuenta según la longitud del código (Clase, Grupo, Cuenta, Subcuenta, Auxiliar)">Nivel</th>
                <th className="py-3.5 px-4 cursor-help" title="Naturaleza contable dominante de la cuenta (Débito o Crédito)">Naturaleza</th>
                <th className="py-3.5 px-4 cursor-help" title="Detalle explicativo del uso o aplicación contable de la cuenta">Descripción</th>
                <th className="py-3.5 px-4 text-right cursor-help" title="Opciones disponibles para editar o eliminar la cuenta PUC registrada">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {cuentasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-8 h-8 text-gray-300" />
                      <p className="font-semibold text-gray-700">No se encontraron cuentas PUC</p>
                      <p className="text-xs text-gray-400">
                        Intenta ajustar los criterios de búsqueda o registra una nueva cuenta.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                cuentasFiltradas.map((cuenta) => (
                  <tr key={cuenta.codigo} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      {cuenta.codigo}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {cuenta.nombre || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {getClaseBadge(cuenta.codigo)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getNivelBadge(cuenta.nivel)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          normalizeText(cuenta.naturaleza).startsWith("d")
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {normalizeText(cuenta.naturaleza).startsWith("d")
                          ? "Débito"
                          : "Crédito"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">
                      {cuenta.descripcion || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditar(cuenta)}
                          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-[#038C3E] transition-colors"
                          title="Editar Cuenta PUC"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <BotonEliminarPuc
                          codigo={cuenta.codigo}
                          nombre={cuenta.nombre || cuenta.codigo}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear / Editar */}
      <ModalCrearEditarPuc
        cuentaEditar={cuentaEditar}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

