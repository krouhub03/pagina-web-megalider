"use client";

import React, { useState } from "react";
import { Plus, Search, Percent, X, Loader2, AlertCircle } from "lucide-react";

interface TipoRetencion {
  id: number;
  codigo: string;
  nombre: string;
  porcentaje: string;
  baseMinima: string;
  cuentaPuc: string;
  activo: boolean;
}

export default function RetencionesInteractive({
  retencionesIniciales,
  pucCuentas,
}: {
  retencionesIniciales: any[];
  pucCuentas: any[];
}) {
  const [retenciones, setRetenciones] = useState<TipoRetencion[]>(retencionesIniciales);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    porcentaje: 2.5,
    baseMinima: 1136000,
    cuentaPuc: "236540",
  });

  const filtradas = retenciones.filter(
    (r) =>
      r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      r.codigo.toLowerCase().includes(search.toLowerCase()) ||
      r.cuentaPuc.includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!formData.codigo || !formData.nombre || !formData.cuentaPuc) {
      setErrorMsg("Por favor completa los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contabilidad/retenciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setRetenciones((prev) => [json.data, ...prev]);
        setShowModal(false);
        setFormData({
          codigo: "",
          nombre: "",
          porcentaje: 2.5,
          baseMinima: 1136000,
          cuentaPuc: "236540",
        });
      } else {
        setErrorMsg(json.error?.message || json.error || "Error al crear tipo de retención");
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
            placeholder="Buscar tipo de retención..."
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
          Nueva Retención
        </button>
      </div>

      {/* Grid of Retenciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtradas.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                  {r.codigo}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Percent className="w-3 h-3" /> {Number(r.porcentaje).toFixed(2)}%
                </span>
              </div>

              <h3 className="font-bold text-gray-800 text-base mb-1">{r.nombre}</h3>
              <p className="text-xs text-gray-500 mb-4">
                Base Mínima: ${Number(r.baseMinima).toLocaleString("es-CO")} COP
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-500">Cuenta Pasivo PUC:</span>
              <span className="font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {r.cuentaPuc}
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
              <h3 className="font-bold text-gray-800 text-lg">Nueva Tarifa de Retención</h3>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Descriptivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Retención Compras 2.5%"
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
                  placeholder="RTEFTE_COMPRAS_25"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#044a23] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Porcentaje (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.porcentaje}
                    onChange={(e) => setFormData({ ...formData, porcentaje: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#044a23] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Base Mínima (COP)</label>
                  <input
                    type="number"
                    value={formData.baseMinima}
                    onChange={(e) => setFormData({ ...formData, baseMinima: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#044a23] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cuenta Pasivo PUC *</label>
                <select
                  value={formData.cuentaPuc}
                  onChange={(e) => setFormData({ ...formData, cuentaPuc: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] outline-none bg-white"
                >
                  {pucCuentas.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.codigo} - {p.nombre}
                    </option>
                  ))}
                </select>
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
                  Guardar Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
