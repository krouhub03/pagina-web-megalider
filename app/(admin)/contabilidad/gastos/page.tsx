import React from "react";
import Link from "next/link";
import { getEgresosTienda } from "@/services/contabilidad.service";
import { Wallet, Search, Bot, User, CheckCircle2, History, Calendar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GastosPage() {
  const result = await getEgresosTienda();
  const egresos = result.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Link href="/dashboard" className="hover:text-slate-800">
              Dashboard
            </Link>
            <span>/</span>
            <span>Contabilidad</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Egresos y Gastos de Tienda
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de gastos operativos registrados por Hermes IA y auditoría de modificaciones.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="w-full max-w-md">
            <Input
              type="text"
              placeholder="Buscar por descripción, proveedor o comprobante..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total: <span className="font-bold text-slate-800">{egresos.length}</span> egresos
          </div>
        </div>

        {/* Table */}
        {egresos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No hay egresos registrados aún</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Los gastos operativos registrados por Hermes Bot o de forma manual aparecerán aquí con su respectivo historial de cambios.
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {egresos.map((egreso) => {
                  const esHermes =
                    egreso.registradoPor?.toLowerCase().includes("hermes") ||
                    egreso.registradoPor?.toLowerCase().includes("bot");
                  const tieneCorrecciones = (egreso.correcciones?.length || 0) > 0;

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
                            PUC: {egreso.codigoPuc} - {egreso.puc?.nombre || ""}
                          </div>
                        )}
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {egreso.descripcion}
                        </div>
                        {egreso.proveedor && egreso.proveedor !== "null" && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {egreso.proveedor} {egreso.nitEmisor && egreso.nitEmisor !== "null" ? `(NIT: ${egreso.nitEmisor})` : ""}
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
                          <Badge variant="amber">
                            <History className="w-3 h-3" />
                            {egreso.correcciones?.length} cambios
                          </Badge>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Original
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
