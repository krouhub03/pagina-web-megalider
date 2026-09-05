import { useState } from "react";
import { FileText, ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  fields: any;
  onChange: (fields: any) => void;
  visible: boolean;
}

export function ScanManualForm({ fields, onChange, visible }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  if (!visible) return null;

  return (
    <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 shadow-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/80 transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              Completar Datos Manualmente <span className="text-xs font-normal text-slate-500">(Opcional)</span>
            </h4>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">NIT Proveedor</label>
            <input 
              type="text" 
              value={fields.proveedor_nit}
              onChange={(e) => onChange({ ...fields, proveedor_nit: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Razón Social</label>
            <input 
              type="text" 
              value={fields.proveedor_razon_social}
              onChange={(e) => onChange({ ...fields, proveedor_razon_social: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">N° de Factura</label>
            <input 
              type="text" 
              value={fields.numero_factura}
              onChange={(e) => onChange({ ...fields, numero_factura: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Emisión</label>
            <input 
              type="date" 
              value={fields.fecha_emision}
              onChange={(e) => onChange({ ...fields, fecha_emision: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Vencimiento</label>
            <input 
              type="date" 
              value={fields.fecha_vencimiento}
              onChange={(e) => onChange({ ...fields, fecha_vencimiento: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Documento</label>
            <select 
              value={fields.tipo_documento}
              onChange={(e) => onChange({ ...fields, tipo_documento: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="Factura Electrónica">Factura Electrónica</option>
              <option value="Factura POS">Factura POS</option>
              <option value="Remision">Remisión</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}