"use client";

import { Loader2, Search, FileText } from "lucide-react";

interface FacturasTableProps {
  facturas: any[];
  isLoading: boolean;
  onSelectFactura: (factura: any) => void;
}

export default function FacturasTable({ facturas, isLoading, onSelectFactura }: FacturasTableProps) {
  if (isLoading) {
    return (
      <div className="p-12 flex justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (facturas.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-1">Bandeja limpia</h3>
        <p className="text-gray-500">No hay facturas pendientes de auditoría.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 📱 VISTA MÓVIL (Tarjetas) */}
      <div className="grid grid-cols-1 gap-3 md:hidden p-2">
        {facturas.map((f) => {
          let data: any = {};
          try {
            const parsed = JSON.parse(f.datosExtraidos);
            data = parsed.factura_compra || parsed;
          } catch (e) {}

          const totalFormat = new Intl.NumberFormat('es-CO', { 
            style: 'currency', currency: 'COP', minimumFractionDigits: 0 
          }).format(data?.items?.reduce((acc: number, item: any) => acc + (Number(item.costo_total_linea) || 0), 0) || Number(data?.totales?.total_factura || 0));

          return (
            <div key={`mobile-${f.id}`} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3 relative">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium mb-2">
                    {new Date(f.creadoEn).toLocaleDateString()}
                  </span>
                  <h4 className="font-bold text-gray-800 text-base leading-none">
                    {data?.numero_factura || "Sin Número"}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">{data?.proveedor?.razon_social || "Proveedor N/A"}</p>
                </div>
                <button 
                  onClick={() => onSelectFactura(f)}
                  className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors flex-shrink-0"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-between items-center border-t border-gray-50 pt-2 mt-1">
                <span className="text-xs text-gray-400">NIT: {data?.proveedor?.nit || "N/A"}</span>
                <span className="font-semibold text-blue-600">{totalFormat}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 💻 VISTA ESCRITORIO (Tabla con columna fija) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
              <th className="px-6 py-4">Fecha de Escaneo</th>
              <th className="px-6 py-4">N° Factura</th>
              <th className="px-6 py-4">Proveedor (NIT)</th>
              <th className="px-6 py-4 text-right">Total Leído</th>
              <th className="px-6 py-4 text-center sticky right-0 bg-gray-50 z-10 border-l border-gray-200 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {facturas.map((f) => {
              let data: any = {};
              try {
                const parsed = JSON.parse(f.datosExtraidos);
                data = parsed.factura_compra || parsed;
              } catch (e) {}

              const totalFormat = new Intl.NumberFormat('es-CO', { 
                style: 'currency', currency: 'COP', minimumFractionDigits: 2 
              }).format(data?.items?.reduce((acc: number, item: any) => acc + (Number(item.costo_total_linea) || 0), 0) || Number(data?.totales?.total_factura || 0));

              return (
                <tr key={`desktop-${f.id}`} className="group hover:bg-blue-50/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(f.creadoEn).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">
                    {data?.numero_factura || "Desconocido"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800 line-clamp-1">{data?.proveedor?.razon_social || "N/A"}</div>
                    <div className="text-xs text-gray-500">NIT: {data?.proveedor?.nit || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-blue-600 whitespace-nowrap">
                    {totalFormat}
                  </td>
                  <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-blue-50 z-10 border-l border-gray-100 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] transition-colors">
                    <button 
                      onClick={() => onSelectFactura(f)}
                      className="p-2 text-blue-600 hover:bg-blue-200 rounded-lg transition"
                      title="Auditar Factura"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}