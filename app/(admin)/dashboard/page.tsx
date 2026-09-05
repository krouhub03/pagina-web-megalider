import React from "react";
import Link from "next/link";
import {
  Receipt,
  Wallet,
  Bot,
  ArrowUpRight,
  PackageCheck,
} from "lucide-react";
import { getMetricasContables } from "@/services/contabilidad.service";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const metricasRes = await getMetricasContables();
  const metricas = metricasRes.data;

  return (
    <div className="space-y-8">
      {/* Encabezado del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
            Panel de Control General
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Resumen contable, compras de mercancía y supervisión de Hermes IA.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/facturas/history">
            <Button variant="primary" size="sm" leftIcon={<Receipt className="w-4 h-4" />}>
              Gestionar Facturas
            </Button>
          </Link>
          <Link href="/contabilidad/gastos">
            <Button variant="secondary" size="sm" leftIcon={<Wallet className="w-4 h-4" />}>
              Ver Egresos
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Compras de Mercancía */}
        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Compras Registradas
            </span>
            <div className="p-2.5 bg-emerald-50 text-[#067335] rounded-xl border border-emerald-100">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(metricas.totalCompras)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-slate-700">
                {metricas.conteoFacturas}
              </span>{" "}
              facturas procesadas
            </div>
          </div>
        </Card>

        {/* Egresos y Gastos de Tienda */}
        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gastos / Egresos
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(metricas.totalEgresos)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-slate-700">
                {metricas.conteoEgresos}
              </span>{" "}
              registros de caja
            </div>
          </div>
        </Card>

      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Accesos rápidos */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
            Módulos Rápidos
          </h2>
          <div className="space-y-2.5">
            <Link
              href="/facturas/history"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#53A677]/40 hover:bg-[#A7D9BD]/10 transition-all text-xs font-semibold text-slate-700 group"
            >
              <span className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-[#067335]" />
                Facturas de Compra
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#067335] transition-colors" />
            </Link>

            <Link
              href="/contabilidad/gastos"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#53A677]/40 hover:bg-[#A7D9BD]/10 transition-all text-xs font-semibold text-slate-700 group"
            >
              <span className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4 text-amber-600" />
                Control de Egresos
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </Link>

            <Link
              href="/catalogo"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#53A677]/40 hover:bg-[#A7D9BD]/10 transition-all text-xs font-semibold text-slate-700 group"
            >
              <span className="flex items-center gap-2.5">
                <PackageCheck className="w-4 h-4 text-blue-600" />
                Catálogo (4 Categorías)
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
