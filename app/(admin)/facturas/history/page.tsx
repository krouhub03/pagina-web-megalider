"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Receipt,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Layers,
  RotateCcw,
  Building2,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Truck,
  Scale,
  Plus,
} from "lucide-react";
import HistoryModal from "@/components/facturas/HistoryModal";
import ModalEditarFacturaHistorial from "@/components/facturas/ModalEditarFacturaHistorial";
import ModalEliminarFactura from "@/components/facturas/ModalEliminarFactura";
import ModalConciliacionFactura from "@/components/facturas/ModalConciliacionFactura";
import ModalDocumentoSoporte from "@/components/facturas/ModalDocumentoSoporte";

interface TipoOperacion {
  id: number;
  codigo: string;
  nombre: string;
  cuentaPucDebito: string;
}

interface MedioPago {
  id: number;
  codigo: string;
  nombre: string;
}

interface FacturaHistorial {
  id: number;
  numeroFactura: string;
  tipoDocumento: string | null;
  cufe: string | null;
  fechaEmision: string;
  proveedorId: number;
  proveedor?: {
    id: number;
    nit: string;
    razonSocial: string;
  } | null;
  tipoOperacionId: number | null;
  tipoOperacion?: TipoOperacion | null;
  medioPagoId: number | null;
  medioPagoRel?: MedioPago | null;
  cuentaTesoreriaId: number | null;
  cuentaTesoreria?: {
    id: number;
    nombreCuenta: string;
    codigoPuc: string;
  } | null;
  estadoContable: "PENDIENTE_CONCILIACION" | "CONCILIADA" | "PAGADA";
  estadoRemision: "PENDIENTE_FACTURAR" | "FACTURADA" | "NO_APLICA";
  subtotal: string;
  iva: string;
  impoconsumo: string;
  otrosImpuestosTotal: string;
  totalFactura: string;
  observaciones: string | null;
  items: any[];
}

