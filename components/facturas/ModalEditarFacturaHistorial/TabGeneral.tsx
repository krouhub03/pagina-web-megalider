import { FileText, Wallet } from "lucide-react";

interface TabGeneralProps {
  form: any;
  setForm: (form: any) => void;
  tiposOperacion: any[];
  mediosPago: any[];
  cuentasTesoreriaFiltradas: any[];
}

export function TabGeneral({
  form,
  setForm,
  tiposOperacion,
  mediosPago,
  cuentasTesoreriaFiltradas,
}: TabGeneralProps) {
  return (
    <div className="space-y-5">
      {/* Bloque: Metadatos Básicos */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#044a23]" />
          Identificación del Documento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          <div className="sm:col-span-2 lg:col-span-1">
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
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-100 flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5 text-[#044a23]" />
          Tesorería
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          <div className="sm:col-span-2 lg:col-span-1">
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
  );
}