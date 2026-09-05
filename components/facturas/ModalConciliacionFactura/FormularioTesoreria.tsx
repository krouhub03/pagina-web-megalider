import React from "react";
import { Wallet } from "lucide-react";
import { CuentaTesoreria, MedioPago, TipoRetencion } from "./types";

interface FormularioTesoreriaProps {
  mediosPago: MedioPago[];
  cuentasTesoreria: CuentaTesoreria[];
  selectedMedioPagoId: number | "todos";
  selectedCuentaTesoreriaId: number | null;
  retencionesDB: TipoRetencion[];
  selectedRetencionesIds: number[];
  onSelectMedioPago: (medioId: number | "todos") => void;
  onSelectCuenta: (cuentaId: number | null) => void;
  onToggleRetencion: (retencionId: number) => void;
}

export const FormularioTesoreria: React.FC<FormularioTesoreriaProps> = ({
  mediosPago,
  cuentasTesoreria,
  selectedMedioPagoId,
  selectedCuentaTesoreriaId,
  retencionesDB,
  selectedRetencionesIds,
  onSelectMedioPago,
  onSelectCuenta,
  onToggleRetencion,
}) => {
  const cuentasFiltradas = cuentasTesoreria.filter((ct) => {
    if (selectedMedioPagoId === "todos") return true;
    const mId = ct.medioPago?.id || ct.medioPagoId;
    return mId === Number(selectedMedioPagoId);
  });

  return (
    <div className="border border-emerald-200 rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-emerald-50/40 to-white space-y-4 shadow-2xs">
      <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
        <Wallet className="w-4 h-4 text-[#044a23] shrink-0" />
        <h3 className="font-bold text-gray-800 text-sm leading-snug">
          Cuenta de Tesorería (Caja / Banco de Pago)
        </h3>
      </div>

      {/* 1. Selector / Filtro de Medio de Pago */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-700">
          1. Medio de Pago:
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onSelectMedioPago("todos")}
            className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedMedioPagoId === "todos"
                ? "bg-[#044a23] text-white shadow-xs"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-emerald-300"
            }`}
          >
            Todos
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
                onClick={() => onSelectMedioPago(mp.id)}
                className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-[#044a23] text-white shadow-xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-emerald-300"
                }`}
              >
                <span>{mp.nombre}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
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
          2. Selecciona la Cuenta Tesoreria
        </label>
        <select
          value={selectedCuentaTesoreriaId || ""}
          onChange={(e) => onSelectCuenta(Number(e.target.value) || null)}
          className="w-full px-3 py-3 sm:py-2.5 border border-emerald-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#044a23] bg-white shadow-xs cursor-pointer truncate"
        >
          <option value="">elegir</option>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {retencionesDB.map((r) => {
              const isSelected = selectedRetencionesIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onToggleRetencion(r.id)}
                  className={`p-3 sm:p-2.5 rounded-xl text-left border text-xs transition-all flex justify-between items-center cursor-pointer ${
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
  );
};