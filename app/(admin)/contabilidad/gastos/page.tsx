import React from "react";
import Link from "next/link";
import {
  getEgresosTienda,
  getMetricasContables,
  getCategoriasGastos,
  getPucCuentas,
} from "@/services/contabilidad.service";
import { Wallet, Bot, TrendingDown, Building2, Receipt, ArrowUpRight } from "lucide-react";
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
    totalGastosPyG: 0,
    conteoGastosPyG: 0,
    totalInversionesDeuda: 0,
    conteoInversionesDeuda: 0,
    totalIvaDescontable: 0,
    totalOtrosImpuestos: 0,
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
            <span className="text-slate-900 font-bold">Gastos & Egresos</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Control de Egresos y Gastos de Tienda
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión financiera integral: Doble lectura de Flujo de Caja (Liquidez) y Pérdidas & Ganancias (Rentabilidad P&G).
          </p>
        </div>
      </div>

      {/* KPI Resumen Metrics (Doble Lectura: Flujo de Caja vs P&G) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Flujo de Caja (Liquidez Saliente) */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Flujo de Caja
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
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{egresos.length} salidas de caja</span>
            <span className="text-emerald-700 font-semibold">100% Liquidez</span>
          </div>
        </Card>

        {/* Metric 2: Gastos Operativos (Impacto P&G / Clase 5 PUC) */}
        <Card className="p-4 bg-white border border-slate-200 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Gastos Operativos (P&G)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-900">
              {formatCurrency(metricas.totalGastosPyG || metricas.totalEgresos)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Afectan rentabilidad neta (Arriendo, Luz, Nómina)
          </div>
        </Card>

        {/* Metric 3: Inversión en Activos & Deudas (CAPEX / Pasivos) */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Activos & Deudas
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {formatCurrency(metricas.totalInversionesDeuda)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-purple-700 font-medium">
            No restan utilidad mensual (Congeladores/Préstamos)
          </div>
        </Card>

        {/* Metric 4: Trazabilidad Hermes IA & Impuestos */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hermes IA & Impuestos
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold text-slate-900">
                {egresosHermesCount}
              </span>
              <span className="text-xs text-blue-600 font-semibold ml-1 inline-flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                {egresos.length > 0 ? Math.round((egresosHermesCount / egresos.length) * 100) : 0}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-700 block">
                IVA: {formatCurrency(metricas.totalIvaDescontable)}
              </span>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <Receipt className="w-3 h-3 text-slate-400" />
            <span>Impoconsumo acumulado: {formatCurrency(metricas.totalOtrosImpuestos)}</span>
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