export default function ConsolidadoFacturasPage() {
  const [facturas, setFacturas] = useState<FacturaHistorial[]>([]);
  const [tiposOperacion, setTiposOperacion] = useState<TipoOperacion[]>([]);
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFactura, setSelectedFactura] = useState<FacturaHistorial | null>(null);
  const [facturaAConciliar, setFacturaAConciliar] = useState<FacturaHistorial | null>(null);
  const [facturaAEditar, setFacturaAEditar] = useState<FacturaHistorial | null>(null);
  const [facturaAEliminar, setFacturaAEliminar] = useState<FacturaHistorial | null>(null);
  const [isModalDocSoporteOpen, setIsModalDocSoporteOpen] = useState(false);
  const [isSyncingAsientos, setIsSyncingAsientos] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sincronizar asientos contables faltantes en el Libro Diario
  const handleSyncLibroDiario = async () => {
    setIsSyncingAsientos(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/contabilidad/asientos/sync", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSyncMessage({
          type: "success",
          text: data.message || `Sincronización exitosa: ${data.data?.asientosGenerados ?? 0} asientos contables generados.`,
        });
        fetchFacturas();
      } else {
        setSyncMessage({
          type: "error",
          text: data.error?.message || "Error al sincronizar asientos con el Libro Diario.",
        });
      }
    } catch (err: any) {
      setSyncMessage({
        type: "error",
        text: "Error de red al sincronizar con el Libro Diario.",
      });
    } finally {
      setIsSyncingAsientos(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  // Filtros reactivos adaptados
  const [search, setSearch] = useState("");
  const [filtroTipoOp, setFiltroTipoOp] = useState<string>("todos");
  const [filtroEstadoContable, setFiltroEstadoContable] = useState<string>("todos");
  const [filtroMedioPago, setFiltroMedioPago] = useState<string>("todos");

  // Cargar catálogos auxiliares (Tipos de Operación y Medios de Pago)
  useEffect(() => {
    fetch("/api/contabilidad/tipos-operacion")
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) setTiposOperacion(json.data);
      })
      .catch(console.error);

    fetch("/api/contabilidad/tesoreria?tipo=medios")
      .then((res) => res.json())
      .then((json) => {
        if (json?.data && Array.isArray(json.data)) setMediosPago(json.data);
      })
      .catch(console.error);
  }, []);

  // Cargar facturas consolidadas
  const fetchFacturas = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.append("search", search.trim());
      if (filtroTipoOp !== "todos") query.append("tipoOperacionId", filtroTipoOp);
      if (filtroEstadoContable !== "todos") query.append("estadoContable", filtroEstadoContable);
      if (filtroMedioPago !== "todos") query.append("medioPagoId", filtroMedioPago);

      const res = await fetch(`/api/facturas/consolidated?${query.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFacturas(json.data);
      }
    } catch (e) {
      console.error("Error al cargar historial:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, [filtroTipoOp, filtroEstadoContable, filtroMedioPago]);

  // Manejo de búsqueda con debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchFacturas();
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const hasActiveFilters =
    search.trim() !== "" ||
    filtroTipoOp !== "todos" ||
    filtroEstadoContable !== "todos" ||
    filtroMedioPago !== "todos";

  const handleLimpiarFiltros = () => {
    setSearch("");
    setFiltroTipoOp("todos");
    setFiltroEstadoContable("todos");
    setFiltroMedioPago("todos");
  };

  // KPIs de resumen
  const kpis = useMemo(() => {
    const totalRegistros = facturas.length;
    let montoTotal = 0;
    let totalConciliadas = 0;
    let montoConciliadas = 0;
    let totalPendientes = 0;
    let totalRemisiones = 0;

    for (const f of facturas) {
      const valor = Number(f.totalFactura) || 0;
      montoTotal += valor;
      if (f.estadoContable === "CONCILIADA" || f.estadoContable === "PAGADA") {
        totalConciliadas++;
        montoConciliadas += valor;
      } else {
        totalPendientes++;
      }
      if (f.estadoRemision === "PENDIENTE_FACTURAR" || f.tipoDocumento === "REMISIÓN") {
        totalRemisiones++;
      }
    }

    return {
      totalRegistros,
      montoTotal,
      totalConciliadas,
      montoConciliadas,
      totalPendientes,
      totalRemisiones,
    };
  }, [facturas]);

  // Exportar a CSV
  const handleExportCSV = () => {
    if (facturas.length === 0) return;

    const headers = [
      "ID",
      "Fecha Emision",
      "Numero Factura",
      "Tipo Documento",
      "NIT Proveedor",
      "Razon Social Proveedor",
      "Tipo Operacion",
      "Medio Pago",
      "Cuenta Tesoreria",
      "Estado Contable",
      "Subtotal",
      "IVA",
      "Impoconsumo",
      "Total",
    ];

    const rows = facturas.map((f) => [
      f.id,
      f.fechaEmision,
      `"${f.numeroFactura || ""}"`,
      `"${f.tipoDocumento || "Factura"}"`,
      `"${f.proveedor?.nit || ""}"`,
      `"${f.proveedor?.razonSocial || ""}"`,
      `"${f.tipoOperacion?.nombre || "Compra General"}"`,
      `"${f.medioPagoRel?.nombre || "Efectivo"}"`,
      `"${f.cuentaTesoreria?.nombreCuenta || "Sin Asignar"}"`,
      `"${f.estadoContable}"`,
      f.subtotal,
      f.iva,
      f.impoconsumo,
      f.totalFactura,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Historial_Facturas_Megalider_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-400">IA & Facturas</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[#067335] font-bold">Historial Consolidado</span>
      </nav>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#067335] text-white flex items-center justify-center shadow-md shadow-[#067335]/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-gray-900 tracking-tight">
              Historial Consolidado de Facturas y Compras
            </h1>
            <p className="text-xs text-gray-600 font-sans mt-0.5">
              Registro inmutable de facturas aprobadas, remisiones de inventario y conciliación contable de tesorería.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncLibroDiario}
            disabled={isSyncingAsientos}
            className="bg-emerald-50 text-[#067335] border border-[#067335]/30 hover:bg-[#067335] hover:text-white px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generar asientos contables en el Libro Diario para facturas históricas que no tengan registro"
          >
            {isSyncingAsientos ? (
              <Loader2 className="w-4 h-4 animate-spin text-current" />
            ) : (
              <RotateCcw className="w-4 h-4 text-current" />
            )}
            <span>{isSyncingAsientos ? "Sincronizando..." : "Sincronizar Libro Diario"}</span>
          </button>

          <button
            onClick={() => setIsModalDocSoporteOpen(true)}
            className="bg-[#038C3E] text-white px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#067335] transition-all shadow-md shadow-[#038C3E]/20 flex items-center gap-2 cursor-pointer"
            title="Registrar compra a comerciantes informales o no obligados a facturar (DS-XXXX)"
          >
            <Plus className="w-4 h-4" />
            Nuevo Documento Soporte
          </button>

          <button
            onClick={handleExportCSV}
            disabled={facturas.length === 0}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Exportar a Excel / CSV
          </button>
        </div>
      </div>

      {/* Alerta / Feedback de Sincronización Contable */}
      {syncMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 ${
            syncMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#038C3E] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{syncMessage.text}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-gray-400 hover:text-gray-700 text-xs px-2 py-1 rounded transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Resumen Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Total Facturado */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Compras Aprobadas</p>
            <p className="text-xl font-bold text-gray-900 mt-1 font-sans">
              ${kpis.montoTotal.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">{kpis.totalRegistros} documentos registrados</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#067335] flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Conciliadas en Tesorería */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between border-l-4 border-l-[#067335]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#067335]">Facturas Conciliadas</p>
            <p className="text-xl font-bold text-emerald-950 mt-1 font-sans">
              {kpis.totalConciliadas} <span className="text-xs text-gray-500 font-normal">facturas</span>
            </p>
            <p className="text-[11px] text-[#53A677] mt-0.5 font-medium">Tesorería asentada</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#067335] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Pendientes de Conciliación */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pendiente Tesorería</p>
            <p className="text-xl font-bold text-amber-900 mt-1 font-sans">
              {kpis.totalPendientes} <span className="text-xs text-gray-500 font-normal">por conciliar</span>
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">Requiere asignar cuenta de pago</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filtros Contables Limpios y Adaptados */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            Filtros del Historial
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleLimpiarFiltros}
              className="text-xs font-semibold text-[#067335] hover:text-[#038C3E] transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Buscador de Texto */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Buscar Proveedor / N° Factura / CUFE</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Ej. Bavaria, 900123456, FE-8921..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#067335]/30 focus:border-[#067335] transition-all bg-gray-50/50 hover:bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Tipo de Operación */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Tipo de Operación</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#067335]/30 focus:border-[#067335] transition-all bg-gray-50/50 hover:bg-white"
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
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Estado Contable</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#067335]/30 focus:border-[#067335] transition-all bg-gray-50/50 hover:bg-white"
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
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Medio de Pago</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#067335]/30 focus:border-[#067335] transition-all bg-gray-50/50 hover:bg-white"
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

      {/* Tabla Contable Adaptada con Columnas Separadas */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#067335]" />
            <p className="text-xs text-gray-500 font-medium">Cargando historial de compras...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-[#067335]/5 border-b border-gray-200 text-[11px] uppercase text-gray-600 font-semibold tracking-wider">
                  <th className="px-4 py-3.5 cursor-help" title="Fecha en que el proveedor emitió el documento original">
                    Fecha Emisión
                  </th>
                  <th className="px-4 py-3.5 cursor-help" title="Razón social e identificación fiscal (NIT) del proveedor emisor">
                    Proveedor
                  </th>
                  <th className="px-4 py-3.5 cursor-help" title="Tipo de comprobante y número consecutivo oficial del documento">
                    Documento
                  </th>
                  <th className="px-4 py-3.5 cursor-help" title="Destino económico del gasto o inventario y su cuenta PUC de débito">
                    Tipo de Operación
                  </th>
                  <th className="px-4 py-3.5 cursor-help" title="Medio de pago utilizado y cuenta de tesorería (Caja o Banco) asociada">
                    Medio de Pago & Tesorería
                  </th>
                  <th className="px-4 py-3.5 text-center cursor-help" title="Estado de conciliación: Conciliada con cuenta de pago o Pendiente de asignar tesorería">
                    Estado Contable
                  </th>
                  <th className="px-4 py-3.5 text-right cursor-help" title="Importe total liquidado de la factura incluyendo impuestos">
                    Total Factura
                  </th>
                  <th className="px-4 py-3.5 text-center cursor-help" title="Acciones de gestión: Ver detalle, Conciliar tesorería, Editar datos o Eliminar">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {facturas.map((f) => {
                  const estaConciliada = f.estadoContable === "CONCILIADA";

                  return (
                    <tr key={f.id} className="hover:bg-emerald-50/20 transition-colors">
                      {/* 1. Fecha de Emisión */}
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{f.fechaEmision ? new Date(f.fechaEmision).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—"}</span>
                        </div>
                      </td>

                      {/* 2. Proveedor (Columna Separada) */}
                      <td className="px-4 py-3.5 max-w-[220px]">
                        <div className="font-semibold text-gray-900 truncate flex items-center gap-1.5" title={f.proveedor?.razonSocial || "Proveedor General"}>
                          <Building2 className="w-3.5 h-3.5 text-[#067335] shrink-0" />
                          <span className="truncate">{f.proveedor?.razonSocial || "Proveedor General"}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          NIT: {f.proveedor?.nit || "—"}
                        </div>
                      </td>

                      {/* 3. Documento (Columna Separada) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-[#A7D9BD]/25 text-[#067335] border border-[#A7D9BD] text-[10px] font-bold rounded-md uppercase tracking-wide">
                            {f.tipoDocumento || (f.cufe ? "Factura Electrónica" : "Factura de Venta")}
                          </span>
                        </div>
                        <div className="font-mono text-gray-800 font-bold text-xs mt-1">
                          #{f.numeroFactura}
                        </div>
                      </td>

                      {/* 4. Tipo de Operación */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {f.tipoOperacion ? (
                          <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200/70 rounded-lg text-xs font-semibold">
                            {f.tipoOperacion.nombre}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                            Compra de Mercancía
                          </span>
                        )}
                      </td>

                      {/* 5. Medio de Pago y Cuenta de Tesorería */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-900 text-xs">
                          <Wallet className="w-3.5 h-3.5 text-[#067335]" />
                          <span>{f.medioPagoRel?.nombre || "Efectivo"}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
                          {f.cuentaTesoreria ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#038C3E] shrink-0"></span>
                              <span className="font-medium text-[#067335]">{f.cuentaTesoreria.nombreCuenta}</span>
                            </>
                          ) : (
                            <span className="text-gray-400 italic">Sin cuenta asignada</span>
                          )}
                        </div>
                      </td>

                      {/* 6. Estado Contable */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {estaConciliada ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#A7D9BD]/20 text-[#067335] border border-[#A7D9BD] rounded-full text-xs font-bold shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#038C3E]" />
                            Conciliada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Por Conciliar
                          </span>
                        )}
                      </td>

                      {/* 7. Total Factura */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-[#067335] text-sm whitespace-nowrap">
                        ${Number(f.totalFactura).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>

                      {/* 8. Acciones */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Ver Detalle (Solo lectura) */}
                          <button
                            onClick={() => setSelectedFactura(f)}
                            className="p-2 bg-gray-50 hover:bg-[#067335] text-gray-600 hover:text-white border border-gray-200 hover:border-[#067335] rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105"
                            title="Ver Detalle de Compra y Comprobante Contable (Solo Lectura)"
                            aria-label="Ver Detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 2. Conciliar (Tesorería) */}
                          <button
                            onClick={() => setFacturaAConciliar(f)}
                            className="p-2 bg-[#A7D9BD]/25 hover:bg-[#038C3E] text-[#067335] hover:text-white border border-[#A7D9BD] hover:border-[#038C3E] rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105"
                            title="Conciliar Tesorería y Retenciones en la Fuente"
                            aria-label="Conciliar Factura"
                          >
                            <Scale className="w-4 h-4" />
                          </button>

                          {/* 3. Editar (Datos & Productos) */}
                          <button
                            onClick={() => setFacturaAEditar(f)}
                            className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105"
                            title="Modificar Factura, Items y Clasificación"
                            aria-label="Editar Factura"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* 4. Eliminar */}
                          <button
                            onClick={() => setFacturaAEliminar(f)}
                            className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105"
                            title="Eliminar Factura del Historial"
                            aria-label="Eliminar Factura"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {facturas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                      <div className="max-w-xs mx-auto flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-gray-700 text-sm">No se encontraron facturas</p>
                        <p className="text-xs text-gray-400">
                          {hasActiveFilters
                            ? "No hay facturas aprobadas que coincidan con los criterios de búsqueda o filtros seleccionados."
                            : "Aún no se han aprobado facturas en el sistema. Puedes escanear y auditar documentos en 'Escanear Factura'."}
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={handleLimpiarFiltros}
                            className="mt-2 text-xs font-semibold text-[#067335] hover:text-[#038C3E] hover:underline cursor-pointer"
                          >
                            Restablecer todos los filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle e Inspección (Solo Lectura) */}
      {selectedFactura && (
        <HistoryModal
          factura={selectedFactura}
          onClose={() => setSelectedFactura(null)}
        />
      )}

      {/* Modal de Conciliación Contable y Tesorería */}
      {facturaAConciliar && (
        <ModalConciliacionFactura
          factura={facturaAConciliar}
          onClose={() => setFacturaAConciliar(null)}
          onSuccess={() => {
            fetchFacturas();
            setFacturaAConciliar(null);
          }}
        />
      )}

      {/* Modal de Modificación y Recalculación */}
      {facturaAEditar && (
        <ModalEditarFacturaHistorial
          facturaId={facturaAEditar.id}
          onClose={() => setFacturaAEditar(null)}
          onSuccess={() => {
            fetchFacturas();
            setFacturaAEditar(null);
          }}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {facturaAEliminar && (
        <ModalEliminarFactura
          factura={facturaAEliminar}
          onClose={() => setFacturaAEliminar(null)}
          onSuccess={() => {
            fetchFacturas();
            setFacturaAEliminar(null);
          }}
        />
      )}

      {/* Modal de Creación de Documento Soporte (Compras sin Factura) */}
      <ModalDocumentoSoporte
        isOpen={isModalDocSoporteOpen}
        onClose={() => setIsModalDocSoporteOpen(false)}
        onSuccess={() => {
          fetchFacturas();
          setIsModalDocSoporteOpen(false);
        }}
      />
    </div>
  );
}
