import React from "react";
import Link from "next/link";
import { getFacturas } from "@/services/contabilidad.service";
import { Receipt, Search, Building2, Calendar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FacturasPage() {
  const result = await getFacturas();
  const facturas = result.data || [];

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
            Facturas de Compra de Mercancía
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro y control tributario de facturas extraídas por Hermes IA y cargadas al sistema.
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
              placeholder="Buscar por número de factura, CUFE o proveedor..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total: <span className="font-bold text-slate-800">{facturas.length}</span> facturas
          </div>
        </div>

        {/* Facturas Table */}
        {facturas.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No hay facturas registradas aún</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Cuando Hermes IA procese facturas de compra o agregues una nueva, aparecerán listadas aquí con su desglose de IVA, Impoconsumo y CUFE.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">N° Factura</th>
                  <th className="p-4">Fecha Emisión</th>
                  <th className="p-4">Proveedor</th>
                  <th className="p-4">Subtotal</th>
                  <th className="p-4">Impuestos</th>
                  <th className="p-4">Total Factura</th>
                  <th className="p-4 text-right">Líneas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facturas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-800 font-mono">
                      {factura.numeroFactura}
                      {factura.cufe && (
                        <div className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]" title={factura.cufe}>
                          CUFE: {factura.cufe}
                        </div>
                      )}
                    </td>
                    <td className="p-4 flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(factura.fechaEmision)}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {factura.proveedor?.razonSocial || "Proveedor General"}
                      </div>
                      {factura.proveedor?.nit && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIT: {factura.proveedor.nit}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(factura.subtotal)}</td>
                    <td className="p-4">
                      <div className="text-emerald-700 font-medium">
                        IVA: {formatCurrency(factura.iva)}
                      </div>
                      {Number(factura.impoconsumo || 0) > 0 && (
                        <div className="text-[10px] text-amber-700 font-medium">
                          Impoconsumo: {formatCurrency(factura.impoconsumo)}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-900 text-sm">
                      {formatCurrency(factura.totalFactura)}
                    </td>
                    <td className="p-4 text-right">
                      <Badge variant="neutral">
                        {factura.items?.length || 0} items
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
