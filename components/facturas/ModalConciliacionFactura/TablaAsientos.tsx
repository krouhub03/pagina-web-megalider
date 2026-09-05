import React from "react";
import { Scale } from "lucide-react";
import { AsientoItem } from "./types";

interface TablaAsientosProps {
  asientos: AsientoItem[];
}

export const TablaAsientos: React.FC<TablaAsientosProps> = ({ asientos }) => {
  const totalDebitos = asientos.reduce((acc, a) => acc + Number(a.debito || 0), 0);
  const totalCreditos = asientos.reduce((acc, a) => acc + Number(a.credito || 0), 0);

  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="leading-snug">Asientos Contables Registrados (Partida Doble NIIF)</span>
        </h3>
        <span className="text-[11px] font-mono text-gray-400 shrink-0">
          {asientos.length} líneas
        </span>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-xs min-w-[500px] sm:min-w-full">
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
                  <td className="px-3 py-2.5 sm:py-2 text-blue-700 font-bold">{a.cuentaPuc}</td>
                  <td className="px-3 py-2.5 sm:py-2 text-gray-700 font-sans">{a.concepto}</td>
                  <td className="px-3 py-2.5 sm:py-2 text-right font-semibold text-emerald-700">
                    {Number(a.debito) > 0 ? `$${Number(a.debito).toLocaleString("es-CO", { maximumFractionDigits: 0 })}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 sm:py-2 text-right font-semibold text-purple-700">
                    {Number(a.credito) > 0 ? `$${Number(a.credito).toLocaleString("es-CO", { maximumFractionDigits: 0 })}` : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-3 py-5 text-center text-gray-400 font-sans">
                  Haz clic en &quot;Guardar & Asentar Conciliación&quot; para generar el comprobante de diario.
                </td>
              </tr>
            )}
          </tbody>
          {asientos.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-[11px]">
                <td colSpan={2} className="px-3 py-2.5 sm:py-2 text-right font-sans">
                  SUMAS IGUALES:
                </td>
                <td className="px-3 py-2.5 sm:py-2 text-right text-emerald-800">
                  ${totalDebitos.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                </td>
                <td className="px-3 py-2.5 sm:py-2 text-right text-purple-800">
                  ${totalCreditos.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};