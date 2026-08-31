"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { eliminarPucAction } from "./actions";

interface Props {
  codigo: string;
  nombre: string;
}

export default function BotonEliminarPuc({ codigo, nombre }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEliminar = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await eliminarPucAction(codigo);
      if (res.success) {
        setIsOpen(false);
      } else {
        setErrorMsg(res.error || "No se pudo eliminar la cuenta PUC.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al eliminar";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        title="Eliminar Cuenta PUC"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200 p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-serif font-bold text-lg text-center text-gray-900 mb-2">
              ¿Eliminar Cuenta PUC {codigo}?
            </h3>

            <p className="text-xs text-center text-gray-600 mb-4">
              Esta acción eliminará permanentemente la cuenta contables <strong className="font-semibold text-gray-800">{nombre} ({codigo})</strong> del catálogo de cuentas del sistema.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleEliminar}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
