"use client";

import Link from "next/link";
import { ChevronRight, Receipt, RotateCcw, Plus, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FacturasHeaderProps {
  isSyncingAsientos: boolean;
  syncMessage: { type: "success" | "error"; text: string } | null;
  facturasCount: number;
  onSyncLibroDiario: () => void;
  onOpenDocSoporte: () => void;
  onExportCSV: () => void;
  onCloseSyncMessage: () => void;
}

export default function FacturasHeader({
  isSyncingAsientos,
  syncMessage,
  facturasCount,
  onSyncLibroDiario,
  onOpenDocSoporte,
  onExportCSV,
  onCloseSyncMessage,
}: FacturasHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation - Scrollable on mobile */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium overflow-x-auto pb-1 scrollbar-none">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors shrink-0">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-gray-400 shrink-0">IA & Facturas</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-[#067335] font-bold shrink-0">Facturas Auditadas</span>
      </nav>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200/80 pb-6">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="w-10 h-10 rounded-xl bg-[#067335] text-white flex items-center justify-center shadow-md shadow-[#067335]/20 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif font-bold text-xl sm:text-2xl text-gray-900 tracking-tight leading-snug truncate">
              Facturas Aprobadas
            </h1>
            <p className="text-xs text-gray-600 font-sans mt-0.5 line-clamp-1 sm:line-clamp-none">
              Registro inmutable de facturas aprobadas, remisiones de inventario y conciliación contable de tesorería.
            </p>
          </div>
        </div>

        {/* Action Buttons: 3 columns on mobile, auto/flex on large screens */}
        <div className="grid grid-cols-3 lg:flex lg:flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={onSyncLibroDiario}
            disabled={isSyncingAsientos}
            className="w-full justify-center bg-emerald-50 text-[#067335] border border-[#067335]/30 hover:bg-[#067335] hover:text-white px-3 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generar asientos contables en el Libro Diario para facturas históricas que no tengan registro"
          >
            {isSyncingAsientos ? (
              <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
            ) : (
              <RotateCcw className="w-4 h-4 text-current shrink-0" />
            )}
            <span className="truncate">{isSyncingAsientos ? "Cargando..." : "Sincronizar"}</span>
          </button>

          <button
            onClick={onOpenDocSoporte}
            className="w-full justify-center bg-[#038C3E] text-white px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#067335] transition-all shadow-md shadow-[#038C3E]/20 flex items-center gap-1.5 cursor-pointer"
            title="Registrar compra a comerciantes informales o no obligados a facturar (DS-XXXX)"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">Nuevo</span>
          </button>

          <button
            onClick={onExportCSV}
            disabled={facturasCount === 0}
            className="w-full justify-center bg-white text-gray-700 border border-gray-300 px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="truncate">CSV</span>
          </button>
        </div>
      </div>

      {/* Alerta / Feedback de Sincronización Contable */}
      {syncMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-start sm:items-center justify-between gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
            syncMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            {syncMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#038C3E] shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <span className="leading-relaxed">{syncMessage.text}</span>
          </div>
          <button
            onClick={onCloseSyncMessage}
            className="text-gray-400 hover:text-gray-700 text-xs px-2 py-1 rounded transition shrink-0 cursor-pointer"
            aria-label="Cerrar alerta"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}