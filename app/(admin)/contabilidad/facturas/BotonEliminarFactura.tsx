"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { eliminarFacturaAction } from "./actions";

interface BotonEliminarFacturaProps {
  facturaId: number;
  numeroFactura: string;
  redirectOnSuccess?: string;
  variant?: "table" | "full";
}

export function BotonEliminarFactura({
  facturaId,
  numeroFactura,
  redirectOnSuccess,
  variant = "table",
}: BotonEliminarFacturaProps) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEliminar = () => {
    setError(null);
    startTransition(async () => {
      const res = await eliminarFacturaAction(facturaId);
      if (res.success) {
        setMostrarModal(false);
        if (redirectOnSuccess) {
          router.push(redirectOnSuccess);
        }
      } else {
        setError(res.error || "No se pudo eliminar la factura.");
      }
    });
  };

  return (
    <>
      {variant === "table" ? (
        <button
          type="button"
          onClick={() => setMostrarModal(true)}
          title={`Eliminar factura ${numeroFactura}`}
          className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <Button
          variant="danger"
          size="sm"
          onClick={() => setMostrarModal(true)}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Eliminar Factura
        </Button>
      )}

      {/* Modal de Confirmación */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ¿Eliminar Factura N° {numeroFactura}?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta acción eliminará permanentemente la factura y todas sus líneas asociadas.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                disabled={isPending}
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isPending}
                isLoading={isPending}
                onClick={handleEliminar}
                leftIcon={!isPending ? <Trash2 className="w-3.5 h-3.5" /> : undefined}
              >
                {isPending ? "Eliminando..." : "Sí, eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
