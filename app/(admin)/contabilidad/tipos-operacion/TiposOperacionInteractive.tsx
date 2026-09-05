"use client";

import React, { useState } from "react";
import { Plus, Search, CheckCircle2, XCircle, Package, Layers, X, Loader2, AlertCircle } from "lucide-react";

interface PucCuenta {
  codigo: string;
  nombre: string | null;
}

interface TipoOperacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  cuentaPucDebito: string;
  cuentaPucCredito: string | null;
  afectaInventario: boolean;
  esRemision: boolean;
  activo: boolean;
  cuentaDebito?: PucCuenta;
  cuentaCredito?: PucCuenta;
}

export default function TiposOperacionInteractive({
  tiposIniciales,
  pucCuentas,
}: {
  tiposIniciales: any[];
  pucCuentas: any[];
}) {
  const [tipos, setTipos] = useState<TipoOperacion[]>(tiposIniciales);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    cuentaPucDebito: "143505",
    cuentaPucCredito: "220505",
    afectaInventario: false,
    esRemision: false,
  });

  const filtrados = tipos.filter(
    (t) =>
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.codigo.toLowerCase().includes(search.toLowerCase()) ||
      t.cuentaPucDebito.includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!formData.codigo || !formData.nombre || !formData.cuentaPucDebito) {
      setErrorMsg("Por favor completa los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contabilidad/tipos-operacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setTipos((prev) => [json.data, ...prev]);
        setShowModal(false);
        setFormData({
          codigo: "",
          nombre: "",
          descripcion: "",
          cuentaPucDebito: "143505",
          cuentaPucCredito: "220505",
          afectaInventario: false,
          esRemision: false,
        });
      } else {
        setErrorMsg(json.error?.message || json.error || "Error al crear el tipo de operación");
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
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tipo de operación o cuenta..."
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
          Nuevo Tipo de Operación
        </button>
      </div>

      {/* Grid of Tipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((tipo) => (
          <div
            key={tipo.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                  {tipo.codigo}
                </span>
                {tipo.afectaInventario ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Package className="w-3 h-3" /> Suma Inventario
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                    <Layers className="w-3 h-3" /> Gasto / Activo
                  </span>
                )}
              </div>

              <h3 className="font-bold text-gray-800 text-base mb-1">{tipo.nombre}</h3>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                {tipo.descripcion || "Sin descripción adicional"}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Cuenta Débito:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {tipo.cuentaPucDebito}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Contrapartida:</span>
                <span className="font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                  {tipo.cuentaPucCredito || "220505"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Crear Tipo de Operación */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">Nuevo Tipo de Operación Contable</h3>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Descriptivo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 📦 Compra de Snacks y Confitería"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#044a23] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Código Único *</label>
                  <input
                    type="text"
                    required
                    placeholder="COMPRA_SNACKS"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#044a23] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cuenta Débito (PUC) *</label>
                  <select
                    value={formData.cuentaPucDebito}
                    onChange={(e) => setFormData({ ...formData, cuentaPucDebito: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] outline-none bg-white"
                  >
                    {pucCuentas.map((p) => (
                      <option key={p.codigo} value={p.codigo}>
                        {p.codigo} - {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cuenta Contrapartida / Crédito</label>
                  <select
                    value={formData.cuentaPucCredito}
                    onChange={(e) => setFormData({ ...formData, cuentaPucCredito: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] outline-none bg-white"
                  >
                    {pucCuentas.map((p) => (
                      <option key={p.codigo} value={p.codigo}>
                        {p.codigo} - {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    placeholder="Detalles sobre qué compras o gastos abarca..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-2 pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.afectaInventario}
                      onChange={(e) => setFormData({ ...formData, afectaInventario: e.target.checked })}
                      className="w-4 h-4 rounded text-[#044a23] focus:ring-[#044a23]"
                    />
                    <span>¿Suma existencias al stock de productos en la tienda? (Mercancía de venta)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.esRemision}
                      onChange={(e) => setFormData({ ...formData, esRemision: e.target.checked })}
                      className="w-4 h-4 rounded text-[#044a23] focus:ring-[#044a23]"
                    />
                    <span>Es remisión / soporte de entrega (Provisión transitoria)</span>
                  </label>
                </div>
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
                  Guardar Tipo de Operación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
