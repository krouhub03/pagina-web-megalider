import React from "react";
import Link from "next/link";
import {
  Receipt,
  Wallet,
  Bot,
  ArrowUpRight,
  PackageCheck,
  Building2,
  Calendar,
} from "lucide-react";
import { getMetricasContables } from "@/services/contabilidad.service";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
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
          <Link href="/admin/contabilidad/facturas">
            <Button variant="primary" size="sm" leftIcon={<Receipt className="w-4 h-4" />}>
              Gestionar Facturas
            </Button>
          </Link>
          <Link href="/admin/contabilidad/gastos">
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

        {/* Acciones de Hermes IA */}
        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hermes IA Bot
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {metricas.egresosPorHermes}
            </div>
            <div className="mt-1">
              <Badge variant="emerald" dot>
                Registros automáticos activos
              </Badge>
            </div>
          </div>
        </Card>

        {/* Estado del Sistema */}
        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Base de Datos
            </span>
            <div className="p-2.5 bg-[#A7D9BD]/30 text-[#067335] rounded-xl border border-[#53A677]/30">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
              PostgreSQL
              <Badge variant="emerald">Online</Badge>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Conexión Drizzle ORM sincronizada
            </div>
          </div>
        </Card>
      </div>

      {/* Sección informativa de Hermes y Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Supervisión de Hermes */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#067335]/10 text-[#067335] rounded-xl border border-[#067335]/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Agente Hermes IA — Estado y Trazabilidad
                </h2>
                <p className="text-xs text-slate-500">
                  Monitoreo de ingresos de facturas y gastos en PostgreSQL
                </p>
              </div>
            </div>
            <Link href="/admin/hermes-logs">
              <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                Ver auditoría
              </Button>
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
            <p className="leading-relaxed">
              Hermes IA registra de forma autónoma las facturas de proveedores y egresos operativos.
              Puedes supervisar cada documento, corregir valores en caso de errores en la extracción
              y el sistema guardará automáticamente una entrada en la tabla{" "}
              <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
                historial_correcciones
              </code>{" "}
              con el motivo y el usuario responsable.
            </p>
          </div>
        </Card>

        {/* Accesos rápidos */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
            Módulos Rápidos
          </h2>
          <div className="space-y-2.5">
            <Link
              href="/admin/contabilidad/facturas"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#53A677]/40 hover:bg-[#A7D9BD]/10 transition-all text-xs font-semibold text-slate-700 group"
            >
              <span className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-[#067335]" />
                Facturas de Compra
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#067335] transition-colors" />
            </Link>

            <Link
              href="/admin/contabilidad/gastos"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#53A677]/40 hover:bg-[#A7D9BD]/10 transition-all text-xs font-semibold text-slate-700 group"
            >
              <span className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4 text-amber-600" />
                Control de Egresos
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </Link>

            <Link
              href="/admin/catalogo"
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
