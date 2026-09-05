"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Edit, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { crearPucAction, actualizarPucAction } from "./actions";
import {
  type PucCuentaItem,
  calcularNivelPuc,
  normalizarNaturalezaPuc,
  obtenerInfoClasePuc,
} from "@/lib/puc-utils";

interface Props {
  cuentaEditar?: PucCuentaItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalCrearEditarPuc({ cuentaEditar, isOpen, onClose }: Props) {
  const isEditing = !!cuentaEditar;

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<number>(1);
  const [naturaleza, setNaturaleza] = useState<"Débito" | "Crédito">("Débito");
  const [descripcion, setDescripcion] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (cuentaEditar) {
      const cleanCode = cuentaEditar.codigo.trim();
      setCodigo(cleanCode);
      setNombre(cuentaEditar.nombre || "");
      const nivelOficial = calcularNivelPuc(cleanCode);
      setNivel(cuentaEditar.nivel || nivelOficial);
      setNaturaleza(normalizarNaturalezaPuc(cuentaEditar.naturaleza, cleanCode));
      setDescripcion(cuentaEditar.descripcion || "");
    } else {
      setCodigo("");
      setNombre("");
      setNivel(1);
      setNaturaleza("Débito");
      setDescripcion("");
    }
    setErrorMsg(null);
  }, [cuentaEditar, isOpen]);

  // Recalcular nivel y sugerir naturaleza automáticamente al escribir el código
  const handleCodigoChange = (val: string) => {
    setCodigo(val);
    if (!isEditing && val.trim().length > 0) {
      setNivel(calcularNivelPuc(val));
      setNaturaleza(normalizarNaturalezaPuc(null, val));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isEditing) {
        const res = await actualizarPucAction(cuentaEditar.codigo, {
          nombre,
          nivel,
          naturaleza,
          descripcion,
        });

        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.error || "Error al actualizar la cuenta PUC");
        }
      } else {
        const res = await crearPucAction({
          codigo,
          nombre,
          nivel,
          naturaleza,
          descripcion,
        });

        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.error || "Error al crear la cuenta PUC");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error inesperado";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header Modal */}
        <div className="bg-[#044a23] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-[#A7D9BD]">
              {isEditing ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg leading-tight">
                {isEditing ? "Editar Cuenta PUC" : "Nueva Cuenta PUC"}
              </h2>
              <p className="text-xs text-[#A7D9BD] font-sans">
                {isEditing
                  ? `Modificando parámetros de la cuenta ${cuentaEditar.codigo}`
                  : "Registrar una nueva cuenta en el Plan Único de Cuentas"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Campo Código */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Código PUC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                placeholder="Ej. 1105, 5135"
                value={codigo}
                onChange={(e) => handleCodigoChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-mono transition-all ${
                  isEditing
                    ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                    : "border-gray-300 focus:ring-2 focus:ring-[#038C3E]/30 focus:border-[#038C3E]"
                }`}
              />
            </div>

            {/* Campo Nivel */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nivel Contable <span className="text-red-500">*</span>
              </label>
              <select
                value={nivel}
                onChange={(e) => setNivel(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-300 focus:ring-2 focus:ring-[#038C3E]/30 focus:border-[#038C3E] bg-white transition-all"
              >
                <option value={1}>Nivel 1 — Clase (1 dígito)</option>
                <option value={2}>Nivel 2 — Grupo (2 dígitos)</option>
                <option value={3}>Nivel 3 — Cuenta (4 dígitos)</option>
                <option value={4}>Nivel 4 — Subcuenta (6 dígitos)</option>
                <option value={5}>Nivel 5 — Auxiliar (&gt;6 dígitos)</option>
              </select>
            </div>
          </div>

          {/* Campo Nombre */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Nombre de la Cuenta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Caja General, Gastos de Servicios Públicos"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-300 focus:ring-2 focus:ring-[#038C3E]/30 focus:border-[#038C3E] transition-all"
            />
          </div>

          {/* Campo Naturaleza */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Naturaleza Contable <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNaturaleza("Débito")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  naturaleza === "Débito"
                    ? "bg-[#044a23] text-white border-[#044a23] shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                Débito (Aumento por él Debe)
              </button>
              <button
                type="button"
                onClick={() => setNaturaleza("Crédito")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  naturaleza === "Crédito"
                    ? "bg-[#044a23] text-white border-[#044a23] shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                Crédito (Aumento por él Haber)
              </button>
            </div>
          </div>

          {/* Campo Descripción */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Descripción / Observaciones (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Detalles sobre el uso o aplicación contable de esta cuenta..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-300 focus:ring-2 focus:ring-[#038C3E]/30 focus:border-[#038C3E] transition-all resize-none"
            />
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#038C3E] hover:bg-[#044a23] text-white transition-all shadow-md shadow-[#038C3E]/20 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>{isEditing ? "Actualizar Cuenta" : "Guardar Cuenta"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
