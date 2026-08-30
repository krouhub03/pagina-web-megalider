import React from "react";
import Link from "next/link";
import {
  getEgresosTienda,
  getMetricasContables,
  getCategoriasGastos,
  getPucCuentas,
} from "@/services/contabilidad.service";
import { Wallet, Bot, UserCheck, History, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { GastosTablaInteractive, EgresoItem } from "./GastosTablaInteractive";

export const dynamic = "force-dynamic";

export default async function GastosPage() {
  const [egresosRes, metricasRes, categoriasRes, pucRes] = await Promise.all([
    getEgresosTienda(),
    getMetricasContables(),
    getCategoriasGastos(),
    getPucCuentas(),
  ]);

  const egresos = (egresosRes.data || []) as unknown as EgresoItem[];
  const metricas = metricasRes.data || {
    totalCompras: 0,
    conteoFacturas: 0,
    totalEgresos: 0,
    conteoEgresos: 0,
    egresosPorHermes: 0,
  };
  const categorias = categoriasRes.data || [];
  const pucCuentas = pucRes.data || [];

  const egresosHermesCount = egresos.filter(
    (e) =>
      e.registradoPor?.toLowerCase().includes("hermes") ||
      e.registradoPor?.toLowerCase().includes("bot") ||
      e.origen?.toLowerCase().includes("hermes")
  ).length;

  const egresosManualesCount = egresos.length - egresosHermesCount;
  const egresosAuditadosCount = egresos.filter(
    (e) => (e.correcciones?.length || 0) > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/contabilidad" className="hover:text-slate-800 transition-colors">
              Contabilidad
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Gastos</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Egresos y Gastos de Tienda
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de gastos operativos registrados por Hermes IA y auditoría de modificaciones.
          </p>
        </div>
      </div>

      {/* KPI Resumen Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Egresos */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Egresos
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {formatCurrency(metricas.totalEgresos)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-slate-700">{egresos.length}</span> registros acumulados
          </div>
        </Card>

        {/* Metric 2: Registrados por Hermes IA */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hermes IA (Bot)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {egresosHermesCount}
            </span>
            <span className="text-xs text-blue-600 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {egresos.length > 0
                ? Math.round((egresosHermesCount / egresos.length) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Capturas automáticas vía IA
          </div>
        </Card>

        {/* Metric 3: Gastos Manuales */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registros Manuales
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {egresosManualesCount}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Ingresados por administración
          </div>
        </Card>

        {/* Metric 4: Egresos Auditados */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Egresos Auditados
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {egresosAuditadosCount}
            </span>
            {egresosAuditadosCount > 0 && (
              <span className="text-xs text-amber-600 font-semibold">Con historial</span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Con correcciones registradas
          </div>
        </Card>
      </div>

      {/* Main Interactive Table */}
      <GastosTablaInteractive
        egresos={egresos}
        categorias={categorias}
        pucCuentas={pucCuentas}
      />
    </div>
  );
}
