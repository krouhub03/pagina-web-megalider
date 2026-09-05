"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Save,
  Loader2,
  Plus,
  Trash2,
  Building2,
  FileText,
  Wallet,
  Calendar,
  Layers,
  Calculator,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface FacturaItemEdit {
  id?: number;
  nombreProducto: string;
  codigoBarras?: string | null;
  codigoProveedor?: string | null;
  cantidadIngresada: number | string;
  unidadMedida?: string | null;
  costoUnitarioCompra: number | string;
  descuentoPorProducto?: number | string;
  ivaTotal?: number | string;
  porcentajeIva?: number | string;
  impuestoConsumo?: number | string;
  otrosImpuestos?: number | string;
  costoTotalLinea?: number | string;
}

interface ModalEditarFacturaHistorialProps {
  facturaId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEditarFacturaHistorial({
  facturaId,
  onClose,
  onSuccess,
}: ModalEditarFacturaHistorialProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "items">("general");

  // Catálogos
  const [tiposOperacion, setTiposOperacion] = useState<any[]>([]);
  const [mediosPago, setMediosPago] = useState<any[]>([]);
  const [cuentasTesoreria, setCuentasTesoreria] = useState<any[]>([]);

  // Estado del formulario
  const [form, setForm] = useState({
    numeroFactura: "",
    tipoDocumento: "Factura Electrónica",
    cufe: "",
    documentoReferencia: "",
    fechaEmision: "",
    fechaVencimiento: "",
    tipoOperacionId: "",
    medioPagoId: "",
    cuentaTesoreriaId: "",
    observaciones: "",
    proveedorNombre: "",
    proveedorNit: "",
  });

  const [items, setItems] = useState<FacturaItemEdit[]>([]);

  // Cargar catálogos y datos iniciales de la factura
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [tiposRes, tesoreriaRes, mediosRes, factRes] = await Promise.all([
          fetch("/api/contabilidad/tipos-operacion").then((r) => r.json()),
          fetch("/api/contabilidad/tesoreria").then((r) => r.json()),
          fetch("/api/contabilidad/tesoreria?tipo=medios").then((r) => r.json()),
          fetch(`/api/facturas/${facturaId}`).then((r) => r.json()),
        ]);

        if (tiposRes?.data) setTiposOperacion(tiposRes.data);
        if (tesoreriaRes?.data) setCuentasTesoreria(tesoreriaRes.data);
        if (mediosRes?.data) setMediosPago(mediosRes.data);

        if (factRes?.success && factRes.data) {
          const f = factRes.data;
          setForm({
            numeroFactura: f.numeroFactura || "",
            tipoDocumento: f.tipoDocumento || "Factura Electrónica",
            cufe: f.cufe || "",
            documentoReferencia: f.documentoReferencia || "",
            fechaEmision: f.fechaEmision || "",
            fechaVencimiento: f.fechaVencimiento || "",
            tipoOperacionId: f.tipoOperacionId ? String(f.tipoOperacionId) : "",
            medioPagoId: f.medioPagoId ? String(f.medioPagoId) : "",
            cuentaTesoreriaId: f.cuentaTesoreriaId ? String(f.cuentaTesoreriaId) : "",
            observaciones: f.observaciones || "",
            proveedorNombre: f.proveedor?.razonSocial || "",
            proveedorNit: f.proveedor?.nit || "",
          });

          if (Array.isArray(f.items) && f.items.length > 0) {
            setItems(
              f.items.map((i: any) => ({
                id: i.id,
                nombreProducto: i.nombreProducto || i.descripcion || "Ítem General",
                codigoBarras: i.codigoBarras || "",
                codigoProveedor: i.codigoProveedor || "",
                cantidadIngresada: Number(i.cantidadIngresada) || 1,
                unidadMedida: i.unidadMedida || "UND",
                costoUnitarioCompra: Number(i.costoUnitarioCompra) || 0,
                descuentoPorProducto: Number(i.descuentoPorProducto) || 0,
                ivaTotal: Number(i.ivaTotal) || 0,
                porcentajeIva: Number(i.porcentajeIva) || 19,
                impuestoConsumo: Number(i.impuestoConsumo) || 0,
                otrosImpuestos: Number(i.otrosImpuestos) || 0,
                costoTotalLinea: Number(i.costoTotalLinea) || 0,
              }))
            );
          } else {
            setItems([
              {
                nombreProducto: "Ítem de compra general",
                cantidadIngresada: 1,
                costoUnitarioCompra: Number(f.subtotal) || Number(f.totalFactura) || 0,
                descuentoPorProducto: 0,
                ivaTotal: Number(f.iva) || 0,
                porcentajeIva: 19,
                impuestoConsumo: Number(f.impoconsumo) || 0,
                otrosImpuestos: 0,
                costoTotalLinea: Number(f.totalFactura) || 0,
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar la factura");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [facturaId]);

  // Totales calculados en tiempo real
  const calculos = useMemo(() => {
    let subtotal = 0;
    let descuento = 0;
    let iva = 0;
    let impoconsumo = 0;
    let otrosImp = 0;
    let total = 0;

    for (const it of items) {
      const cant = Number(it.cantidadIngresada) || 0;
      const costo = Number(it.costoUnitarioCompra) || 0;
      const desc = Number(it.descuentoPorProducto) || 0;
      const pctIva = Number(it.porcentajeIva) || 0;
      const ivaLin = Number(it.ivaTotal) || (cant * costo - desc) * (pctIva / 100);
      const impo = Number(it.impuestoConsumo) || 0;
      const otros = Number(it.otrosImpuestos) || 0;
      const totalLin = cant * costo - desc + ivaLin + impo + otros;

      subtotal += cant * costo - desc;
      descuento += desc;
      iva += ivaLin;
      impoconsumo += impo;
      otrosImp += otros;
      total += totalLin;
    }

    return {
      subtotal,
      descuento,
      iva,
      impoconsumo,
      otrosImpuestos: otrosImp,
      total,
    };
  }, [items]);

  // Manejadores de Ítems
  const handleItemChange = (index: number, field: keyof FacturaItemEdit, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      // Autocálculo de IVA y Total Línea
      const cant = Number(field === "cantidadIngresada" ? value : item.cantidadIngresada) || 0;
      const costo = Number(field === "costoUnitarioCompra" ? value : item.costoUnitarioCompra) || 0;
      const desc = Number(field === "descuentoPorProducto" ? value : item.descuentoPorProducto) || 0;
      const pctIva = Number(field === "porcentajeIva" ? value : item.porcentajeIva) || 0;
      const impo = Number(field === "impuestoConsumo" ? value : item.impuestoConsumo) || 0;
      const otros = Number(field === "otrosImpuestos" ? value : item.otrosImpuestos) || 0;

      const base = cant * costo - desc;
      const calcIva = base * (pctIva / 100);
      item.ivaTotal = Math.round(calcIva * 100) / 100;
      item.costoTotalLinea = Math.round((base + calcIva + impo + otros) * 100) / 100;

      next[index] = item;
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        nombreProducto: "",
        cantidadIngresada: 1,
        unidadMedida: "UND",
        costoUnitarioCompra: 0,
        descuentoPorProducto: 0,
        ivaTotal: 0,
        porcentajeIva: 19,
        impuestoConsumo: 0,
        otrosImpuestos: 0,
        costoTotalLinea: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Guardar Cambios
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (!form.numeroFactura.trim()) {
        throw new Error("El número de factura es obligatorio");
      }
      if (items.length === 0) {
        throw new Error("Debe incluir al menos un producto");
      }

      const payload = {
        numeroFactura: form.numeroFactura.trim(),
        tipoDocumento: form.tipoDocumento,
        fechaEmision: form.fechaEmision,
        fechaVencimiento: form.fechaVencimiento || null,
        cufe: form.cufe.trim() || null,
        documentoReferencia: form.documentoReferencia.trim() || null,
        tipoOperacionId: form.tipoOperacionId ? Number(form.tipoOperacionId) : null,
        medioPagoId: form.medioPagoId ? Number(form.medioPagoId) : null,
        cuentaTesoreriaId: form.cuentaTesoreriaId ? Number(form.cuentaTesoreriaId) : null,
        observaciones: form.observaciones.trim() || null,
        subtotal: calculos.subtotal.toFixed(2),
        iva: calculos.iva.toFixed(2),
        impoconsumo: calculos.impoconsumo.toFixed(2),
        otrosImpuestosTotal: calculos.otrosImpuestos.toFixed(2),
        totalFactura: calculos.total.toFixed(2),
        items: items.map((it) => ({
          nombreProducto: it.nombreProducto.trim() || "Ítem General",
          codigoBarras: it.codigoBarras?.trim() || null,
          codigoProveedor: it.codigoProveedor?.trim() || null,
          cantidadIngresada: String(it.cantidadIngresada),
          unidadMedida: it.unidadMedida || "UND",
          costoUnitarioCompra: String(Number(it.costoUnitarioCompra).toFixed(2)),
          descuentoPorProducto: String(Number(it.descuentoPorProducto || 0).toFixed(2)),
          ivaTotal: String(Number(it.ivaTotal || 0).toFixed(2)),
          porcentajeIva: String(it.porcentajeIva || "19.00"),
          impuestoConsumo: String(Number(it.impuestoConsumo || 0).toFixed(2)),
          otrosImpuestos: String(Number(it.otrosImpuestos || 0).toFixed(2)),
          costoTotalLinea: String(Number(it.costoTotalLinea || 0).toFixed(2)),
        })),
      };

      const res = await fetch(`/api/facturas/${facturaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error al actualizar la factura");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al guardar";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Cuentas de tesorería filtradas por el medio de pago seleccionado
  const cuentasTesoreriaFiltradas = useMemo(() => {
    if (!form.medioPagoId) return cuentasTesoreria;
    return cuentasTesoreria.filter((c) => String(c.medioPagoId) === String(form.medioPagoId));
  }, [cuentasTesoreria, form.medioPagoId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#044a23] text-white flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-gray-900">
                Modificar Factura #{form.numeroFactura || facturaId}
              </h2>
              <p className="text-xs text-gray-500">
                {form.proveedorNombre ? `${form.proveedorNombre} (NIT: ${form.proveedorNit})` : "Edición y recálculo contable"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white px-6">
          <button
            onClick={() => setActiveTab("general")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "general"
                ? "border-[#044a23] text-[#044a23]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Datos Generales & Clasificación
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "items"
                ? "border-[#044a23] text-[#044a23]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Calculator className="w-4 h-4" />
            Productos & Recálculo de Totales ({items.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#044a23]" />
              <p className="text-xs text-gray-500">Cargando datos de la factura...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tab 1: Datos Generales */}
              {activeTab === "general" && (
                <div className="space-y-5">
                  {/* Bloque: Metadatos Básicos */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-100 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#044a23]" />
                      Identificación del Documento
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Documento *</label>
                        <select
                          value={form.tipoDocumento}
                          onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#044a23]/30 bg-white"
                        >
                          <option value="Factura Electrónica">Factura Electrónica</option>
                          <option value="Factura POS">Factura POS</option>
                          <option value="REMISIÓN">Remisión</option>
                          <option value="Documento Soporte">Documento Soporte</option>
                          <option value="Comprobante de Caja">Comprobante de Caja</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">N° Factura / Consecutivo *</label>
                        <input
                          type="text"
                          value={form.numeroFactura}
                          onChange={(e) => setForm({ ...form, numeroFactura: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-[#044a23]/30 bg-white"
                          placeholder="Ej. FE-1092"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Doc. Referencia / Orden</label>
                        <input
                          type="text"
                          value={form.documentoReferencia}
                          onChange={(e) => setForm({ ...form, documentoReferencia: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#044a23]/30 bg-white"
                          placeholder="Ej. OC-9821"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Emisión *</label>
                        <input
                          type="date"
                          value={form.fechaEmision}
                          onChange={(e) => setForm({ ...form, fechaEmision: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#044a23]/30 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                        <input
                          type="date"
                          value={form.fechaVencimiento}
                          onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#044a23]/30 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Código CUFE</label>
                        <input
                          type="text"
                          value={form.cufe}
                          onChange={(e) => setForm({ ...form, cufe: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#044a23]/30 bg-white"
                          placeholder="Código alfanumérico DIAN"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque: Clasificación Contable & Tesorería */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-100 flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 text-[#044a23]" />
                      Clasificación Contable & Tesorería
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Operación *</label>
                        <select
                          value={form.tipoOperacionId}
                          onChange={(e) => setForm({ ...form, tipoOperacionId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#044a23]/30 bg-white"
                        >
                          <option value="">Selecciona tipo de operación...</option>
                          {tiposOperacion.map((t) => (
                            <option key={t.id} value={String(t.id)}>
                              {t.nombre} [{t.cuentaPucDebito}]
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Medio de Pago Macro *</label>
                        <select
                          value={form.medioPagoId}
                          onChange={(e) => setForm({ ...form, medioPagoId: e.target.value, cuentaTesoreriaId: "" })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#044a23]/30 bg-white"
                        >
                          <option value="">Selecciona medio de pago...</option>
                          {mediosPago.map((m) => (
                            <option key={m.id} value={String(m.id)}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Cuenta de Tesorería (Caja/Banco)</label>
                        <select
                          value={form.cuentaTesoreriaId}
                          onChange={(e) => setForm({ ...form, cuentaTesoreriaId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#044a23]/30 bg-white"
                        >
                          <option value="">(Sin asignar o por conciliar)</option>
                          {cuentasTesoreriaFiltradas.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.nombreCuenta} [{c.codigoPuc}]
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones / Notas</label>
                      <textarea
                        rows={2}
                        value={form.observaciones}
                        onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#044a23]/30 bg-white"
                        placeholder="Comentarios o justificaciones de ajuste..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Productos e Ítems */}
              {activeTab === "items" && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Líneas de Productos / Servicios
                      </span>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="bg-emerald-50 hover:bg-emerald-100 text-[#044a23] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Producto
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse min-w-[750px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-semibold">
                            <th className="px-3 py-2.5">Descripción / Producto</th>
                            <th className="px-2 py-2.5 text-center w-16">Cant.</th>
                            <th className="px-2 py-2.5 text-right w-24">Costo Unit.</th>
                            <th className="px-2 py-2.5 text-right w-20">Desc.</th>
                            <th className="px-2 py-2.5 text-center w-20">IVA %</th>
                            <th className="px-2 py-2.5 text-right w-24">IVA ($)</th>
                            <th className="px-2 py-2.5 text-right w-24">Total Fila</th>
                            <th className="px-2 py-2.5 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/60">
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={it.nombreProducto}
                                  onChange={(e) => handleItemChange(idx, "nombreProducto", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#044a23]"
                                  placeholder="Nombre del producto..."
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={it.cantidadIngresada}
                                  onChange={(e) => handleItemChange(idx, "cantidadIngresada", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-center font-mono focus:ring-1 focus:ring-[#044a23]"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={it.costoUnitarioCompra}
                                  onChange={(e) => handleItemChange(idx, "costoUnitarioCompra", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-right font-mono focus:ring-1 focus:ring-[#044a23]"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={it.descuentoPorProducto || 0}
                                  onChange={(e) => handleItemChange(idx, "descuentoPorProducto", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-right font-mono text-red-600 focus:ring-1 focus:ring-[#044a23]"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <select
                                  value={String(it.porcentajeIva || 19)}
                                  onChange={(e) => handleItemChange(idx, "porcentajeIva", e.target.value)}
                                  className="w-full px-1 py-1 border border-gray-200 rounded text-xs text-center bg-white"
                                >
                                  <option value="19">19%</option>
                                  <option value="5">5%</option>
                                  <option value="0">0%</option>
                                </select>
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-gray-700">
                                ${Number(it.ivaTotal || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-gray-900">
                                ${Number(it.costoTotalLinea || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  disabled={items.length <= 1}
                                  className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors disabled:opacity-30 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Resumen de Liquidación */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex justify-end">
                    <div className="w-64 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal Base:</span>
                        <span className="font-mono font-medium">${calculos.subtotal.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
                      </div>
                      {calculos.descuento > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Descuentos:</span>
                          <span className="font-mono font-medium">-${calculos.descuento.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>IVA Total:</span>
                        <span className="font-mono font-medium">${calculos.iva.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
                      </div>
                      {calculos.impoconsumo > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Impoconsumo:</span>
                          <span className="font-mono font-medium">${calculos.impoconsumo.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-2">
                        <span>Total Factura:</span>
                        <span className="font-mono text-[#044a23] text-base">${calculos.total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50/90 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-500 font-mono">
            Total Liquidado: <strong className="text-gray-900">${calculos.total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#044a23] hover:bg-[#033b1c] rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Guardar Cambios & Recalcular
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
