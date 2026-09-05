"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  DollarSign,
  Package,
  Layers,
  HelpCircle,
  Barcode,
  Landmark,
} from "lucide-react";

interface TipoOperacion {
  id: number;
  codigo: string;
  nombre: string;
  cuentaPucDebito: string;
  cuentaPucCredito?: string | null;
  afectaInventario: boolean;
}

interface MedioPago {
  id: number;
  codigo: string;
  nombre: string;
}

interface CuentaTesoreria {
  id: number;
  medioPagoId: number;
  codigoPuc: string;
  nombreCuenta: string;
  numeroReferencia?: string | null;
}

interface ItemRow {
  id: string;
  nombreProducto: string;
  codigoBarras: string;
  cantidadIngresada: number;
  unidadMedida: string;
  costoUnitarioCompra: number;
  costoTotalLinea: number;
}

interface ModalDocumentoSoporteProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalDocumentoSoporte({
  isOpen,
  onClose,
  onSuccess,
}: ModalDocumentoSoporteProps) {
  // Form state
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [fechaEmision, setFechaEmision] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [proveedorNit, setProveedorNit] = useState("");
  const [proveedorNombre, setProveedorNombre] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [selectedTipoOpId, setSelectedTipoOpId] = useState<number | null>(null);
  const [selectedCuentaId, setSelectedCuentaId] = useState<number | null>(null);
  const [filtroMedioPagoTab, setFiltroMedioPagoTab] = useState<string>("TODOS");

  // Items
  const [items, setItems] = useState<ItemRow[]>([
    {
      id: "row-1",
      nombreProducto: "",
      codigoBarras: "",
      cantidadIngresada: 1,
      unidadMedida: "UND",
      costoUnitarioCompra: 0,
      costoTotalLinea: 0,
    },
  ]);

  // Catalog state
  const [tiposOperacion, setTiposOperacion] = useState<TipoOperacion[]>([]);
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [cuentasTesoreria, setCuentasTesoreria] = useState<CuentaTesoreria[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch catalogs & suggested consecutive
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingCatalogs(true);
    setErrorMessage(null);

    Promise.all([
      fetch("/api/contabilidad/tipos-operacion").then((r) => r.json()),
      fetch("/api/contabilidad/tesoreria?tipo=medios").then((r) => r.json()),
      fetch("/api/contabilidad/tesoreria?tipo=cuentas").then((r) => r.json()),
      fetch("/api/facturas/documento-soporte").then((r) => r.json()),
    ])
      .then(([opsRes, mediosRes, cuentasRes, dsRes]) => {
        if (opsRes?.data && Array.isArray(opsRes.data) && opsRes.data.length > 0) {
          setTiposOperacion(opsRes.data);
          // Set default to COMPRA_MERCANCIA or first active operation
          const invOp =
            opsRes.data.find((o: TipoOperacion) => o.codigo === "COMPRA_MERCANCIA") ||
            opsRes.data.find((o: TipoOperacion) => o.codigo === "COMPRA_INVENTARIO") ||
            opsRes.data[0];
          if (invOp) setSelectedTipoOpId(invOp.id);
        }
        if (mediosRes?.data && Array.isArray(mediosRes.data)) {
          setMediosPago(mediosRes.data);
        }
        if (cuentasRes?.data && Array.isArray(cuentasRes.data)) {
          setCuentasTesoreria(cuentasRes.data);
          // Auto select first Caja Mostrador if available
          const caja = cuentasRes.data.find((c: CuentaTesoreria) =>
            c.nombreCuenta.toLowerCase().includes("caja")
          );
          if (caja) setSelectedCuentaId(caja.id);
        }
        if (dsRes?.data?.consecutivoSugerido) {
          setNumeroDocumento(dsRes.data.consecutivoSugerido);
        }
      })
      .catch((err) => {
        console.error("Error al cargar datos para Documento Soporte:", err);
        setErrorMessage("Error al conectar con el sistema de catálogos contables.");
      })
      .finally(() => {
        setIsLoadingCatalogs(false);
      });
  }, [isOpen]);

  // Reactive filtering of treasury accounts
  const cuentasFiltradas = useMemo(() => {
    if (filtroMedioPagoTab === "TODOS") return cuentasTesoreria;
    const tabLower = filtroMedioPagoTab.toLowerCase();
    const mediosMatch = mediosPago.filter((m) => {
      const nom = m.nombre.toLowerCase();
      if (tabLower === "efectivo") return nom.includes("efectivo");
      if (tabLower === "transferencia") return nom.includes("transferencia") || nom.includes("banco");
      if (tabLower === "billeteras") return nom.includes("nequi") || nom.includes("daviplata") || nom.includes("billetera");
      if (tabLower === "tarjeta") return nom.includes("tarjeta") || nom.includes("debito") || nom.includes("credito");
      return false;
    });
    const idsMedios = mediosMatch.map((m) => m.id);
    return cuentasTesoreria.filter((c) => idsMedios.includes(c.medioPagoId));
  }, [cuentasTesoreria, mediosPago, filtroMedioPagoTab]);

  // Row update helpers
  const handleItemChange = (
    id: string,
    field: keyof ItemRow,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "cantidadIngresada" || field === "costoUnitarioCompra") {
          const qty = field === "cantidadIngresada" ? Number(value) : item.cantidadIngresada;
          const cost = field === "costoUnitarioCompra" ? Number(value) : item.costoUnitarioCompra;
          updated.costoTotalLinea = Math.round(qty * cost * 100) / 100;
        }
        return updated;
      })
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        nombreProducto: "",
        codigoBarras: "",
        cantidadIngresada: 1,
        unidadMedida: "UND",
        costoUnitarioCompra: 0,
        costoTotalLinea: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Grand Total Calculation
  const totalCalculado = useMemo(() => {
    return items.reduce((acc, curr) => acc + (Number(curr.costoTotalLinea) || 0), 0);
  }, [items]);

  const tipoOperacionActual = useMemo(() => {
    return tiposOperacion.find((t) => t.id === selectedTipoOpId);
  }, [tiposOperacion, selectedTipoOpId]);

  const cuentaActual = useMemo(() => {
    return cuentasTesoreria.find((c) => c.id === selectedCuentaId);
  }, [cuentasTesoreria, selectedCuentaId]);

  // Submission handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!proveedorNit.trim() || !proveedorNombre.trim()) {
      setErrorMessage("Por favor ingresa la cédula/NIT y el nombre del vendedor o proveedor informal.");
      return;
    }

    if (items.length === 0 || totalCalculado <= 0) {
      setErrorMessage("Debes registrar al menos un producto con valor mayor a $0.");
      return;
    }

    for (const it of items) {
      if (!it.nombreProducto.trim()) {
        setErrorMessage("Todos los ítems deben tener un nombre o descripción del producto.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        numeroDocumento: numeroDocumento.trim() || null,
        fechaEmision,
        proveedorNit: proveedorNit.trim(),
        proveedorNombre: proveedorNombre.trim(),
        tipoOperacionId: selectedTipoOpId,
        cuentaTesoreriaId: selectedCuentaId || null,
        observaciones: observaciones.trim() || null,
        subtotal: totalCalculado,
        total: totalCalculado,
        items: items.map((it) => ({
          nombreProducto: it.nombreProducto.trim(),
          codigoBarras: it.codigoBarras.trim() || null,
          cantidadIngresada: Number(it.cantidadIngresada),
          unidadMedida: it.unidadMedida || "UND",
          costoUnitarioCompra: Number(it.costoUnitarioCompra),
          costoTotalLinea: Number(it.costoTotalLinea),
        })),
      };

      const res = await fetch("/api/facturas/documento-soporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        let errorMsg = json.error?.message || "No fue posible registrar el Documento Soporte";
        if (Array.isArray(json.error?.details) && json.error.details.length > 0) {
          const detailStrings = json.error.details.map(
            (d: any) => `${d.field}: ${d.message}`
          );
          errorMsg += ` (${detailStrings.join(", ")})`;
        }
        throw new Error(errorMsg);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error al registrar Documento Soporte:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Error inesperado al guardar el documento."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-[#067335] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg text-white">
                  Nuevo Documento Soporte
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#038C3E] text-white border border-white/20">
                  Compras sin Factura
                </span>
              </div>
              <p className="text-xs text-white/80 font-sans mt-0.5">
                Ingreso oficial de mercancía a no obligados a facturar y descarga directa de tesorería.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoadingCatalogs ? (
            <div className="py-16 text-center text-gray-500 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#067335]" />
              <p className="text-xs">Cargando catálogos y consecutivo contable...</p>
            </div>
          ) : (
            <>
              {/* Sección 1: Datos Generales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200/70">
                {/* Consecutivo */}
                <div>
                  <label
                    htmlFor="ds-consecutivo"
                    className="block text-xs font-semibold text-gray-700 mb-1 cursor-help"
                    title="Identificador consecutivo interno para compras a no obligados a facturar"
                  >
                    N° Documento Soporte <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ds-consecutivo"
                    type="text"
                    required
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    placeholder="DS-0001"
                    className="w-full text-xs font-mono font-bold text-[#067335] bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#067335] focus:outline-hidden"
                  />
                </div>

                {/* Fecha Emisión */}
                <div>
                  <label
                    htmlFor="ds-fecha"
                    className="block text-xs font-semibold text-gray-700 mb-1 cursor-help"
                    title="Fecha real en que se efectuó la compra de mercancía"
                  >
                    Fecha de Compra <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="ds-fecha"
                      type="date"
                      required
                      value={fechaEmision}
                      onChange={(e) => setFechaEmision(e.target.value)}
                      className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 pl-8 focus:ring-2 focus:ring-[#067335] focus:outline-hidden"
                    />
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Tipo de Operación */}
                <div>
                  <label
                    htmlFor="ds-tipo-op"
                    className="block text-xs font-semibold text-gray-700 mb-1 cursor-help"
                    title="Determina la cuenta contable de destino (ej. 143505 Inventario Mercancía)"
                  >
                    Tipo de Operación Contable
                  </label>
                  <select
                    id="ds-tipo-op"
                    value={selectedTipoOpId || ""}
                    onChange={(e) => setSelectedTipoOpId(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#067335] focus:outline-hidden"
                  >
                    {tiposOperacion.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.nombre} ({op.cuentaPucDebito})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección 2: Proveedor Informal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div>
                  <label
                    htmlFor="ds-nit"
                    className="block text-xs font-semibold text-gray-700 mb-1 cursor-help"
                    title="Cédula de ciudadanía o NIT del vendedor sin factura electrónica"
                  >
                    Cédula / NIT del Vendedor <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="ds-nit"
                      type="text"
                      required
                      value={proveedorNit}
                      onChange={(e) => setProveedorNit(e.target.value)}
                      placeholder="Ej. 1023456789"
                      className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 pl-8 focus:ring-2 focus:ring-[#067335] focus:outline-hidden"
                    />
                    <Building2 className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ds-proveedor-nombre"
                    className="block text-xs font-semibold text-gray-700 mb-1 cursor-help"
                    title="Nombre completo del comerciante, campesino o proveedor informal"
                  >
                    Nombre del Vendedor / Proveedor <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ds-proveedor-nombre"
                    type="text"
                    required
                    value={proveedorNombre}
                    onChange={(e) => setProveedorNombre(e.target.value)}
                    placeholder="Ej. Distribuidor Local / Juan Pérez"
                    className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#067335] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Sección 3: Items de Mercancía */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#067335]" />
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Detalle de Productos / Mercancía
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-[#067335] hover:text-[#038C3E] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A7D9BD]/20 hover:bg-[#A7D9BD]/40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Producto
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F2F2F2] border-b border-gray-200 font-semibold text-gray-700">
                      <tr>
                        <th className="py-2.5 px-3 cursor-help" title="Nombre o descripción del artículo comprado">
                          Producto / Concepto <span className="text-red-500">*</span>
                        </th>
                        <th className="py-2.5 px-3 cursor-help w-32" title="Código de barras para sincronizar con el catálogo">
                          Cód. Barras (Opcional)
                        </th>
                        <th className="py-2.5 px-3 cursor-help w-20 text-center" title="Cantidad física ingresada">
                          Cant.
                        </th>
                        <th className="py-2.5 px-3 cursor-help w-28 text-right" title="Costo unitario de compra">
                          Costo Unit. ($)
                        </th>
                        <th className="py-2.5 px-3 cursor-help w-28 text-right" title="Costo total de la línea">
                          Total ($)
                        </th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((it, idx) => (
                        <tr key={it.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={it.nombreProducto}
                              onChange={(e) => handleItemChange(it.id, "nombreProducto", e.target.value)}
                              placeholder="Ej. Cerveza Artesanal 330ml / Hielo 5kg"
                              className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-[#067335] focus:outline-hidden"
                            />
                          </td>
                          <td className="p-2">
                            <div className="relative">
                              <input
                                type="text"
                                value={it.codigoBarras}
                                onChange={(e) => handleItemChange(it.id, "codigoBarras", e.target.value)}
                                placeholder="EAN-13"
                                className="w-full text-xs font-mono border border-gray-200 rounded-md px-2 py-1.5 pl-6 focus:ring-1 focus:ring-[#067335] focus:outline-hidden"
                              />
                              <Barcode className="w-3.5 h-3.5 text-gray-400 absolute left-1.5 top-2 pointer-events-none" />
                            </div>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              required
                              value={it.cantidadIngresada}
                              onChange={(e) => handleItemChange(it.id, "cantidadIngresada", Number(e.target.value))}
                              className="w-full text-center text-xs font-semibold border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-[#067335] focus:outline-hidden"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              value={it.costoUnitarioCompra || ""}
                              onChange={(e) => handleItemChange(it.id, "costoUnitarioCompra", Number(e.target.value))}
                              placeholder="0"
                              className="w-full text-right text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-[#067335] focus:outline-hidden"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-gray-900">
                            ${(it.costoTotalLinea || 0).toLocaleString("es-CO")}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(it.id)}
                              disabled={items.length <= 1}
                              className="text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 p-1 rounded-md transition-colors cursor-pointer"
                              title="Eliminar fila"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sección 4: Forma de Pago & Tesorería */}
              <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[#067335]" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Desembolso y Cuenta de Pago
                  </h3>
                </div>

                {/* Filtro rápido por tipo de medio */}
                <div className="flex flex-wrap gap-1.5">
                  {["TODOS", "EFECTIVO", "TRANSFERENCIA", "BILLETERAS", "TARJETA"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFiltroMedioPagoTab(tab)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                        filtroMedioPagoTab === tab
                          ? "bg-[#067335] text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label
                      htmlFor="ds-cuenta-tesoreria"
                      className="block text-xs font-semibold text-gray-700 mb-1 cursor-help"
                      title="Caja o banco desde el cual se cancela la compra. Si se deja en 'Cuenta por Pagar', queda pendiente de pago"
                    >
                      Caja / Banco de Salida
                    </label>
                    <select
                      id="ds-cuenta-tesoreria"
                      value={selectedCuentaId || ""}
                      onChange={(e) =>
                        setSelectedCuentaId(e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-[#067335] focus:outline-hidden"
                    >
                      <option value="">— Dejar como Cuenta por Pagar (Proveedor 220505 - Crédito) —</option>
                      {cuentasFiltradas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombreCuenta} (PUC {c.codigoPuc})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="ds-observaciones"
                      className="block text-xs font-semibold text-gray-700 mb-1 cursor-help"
                      title="Notas adicionales sobre la procedencia de la compra o entrega"
                    >
                      Observaciones / Concepto
                    </label>
                    <input
                      id="ds-observaciones"
                      type="text"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Ej. Compra directa a productor local con entrega en tienda"
                      className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#067335] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 5: Resumen Contable y Totales */}
              <div className="bg-[#067335]/5 border border-[#067335]/20 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#067335]" />
                    <span className="text-xs font-bold text-gray-900">
                      Asiento Contable Proyectado:
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-mono">
                    <span className="text-[#067335] font-bold">Débito {tipoOperacionActual?.cuentaPucDebito || "143505"}</span> ({tipoOperacionActual?.nombre || "Inventario"}) → ${totalCalculado.toLocaleString("es-CO")}
                    <br />
                    <span className="text-blue-700 font-bold">Crédito {cuentaActual?.codigoPuc || "220505"}</span> ({cuentaActual?.nombreCuenta || "Proveedores Nacionales - Cta por Pagar"}) → ${totalCalculado.toLocaleString("es-CO")}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-500 font-semibold block">
                    TOTAL DOCUMENTO SOPORTE
                  </span>
                  <span className="text-2xl font-serif font-extrabold text-[#067335]">
                    ${totalCalculado.toLocaleString("es-CO")}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoadingCatalogs || totalCalculado <= 0}
              className="bg-[#038C3E] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#067335] transition-all shadow-md shadow-[#038C3E]/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Contabilizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Registrar Documento Soporte
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
