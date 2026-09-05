"use client";

import React, { useState, useTransition } from "react";
import {
  Wallet,
  Search,
  Bot,
  User,
  CheckCircle2,
  Calendar,
  Trash2,
  Filter,
  FileSpreadsheet,
  TrendingDown,
  Package,
  Building2,
  CreditCard,
  UserCheck,
  Receipt,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  obtenerNaturalezaFinanciera,
  MAPA_NATURALEZA_FINANCIERA,
  TipoNaturalezaFinanciera,
} from "@/lib/clasificacion-financiera";
import { DrawerAuditoriaEgreso, CorreccionItem } from "./DrawerAuditoriaEgreso";
import { ModalEditarEgreso } from "./ModalEditarEgreso";
import { ModalNuevoEgreso, CategoriaGastoItem, PucCuentaItem } from "./ModalNuevoEgreso";
import { eliminarEgresoAction } from "./actions";

export interface EgresoItem {
  id: number;
  fechaEgreso: string;
  tipoEgreso: string;
  categoriaId: number;
  codigoPuc?: string | null;
  descripcion: string;
  proveedor?: string | null;
  nitEmisor?: string | null;
  codigoCiiu?: string | null;
  subtotal?: string | number | null;
  iva?: string | number | null;
  otrosImpuestos?: string | number | null;
  totalEgreso: string | number;
  tieneFactura?: boolean | null;
  numeroComprobante?: string | null;
  origen?: string | null;
  registradoPor?: string | null;
  creadoEn?: string | null;
  categoria?: { id: number; nombre: string } | null;
  puc?: { codigo: string; nombre?: string | null } | null;
  correcciones?: CorreccionItem[];
}

interface GastosTablaInteractiveProps {
  egresos: EgresoItem[];
  categorias: CategoriaGastoItem[];
  pucCuentas: PucCuentaItem[];
}

