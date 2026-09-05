import React from "react";
import Link from "next/link";
import { getBalanceComprobacion } from "@/services/asientos.service";
import BalanceComprobacionInteractive from "./BalanceComprobacionInteractive";
import { Scale, ChevronRight, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BalanceComprobacionPage() {
  const balanceRes = await getBalanceComprobacion();
  const balanceData = balanceRes.data || {
    cuentas: [],
    totalDebitos: 0,
    totalCreditos: 0,
    diferencia: 0,
    estaCuadrado: true,
    totalAsientos: 0,
  };

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
        <span className="text-[#044a23] font-bold">Balance de Comprobación</span>
      </nav>

      {/* Header */}
      <div className="border-b border-gray-200/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#044a23] text-white flex items-center justify-center shadow-md shadow-[#044a23]/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-gray-900 tracking-tight">
              Balance de Comprobación (Sumas y Saldos)
            </h1>
            <p className="text-xs text-gray-600 font-sans mt-0.5">
              Consolidación periódica de movimientos y saldos netos por cuenta contable bajo norma NIIF.
            </p>
          </div>
        </div>

        <Link
          href="/contabilidad/libro-diario"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          Ver Libro Diario
        </Link>
      </div>

      {/* Interactive Balance Component */}
      <BalanceComprobacionInteractive balanceData={balanceData} />
    </div>
  );
}
