import React from "react";
import Link from "next/link";
import { getPucCuentas } from "@/services/puc.service";
import PucTablaInteractive from "./PucTablaInteractive";
import { BookOpen, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PucPage() {
  const pucRes = await getPucCuentas();
  const cuentas = pucRes.data || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-400">Contabilidad</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[#044a23] font-bold">Cuentas PUC</span>
      </nav>

      {/* Header Section */}
      <div className="border-b border-gray-200/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#044a23] text-white flex items-center justify-center shadow-md shadow-[#044a23]/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-gray-900 tracking-tight">
              Catálogo del Plan Único de Cuentas (PUC)
            </h1>
            <p className="text-xs text-gray-600 font-sans mt-0.5">
              Gestión, consulta y parametrización de cuentas contables registradas en el sistema para el control de egresos y facturas.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Table Component */}
      <PucTablaInteractive cuentasIniciales={cuentas} />
    </div>
  );
}
