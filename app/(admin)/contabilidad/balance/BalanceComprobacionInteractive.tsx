"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Scale,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import type { ItemBalanceComprobacion } from "@/services/asientos.service";

interface BalanceData {
  cuentas: ItemBalanceComprobacion[];
  totalDebitos: number;
  totalCreditos: number;
  diferencia: number;
  estaCuadrado: boolean;
  totalAsientos: number;
}

export default function BalanceComprobacionInteractive({
  balanceData,
}: {
  balanceData: BalanceData;
}) {
  const [search, setSearch] = useState("");
  const [claseFilter, setClaseFilter] = useState("todas");

  const filtradas = useMemo(() => {
    return balanceData.cuentas.filter((c) => {
      if (claseFilter !== "todas" && !c.codigoPuc.startsWith(claseFilter)) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return c.codigoPuc.includes(q) || c.nombreCuenta.toLowerCase().includes(q);
    });
  }, [balanceData.cuentas, search, claseFilter]);

  const sumaDebitosFiltrados = useMemo(() => {
    return filtradas.reduce((acc, c) => acc + c.totalDebitos, 0);
  }, [filtradas]);

  const sumaCreditosFiltrados = useMemo(() => {
    return filtradas.reduce((acc, c) => acc + c.totalCreditos, 0);
  }, [filtradas]);

  const sumaSaldosDebito = useMemo(() => {
    return filtradas.reduce((acc, c) => acc + c.saldoDebito, 0);
  }, [filtradas]);

  const sumaSaldosCredito = useMemo(() => {
    return filtradas.reduce((acc, c) => acc + c.saldoCredito, 0);
  }, [filtradas]);

  const handleExportCSV = () => {
    const headers = [
      "Código PUC",
      "Nombre de Cuenta",
      "Naturaleza",
      "Movimiento Débito",
      "Movimiento Crédito",
      "Saldo Débito",
      "Saldo Crédito",
    ];
    const rows = filtradas.map((c) => [
      c.codigoPuc,
      `"${c.nombreCuenta}"`,
      c.naturaleza === "D" ? "Débito" : "Crédito",
      c.totalDebitos.toFixed(2),
      c.totalCreditos.toFixed(2),
      c.saldoDebito.toFixed(2),
      c.saldoCredito.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `balance_comprobacion_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Movimientos Débito
            </span>
            <p className="text-xl font-bold font-mono text-blue-700 mt-1">
              ${balanceData.totalDebitos.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Movimientos Crédito
            </span>
            <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
              ${balanceData.totalCreditos.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Cuentas con Movimiento
            </span>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {balanceData.cuentas.length}{" "}
              <span className="text-xs font-normal text-gray-500">
                ({balanceData.totalAsientos} asientos)
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Estado de Cuadre
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              {balanceData.estaCuadrado ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Cuadrado (0.00)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> Descuadre: $
                  {balanceData.diferencia.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código PUC o nombre de cuenta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#044a23] focus:border-transparent bg-gray-50/50 outline-none transition"
            />
          </div>

          {/* Filtro de Clase */}
          <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600 overflow-x-auto">
            <button
              type="button"
              onClick={() => setClaseFilter("todas")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                claseFilter === "todas"
                  ? "bg-white text-[#044a23] shadow-sm font-bold"
                  : "hover:text-gray-900"
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setClaseFilter("1")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                claseFilter === "1"
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "hover:text-gray-900"
              }`}
            >
              1. Activos
            </button>
            <button
              type="button"
              onClick={() => setClaseFilter("2")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                claseFilter === "2"
                  ? "bg-white text-amber-700 shadow-sm font-bold"
                  : "hover:text-gray-900"
              }`}
            >
              2. Pasivos
            </button>
            <button
              type="button"
              onClick={() => setClaseFilter("5")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                claseFilter === "5"
                  ? "bg-white text-purple-700 shadow-sm font-bold"
                  : "hover:text-gray-900"
              }`}
            >
              5. Gastos
            </button>
            <button
              type="button"
              onClick={() => setClaseFilter("6")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                claseFilter === "6"
                  ? "bg-white text-indigo-700 shadow-sm font-bold"
                  : "hover:text-gray-900"
              }`}
            >
              6. Costos
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Exportar CSV
        </button>
      </div>

      {/* Tabla Oficial de Sumas y Saldos */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {filtradas.length === 0 ? (
          <div className="p-12 text-center">
            <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-800 text-base mb-1">
              No hay movimientos contables bajo este filtro
            </h3>
            <p className="text-xs text-gray-500">
              Las cuentas aparecerán automáticamente cuando registres compras, egresos o ventas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3" rowSpan={2}>
                    Código PUC
                  </th>
                  <th className="px-4 py-3" rowSpan={2}>
                    Nombre de la Cuenta
                  </th>
                  <th className="px-4 py-3 text-center" rowSpan={2}>
                    Nat.
                  </th>
                  <th className="px-4 py-2 text-center border-b border-slate-700 bg-slate-800/80" colSpan={2}>
                    Movimientos del Periodo
                  </th>
                  <th className="px-4 py-2 text-center border-b border-slate-700 bg-slate-800/80" colSpan={2}>
                    Saldos Finales
                  </th>
                </tr>
                <tr className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider border-t border-slate-800">
                  <th className="px-4 py-2 text-right bg-blue-950/40 text-blue-200">Débito</th>
                  <th className="px-4 py-2 text-right bg-emerald-950/40 text-emerald-200">Crédito</th>
                  <th className="px-4 py-2 text-right bg-blue-950/60 text-blue-200">Saldo Débito</th>
                  <th className="px-4 py-2 text-right bg-emerald-950/60 text-emerald-200">Saldo Crédito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {filtradas.map((c) => (
                  <tr key={c.codigoPuc} className="hover:bg-gray-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {c.codigoPuc}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{c.nombreCuenta}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                          c.naturaleza === "D"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {c.naturaleza}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-800">
                      {c.totalDebitos > 0
                        ? `$${c.totalDebitos.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-800">
                      {c.totalCreditos > 0
                        ? `$${c.totalCreditos.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-700 bg-blue-50/30">
                      {c.saldoDebito > 0
                        ? `$${c.saldoDebito.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      {c.saldoCredito > 0
                        ? `$${c.saldoCredito.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                  <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-xs">
                    Sumas Iguales:
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-blue-800 text-sm">
                    ${sumaDebitosFiltrados.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-800 text-sm">
                    ${sumaCreditosFiltrados.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-blue-900 text-sm bg-blue-100/50">
                    ${sumaSaldosDebito.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-900 text-sm bg-emerald-100/50">
                    ${sumaSaldosCredito.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
