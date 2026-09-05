"use client";

import { useState } from "react";
import AuditModal from "@/components/facturas/auditModal";
import FacturasTable from "./FacturasTable"; // Importamos el componente visual
import { useFacturas } from "./useFacturas";   // Importamos el custom hook

export default function AuditFacturasPage() {
  const { facturas, setFacturas, isLoading, handleApprove, handleDiscard } = useFacturas();
  const [selectedFactura, setSelectedFactura] = useState<any>(null);

  const closeAndClear = () => setSelectedFactura(null);

  return (
    // Padding ajustado para móviles (p-4) y escritorio (md:p-6)
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Auditoría de Facturas</h1>
          <p className="text-sm md:text-base text-gray-500">
            Revisa y corrige los datos extraídos por la IA antes de enviarlos a contabilidad.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <FacturasTable 
          facturas={facturas} 
          isLoading={isLoading} 
          onSelectFactura={setSelectedFactura} 
        />
      </div>

      {selectedFactura && (
        <AuditModal 
          factura={selectedFactura} 
          onClose={closeAndClear}
          onApprove={(id: any, correctedData: any, auditMetadata: any) => handleApprove(id, correctedData, auditMetadata, closeAndClear)}
          onDiscard={(id: any) => handleDiscard(id, closeAndClear)}
          onUpdate={(newData: any) => {
            setFacturas(prev => prev.map(f => 
              f.id === selectedFactura.id 
                ? { ...f, datosExtraidos: JSON.stringify({ factura_compra: newData }) } 
                : f
            ));
            setSelectedFactura((prev: any) => ({
              ...prev,
              datosExtraidos: JSON.stringify({ factura_compra: newData })
            }));
          }}
        />
      )}
    </div>
  );
}