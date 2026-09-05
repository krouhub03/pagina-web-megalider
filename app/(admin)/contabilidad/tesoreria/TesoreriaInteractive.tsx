"use client";

import React, { useState } from "react";
import { Plus, Search, Building2, Banknote, Smartphone, X, Loader2, AlertCircle } from "lucide-react";

interface CuentaTesoreria {
  id: number;
  medioPagoId: number;
  codigoPuc: string;
  nombreCuenta: string;
  numeroReferencia: string | null;
  activo: boolean;
  medioPago?: { id: number; nombre: string; codigo: string | null };
  cuentaPuc?: { codigo: string; nombre: string | null };
}

export default function TesoreriaInteractive({
  cuentasIniciales,
  mediosPago,
  pucCuentas,
}: {
  cuentasIniciales: any[];
  mediosPago: any[];
  pucCuentas: any[];
}) {
  const [cuentas, setCuentas] = useState<CuentaTesoreria[]>(cuentasIniciales);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    medioPagoId: mediosPago[0]?.id || 1,
    codigoPuc: "11050501",
    nombreCuenta: "",
    numeroReferencia: "",
  });

  const filtradas = cuentas.filter(
    (c) =>
      c.nombreCuenta.toLowerCase().includes(search.toLowerCase()) ||
      c.codigoPuc.includes(search) ||
      (c.medioPago?.nombre || "").toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes("nequi") || n.includes("daviplata") || n.includes("digital")) return <Smartphone className="w-5 h-5 text-purple-600" />;
    if (n.includes("banco") || n.includes("bancolombia") || n.includes("davivienda")) return <Building2 className="w-5 h-5 text-blue-600" />;
    return <Banknote className="w-5 h-5 text-emerald-600" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!formData.nombreCuenta || !formData.codigoPuc) {
      setErrorMsg("Por favor completa los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contabilidad/tesoreria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setCuentas((prev) => [json.data, ...prev]);
        setShowModal(false);
        setFormData({
          medioPagoId: mediosPago[0]?.id || 1,
          codigoPuc: "11050501",
          nombreCuenta: "",
          numeroReferencia: "",
        });
      } else {
        setErrorMsg(json.error?.message || json.error || "Error al crear la cuenta");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de conexión al servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar caja o cuenta bancaria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#044a23] focus:border-transparent bg-white shadow-sm"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-[#044a23] hover:bg-[#033619] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Nueva Cuenta / Caja
        </button>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtradas.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  {getIcon(c.nombreCuenta)}
                </div>
                <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                  {c.medioPago?.nombre || "Efectivo"}
                </span>
              </div>

              <h3 className="font-bold text-gray-800 text-base mb-1">{c.nombreCuenta}</h3>
              {c.numeroReferencia && (
                <p className="text-xs font-mono text-gray-500 mb-4">Ref: {c.numeroReferencia}</p>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-500">Cuenta PUC:</span>
              <span className="font-mono font-bold text-[#044a23] bg-[#A7D9BD]/20 px-2 py-0.5 rounded border border-[#044a23]/20">
                {c.codigoPuc}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">Nueva Cuenta de Tesorería</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Medio de Pago Macro *</label>
                <select
                  value={formData.medioPagoId}
                  onChange={(e) => setFormData({ ...formData, medioPagoId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#044a23] outline-none bg-white"
                >
                  {mediosPago.map((mp) => (
                    <option key={mp.id} value={mp.id}>
                      {mp.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre de la Caja o Cuenta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Bancolombia Cta Ahorros / Caja 1"
                  value={formData.nombreCuenta}
                  onChange={(e) => setFormData({ ...formData, nombreCuenta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#044a23] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cuenta PUC Asociada *</label>
                <select
                  value={formData.codigoPuc}
                  onChange={(e) => setFormData({ ...formData, codigoPuc: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] outline-none bg-white"
                >
                  {pucCuentas.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.codigo} - {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">N° Referencia o Identificador</label>
                <input
                  type="text"
                  placeholder="Ej: Últimos dígitos de cuenta o POS"
                  value={formData.numeroReferencia}
                  onChange={(e) => setFormData({ ...formData, numeroReferencia: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#044a23] outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#044a23] hover:bg-[#033619] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
