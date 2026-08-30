"use client";

import React, { useState, useTransition } from "react";
import { Plus, X, Save, AlertCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { crearEgresoAction } from "./actions";

export interface CategoriaGastoItem {
  id: number;
  nombre: string;
}

export interface PucCuentaItem {
  codigo: string;
  nombre: string | null;
}

interface ModalNuevoEgresoProps {
  categorias: CategoriaGastoItem[];
  pucCuentas: PucCuentaItem[];
}

export function ModalNuevoEgreso({
  categorias,
  pucCuentas,
}: ModalNuevoEgresoProps) {
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hoy = new Date().toISOString().substring(0, 10);

  const [formData, setFormData] = useState({
    fechaEgreso: hoy,
    tipoEgreso: "Operativo",
    categoriaId: categorias.length > 0 ? String(categorias[0].id) : "1",
    codigoPuc: "",
    descripcion: "",
    proveedor: "",
    nitEmisor: "",
    subtotal: "0",
    iva: "0",
    otrosImpuestos: "0",
    totalEgreso: "",
    tieneFactura: false,
    numeroComprobante: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    const name = target.name;

    setFormData((prev) => {
      const nextData = { ...prev, [name]: value };

      // Autocalcular total si subtotal, iva u otros cambian y total no ha sido fijado manualmente
      if (["subtotal", "iva", "otrosImpuestos"].includes(name)) {
        const sub = parseFloat(String(nextData.subtotal || 0)) || 0;
        const ivaVal = parseFloat(String(nextData.iva || 0)) || 0;
        const otros = parseFloat(String(nextData.otrosImpuestos || 0)) || 0;
        const sum = sub + ivaVal + otros;
        if (sum > 0) {
          nextData.totalEgreso = String(sum);
        }
      }

      return nextData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.descripcion.trim()) {
      setError("La descripción del egreso es requerida.");
      return;
    }

    const totalVal = parseFloat(formData.totalEgreso);
    if (isNaN(totalVal) || totalVal <= 0) {
      setError("El total del egreso debe ser un monto mayor a 0.");
      return;
    }

    startTransition(async () => {
      const res = await crearEgresoAction({
        fechaEgreso: formData.fechaEgreso,
        tipoEgreso: formData.tipoEgreso,
        categoriaId: Number(formData.categoriaId),
        codigoPuc: formData.codigoPuc || null,
        descripcion: formData.descripcion.trim(),
        proveedor: formData.proveedor.trim() || null,
        nitEmisor: formData.nitEmisor.trim() || null,
        subtotal: formData.subtotal || "0",
        iva: formData.iva || "0",
        otrosImpuestos: formData.otrosImpuestos || "0",
        totalEgreso: String(totalVal),
        tieneFactura: formData.tieneFactura,
        numeroComprobante: formData.numeroComprobante.trim() || null,
        origen: "manual",
        registradoPor: "Manual",
      });

      if (res.success) {
        setAbierto(false);
        setFormData({
          fechaEgreso: hoy,
          tipoEgreso: "Operativo",
          categoriaId: categorias.length > 0 ? String(categorias[0].id) : "1",
          codigoPuc: "",
          descripcion: "",
          proveedor: "",
          nitEmisor: "",
          subtotal: "0",
          iva: "0",
          otrosImpuestos: "0",
          totalEgreso: "",
          tieneFactura: false,
          numeroComprobante: "",
        });
      } else {
        setError(res.error || "No se pudo registrar el egreso.");
      }
    });
  };

  return (
    <>
      <Button onClick={() => setAbierto(true)} size="sm" className="shadow-xs">
        <Plus className="w-4 h-4 mr-1" />
        Nuevo Egreso Manual
      </Button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Registrar Nuevo Egreso
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Ingresa los datos del gasto operacional de la tienda.
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
            <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha del Egreso <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    name="fechaEgreso"
                    value={formData.fechaEgreso}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Egreso <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="tipoEgreso"
                    value={formData.tipoEgreso}
                    onChange={handleChange}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="Operativo">Operativo</option>
                    <option value="Servicios Públicos">Servicios Públicos</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Transporte / Fletes">Transporte / Fletes</option>
                    <option value="Nómina / Turnos">Nómina / Turnos</option>
                    <option value="Otros Gastos">Otros Gastos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría de Gasto <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="categoriaId"
                    value={formData.categoriaId}
                    onChange={handleChange}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                    {categorias.length === 0 && (
                      <option value="1">General</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cuenta PUC (Opcional)
                  </label>
                  <select
                    name="codigoPuc"
                    value={formData.codigoPuc}
                    onChange={handleChange}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="">Sin PUC específico</option>
                    {pucCuentas.map((p) => (
                      <option key={p.codigo} value={p.codigo}>
                        {p.codigo} - {p.nombre || ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción del Egreso <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Ej: Pago de recibo de energía local principal..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proveedor / Emisor
                  </label>
                  <Input
                    type="text"
                    name="proveedor"
                    value={formData.proveedor}
                    onChange={handleChange}
                    placeholder="Ej: Enel Codensa / Surtidor"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIT Emisor
                  </label>
                  <Input
                    type="text"
                    name="nitEmisor"
                    value={formData.nitEmisor}
                    onChange={handleChange}
                    placeholder="Ej: 860005224-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subtotal ($)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    name="subtotal"
                    value={formData.subtotal}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IVA ($)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    name="iva"
                    value={formData.iva}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Egreso ($) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="any"
                    name="totalEgreso"
                    value={formData.totalEgreso}
                    onChange={handleChange}
                    className="font-bold text-slate-900"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="tieneFactura"
                    checked={formData.tieneFactura}
                    onChange={handleChange}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Tiene Factura / Comprobante Físico</span>
                </label>
                {formData.tieneFactura && (
                  <div className="w-1/2">
                    <Input
                      type="text"
                      name="numeroComprobante"
                      value={formData.numeroComprobante}
                      onChange={handleChange}
                      placeholder="N° Comprobante"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
                  Registrar Egreso
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
