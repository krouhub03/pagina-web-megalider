"use client";

import React, { useState, useTransition } from "react";
import { Edit3, Plus, Minus, X, Save, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import {
  actualizarFacturaItemAction,
  crearFacturaItemAction,
  eliminarFacturaItemAction,
} from "./actions";

export interface ItemFacturaData {
  id?: number;
  facturaId?: number | null;
  codigoBarras?: string | null;
  codigoProveedor?: string | null;
  descripcion: string;
  cantidadIngresada: string | number;
  unidadMedida?: string | null;
  costoUnitarioCompra: string | number;
  descuentoPorProducto?: string | number | null;
  ivaTotal?: string | number | null;
  porcentajeIva?: string | number | null;
  impuestoConsumo?: string | number | null;
  otrosImpuestos?: string | number | null;
  costoTotalLinea?: string | number | null;
}

interface ModalEditarFacturaItemProps {
  item?: ItemFacturaData;
  facturaId: number;
  mode?: "edit" | "create";
}

export function ModalEditarFacturaItem({
  item,
  facturaId,
  mode = "edit",
}: ModalEditarFacturaItemProps) {
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    descripcion: item?.descripcion || "",
    codigoBarras: item?.codigoBarras || "",
    codigoProveedor: item?.codigoProveedor || "",
    cantidadIngresada: String(item?.cantidadIngresada ?? 1),
    unidadMedida: item?.unidadMedida || "UND",
    costoUnitarioCompra: String(item?.costoUnitarioCompra ?? 0),
    descuentoPorProducto: String(item?.descuentoPorProducto ?? 0),
    porcentajeIva: String(item?.porcentajeIva ?? 19),
    ivaTotal: String(item?.ivaTotal ?? 0),
    impuestoConsumo: String(item?.impuestoConsumo ?? 0),
    otrosImpuestos: String(item?.otrosImpuestos ?? 0),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Recalcular IVA total si cambia cantidad, costo o % IVA
      if (name === "cantidadIngresada" || name === "costoUnitarioCompra" || name === "porcentajeIva") {
        const cant = parseFloat(updated.cantidadIngresada) || 0;
        const costo = parseFloat(updated.costoUnitarioCompra) || 0;
        const pctIva = parseFloat(updated.porcentajeIva) || 0;
        const subtotalLinea = cant * costo;
        const ivaCalc = (subtotalLinea * pctIva) / 100;
        updated.ivaTotal = String(ivaCalc.toFixed(2));
      }

      return updated;
    });
  };

  const handleIncreaseCantidad = () => {
    setFormData((prev) => {
      const val = parseFloat(prev.cantidadIngresada) || 0;
      const nuevaCant = Math.max(0.01, val + 1);
      const cant = nuevaCant;
      const costo = parseFloat(prev.costoUnitarioCompra) || 0;
      const pctIva = parseFloat(prev.porcentajeIva) || 0;
      const ivaCalc = ((cant * costo) * pctIva) / 100;

      return {
        ...prev,
        cantidadIngresada: String(Number.isInteger(nuevaCant) ? nuevaCant : nuevaCant.toFixed(2)),
        ivaTotal: String(ivaCalc.toFixed(2)),
      };
    });
  };

  const handleDecreaseCantidad = () => {
    setFormData((prev) => {
      const val = parseFloat(prev.cantidadIngresada) || 0;
      const nuevaCant = Math.max(0.01, val - 1);
      const cant = nuevaCant;
      const costo = parseFloat(prev.costoUnitarioCompra) || 0;
      const pctIva = parseFloat(prev.porcentajeIva) || 0;
      const ivaCalc = ((cant * costo) * pctIva) / 100;

      return {
        ...prev,
        cantidadIngresada: String(Number.isInteger(nuevaCant) ? nuevaCant : nuevaCant.toFixed(2)),
        ivaTotal: String(ivaCalc.toFixed(2)),
      };
    });
  };

  // Cálculo automático del total de la línea
  const cant = parseFloat(formData.cantidadIngresada) || 0;
  const costo = parseFloat(formData.costoUnitarioCompra) || 0;
  const desc = parseFloat(formData.descuentoPorProducto) || 0;
  const iva = parseFloat(formData.ivaTotal) || 0;
  const impo = parseFloat(formData.impuestoConsumo) || 0;
  const otros = parseFloat(formData.otrosImpuestos) || 0;
  const totalCalculado = (cant * costo) - desc + iva + impo + otros;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const payload = {
        descripcion: formData.descripcion,
        codigoBarras: formData.codigoBarras || null,
        codigoProveedor: formData.codigoProveedor || null,
        cantidadIngresada: formData.cantidadIngresada,
        unidadMedida: formData.unidadMedida || null,
        costoUnitarioCompra: formData.costoUnitarioCompra,
        descuentoPorProducto: formData.descuentoPorProducto,
        porcentajeIva: formData.porcentajeIva,
        ivaTotal: formData.ivaTotal,
        impuestoConsumo: formData.impuestoConsumo,
        otrosImpuestos: formData.otrosImpuestos,
        costoTotalLinea: String(totalCalculado.toFixed(2)),
      };

      if (mode === "edit" && item?.id) {
        const res = await actualizarFacturaItemAction(item.id, facturaId, payload);
        if (res.success) setAbierto(false);
        else setError(res.error || "No se pudo actualizar el producto.");
      } else {
        const res = await crearFacturaItemAction(facturaId, payload);
        if (res.success) setAbierto(false);
        else setError(res.error || "No se pudo agregar el producto.");
      }
    });
  };

  const handleEliminar = () => {
    if (!item?.id) return;
    setError(null);
    startTransition(async () => {
      const res = await eliminarFacturaItemAction(item.id!, facturaId);
      if (res.success) setAbierto(false);
      else setError(res.error || "No se pudo eliminar el producto.");
    });
  };

  return (
    <>
      {mode === "edit" ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          title={`Editar producto ${formData.descripcion}`}
          className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          onClick={() => setAbierto(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Agregar Producto
        </Button>
      )}

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#A7D9BD]/30 text-[#067335] flex items-center justify-center shrink-0">
                  {mode === "edit" ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {mode === "edit" ? "Editar Producto / Línea" : "Agregar Nuevo Producto a Factura"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {mode === "edit"
                      ? "Ajusta las cantidades, precio unitario o impuestos de este ítem."
                      : "Ingresa los detalles de la nueva línea de mercancía."}
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
              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción del Producto *
                </label>
                <Input
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Ej. Cerveza Poker 330ml Canasta x 30"
                  required
                />
              </div>

              {/* Códigos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de Barras (EAN / PLU)
                  </label>
                  <Input
                    name="codigoBarras"
                    value={formData.codigoBarras}
                    onChange={handleChange}
                    placeholder="770..."
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código Proveedor / Ref.
                  </label>
                  <Input
                    name="codigoProveedor"
                    value={formData.codigoProveedor}
                    onChange={handleChange}
                    placeholder="PROV-001..."
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              {/* Cantidad, Unidad y Costo Unitario */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cantidad *
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleDecreaseCantidad}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors select-none shrink-0"
                      title="Disminuir 1 unidad"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <Input
                      type="number"
                      step="any"
                      name="cantidadIngresada"
                      value={formData.cantidadIngresada}
                      onChange={handleChange}
                      className="text-center font-bold text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleIncreaseCantidad}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors select-none shrink-0"
                      title="Aumentar 1 unidad"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidad Medida
                  </label>
                  <Input
                    name="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={handleChange}
                    placeholder="UND, CAN, KG..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Costo Unitario ($) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    name="costoUnitarioCompra"
                    value={formData.costoUnitarioCompra}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Impuestos y Descuento */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Impuestos y Descuentos ($)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Descuento ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      name="descuentoPorProducto"
                      value={formData.descuentoPorProducto}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-700 mb-1">
                      % IVA
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      name="porcentajeIva"
                      value={formData.porcentajeIva}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                      Impoconsumo ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      name="impuestoConsumo"
                      value={formData.impuestoConsumo}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-purple-700 mb-1">
                      Otros Imp. ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      name="otrosImpuestos"
                      value={formData.otrosImpuestos}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Vista Previa Total Línea */}
              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">
                  Total Línea Calculado:
                </span>
                <span className="text-base font-extrabold text-emerald-300 font-mono">
                  {formatCurrency(totalCalculado)}
                </span>
              </div>

              {/* Acciones Modal */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {mode === "edit" && item?.id ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isPending}
                    onClick={handleEliminar}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Eliminar Ítem
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
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
                    {isPending ? "Guardando..." : "Guardar Ítem"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
