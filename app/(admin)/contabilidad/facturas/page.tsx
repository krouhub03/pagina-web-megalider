import React from "react";
import Link from "next/link";
import { getFacturas } from "@/services/contabilidad.service";
import { FacturasTablaInteractive } from "./FacturasTablaInteractive";

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

      {/* Main Interactive Table with Zustand Search & Filters */}
      <FacturasTablaInteractive facturasIniciales={facturas} />
    </div>
  );
}
