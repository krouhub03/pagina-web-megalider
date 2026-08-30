"use client";

import React, { useState, useTransition } from "react";
import { Edit3, X, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { corregirEgresoAction } from "./actions";

export interface EgresoEditarData {
  id: number;
  descripcion: string;
  proveedor?: string | null;
  totalEgreso: string | number;
}

interface ModalEditarEgresoProps {
  egreso: EgresoEditarData;
}

export function ModalEditarEgreso({ egreso }: ModalEditarEgresoProps) {
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [campo, setCampo] = useState<"descripcion" | "proveedor" | "total_egreso">("total_egreso");
  const [valorNuevo, setValorNuevo] = useState("");
  const [motivo, setMotivo] = useState("");

  const abrirModal = () => {
    setCampo("total_egreso");
    setValorNuevo(String(egreso.totalEgreso));
    setMotivo("");
    setError(null);
    setAbierto(true);
  };

  const getValorAnterior = () => {
    if (campo === "descripcion") return egreso.descripcion || "";
    if (campo === "proveedor") return egreso.proveedor || "";
    return String(egreso.totalEgreso || "0");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!motivo.trim()) {
      setError("Debes ingresar un motivo para registrar la corrección en la auditoría.");
      return;
    }

    if (!valorNuevo.trim()) {
      setError("El nuevo valor no puede estar vacío.");
      return;
    }

    startTransition(async () => {
      const res = await corregirEgresoAction({
        egresoId: egreso.id,
        campoModificado: campo,
        valorAnterior: getValorAnterior(),
        valorNuevo: valorNuevo.trim(),
        motivo: motivo.trim(),
        corregidoPor: "Administrador",
      });

      if (res.success) {
        setAbierto(false);
      } else {
        setError(("error" in res && res.error) ? res.error : "No se pudo actualizar el egreso.");
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={abrirModal}
        className="h-8 px-2 text-slate-500 hover:text-slate-900"
        title="Corregir datos de este egreso"
      >
        <Edit3 className="w-3.5 h-3.5" />
      </Button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Corregir Egreso #{egreso.id}
                  </h2>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {egreso.descripcion}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAbierto(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campo a modificar <span className="text-rose-500">*</span>
                </label>
                <select
                  value={campo}
                  onChange={(e) => {
                    const val = e.target.value as "descripcion" | "proveedor" | "total_egreso";
                    setCampo(val);
                    if (val === "descripcion") setValorNuevo(egreso.descripcion || "");
                    else if (val === "proveedor") setValorNuevo(egreso.proveedor || "");
                    else setValorNuevo(String(egreso.totalEgreso || "0"));
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="total_egreso">Total Egreso ($)</option>
                  <option value="descripcion">Descripción</option>
                  <option value="proveedor">Proveedor / Emisor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor Actual
                </label>
                <div className="p-2 rounded bg-slate-100 text-slate-600 text-xs font-mono">
                  {getValorAnterior() || "(vacío)"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nuevo Valor <span className="text-rose-500">*</span>
                </label>
                <Input
                  type={campo === "total_egreso" ? "number" : "text"}
                  step={campo === "total_egreso" ? "any" : undefined}
                  value={valorNuevo}
                  onChange={(e) => setValorNuevo(e.target.value)}
                  placeholder="Ingresa el nuevo valor corregido"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo del Cambio (Obligatorio para Auditoría) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Corrección de valor digitado erróneamente en el recibo físico..."
                  rows={3}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAbierto(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" isLoading={isPending}>
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Guardar Corrección
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
