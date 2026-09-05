"use client";

import { useState, useEffect } from "react";
import {
  X,
  Scale,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface MedioPago {
  id: number;
  codigo: string;
  nombre: string;
}

interface CuentaTesoreria {
  id: number;
  nombreCuenta: string;
  codigoPuc: string;
  medioPagoId?: number;
  medioPago?: {
    id: number;
    nombre: string;
  } | null;
}

interface TipoRetencion {
  id: number;
  codigo: string;
  nombre: string;
  porcentaje: string | number;
  cuentaPuc: string;
}

interface AsientoItem {
  id?: number;
  cuentaPuc: string;
  concepto: string;
  debito: string | number;
  credito: string | number;
}

interface ModalConciliacionFacturaProps {
  factura: {
    id: number;
    numeroFactura: string;
    totalFactura: string | number;
    subtotal?: string | number;
    iva?: string | number;
    estadoContable?: string;
    medioPagoId?: number | null;
    medioPagoRel?: {
      id: number;
      nombre: string;
    } | null;
    cuentaTesoreriaId?: number | null;
    cuentaTesoreria?: {
      id: number;
      nombreCuenta: string;
      codigoPuc: string;
    } | null;
    proveedor?: {
      razonSocial?: string;
      nit?: string;
    } | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalConciliacionFactura({
  factura,
  onClose,
  onSuccess,
}: ModalConciliacionFacturaProps) {
  const [cuentasTesoreria, setCuentasTesoreria] = useState<CuentaTesoreria[]>([]);
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [selectedMedioPagoId, setSelectedMedioPagoId] = useState<number | "todos">(
    factura.medioPagoId ? Number(factura.medioPagoId) : "todos"
  );
  const [retencionesDB, setRetencionesDB] = useState<TipoRetencion[]>([]);
  const [asientos, setAsientos] = useState<AsientoItem[]>([]);
  const [selectedCuentaTesoreriaId, setSelectedCuentaTesoreriaId] = useState<number | null>(
    factura.cuentaTesoreriaId ? Number(factura.cuentaTesoreriaId) : null
  );
  const [selectedRetencionesIds, setSelectedRetencionesIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [tesoreriaRes, mediosRes, retRes, asientosRes] = await Promise.all([
          fetch("/api/contabilidad/tesoreria").then((r) => r.json()),
          fetch("/api/contabilidad/tesoreria?tipo=medios").then((r) => r.json()),
          fetch("/api/contabilidad/retenciones").then((r) => r.json()),
          fetch(`/api/contabilidad/asientos?facturaId=${factura.id}`).then((r) => r.json()),
        ]);

        if (tesoreriaRes?.data) setCuentasTesoreria(tesoreriaRes.data);
        if (mediosRes?.data && Array.isArray(mediosRes.data)) setMediosPago(mediosRes.data);
        if (retRes?.data) setRetencionesDB(retRes.data);
        if (asientosRes?.data) setAsientos(asientosRes.data);
      } catch (e) {
        console.error("Error al cargar datos de conciliación:", e);
        setError("Error al cargar los datos contables");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [factura.id]);

  // Cuentas filtradas por medio de pago seleccionado
  const cuentasFiltradas = cuentasTesoreria.filter((ct) => {
    if (selectedMedioPagoId === "todos") return true;
    const mId = ct.medioPago?.id || ct.medioPagoId;
    return mId === Number(selectedMedioPagoId);
  });

  const handleSelectMedioPago = (medioId: number | "todos") => {
    setSelectedMedioPagoId(medioId);
    if (medioId !== "todos") {
      const cuentasDelMedio = cuentasTesoreria.filter(
        (ct) => (ct.medioPago?.id || ct.medioPagoId) === Number(medioId)
      );
      const pertenece = cuentasDelMedio.some((ct) => ct.id === selectedCuentaTesoreriaId);
      if (!pertenece) {
        if (cuentasDelMedio.length === 1) {
          setSelectedCuentaTesoreriaId(cuentasDelMedio[0].id);
        } else {
          setSelectedCuentaTesoreriaId(null);
        }
      }
    }
  };

  const handleSelectCuenta = (cuentaId: number | null) => {
    setSelectedCuentaTesoreriaId(cuentaId);
    if (cuentaId) {
      const cuenta = cuentasTesoreria.find((c) => c.id === cuentaId);
      const mId = cuenta?.medioPago?.id || cuenta?.medioPagoId;
      if (mId && selectedMedioPagoId === "todos") {
        setSelectedMedioPagoId(mId);
      }
    }
  };

  const handleConciliar = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/contabilidad/asientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facturaId: factura.id,
          cuentaTesoreriaId: selectedCuentaTesoreriaId || null,
          retencionesIds: selectedRetencionesIds,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg =
          typeof json.error === "object"
            ? json.error?.message || JSON.stringify(json.error)
            : json.error || "Error al registrar la conciliación contable";
        throw new Error(msg);
      }

      setSuccessMsg("¡Conciliación contable y asientos generados con éxito!");

      // Refrescar asientos locales
      const asientosRes = await fetch(`/api/contabilidad/asientos?facturaId=${factura.id}`).then((r) =>
        r.json()
      );
      if (asientosRes?.data) setAsientos(asientosRes.data);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la conciliación";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const totalDebitos = asientos.reduce((acc, a) => acc + Number(a.debito || 0), 0);
  const totalCreditos = asientos.reduce((acc, a) => acc + Number(a.credito || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#044a23] text-white rounded-xl shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Conciliación Contable & Cierre de Tesorería
              </h2>
              <p className="text-xs text-gray-500">
                Factura #{factura.numeroFactura} • {factura.proveedor?.razonSocial || "Proveedor"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">No se pudo conciliar la factura</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {/* Resumen de Factura */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Proveedor:</span>
              <strong className="text-gray-800 truncate block">{factura.proveedor?.razonSocial || "General"}</strong>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Estado Actual:</span>
              <span className="inline-block font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[11px] mt-0.5">
                {factura.estadoContable || "POR CONCILIAR"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 block font-medium">Total Factura:</span>
              <strong className="text-base text-[#044a23] font-mono font-bold">
                ${Number(factura.totalFactura).toLocaleString("es-CO", { maximumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* Formulario de Asignación de Tesorería */}
          <div className="border border-emerald-200 rounded-2xl p-5 bg-gradient-to-br from-emerald-50/40 to-white space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
              <Wallet className="w-4 h-4 text-[#044a23]" />
              <h3 className="font-bold text-gray-800 text-sm">
                Cuenta de Tesorería (Caja / Banco de Pago)
              </h3>
            </div>

            {/* 1. Selector / Filtro de Medio de Pago */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                1. Selecciona o Filtra por Medio de Pago:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectMedioPago("todos")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedMedioPagoId === "todos"
                      ? "bg-[#044a23] text-white shadow-xs"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-emerald-300"
                  }`}
                >
                  Todos los Medios
                </button>
                {mediosPago.map((mp) => {
                  const isSelected = selectedMedioPagoId === mp.id;
                  const totalCuentas = cuentasTesoreria.filter(
                    (ct) => (ct.medioPago?.id || ct.medioPagoId) === mp.id
                  ).length;

                  return (
                    <button
                      key={mp.id}
                      type="button"
                      onClick={() => handleSelectMedioPago(mp.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-[#044a23] text-white shadow-xs"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-emerald-300"
                      }`}
                    >
                      <span>{mp.nombre}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {totalCuentas}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Selector de Caja / Cuenta Bancaria Filtrada */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                2. Selecciona la Caja o Cuenta Bancaria de donde se debitaron los fondos:
              </label>
              <select
                value={selectedCuentaTesoreriaId || ""}
                onChange={(e) => handleSelectCuenta(Number(e.target.value) || null)}
                className="w-full px-3 py-2.5 border border-emerald-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#044a23] bg-white shadow-xs cursor-pointer"
              >
                <option value="">— Ninguna (Dejar como Cuenta por Pagar / Proveedor 220505) —</option>
                {cuentasFiltradas.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.nombreCuenta} (PUC: {ct.codigoPuc}) {ct.medioPago?.nombre ? `• ${ct.medioPago.nombre}` : ""}
                  </option>
                ))}
              </select>
              {cuentasFiltradas.length === 0 && selectedMedioPagoId !== "todos" && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  ⚠️ No hay cajas o cuentas bancarias registradas específicamente para este medio de pago. Puedes seleccionar &quot;Todos los Medios&quot; o configurar una en Contabilidad.
                </p>
              )}
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                💡 <strong>Al asignar una cuenta de tesorería</strong>, la factura pasa a estado <strong>CONCILIADA & PAGADA</strong> (se asienta la salida de dinero). Si dejas <strong>&quot;Ninguna&quot;</strong>, la factura queda <strong>PENDIENTE DE PAGO</strong> registrada como cuenta por pagar (PUC 220505).
              </p>
            </div>

            {/* Retenciones */}
            {retencionesDB.length > 0 && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Retenciones en la Fuente a Practicar (Opcional):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {retencionesDB.map((r) => {
                    const isSelected = selectedRetencionesIds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedRetencionesIds((prev) =>
                            isSelected ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                          );
                        }}
                        className={`p-2.5 rounded-xl text-left border text-xs transition-all flex justify-between items-center cursor-pointer ${
                          isSelected
                            ? "bg-[#044a23] text-white border-[#044a23] shadow-xs"
                            : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                        }`}
                      >
                        <span className="font-medium truncate mr-2">{r.nombre}</span>
                        <span className="font-mono text-[10px] font-bold shrink-0">{Number(r.porcentaje)}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Comprobante de Diario */}
          <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                <span>Asientos Contables Registrados (Partida Doble NIIF)</span>
              </h3>
              <span className="text-[11px] font-mono text-gray-400">
                {asientos.length} líneas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                    <th className="px-3 py-2 text-left">Cuenta PUC</th>
                    <th className="px-3 py-2 text-left">Concepto</th>
                    <th className="px-3 py-2 text-right">Débito</th>
                    <th className="px-3 py-2 text-right">Crédito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {asientos.length > 0 ? (
                    asientos.map((a, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-blue-700 font-bold">{a.cuentaPuc}</td>
                        <td className="px-3 py-2 text-gray-700 font-sans">{a.concepto}</td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                          {Number(a.debito) > 0 ? `$${Number(a.debito).toLocaleString("es-CO", { maximumFractionDigits: 0 })}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-purple-700">
                          {Number(a.credito) > 0 ? `$${Number(a.credito).toLocaleString("es-CO", { maximumFractionDigits: 0 })}` : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-5 text-center text-gray-400 font-sans">
                        Haz clic en "Guardar & Conciliar" para asentar el comprobante de diario.
                      </td>
                    </tr>
                  )}
                </tbody>
                {asientos.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-[11px]">
                      <td colSpan={2} className="px-3 py-2 text-right font-sans">
                        SUMAS IGUALES:
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-800">
                        ${totalDebitos.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-2 text-right text-purple-800">
                        ${totalCreditos.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handleConciliar}
            disabled={isSaving || isLoading}
            className="px-5 py-2 text-xs font-bold text-white bg-[#044a23] hover:bg-[#033b1c] rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Asentando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Guardar & Asentar Conciliación
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
