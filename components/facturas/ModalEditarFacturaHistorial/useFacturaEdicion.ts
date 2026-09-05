import { useState, useEffect, useMemo } from "react";
import { FacturaItemEdit } from "./types";

export function useFacturaEdicion(facturaId: number, onSuccess: () => void, onClose: () => void) {
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

  // Cargar catálogos y datos iniciales
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

    return { subtotal, descuento, iva, impoconsumo, otrosImpuestos: otrosImp, total };
  }, [items]);

  const handleItemChange = (index: number, field: keyof FacturaItemEdit, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

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

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (!form.numeroFactura.trim()) throw new Error("El número de factura es obligatorio");
      if (items.length === 0) throw new Error("Debe incluir al menos un producto");

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

  const cuentasTesoreriaFiltradas = useMemo(() => {
    if (!form.medioPagoId) return cuentasTesoreria;
    return cuentasTesoreria.filter((c) => String(c.medioPagoId) === String(form.medioPagoId));
  }, [cuentasTesoreria, form.medioPagoId]);

  return {
    isLoading,
    isSaving,
    error,
    activeTab,
    setActiveTab,
    form,
    setForm,
    items,
    tiposOperacion,
    mediosPago,
    cuentasTesoreriaFiltradas,
    calculos,
    handleItemChange,
    handleAddItem,
    handleRemoveItem,
    handleSave,
  };
}