"use client";

import React, { useState, useTransition } from "react";
import { Edit3, X, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { actualizarFacturaAction } from "./actions";

export interface FacturaEditarData {
  id: number;
  numeroFactura: string;
  cufe?: string | null;
  documentoReferencia?: string | null;
  fechaEmision: string;
  fechaVencimiento?: string | null;
  condicionPago?: string | null;
  medioPago?: string | null;
  subtotal?: string | number | null;
  iva?: string | number | null;
  impoconsumo?: string | number | null;
  totalFactura?: string | number | null;
  observaciones?: string | null;
}

interface ModalEditarFacturaProps {
  factura: FacturaEditarData;
  variant?: "icon" | "full";
}

export function ModalEditarFactura({
  factura,
  variant = "icon",
}: ModalEditarFacturaProps) {
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    numeroFactura: factura.numeroFactura || "",
    cufe: factura.cufe || "",
    documentoReferencia: factura.documentoReferencia || "",
    fechaEmision: factura.fechaEmision ? factura.fechaEmision.substring(0, 10) : "",
    fechaVencimiento: factura.fechaVencimiento ? factura.fechaVencimiento.substring(0, 10) : "",
    condicionPago: factura.condicionPago || "",
    medioPago: factura.medioPago || "",
    subtotal: String(factura.subtotal ?? 0),
    iva: String(factura.iva ?? 0),
    impoconsumo: String(factura.impoconsumo ?? 0),
    totalFactura: String(factura.totalFactura ?? 0),
    observaciones: factura.observaciones || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await actualizarFacturaAction(factura.id, {
        numeroFactura: formData.numeroFactura,
        cufe: formData.cufe || null,
        documentoReferencia: formData.documentoReferencia || null,
        fechaEmision: formData.fechaEmision,
        fechaVencimiento: formData.fechaVencimiento || null,
        condicionPago: formData.condicionPago || null,
        medioPago: formData.medioPago || null,
        observaciones: formData.observaciones || null,
      });

      if (res.success) {
        setAbierto(false);
      } else {
        setError(res.error || "No se pudo actualizar la factura.");
      }
    });
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          title={`Corregir datos de factura ${factura.numeroFactura}`}
          className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setAbierto(true)}
          leftIcon={<Edit3 className="w-3.5 h-3.5 text-amber-600" />}
        >
          Corregir Datos
        </Button>
      )}

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8 animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Corregir Datos de la Factura
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajusta los valores fiscales o de identificación registrados por Hermes IA.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="numeroFactura" className="block text-xs font-semibold text-slate-700 mb-1">
                    N° Factura *
                  </label>
                  <Input
                    id="numeroFactura"
                    name="numeroFactura"
                    value={formData.numeroFactura}
                    onChange={handleChange}
                    aria-describedby="numeroFactura-help"
                    title="Número consecutivo oficial asignado a la factura"
                    required
                  />
                  <p id="numeroFactura-help" className="mt-1 text-[11px] text-slate-500">
                    Número consecutivo oficial impreso en el comprobante fiscal.
                  </p>
                </div>

                <div>
                  <label htmlFor="documentoReferencia" className="block text-xs font-semibold text-slate-700 mb-1">
                    Doc. Referencia
                  </label>
                  <Input
                    id="documentoReferencia"
                    name="documentoReferencia"
                    value={formData.documentoReferencia}
                    onChange={handleChange}
                    placeholder="Ej. PED-2026-01"
                    aria-describedby="documentoReferencia-help"
                    title="Número de pedido u orden de compra relacionada"
                  />
                  <p id="documentoReferencia-help" className="mt-1 text-[11px] text-slate-500">
                    Número de pedido, orden de compra o remisión vinculada.
                  </p>
                </div>

                <div>
                  <label htmlFor="fechaEmision" className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha Emisión *
                  </label>
                  <Input
                    id="fechaEmision"
                    type="date"
                    name="fechaEmision"
                    value={formData.fechaEmision}
                    onChange={handleChange}
                    aria-describedby="fechaEmision-help"
                    title="Fecha original en la que se generó la factura"
                    required
                  />
                  <p id="fechaEmision-help" className="mt-1 text-[11px] text-slate-500">
                    Fecha oficial en la que el proveedor expidió la factura.
                  </p>
                </div>

                <div>
                  <label htmlFor="fechaVencimiento" className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha Vencimiento
                  </label>
                  <Input
                    id="fechaVencimiento"
                    type="date"
                    name="fechaVencimiento"
                    value={formData.fechaVencimiento}
                    onChange={handleChange}
                    aria-describedby="fechaVencimiento-help"
                    title="Fecha límite pactada para realizar el pago"
                  />
                  <p id="fechaVencimiento-help" className="mt-1 text-[11px] text-slate-500">
                    Fecha límite acordada para realizar el pago completo.
                  </p>
                </div>

                <div>
                  <label htmlFor="medioPago" className="block text-xs font-semibold text-slate-700 mb-1">
                    Medio de Pago
                  </label>
                  <Input
                    id="medioPago"
                    name="medioPago"
                    value={formData.medioPago}
                    onChange={handleChange}
                    placeholder="Ej. Transferencia Bancaria, Crédito"
                    aria-describedby="medioPago-help"
                    title="Instrumento o canal financiero utilizado para el pago"
                  />
                  <p id="medioPago-help" className="mt-1 text-[11px] text-slate-500">
                    Canal empleado (ej. Transferencia, Efectivo, Crédito).
                  </p>
                </div>

                <div>
                  <label htmlFor="condicionPago" className="block text-xs font-semibold text-slate-700 mb-1">
                    Condición de Pago
                  </label>
                  <Input
                    id="condicionPago"
                    name="condicionPago"
                    value={formData.condicionPago}
                    onChange={handleChange}
                    placeholder="Ej. Contado, 30 días"
                    aria-describedby="condicionPago-help"
                    title="Modalidad o plazo acordado de la obligación"
                  />
                  <p id="condicionPago-help" className="mt-1 text-[11px] text-slate-500">
                    Plazo acordado con el emisor (ej. Contado, 30 días).
                  </p>
                </div>
              </div>

              {/* CUFE */}
              <div>
                <label htmlFor="cufe" className="block text-xs font-semibold text-slate-700 mb-1">
                  Código Único CUFE
                </label>
                <Input
                  id="cufe"
                  name="cufe"
                  value={formData.cufe}
                  onChange={handleChange}
                  placeholder="Código hexadecimal CUFE..."
                  aria-describedby="cufe-help"
                  title="Código alfanumérico fiscal de Factura Electrónica"
                  className="font-mono text-xs"
                />
                <p id="cufe-help" className="mt-1 text-[11px] text-slate-500">
                  Cadena única hexadecimal de la DIAN que valida la factura electrónica.
                </p>
              </div>

              {/* Observaciones */}
              <div>
                <label htmlFor="observaciones" className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones / Motivo de Corrección
                </label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  rows={2}
                  value={formData.observaciones}
                  onChange={handleChange}
                  placeholder="Anota cualquier observación o corrección realizada..."
                  aria-describedby="observaciones-help"
                  title="Justificación o detalles adicionales sobre la corrección realizada"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#038C3E]/30 focus:border-[#038C3E] text-slate-800 resize-none"
                />
                <p id="observaciones-help" className="mt-1 text-[11px] text-slate-500">
                  Registra el motivo del ajuste o notas importantes para contabilidad.
                </p>
              </div>

              {/* Acciones Modal */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setAbierto(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPending}
                  isLoading={isPending}
                  leftIcon={!isPending ? <Save className="w-3.5 h-3.5" /> : undefined}
                >
                  {isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
