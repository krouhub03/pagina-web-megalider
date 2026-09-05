"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface ModalEliminarFacturaProps {
  factura: {
    id: number;
    numeroFactura: string;
    tipoDocumento?: string | null;
    totalFactura: string | number;
    proveedor?: {
      razonSocial?: string;
      nit?: string;
    } | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEliminarFactura({ factura, onClose, onSuccess }: ModalEliminarFacturaProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/facturas/${factura.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudo eliminar la factura");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900">Eliminar Factura</h3>
              <p className="text-xs text-gray-500">Esta acción es irreversible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            ¿Estás seguro de que deseas eliminar la factura <strong className="text-gray-900 font-mono">#{factura.numeroFactura}</strong>?
          </p>

          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Proveedor:</span>
              <span className="font-semibold text-gray-800">{factura.proveedor?.razonSocial || "Proveedor General"}</span>
            </div>
            {factura.proveedor?.nit && (
              <div className="flex justify-between">
                <span className="text-gray-500">NIT:</span>
                <span className="font-mono text-gray-700">{factura.proveedor.nit}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200/60 pt-1.5">
              <span className="text-gray-500 font-medium">Total Factura:</span>
              <span className="font-bold text-red-700 font-mono">
                ${Number(factura.totalFactura).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-800 space-y-1">
            <p className="font-semibold">⚠️ Impacto Contable y en Inventario:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li>Se revertirán los asientos de partida doble en el Libro Diario.</li>
              <li>Se eliminarán las retenciones y el desglose de productos asociados.</li>
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Confirmar Eliminación
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
