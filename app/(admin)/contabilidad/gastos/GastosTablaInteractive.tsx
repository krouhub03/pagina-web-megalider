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
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  const [filtroOrigen, setFiltroOrigen] = useState<"todos" | "hermes" | "manual">("todos");
  const [filtroAudit, setFiltroAudit] = useState<"todos" | "auditados" | "originales">("todos");
  const [isPending, startTransition] = useTransition();

  // Filtrado reactivo en el cliente
  const egresosFiltrados = egresos.filter((item) => {
    // Búsqueda de texto
    const query = busqueda.toLowerCase().trim();
    if (query) {
      const matchDesc = item.descripcion.toLowerCase().includes(query);
      const matchProv = item.proveedor?.toLowerCase().includes(query);
      const matchNit = item.nitEmisor?.toLowerCase().includes(query);
      const matchComp = item.numeroComprobante?.toLowerCase().includes(query);
      const matchTipo = item.tipoEgreso.toLowerCase().includes(query);
      const matchPuc = item.codigoPuc?.toLowerCase().includes(query);
      if (!matchDesc && !matchProv && !matchNit && !matchComp && !matchTipo && !matchPuc) {
        return false;
      }
    }

    // Filtro Origen
    const esHermes =
      item.registradoPor?.toLowerCase().includes("hermes") ||
      item.registradoPor?.toLowerCase().includes("bot") ||
      item.origen?.toLowerCase().includes("hermes");

    if (filtroOrigen === "hermes" && !esHermes) return false;
    if (filtroOrigen === "manual" && esHermes) return false;

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

    const headers = ["ID", "Fecha", "Tipo", "PUC", "Descripción", "Proveedor", "NIT", "Origen", "Total ($)", "Tiene Factura"];
    const rows = egresosFiltrados.map((e) => [
      e.id,
      e.fechaEgreso,
      `"${e.tipoEgreso}"`,
      `"${e.codigoPuc || ""}"`,
      `"${e.descripcion.replace(/"/g, '""')}"`,
      `"${e.proveedor || ""}"`,
      `"${e.nitEmisor || ""}"`,
      `"${e.registradoPor || "Manual"}"`,
      e.totalEgreso,
      e.tieneFactura ? "Sí" : "No",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `egresos_megalider_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="overflow-hidden">
      {/* Filter and Actions Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:max-w-2xl">
          <div className="w-full sm:w-72">
            <Input
              type="text"
              placeholder="Buscar por descripción, proveedor, NIT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Origen */}
            <div className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filtroOrigen}
                onChange={(e) => setFiltroOrigen(e.target.value as "todos" | "hermes" | "manual")}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Orígenes</option>
                <option value="hermes">Hermes Bot (IA)</option>
                <option value="manual">Manual</option>
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
                <th className="p-4">Fecha</th>
                <th className="p-4">Tipo / PUC</th>
                <th className="p-4">Descripción & Proveedor</th>
                <th className="p-4">Origen</th>
                <th className="p-4">Total Egreso</th>
                <th className="p-4 text-center">Auditoría</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {egresosFiltrados.map((egreso) => {
                const esHermes =
                  egreso.registradoPor?.toLowerCase().includes("hermes") ||
                  egreso.registradoPor?.toLowerCase().includes("bot") ||
                  egreso.origen?.toLowerCase().includes("hermes");
                const correccionesList = egreso.correcciones || [];
                const tieneCorrecciones = correccionesList.length > 0;

                return (
                  <tr key={egreso.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 flex items-center gap-1.5 text-slate-600 font-medium whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(egreso.fechaEgreso)}
                    </td>
                    <td className="p-4">
                      <Badge variant="neutral">
                        {egreso.tipoEgreso}
                      </Badge>
                      {egreso.codigoPuc && (
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          PUC: {egreso.codigoPuc} {egreso.puc?.nombre ? `- ${egreso.puc.nombre}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">
                        {egreso.descripcion}
                      </div>
                      {egreso.proveedor && egreso.proveedor !== "null" && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {egreso.proveedor}{" "}
                          {egreso.nitEmisor && egreso.nitEmisor !== "null" ? `(NIT: ${egreso.nitEmisor})` : ""}
                        </div>
                      )}
                      {egreso.numeroComprobante && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Comp: N° {egreso.numeroComprobante}
                        </div>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {esHermes ? (
                        <Badge variant="blue" dot>
                          <Bot className="w-3 h-3" />
                          {egreso.registradoPor || "Hermes Bot"}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">
                          <User className="w-3 h-3" />
                          {egreso.registradoPor || "Manual"}
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                      {formatCurrency(egreso.totalEgreso)}
                    </td>
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
