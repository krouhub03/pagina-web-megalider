import React from "react";
import Link from "next/link";
import { getTiposRetencion } from "@/services/retenciones.service";
import { getPucCuentas } from "@/services/puc.service";
import RetencionesInteractive from "./RetencionesInteractive";
import { ClipboardCheck, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RetencionesPage() {
  const [retencionesRes, pucRes] = await Promise.all([
    getTiposRetencion(false),
    getPucCuentas({}),
  ]);

  const retenciones = retencionesRes.data || [];
  const pucCuentas = pucRes.data || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-400">Contabilidad</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[#044a23] font-bold">Retenciones en la Fuente</span>
      </nav>

      {/* Header */}
      <div className="border-b border-gray-200/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#044a23] text-white flex items-center justify-center shadow-md shadow-[#044a23]/20">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-gray-900 tracking-tight">
              Retenciones en la Fuente (RteFte, ReteIVA, ReteICA)
            </h1>
            <p className="text-xs text-gray-600 font-sans mt-0.5">
              Configuración de tarifas de retención aplicables a compras y servicios de la cigarrería con sus cuentas de pasivo fiscal.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Manager */}
      <RetencionesInteractive retencionesIniciales={retenciones} pucCuentas={pucCuentas} />
    </div>
  );
}
