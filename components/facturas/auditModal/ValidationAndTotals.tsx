"use client";
import { ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";

export function ValidationAndTotals({
  data, setData, auditMetadata, setAuditMetadata, tiposOperacionDB, mediosPagoDB,
  warningSubtotal, warningIVA, warningTotal, subtotalReportado, ivaReportado, totalReportado,
  sumaCostoBase, sumaIVA, sumaTotalLineas
}: any) {
  
  const handleTotalesChange = (field: string, value: string) => {
    setData({ ...data, totales: { ...data.totales, [field]: Number(value) }});
  };

  return (
    <div className="space-y-6">
      {/* Auditoría de Cuadre */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-white">
        <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2 pb-2 border-b border-gray-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Validación de Cuadre Matemático
        </h4>
        <div className="overflow-x-auto text-xs">
          <table className="w-full">
            <thead className="text-gray-600 border-b border-gray-200">
              <tr>
                <th className="pb-2 text-left font-semibold">Concepto</th>
                <th className="pb-2 text-right font-semibold">En la Factura</th>
                <th className="pb-2 text-right font-semibold">Calculado</th>
                <th className="pb-2 text-center font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className={warningSubtotal ? "bg-red-50" : "bg-white"}>
                <td className="py-2 font-medium text-gray-800">Subtotal</td>
                <td className="py-2 text-right font-mono text-gray-700">${subtotalReportado.toFixed(2)}</td>
                <td className="py-2 text-right font-mono font-semibold text-gray-900">${sumaCostoBase.toFixed(2)}</td>
                <td className="py-2 text-center">{!warningSubtotal ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />}</td>
              </tr>
              <tr className={warningIVA ? "bg-red-50" : "bg-white"}>
                <td className="py-2 font-medium text-gray-800">IVA Total</td>
                <td className="py-2 text-right font-mono text-gray-700">${ivaReportado.toFixed(2)}</td>
                <td className="py-2 text-right font-mono font-semibold text-gray-900">${sumaIVA.toFixed(2)}</td>
                <td className="py-2 text-center">{!warningIVA ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />}</td>
              </tr>
              <tr className={warningTotal ? "bg-red-50" : "bg-white"}>
                <td className="py-2 font-bold text-gray-800">Total a Pagar</td>
                <td className="py-2 text-right font-mono font-bold text-gray-900">${totalReportado.toFixed(2)}</td>
                <td className="py-2 text-right font-mono font-bold text-emerald-700">${sumaTotalLineas.toFixed(2)}</td>
                <td className="py-2 text-center">{!warningTotal ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Totales Editable */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-200">Resumen de Totales</h3>
        <div className="space-y-2.5 text-sm">
          {["subtotal", "descuento_total_factura", "iva_5", "iva_19", "impoconsumo_total", "otros_impuestos_total"].map((field) => (
            <div key={field} className="flex justify-between items-center">
              <span className="text-gray-600 font-medium capitalize">{field.replace(/_/g, ' ')}:</span>
              <input type="number" value={data.totales?.[field] || 0} onChange={(e) => handleTotalesChange(field, e.target.value)}
                className={`w-32 text-right px-2 py-1 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-semibold ${field === "descuento_total_factura" ? "text-red-600" : ""}`}
              />
            </div>
          ))}
          <div className="border-t border-gray-300 pt-3 mt-3 flex justify-between items-center">
            <span className="font-bold text-gray-800">Total a Pagar:</span>
            <input type="number" value={data.totales?.total_factura || 0} onChange={(e) => handleTotalesChange("total_factura", e.target.value)}
              className="w-32 text-right px-2 py-1 bg-emerald-50 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-lg text-emerald-700"
            />
          </div>
        </div>
      </div>

      {/* Clasificación Contable y Pago */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm pb-2 border-b border-gray-200">🏷️ Clasificación de la Operación y Pago</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Operación / Destino *</label>
            <select value={auditMetadata.tipoOperacionId || ""} onChange={(e) => setAuditMetadata({ ...auditMetadata, tipoOperacionId: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-white">
              {tiposOperacionDB.map((t: any) => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Medio de Pago Macro *</label>
            <select value={auditMetadata.medioPagoId || ""} onChange={(e) => {
                const idNum = Number(e.target.value);
                const found = mediosPagoDB.find((m: any) => m.id === idNum);
                setAuditMetadata({ ...auditMetadata, medioPagoId: idNum });
                if (found) {
                  setData((prev: any) => ({ ...prev, condiciones_comerciales: { ...(prev.condiciones_comerciales || {}), medio_pago: found.nombre }}));
                }
              }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-white">
              {mediosPagoDB.map((mp: any) => (<option key={mp.id} value={mp.id}>{mp.nombre}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Observaciones de Auditoría */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Observaciones de Auditoría</label>
        <textarea value={auditMetadata.observacionAuditoria} onChange={(e) => setAuditMetadata({ ...auditMetadata, observacionAuditoria: e.target.value })} placeholder="Ej: Aprobada. Descuadre de $50 por redondeo aceptable..." rows={2} className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"/>
      </div>
    </div>
  );
}