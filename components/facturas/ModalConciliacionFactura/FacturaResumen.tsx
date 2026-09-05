import React from "react";

interface FacturaResumenProps {
  factura: {
    numeroFactura: string;
    totalFactura: string | number;
    estadoContable?: string;
    proveedor?: {
      razonSocial?: string;
    } | null;
  };
}

export const FacturaResumen: React.FC<FacturaResumenProps> = ({ factura }) => {
  return (
    <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 text-xs">
      <div>
        <span className="text-gray-400 block font-medium">Proveedor:</span>
        <strong className="text-gray-800 truncate block">
          {factura.proveedor?.razonSocial || "General"}
        </strong>
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
  );
};