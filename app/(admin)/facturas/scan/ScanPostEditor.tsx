import { Check, CheckCircle2, Save, Plus, Trash2 } from "lucide-react";

interface Props {
  extractedData: any;
  isSaving: boolean;
  saveSuccessMsg: string | null;
  error: string | null;
  onClearAll: () => void;
  onSaveAuditChanges: () => void;
  handleUpdateField: (f: string, v: any) => void;
  handleUpdateProvider: (f: string, v: string) => void;
  handleUpdateClient: (f: string, v: string) => void;
  handleUpdateItem: (idx: number, f: string, v: any) => void;
  handleAddItem: () => void;
  handleRemoveItem: (idx: number) => void;
}

export function ScanPostEditor(props: Props) {
  const { extractedData, isSaving, saveSuccessMsg, error } = props;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Feedback */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 text-white rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 text-base">¡Factura extraída con éxito!</h3>
            <p className="text-xs text-emerald-700">Revisa o completa los datos extraídos por la IA.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={props.onClearAll} className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100">
            Escanear Otra
          </button>
          <a href="/facturas/audit" className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs">
            Ver Lista
          </a>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> <span>{saveSuccessMsg}</span>
        </div>
      )}
      {error && <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium">{error}</div>}

      {/* Proveedor y Cliente */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">1. Proveedor y Cliente</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">NIT Proveedor</label>
            <input type="text" value={extractedData?.proveedor?.nit || ""} onChange={(e) => props.handleUpdateProvider("nit", e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Razón Social</label>
            <input type="text" value={extractedData?.proveedor?.razon_social || ""} onChange={(e) => props.handleUpdateProvider("razon_social", e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">NIT Receptor</label>
            <input type="text" value={extractedData?.cliente_receptor?.documento || "1032401381"} onChange={(e) => props.handleUpdateClient("documento", e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre Receptor</label>
            <input type="text" value={extractedData?.cliente_receptor?.nombre || "GUEVARA VANEGAS YULI MARCELA"} onChange={(e) => props.handleUpdateClient("nombre", e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Documento y Fechas */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">2. Datos del Documento</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo Documento</label>
            <select value={extractedData?.tipo_documento || "Factura Electrónica"} onChange={(e) => props.handleUpdateField("tipo_documento", e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500">
              <option value="Factura Electrónica">Factura Electrónica</option>
              <option value="Factura POS">Factura POS</option>
              <option value="Remision">Remisión</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">N° Factura</label>
            <input type="text" value={extractedData?.numero_factura || ""} onChange={(e) => props.handleUpdateField("numero_factura", e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Emisión</label>
            <input type="text" value={extractedData?.fecha_emision || ""} onChange={(e) => props.handleUpdateField("fecha_emision", e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Vencimiento</label>
            <input type="text" value={extractedData?.fecha_vencimiento || ""} onChange={(e) => props.handleUpdateField("fecha_vencimiento", e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">3. Productos ({extractedData?.items?.length || 0})</h4>
          <button onClick={props.handleAddItem} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs">
            <Plus className="w-3.5 h-3.5" /> Agregar Fila
          </button>
        </div>
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-200 text-slate-700 font-bold text-[11px] border-b border-slate-300">
                <th className="p-2 w-28">Ref / Cód</th>
                <th className="p-2">Descripción Producto</th>
                <th className="p-2 w-20 text-center">Cant.</th>
                <th className="p-2 w-24 text-right">Costo Unit.</th>
                <th className="p-2 w-20 text-right">Dcto.</th>
                <th className="p-2 w-24 text-right">IVA $</th>
                <th className="p-2 w-20 text-right">ICO $</th>
                <th className="p-2 w-24 text-right">Total Línea</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {(extractedData?.items || []).map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="p-1.5"><input type="text" value={item.codigo_proveedor || item.codigo_barras || ""} onChange={(e) => props.handleUpdateItem(idx, "codigo_proveedor", e.target.value)} className="w-full border rounded p-1 text-xs" /></td>
                  <td className="p-1.5"><input type="text" value={item.descripcion || ""} onChange={(e) => props.handleUpdateItem(idx, "descripcion", e.target.value)} className="w-full border rounded p-1 text-xs font-medium" /></td>
                  <td className="p-1.5"><input type="number" value={item.cantidad_ingresada || ""} onChange={(e) => props.handleUpdateItem(idx, "cantidad_ingresada", Number(e.target.value))} className="w-full border rounded p-1 text-xs text-center" /></td>
                  <td className="p-1.5"><input type="number" value={item.costo_unitario_compra || ""} onChange={(e) => props.handleUpdateItem(idx, "costo_unitario_compra", Number(e.target.value))} className="w-full border rounded p-1 text-xs text-right" /></td>
                  <td className="p-1.5"><input type="number" value={item.descuento_por_producto || ""} onChange={(e) => props.handleUpdateItem(idx, "descuento_por_producto", Number(e.target.value))} className="w-full border rounded p-1 text-xs text-right" /></td>
                  <td className="p-1.5"><input type="number" value={item.iva_total || ""} onChange={(e) => props.handleUpdateItem(idx, "iva_total", Number(e.target.value))} className="w-full border rounded p-1 text-xs text-right" /></td>
                  <td className="p-1.5"><input type="number" value={item.impuesto_consumo || ""} onChange={(e) => props.handleUpdateItem(idx, "impuesto_consumo", Number(e.target.value))} className="w-full border rounded p-1 text-xs text-right" /></td>
                  <td className="p-1.5"><input type="number" value={item.costo_total_linea || ""} onChange={(e) => props.handleUpdateItem(idx, "costo_total_linea", Number(e.target.value))} className="w-full border rounded p-1 text-xs font-bold text-right" /></td>
                  <td className="p-1.5 text-center"><button onClick={() => props.handleRemoveItem(idx)} className="p-1 text-slate-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totales */}
      <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h5 className="font-bold text-sm text-slate-200">Resumen y Liquidación</h5>
        </div>
        <div className="flex flex-wrap gap-4 text-right">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700"><span className="text-[10px] text-slate-400 block uppercase">Subtotal</span><span className="text-xs font-mono font-semibold">${Number(extractedData?.totales?.subtotal || 0).toLocaleString("es-CO")}</span></div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700"><span className="text-[10px] text-slate-400 block uppercase">Total IVA</span><span className="text-xs font-mono font-semibold">${Number((Number(extractedData?.totales?.iva_19 || 0) + Number(extractedData?.totales?.iva_5 || 0))).toLocaleString("es-CO")}</span></div>
          <div className="bg-emerald-950/80 px-4 py-1.5 rounded-lg border border-emerald-500/40"><span className="text-[10px] text-emerald-400 block font-bold uppercase">Total Factura</span><span className="text-sm font-mono font-bold text-emerald-300">${Number(extractedData?.totales?.total_factura || 0).toLocaleString("es-CO")}</span></div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
        <button onClick={props.onClearAll} className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100">Descartar</button>
        <div className="flex gap-3">
          <button disabled={isSaving} onClick={props.onSaveAuditChanges} className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <Save className="w-4 h-4" /> <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
          <a href="/facturas/audit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4" /> Ir a Auditar
          </a>
        </div>
      </div>
    </div>
  );
}