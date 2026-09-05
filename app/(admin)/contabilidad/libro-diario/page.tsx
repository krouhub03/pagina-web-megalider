import React from "react";
import Link from "next/link";
import { getLibroDiario } from "@/services/asientos.service";
import { getPucCuentas } from "@/services/puc.service";
import LibroDiarioInteractive from "./LibroDiarioInteractive";
import { BookOpen, ChevronRight, Scale } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LibroDiarioPage() {
  const [asientosRes, pucRes] = await Promise.all([
    getLibroDiario({ limit: 500 }),
    getPucCuentas({}),
  ]);

  const asientos = asientosRes.data || [];
  const pucCuentas = pucRes.data || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/contabilidad/puc" className="hover:text-gray-900 transition-colors">
          Contabilidad
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[#044a23] font-bold">Libro Diario</span>
      </nav>

      {/* Header */}
      <div className="border-b border-gray-200/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#044a23] text-white flex items-center justify-center shadow-md shadow-[#044a23]/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-gray-900 tracking-tight">
              Libro Diario General
            </h1>
            <p className="text-xs text-gray-600 font-sans mt-0.5">
              Registro cronológico oficial de asientos contables con principio inmutable de Partida Doble (NIIF Colombia).
            </p>
          </div>
        </div>

        <Link
          href="/contabilidad/balance"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Scale className="w-4 h-4 text-emerald-400" />
          Ver Balance de Comprobación
        </Link>
      </div>

      {/* Interactive Journal Viewer */}
      <LibroDiarioInteractive asientosIniciales={asientos} pucCuentas={pucCuentas} />
    </div>
  );
}
