import { Plus, Trash2 } from "lucide-react";
import { FacturaItemEdit } from "./types";

interface TabItemsProps {
  items: FacturaItemEdit[];
  calculos: {
    subtotal: number;
    descuento: number;
    iva: number;
    impoconsumo: number;
    otrosImpuestos: number;
    total: number;
  };
  handleItemChange: (index: number, field: keyof FacturaItemEdit, value: any) => void;
  handleAddItem: () => void;
  handleRemoveItem: (index: number) => void;
}

export function TabItems({
  items,
  calculos,
  handleItemChange,
  handleAddItem,
  handleRemoveItem,
}: TabItemsProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
           Productos / Servicios
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
  );
}