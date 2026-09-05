"use client";

import { useState, useEffect } from "react";
import { X, Scale, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { CuentaTesoreria, MedioPago, TipoRetencion, AsientoItem, ModalConciliacionFacturaProps } from "./types";
import { FacturaResumen } from "./FacturaResumen";
import { FormularioTesoreria } from "./FormularioTesoreria";
import { TablaAsientos } from "./TablaAsientos";

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

  const handleToggleRetencion = (rId: number) => {
    setSelectedRetencionesIds((prev) =>
      prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]
    );
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header fijo */}
        <div className="px-4 sm:px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 overflow-hidden pr-2">
            <div className="p-2.5 bg-[#044a23] text-white rounded-xl shadow-xs shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold text-gray-900 leading-snug truncate">
                Conciliación Contable
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                Factura #{factura.numeroFactura} • {factura.proveedor?.razonSocial || "Proveedor"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable (con padding horizontal simétrico en móviles) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 w-full">
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
          <FacturaResumen factura={factura} />

          {/* Formulario de Tesorería y Retenciones */}
          <FormularioTesoreria
            mediosPago={mediosPago}
            cuentasTesoreria={cuentasTesoreria}
            selectedMedioPagoId={selectedMedioPagoId}
            selectedCuentaTesoreriaId={selectedCuentaTesoreriaId}
            retencionesDB={retencionesDB}
            selectedRetencionesIds={selectedRetencionesIds}
            onSelectMedioPago={handleSelectMedioPago}
            onSelectCuenta={handleSelectCuenta}
            onToggleRetencion={handleToggleRetencion}
          />

          {/* Tabla de Asientos Contables */}
          <TablaAsientos asientos={asientos} />
        </div>

        {/* Footer fijo */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer text-center"
          >
            Cancelar
          </button>
          <button
            onClick={handleConciliar}
            disabled={isSaving || isLoading}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs font-bold text-white bg-[#044a23] hover:bg-[#033b1c] rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Asentando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Guardar
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}