export function GastosTablaInteractive({
  egresos,
  categorias,
  pucCuentas,
}: GastosTablaInteractiveProps) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroNaturaleza, setFiltroNaturaleza] = useState<"todas" | TipoNaturalezaFinanciera>("todas");
  const [filtroOrigen, setFiltroOrigen] = useState<"todos" | "manual">("todos");
  const [filtroAudit, setFiltroAudit] = useState<"todos" | "auditados" | "originales">("todos");
  const [isPending, startTransition] = useTransition();

  // Filtrado reactivo en el cliente
  const egresosFiltrados = egresos.filter((item) => {
    const nat = obtenerNaturalezaFinanciera({
      codigoPuc: item.codigoPuc,
      tipoEgreso: item.tipoEgreso,
      categoriaNombre: item.categoria?.nombre,
      descripcion: item.descripcion,
    });

    // Filtro por Naturaleza Financiera (P&G vs Flujo de Caja)
    if (filtroNaturaleza !== "todas" && nat.tipo !== filtroNaturaleza) {
      return false;
    }

    // Búsqueda de texto
    const query = busqueda.toLowerCase().trim();
    if (query) {
      const matchDesc = item.descripcion.toLowerCase().includes(query);
      const matchProv = item.proveedor?.toLowerCase().includes(query);
      const matchNit = item.nitEmisor?.toLowerCase().includes(query);
      const matchCiiu = item.codigoCiiu?.toLowerCase().includes(query);
      const matchComp = item.numeroComprobante?.toLowerCase().includes(query);
      const matchTipo = item.tipoEgreso.toLowerCase().includes(query);
      const matchPuc = item.codigoPuc?.toLowerCase().includes(query);
      if (!matchDesc && !matchProv && !matchNit && !matchCiiu && !matchComp && !matchTipo && !matchPuc) {
        return false;
      }
    }

    // Filtro Origen
    if (filtroOrigen === "manual" && item.registradoPor && (item.registradoPor.toLowerCase().includes("hermes") || item.origen?.toLowerCase().includes("hermes"))) return false;

    // Filtro Auditoría
    const tieneCorrecciones = (item.correcciones?.length || 0) > 0;
    if (filtroAudit === "auditados" && !tieneCorrecciones) return false;
    if (filtroAudit === "originales" && tieneCorrecciones) return false;

    return true;
  });

  const handleEliminar = (id: number, descripcion: string) => {
    if (confirm(`¿Estás seguro de eliminar el egreso "${descripcion}"?`)) {
      startTransition(async () => {
        await eliminarEgresoAction(id);
      });
    }
  };

  const handleExportCSV = () => {
    if (egresosFiltrados.length === 0) return;

    const headers = [
      "ID",
      "Fecha",
      "Naturaleza Financiera",
      "Impacta P&G",
      "Tipo Egreso",
      "PUC",
      "Descripción",
      "Proveedor",
      "NIT",
      "Código CIIU",
      "Subtotal",
      "IVA",
      "Impoconsumo/Otros",
      "Total ($)",
      "Origen",
      "Tiene Factura",
    ];
    const rows = egresosFiltrados.map((e) => {
      const nat = obtenerNaturalezaFinanciera({
        codigoPuc: e.codigoPuc,
        tipoEgreso: e.tipoEgreso,
        categoriaNombre: e.categoria?.nombre,
        descripcion: e.descripcion,
      });
      return [
        e.id,
        e.fechaEgreso,
        `"${nat.label}"`,
        nat.esGastoPyG ? "Sí (P&G)" : "No (Caja)",
        `"${e.tipoEgreso}"`,
        `"${e.codigoPuc || ""}"`,
        `"${e.descripcion.replace(/"/g, '""')}"`,
        `"${e.proveedor || ""}"`,
        `"${e.nitEmisor || ""}"`,
        `"${e.codigoCiiu || ""}"`,
        e.subtotal || 0,
        e.iva || 0,
        e.otrosImpuestos || 0,
        e.totalEgreso,
        `"${e.registradoPor || "Manual"}"`,
        e.tieneFactura ? "Sí" : "No",
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `egresos_contabilidad_megalider_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="overflow-hidden">
      {/* Pestañas de Vista Rápida (Flujo de Caja vs P&G) */}
      <div className="bg-slate-100/80 p-1 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFiltroNaturaleza("todas")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              filtroNaturaleza === "todas"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            Flujo de Caja (Todas las Salidas)
          </button>

          <button
            onClick={() => setFiltroNaturaleza("GASTO_OPERATIVO")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              filtroNaturaleza === "GASTO_OPERATIVO"
                ? "bg-emerald-600 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Estado P&G (Solo Gastos Operativos)
          </button>

          <button
            onClick={() => setFiltroNaturaleza("ACTIVO_FIJO")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              filtroNaturaleza === "ACTIVO_FIJO"
                ? "bg-purple-600 text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Activos Fijos (CAPEX)
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-normal px-2">
          {filtroNaturaleza === "GASTO_OPERATIVO"
            ? "Mostrando únicamente insumos consumidos este mes"
            : filtroNaturaleza === "todas"
            ? "Mostrando 100% de salidas de dinero registradas"
            : "Inversiones en bienes y propiedad de la tienda"}
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:max-w-3xl">
          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Buscar por descripción, proveedor, CIIU..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Filter Naturaleza Financiera */}
            <div className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filtroNaturaleza}
                onChange={(e) => setFiltroNaturaleza(e.target.value as "todas" | TipoNaturalezaFinanciera)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="todas">Todas las Naturalezas</option>
                <option value="GASTO_OPERATIVO">📉 Gastos Operativos (P&G)</option>
                <option value="COMPRA_INVENTARIO">📦 Compras de Inventario</option>
                <option value="ACTIVO_FIJO">🏢 Activos Fijos (CAPEX)</option>
                <option value="PAGO_DEUDA">💳 Pago de Deudas / Pasivos</option>
                <option value="RETIRO_PERSONAL">👤 Retiros de Socios</option>
              </select>
            </div>

            {/* Filter Origen */}
            <div className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
                value={filtroOrigen}
                onChange={(e) => setFiltroOrigen(e.target.value as "todos" | "manual")}
              >
                <option value="todos">Cualquier Origen</option>
                <option value="manual">Registro Manual (Web)</option>
              </select>
            </div>

            {/* Filter Audit */}
            <div className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs">
              <select
                value={filtroAudit}
                onChange={(e) => setFiltroAudit(e.target.value as "todos" | "auditados" | "originales")}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="auditados">Con Correcciones</option>
                <option value="originales">Originales (Sin cambios)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={egresosFiltrados.length === 0}
            title="Exportar listado a CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
            Exportar
          </Button>

          <ModalNuevoEgreso categorias={categorias} pucCuentas={pucCuentas} />
        </div>
      </div>

      {/* Subheader info */}
      <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-200/60 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div>
          Mostrando <span className="font-bold text-slate-800">{egresosFiltrados.length}</span> de{" "}
          <span className="font-bold text-slate-800">{egresos.length}</span> egresos
        </div>
        {(busqueda || filtroOrigen !== "todos" || filtroAudit !== "todos") && (
          <button
            onClick={() => {
              setBusqueda("");
              setFiltroOrigen("todos");
              setFiltroAudit("todos");
            }}
            className="text-slate-600 hover:text-slate-900 font-semibold underline text-[11px]"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Table */}
      {egresosFiltrados.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">No se encontraron egresos</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Ajusta los filtros de búsqueda o registra un nuevo egreso manual para visualizarlo aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 cursor-help" title="Fecha oficial en la que se efectuó el pago o egreso de caja">Fecha</th>
                <th className="p-4 cursor-help" title="Naturaleza financiera (Gasto P&G, Activo Fijo, Deuda, Retiro) y código de cuenta PUC asociado">Naturaleza & PUC</th>
                <th className="p-4 cursor-help" title="Concepto o descripción detallada de la erogación y proveedor o beneficiario del pago">Descripción & Proveedor</th>
                <th className="p-4 cursor-help" title="Método u origen de registro en el sistema (Captura manual de caja o procesamiento automático por agente)">Origen Captura</th>
                <th className="p-4 cursor-help" title="Monto total desembolsado e impuestos asociados (IVA o Impoconsumo)">Monto & Impuestos</th>
                <th className="p-4 text-center cursor-help" title="Estado de revisión y registro de auditoría de modificaciones realizadas al egreso">Auditoría</th>
                <th className="p-4 text-right cursor-help" title="Opciones de edición del registro, ver historial de auditoría o eliminar egreso">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {egresosFiltrados.map((egreso) => {
                const nat = obtenerNaturalezaFinanciera({
                  codigoPuc: egreso.codigoPuc,
                  tipoEgreso: egreso.tipoEgreso,
                  categoriaNombre: egreso.categoria?.nombre,
                  descripcion: egreso.descripcion,
                });

                const correccionesList = egreso.correcciones || [];
                const tieneCorrecciones = correccionesList.length > 0;

                const subtotalNum = Number(egreso.subtotal || 0);
                const ivaNum = Number(egreso.iva || 0);
                const otrosImpNum = Number(egreso.otrosImpuestos || 0);
                const tieneDesgloseImpuestos = ivaNum > 0 || otrosImpNum > 0;

                return (
                  <tr key={egreso.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 flex items-center gap-1.5 text-slate-600 font-medium whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(egreso.fechaEgreso)}
                    </td>

                    {/* Naturaleza & PUC */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${nat.badgeClass}`}
                        title={nat.descripcionCorta}
                      >
                        {nat.tipo === "GASTO_OPERATIVO" && <TrendingDown className="w-3 h-3 shrink-0" />}
                        {nat.tipo === "COMPRA_INVENTARIO" && <Package className="w-3 h-3 shrink-0" />}
                        {nat.tipo === "ACTIVO_FIJO" && <Building2 className="w-3 h-3 shrink-0" />}
                        {nat.tipo === "PAGO_DEUDA" && <CreditCard className="w-3 h-3 shrink-0" />}
                        {nat.tipo === "RETIRO_PERSONAL" && <UserCheck className="w-3 h-3 shrink-0" />}
                        {nat.label}
                      </span>

                      {egreso.codigoPuc ? (
                        <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                          <span className="font-bold bg-slate-100 px-1 py-0.2 rounded">PUC {egreso.codigoPuc}</span>
                          {egreso.puc?.nombre && (
                            <span className="truncate max-w-[120px]" title={egreso.puc.nombre}>
                              {egreso.puc.nombre}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Categoría: {egreso.categoria?.nombre || egreso.tipoEgreso}
                        </div>
                      )}
                    </td>

                    {/* Descripción & Proveedor */}
                    <td className="p-4 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1" title={egreso.descripcion}>
                        {egreso.descripcion}
                      </div>
                      {egreso.proveedor && egreso.proveedor !== "null" && (
                        <div className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap items-center gap-1">
                          <span>{egreso.proveedor}</span>
                          {egreso.nitEmisor && egreso.nitEmisor !== "null" && (
                            <span className="text-[10px] text-slate-400 font-mono">(NIT: {egreso.nitEmisor})</span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {egreso.codigoCiiu && egreso.codigoCiiu !== "null" && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-1 rounded font-mono" title="Código CIIU para impuestos DIAN / ICA">
                            CIIU: {egreso.codigoCiiu}
                          </span>
                        )}
                        {egreso.numeroComprobante && (
                          <span className="text-[9px] text-slate-400 font-mono">
                            Comp: N° {egreso.numeroComprobante}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Origen Captura */}
                    <td className="p-4 whitespace-nowrap">
                        <Badge variant="neutral">
                          <User className="w-3 h-3 mr-0.5" />
                          {egreso.registradoPor || "Manual"}
                        </Badge>
                      {egreso.origen && (
                        <div className="text-[9px] text-slate-400 uppercase tracking-wide mt-0.5">
                          Vía: {egreso.origen}
                        </div>
                      )}
                    </td>

                    {/* Monto & Impuestos */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatCurrency(egreso.totalEgreso)}
                      </div>
                      {tieneDesgloseImpuestos ? (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                          {subtotalNum > 0 && <span>Sub: ${Math.round(subtotalNum).toLocaleString()}</span>}
                          {ivaNum > 0 && <span className="text-emerald-700 font-semibold">+IVA: ${Math.round(ivaNum).toLocaleString()}</span>}
                          {otrosImpNum > 0 && <span className="text-purple-700 font-semibold">+Impoconsumo: ${Math.round(otrosImpNum).toLocaleString()}</span>}
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {egreso.tieneFactura ? "📄 Con factura de venta" : "Sin desglose fiscal"}
                        </div>
                      )}
                    </td>

                    {/* Auditoría */}
                    <td className="p-4 text-center">
                      {tieneCorrecciones ? (
                        <DrawerAuditoriaEgreso
                          egresoId={egreso.id}
                          descripcion={egreso.descripcion}
                          correcciones={correccionesList}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Original
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <ModalEditarEgreso egreso={egreso} />
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleEliminar(egreso.id, egreso.descripcion)}
                          className="h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          title="Eliminar egreso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
