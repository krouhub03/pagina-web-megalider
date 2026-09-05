"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Edit, BookOpen, Loader2, AlertCircle, Info } from "lucide-react";
import { crearPucAction, actualizarPucAction } from "./actions";
import {
  type PucCuentaItem,
  normalizarNaturalezaPuc,
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

  // Función estricta para determinar el nivel basado en la longitud
  const calcularNivelPorDigitos = (cod: string): number => {
    const len = cod.replace(/\D/g, "").length;
    if (len <= 1) return 1;      // 1 dígito -> Clase
    if (len === 2) return 2;     // 2 dígitos -> Grupo
    if (len <= 4) return 3;      // 3-4 dígitos -> Cuenta
    if (len <= 6) return 4;      // 5-6 dígitos -> Subcuenta
    return 5;                    // >6 dígitos -> Auxiliar
  };

  // Función para obtener el nombre del nivel
  const getNombreNivel = (nivelNum: number) => {
    switch (nivelNum) {
      case 1: return "Clase (1 dígito)";
      case 2: return "Grupo (2 dígitos)";
      case 3: return "Cuenta (3-4 dígitos)";
      case 4: return "Subcuenta (5-6 dígitos)";
      case 5: return "Auxiliar (>6 dígitos)";
      default: return "Desconocido";
    }
  };

  // Función para determinar la clase de cuenta según el primer dígito del PUC
  const getClasePuc = (cod: string) => {
    if (!cod) return "Esperando código...";
    const primerDigito = cod.charAt(0);
    switch (primerDigito) {
      case "1": return "Activo";
      case "2": return "Pasivo";
      case "3": return "Patrimonio";
      case "4": return "Ingresos";
      case "5": return "Gastos";
      case "6": return "Costos de Ventas";
      case "7": return "Costos de Producción";
      case "8": return "Cuentas de Orden Deudoras";
      case "9": return "Cuentas de Orden Acreedoras";
      default: return "Clase no válida";
    }
  };

  useEffect(() => {
    if (cuentaEditar) {
      const cleanCode = cuentaEditar.codigo.trim();
      setCodigo(cleanCode);
      setNombre(cuentaEditar.nombre || "");
      // FORZAMOS el recálculo aquí para ignorar cualquier dato erróneo previo
      setNivel(calcularNivelPorDigitos(cleanCode));
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

  // Actualización en tiempo real al escribir
  const handleCodigoChange = (val: string) => {
    const soloNumeros = val.replace(/\D/g, "");
    setCodigo(soloNumeros);
    
    if (soloNumeros.length > 0) {
      setNivel(calcularNivelPorDigitos(soloNumeros));
      if (!isEditing) {
        setNaturaleza(normalizarNaturalezaPuc(null, soloNumeros));
      }
    } else {
      setNivel(1);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = { nombre, nivel, naturaleza, descripcion };
      const res = isEditing
        ? await actualizarPucAction(cuentaEditar.codigo, payload)
        : await crearPucAction({ codigo, ...payload });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || `Error al ${isEditing ? "actualizar" : "crear"} la cuenta`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
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
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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

          {/* Avisos Automáticos basados en el código */}
          {codigo.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">Nivel Detectado</div>
                  <div className="text-sm font-medium text-blue-900">{getNombreNivel(nivel)}</div>
                </div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">Clase de Cuenta</div>
                  <div className="text-sm font-medium text-emerald-900">{getClasePuc(codigo)}</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 mt-2">
              Nombre de la Cuenta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Caja General"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-300 focus:ring-2 focus:ring-[#038C3E]/30 focus:border-[#038C3E] transition-all"
            />
          </div>

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

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Descripción / Observaciones (Opcional)
            </label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-300 focus:ring-2 focus:ring-[#038C3E]/30 focus:border-[#038C3E] transition-all resize-none"
            />
          </div>

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