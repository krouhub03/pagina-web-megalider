"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Layers,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Printer,
  ChevronLeft,
  ChevronRight,
  Ban,
} from "lucide-react";

/**
 * Formateador de fecha determinista (DD/MM/YYYY) inmune a diferencias de locale entre servidor y cliente (SSR/Hydration).
 */
function formatFechaContable(fecha: string | Date | undefined | null): string {
  if (!fecha) return "—";
  if (typeof fecha === "string") {
    const part = fecha.split("T")[0];
    const parts = part.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

interface AsientoItem {
  id: number;
  facturaId: number;
  cuentaPuc: string;
  concepto: string;
  debito: string;
  credito: string;
  estado?: "ACTIVO" | "ANULADO" | "REVERSADO" | string;
  anuladoEn?: string | Date | null;
  motivoAnulacion?: string | null;
  creadoEn: string | Date;
  cuenta?: {
    codigo: string;
    nombre: string | null;
  } | null;
  factura?: {
    id: number;
    numeroFactura: string;
    fechaEmision: string;
    proveedor?: {
      nit: string;
      razonSocial: string;
    } | null;
  } | null;
}

interface ComprobanteAgrupado {
  facturaId: number;
  factura: AsientoItem["factura"];
  lineas: AsientoItem[];
  totalDeb: number;
  totalCred: number;
  descuadre: number;
  estaBalanceado: boolean;
  esAnulado: boolean;
  fecha: string | Date;
}

export default function LibroDiarioInteractive({
  asientosIniciales,
  pucCuentas,
}: {
  asientosIniciales: AsientoItem[];
  pucCuentas: any[];
}) {
  const [search, setSearch] = useState("");
  const [cuentaFilter, setCuentaFilter] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [estadoBalance, setEstadoBalance] = useState<"TODOS" | "BALANCEADOS" | "DESCUADRADOS">("TODOS");
  const [estadoAuditoria, setEstadoAuditoria] = useState<"SOLO_ACTIVOS" | "SOLO_ANULADOS" | "TODOS">("SOLO_ACTIVOS");
  const [vistaAgrupada, setVistaAgrupada] = useState(true);
  const [fechaImpresion, setFechaImpresion] = useState("");
  
  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  useEffect(() => {
    setFechaImpresion(new Date().toLocaleString("es-CO"));
  }, []);

  // 1. Agrupación base de comprobantes completos (Garantiza Partida Doble atómica)
  const todosLosComprobantes = useMemo<ComprobanteAgrupado[]>(() => {
    const map = new Map<number, AsientoItem[]>();
    for (const a of asientosIniciales) {
      const list = map.get(a.facturaId) || [];
      list.push(a);
      map.set(a.facturaId, list);
    }

    return Array.from(map.entries()).map(([facturaId, lineas]) => {
      const fact = lineas[0]?.factura;
      const esAnulado = lineas.every((l) => l.estado === "ANULADO");
      const totalDeb = lineas.reduce((acc, l) => acc + Number(l.debito || 0), 0);
      const totalCred = lineas.reduce((acc, l) => acc + Number(l.credito || 0), 0);
      const descuadre = Math.abs(totalDeb - totalCred);
      const estaBalanceado = descuadre < 0.05;
      return {
        facturaId,
        factura: fact,
        lineas,
        totalDeb,
        totalCred,
        descuadre,
        estaBalanceado,
        esAnulado,
        fecha: lineas[0]?.creadoEn || new Date().toISOString(),
      };
    });
  }, [asientosIniciales]);

  // 2. Filtros para la vista por comprobante
  const comprobantesFiltrados = useMemo(() => {
    const q = search.toLowerCase().trim();

    return todosLosComprobantes.filter((comp) => {
      // Filtro por Estado de Auditoría (Activos vs Anulados)
      if (estadoAuditoria === "SOLO_ACTIVOS" && comp.esAnulado) return false;
      if (estadoAuditoria === "SOLO_ANULADOS" && !comp.esAnulado) return false;

      // Filtro por Estado de Balance
      if (estadoBalance === "BALANCEADOS" && !comp.estaBalanceado) return false;
      if (estadoBalance === "DESCUADRADOS" && comp.estaBalanceado) return false;

      // Filtro por Fechas
      const fechaCompStr = new Date(comp.fecha).toISOString().split("T")[0];
      if (fechaDesde && fechaCompStr < fechaDesde) return false;
      if (fechaHasta && fechaCompStr > fechaHasta) return false;

      // Filtro por Cuenta PUC (el comprobante debe contener al menos una línea con esa cuenta)
      if (cuentaFilter && !comp.lineas.some((l) => l.cuentaPuc.startsWith(cuentaFilter))) {
        return false;
      }

      // Filtro por Búsqueda de texto (en comprobante o en sus líneas)
      if (q) {
        const matchCabecera =
          (comp.factura?.numeroFactura && comp.factura.numeroFactura.toLowerCase().includes(q)) ||
          (comp.factura?.proveedor?.razonSocial && comp.factura.proveedor.razonSocial.toLowerCase().includes(q)) ||
          (comp.factura?.proveedor?.nit && comp.factura.proveedor.nit.toLowerCase().includes(q));

        const matchLineas = comp.lineas.some(
          (l) =>
            l.concepto.toLowerCase().includes(q) ||
            l.cuentaPuc.includes(q) ||
            (l.cuenta?.nombre && l.cuenta.nombre.toLowerCase().includes(q))
        );

        if (!matchCabecera && !matchLineas) return false;
      }

      return true;
    });
  }, [todosLosComprobantes, search, cuentaFilter, fechaDesde, fechaHasta, estadoBalance, estadoAuditoria]);

  // 3. Líneas individuales filtradas (para vista plana / auxiliar)
  const lineasFiltradas = useMemo(() => {
    const q = search.toLowerCase().trim();

    return asientosIniciales.filter((a) => {
      // Filtro por estado de auditoría
      if (estadoAuditoria === "SOLO_ACTIVOS" && a.estado === "ANULADO") return false;
      if (estadoAuditoria === "SOLO_ANULADOS" && a.estado !== "ANULADO") return false;

      // Filtro por fechas
      const fechaStr = new Date(a.creadoEn).toISOString().split("T")[0];
      if (fechaDesde && fechaStr < fechaDesde) return false;
      if (fechaHasta && fechaStr > fechaHasta) return false;

      // Filtro por cuenta
      if (cuentaFilter && !a.cuentaPuc.startsWith(cuentaFilter)) return false;

      // Filtro por búsqueda
      if (q) {
        const match =
          a.concepto.toLowerCase().includes(q) ||
          a.cuentaPuc.includes(q) ||
          (a.cuenta?.nombre && a.cuenta.nombre.toLowerCase().includes(q)) ||
          (a.factura?.numeroFactura && a.factura.numeroFactura.toLowerCase().includes(q)) ||
          (a.factura?.proveedor?.razonSocial && a.factura.proveedor.razonSocial.toLowerCase().includes(q)) ||
          (a.factura?.proveedor?.nit && a.factura.proveedor.nit.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Filtro por estado de balance del comprobante padre
      if (estadoBalance !== "TODOS") {
        const compPadre = todosLosComprobantes.find((c) => c.facturaId === a.facturaId);
        if (estadoBalance === "BALANCEADOS" && !compPadre?.estaBalanceado) return false;
        if (estadoBalance === "DESCUADRADOS" && compPadre?.estaBalanceado) return false;
      }

      return true;
    });
  }, [asientosIniciales, search, cuentaFilter, fechaDesde, fechaHasta, estadoBalance, estadoAuditoria, todosLosComprobantes]);

  // Totales Globales calculados según la vista activa
  const totalDebitosGlobal = useMemo(() => {
    if (vistaAgrupada) {
      return comprobantesFiltrados
        .filter((c) => estadoAuditoria === "TODOS" || !c.esAnulado)
        .reduce((acc, c) => acc + c.totalDeb, 0);
    }
    return lineasFiltradas
      .filter((l) => estadoAuditoria === "TODOS" || l.estado !== "ANULADO")
      .reduce((acc, l) => acc + Number(l.debito || 0), 0);
  }, [vistaAgrupada, comprobantesFiltrados, lineasFiltradas, estadoAuditoria]);

  const totalCreditosGlobal = useMemo(() => {
    if (vistaAgrupada) {
      return comprobantesFiltrados
        .filter((c) => estadoAuditoria === "TODOS" || !c.esAnulado)
        .reduce((acc, c) => acc + c.totalCred, 0);
    }
    return lineasFiltradas
      .filter((l) => estadoAuditoria === "TODOS" || l.estado !== "ANULADO")
      .reduce((acc, l) => acc + Number(l.credito || 0), 0);
  }, [vistaAgrupada, comprobantesFiltrados, lineasFiltradas, estadoAuditoria]);

  const descuadreGlobal = Math.abs(totalDebitosGlobal - totalCreditosGlobal);
  const estaBalanceadoGlobal = descuadreGlobal < 0.05;

  // Paginación de items según vista
  const totalItemsCount = vistaAgrupada ? comprobantesFiltrados.length : lineasFiltradas.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalItemsCount / pageSize)) : 1;

  const comprobantesPaginados = useMemo(() => {
    if (pageSize <= 0) return comprobantesFiltrados;
    const start = (page - 1) * pageSize;
    return comprobantesFiltrados.slice(start, start + pageSize);
  }, [comprobantesFiltrados, page, pageSize]);

  const lineasPaginadas = useMemo(() => {
    if (pageSize <= 0) return lineasFiltradas;
    const start = (page - 1) * pageSize;
    return lineasFiltradas.slice(start, start + pageSize);
  }, [lineasFiltradas, page, pageSize]);

  // Cantidad de filtros activos
  const filtrosActivosCount = [
    Boolean(search.trim()),
    Boolean(cuentaFilter),
    Boolean(fechaDesde),
    Boolean(fechaHasta),
    estadoBalance !== "TODOS",
    estadoAuditoria !== "SOLO_ACTIVOS",
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearch("");
    setCuentaFilter("");
    setFechaDesde("");
    setFechaHasta("");
    setEstadoBalance("TODOS");
    setEstadoAuditoria("SOLO_ACTIVOS");
    setPage(1);
  };

  const handleSetMesActual = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    setFechaDesde(firstDay);
    setFechaHasta(lastDay);
    setPage(1);
  };

  const handleSetHoy = () => {
    const today = new Date().toISOString().split("T")[0];
    setFechaDesde(today);
    setFechaHasta(today);
    setPage(1);
  };

  // Exportar a CSV enriquecido
  const handleExportCSV = () => {
    const headers = [
      "ID Asiento",
      "Fecha",
      "N° Factura",
      "NIT",
      "Proveedor",
      "Cuenta PUC",
      "Nombre Cuenta",
      "Concepto",
      "Débito",
      "Crédito",
      "Estado Asiento",
      "Estado Comprobante",
      "Motivo Anulación",
    ];

    const sourceData = vistaAgrupada
      ? comprobantesFiltrados.flatMap((c) =>
          c.lineas.map((l) => ({
            ...l,
            estadoComp: c.estaBalanceado ? "CUADRADO" : "DESCUADRADO",
          }))
        )
      : lineasFiltradas.map((l) => {
          const comp = todosLosComprobantes.find((c) => c.facturaId === l.facturaId);
          return {
            ...l,
            estadoComp: comp?.estaBalanceado ? "CUADRADO" : "DESCUADRADO",
          };
        });

    const rows = sourceData.map((a) => [
      a.id,
      new Date(a.creadoEn).toISOString().split("T")[0],
      `"${a.factura?.numeroFactura || 'N/A'}"`,
      `"${a.factura?.proveedor?.nit || 'N/A'}"`,
      `"${a.factura?.proveedor?.razonSocial || 'N/A'}"`,
      a.cuentaPuc,
      `"${a.cuenta?.nombre || ''}"`,
      `"${a.concepto.replace(/"/g, '""')}"`,
      a.debito,
      a.credito,
      a.estado || "ACTIVO",
      a.estadoComp,
      `"${a.motivoAnulacion || ''}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `libro_diario_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Oficial para Impresión (Solo visible al imprimir) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4 text-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold font-serif uppercase tracking-wider">Cigarrería Megalider</h1>
            <p className="text-xs text-slate-600 font-mono">NIT: 900.123.456-7 • Régimen Común</p>
            <h2 className="text-base font-bold mt-2">LIBRO DIARIO GENERAL OFICIAL</h2>
          </div>
          <div className="text-right text-xs">
            <p suppressHydrationWarning><strong>Fecha Impresión:</strong> {fechaImpresion || "—"}</p>
            <p><strong>Periodo:</strong> {fechaDesde || "Inicio"} al {fechaHasta || "Actual"}</p>
            <p><strong>Estado Auditado:</strong> {estadoAuditoria}</p>
          </div>
        </div>
      </div>

      {/* 1. Tarjetas de Métricas de Partida Doble */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between print:p-3 print:border-slate-300">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider print:text-[10px]">
              Total Débitos (Debe)
            </span>
            <p className="text-xl font-bold font-mono text-blue-700 mt-1 print:text-base">
              ${totalDebitosGlobal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center print:hidden">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between print:p-3 print:border-slate-300">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider print:text-[10px]">
              Total Créditos (Haber)
            </span>
            <p className="text-xl font-bold font-mono text-emerald-700 mt-1 print:text-base">
              ${totalCreditosGlobal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center print:hidden">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between print:p-3 print:border-slate-300">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider print:text-[10px]">
              Comprobantes
            </span>
            <p className="text-xl font-bold text-gray-900 mt-1 print:text-base">
              {comprobantesFiltrados.length}{" "}
              <span className="text-xs font-normal text-gray-500 print:text-[10px]">
                ({vistaAgrupada ? comprobantesFiltrados.reduce((acc, c) => acc + c.lineas.length, 0) : lineasFiltradas.length} líneas)
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center print:hidden">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between print:p-3 print:border-slate-300">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider print:text-[10px]">
              Partida Doble
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              {estaBalanceadoGlobal ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 print:border-none print:p-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 print:hidden" /> Balanceado (100%)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 print:border-none print:p-0">
                  <AlertTriangle className="w-4 h-4 text-red-600 print:hidden" /> Descuadre: ${descuadreGlobal.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros y Controles Avanzados (Oculto en Impresión) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 print:hidden">
        {/* Fila 1: Buscador y Filtros Primarios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Búsqueda */}
          <div className="relative lg:col-span-4">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por concepto, factura, proveedor o NIT..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] focus:border-transparent bg-gray-50/50 outline-none transition"
            />
          </div>

          {/* Filtro por Cuenta PUC */}
          <div className="lg:col-span-3">
            <select
              value={cuentaFilter}
              onChange={(e) => {
                setCuentaFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] outline-none bg-white font-mono"
            >
              <option value="">Todas las cuentas PUC</option>
              <option value="1">Clase 1 - Activo (1xxx)</option>
              <option value="2">Clase 2 - Pasivo (2xxx)</option>
              <option value="3">Clase 3 - Patrimonio (3xxx)</option>
              <option value="4">Clase 4 - Ingresos (4xxx)</option>
              <option value="5">Clase 5 - Gastos (5xxx)</option>
              <option value="6">Clase 6 - Costos (6xxx)</option>
              {pucCuentas.slice(0, 35).map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.codigo} - {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado de Balance */}
          <div className="lg:col-span-2">
            <select
              value={estadoBalance}
              onChange={(e) => {
                setEstadoBalance(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] outline-none bg-white font-semibold text-gray-700"
            >
              <option value="TODOS">Balance: Todos</option>
              <option value="BALANCEADOS">Solo Cuadrados</option>
              <option value="DESCUADRADOS">Solo Descuadrados</option>
            </select>
          </div>

          {/* Filtro por Estado de Auditoría */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <select
              value={estadoAuditoria}
              onChange={(e) => {
                setEstadoAuditoria(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] outline-none bg-white font-semibold text-gray-700"
            >
              <option value="SOLO_ACTIVOS">Auditoría: Solo Activos</option>
              <option value="SOLO_ANULADOS">Auditoría: Solo Anulados</option>
              <option value="TODOS">Auditoría: Ver Todos (Histórico)</option>
            </select>
          </div>
        </div>

        {/* Fila 2: Fechas, Presets y Botones de Control */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Periodo:</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 text-gray-700 focus:ring-1 focus:ring-[#044a23] outline-none"
                placeholder="Desde"
                title="Fecha inicial"
              />
              <span className="text-gray-400 font-mono">—</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 text-gray-700 focus:ring-1 focus:ring-[#044a23] outline-none"
                placeholder="Hasta"
                title="Fecha final"
              />
            </div>

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSetHoy}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium text-[11px] transition"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleSetMesActual}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium text-[11px] transition"
              >
                Este Mes
              </button>
            </div>
          </div>

          {/* Botones de Control de Vista y Exportación */}
          <div className="flex items-center gap-2">
            {filtrosActivosCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar {filtrosActivosCount} filtro{filtrosActivosCount > 1 ? "s" : ""}
              </button>
            )}

            <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600">
              <button
                type="button"
                onClick={() => {
                  setVistaAgrupada(true);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition ${
                  vistaAgrupada
                    ? "bg-white text-[#044a23] shadow-sm font-bold"
                    : "hover:text-gray-900"
                }`}
              >
                Por Comprobante
              </button>
              <button
                type="button"
                onClick={() => {
                  setVistaAgrupada(false);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition ${
                  !vistaAgrupada
                    ? "bg-white text-gray-900 shadow-sm font-bold"
                    : "hover:text-gray-900"
                }`}
              >
                Listado Continuo
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Exportar a CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Imprimir Libro Diario Oficial"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Contenido Principal */}
      {vistaAgrupada ? (
        /* VISTA POR COMPROBANTE (Agrupada Atómica) */
        comprobantesFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-800 text-base mb-1">No se encontraron comprobantes</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              No hay comprobantes que coincidan con los filtros actuales. Prueba limpiando o ajustando el periodo contable.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comprobantesPaginados.map((grupo) => (
              <div
                key={grupo.facturaId}
                className={`bg-white rounded-2xl border ${
                  grupo.esAnulado ? "border-red-200 opacity-75" : "border-gray-200"
                } overflow-hidden shadow-sm hover:shadow-md transition print:shadow-none print:border-slate-400 print:mb-4`}
              >
                {/* Header del Comprobante */}
                <div
                  className={`px-6 py-3.5 ${
                    grupo.esAnulado ? "bg-red-950 text-red-100" : "bg-slate-900 text-white"
                  } flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-bold text-xs ${
                        grupo.esAnulado
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      } px-2.5 py-1 rounded-lg`}
                    >
                      FACT #{grupo.factura?.numeroFactura || grupo.facturaId}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">
                        {grupo.factura?.proveedor?.razonSocial || "Proveedor General"}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        NIT: {grupo.factura?.proveedor?.nit || "N/A"} • Fecha Contable: {formatFechaContable(grupo.fecha)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {grupo.esAnulado ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-300 bg-red-900/60 px-2.5 py-0.5 rounded-full border border-red-500/40">
                        <Ban className="w-3.5 h-3.5 text-red-400" /> ANULADO / REVERSADO
                      </span>
                    ) : grupo.estaBalanceado ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cuadrado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-300 bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-500/30">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Descuadre: ${grupo.descuadre.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabla de Líneas del Asiento */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px] tracking-wider print:bg-slate-100">
                        <th className="px-6 py-2.5 w-36">Cuenta PUC</th>
                        <th className="px-6 py-2.5">Concepto Contable</th>
                        <th className="px-6 py-2.5 text-right w-36">Débito (Debe)</th>
                        <th className="px-6 py-2.5 text-right w-36">Crédito (Haber)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {grupo.lineas.map((linea) => {
                        const coincideCuenta = cuentaFilter && linea.cuentaPuc.startsWith(cuentaFilter);
                        const coincideTexto =
                          search.trim() &&
                          (linea.concepto.toLowerCase().includes(search.toLowerCase().trim()) ||
                            linea.cuentaPuc.includes(search.trim()) ||
                            (linea.cuenta?.nombre && linea.cuenta.nombre.toLowerCase().includes(search.toLowerCase().trim())));

                        const estaResaltada = coincideCuenta || coincideTexto;

                        return (
                          <tr
                            key={linea.id}
                            className={`transition ${
                              linea.estado === "ANULADO"
                                ? "bg-red-50/40 line-through text-gray-400"
                                : estaResaltada
                                ? "bg-emerald-50/60 font-medium"
                                : "hover:bg-gray-50/80"
                            }`}
                          >
                            <td className="px-6 py-3 font-mono font-bold text-slate-800">
                              <span
                                className={`px-2 py-0.5 rounded border ${
                                  estaResaltada
                                    ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-black"
                                    : "bg-slate-100 border-slate-200"
                                }`}
                              >
                                {linea.cuentaPuc}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <p className="font-semibold text-gray-900">{linea.concepto}</p>
                              <p className="text-[11px] text-gray-500">
                                {linea.cuenta?.nombre || "Cuenta auxiliar"}
                                {linea.motivoAnulacion && (
                                  <span className="text-red-600 block text-[10px]">
                                    Motivo: {linea.motivoAnulacion}
                                  </span>
                                )}
                              </p>
                            </td>
                            <td className="px-6 py-3 text-right font-mono font-bold text-blue-700">
                              {Number(linea.debito) > 0
                                ? `$${Number(linea.debito).toLocaleString("es-CO", { minimumFractionDigits: 2 })}`
                                : "—"}
                            </td>
                            <td className="px-6 py-3 text-right font-mono font-bold text-emerald-700">
                              {Number(linea.credito) > 0
                                ? `$${Number(linea.credito).toLocaleString("es-CO", { minimumFractionDigits: 2 })}`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                        <td colSpan={2} className="px-6 py-2.5 text-right uppercase tracking-wider text-[11px] text-slate-600">
                          Sumas Iguales (Partida Doble):
                        </td>
                        <td className="px-6 py-2.5 text-right font-mono text-blue-800">
                          ${grupo.totalDeb.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-2.5 text-right font-mono text-emerald-800">
                          ${grupo.totalCred.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* VISTA CONTINUA / PLANA (Movimientos de Mayor / Subcuentas) */
        lineasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-800 text-base mb-1">No hay movimientos contables</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              No se encontraron asientos con los filtros actuales.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {cuentaFilter && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-medium flex items-center justify-between print:hidden">
                <span>
                  💡 <strong>Vista Auxiliar:</strong> Filtrando únicamente movimientos de la cuenta <code>{cuentaFilter}</code>.
                </span>
                <span className="text-[11px] text-amber-700">
                  {lineasFiltradas.length} registro{lineasFiltradas.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Factura / Tercero</th>
                    <th className="px-4 py-3">Cuenta PUC</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3 text-right">Débito</th>
                    <th className="px-4 py-3 text-right">Crédito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {lineasPaginadas.map((a) => (
                    <tr
                      key={a.id}
                      className={`transition ${
                        a.estado === "ANULADO" ? "bg-red-50/40 line-through text-gray-400" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-2.5 text-gray-500 font-mono whitespace-nowrap">
                        {formatFechaContable(a.creadoEn)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-800">
                        <span className="font-bold">{a.factura?.numeroFactura || `ID #${a.facturaId}`}</span>
                        {a.factura?.proveedor?.razonSocial && (
                          <span className="text-[11px] text-gray-500 block truncate max-w-[180px]">
                            {a.factura.proveedor.razonSocial}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {a.cuentaPuc}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">
                        <span className="font-semibold text-gray-900">{a.concepto}</span>
                        {a.cuenta?.nombre && (
                          <span className="text-[11px] text-gray-400 block">{a.cuenta.nombre}</span>
                        )}
                        {a.estado === "ANULADO" && (
                          <span className="text-red-600 block text-[10px]">ANULADO</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                        {Number(a.debito) > 0 ? `$${Number(a.debito).toLocaleString("es-CO", { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {Number(a.credito) > 0 ? `$${Number(a.credito).toLocaleString("es-CO", { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                    <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider text-xs">
                      Totales de los Registros Filtrados:
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-800 text-sm">
                      ${totalDebitosGlobal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-800 text-sm">
                      ${totalCreditosGlobal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      )}

      {/* 4. Barra de Paginación Reactiva (Oculta en Impresión) */}
      {totalItemsCount > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 print:hidden">
          <div className="flex items-center gap-2">
            <span>
              Mostrando{" "}
              <strong>
                {pageSize > 0 ? Math.min((page - 1) * pageSize + 1, totalItemsCount) : 1}
              </strong>{" "}
              a{" "}
              <strong>
                {pageSize > 0 ? Math.min(page * pageSize, totalItemsCount) : totalItemsCount}
              </strong>{" "}
              de <strong>{totalItemsCount}</strong> {vistaAgrupada ? "comprobantes" : "líneas"}
            </span>

            <span className="text-gray-300">|</span>

            <div className="flex items-center gap-1.5">
              <span>Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:ring-1 focus:ring-[#044a23] outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={0}>Todos</option>
              </select>
            </div>
          </div>

          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-gray-700">
                Página {page} de {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
