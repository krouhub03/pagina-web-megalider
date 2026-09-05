"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, FileText } from "lucide-react";
import AuditModal from "@/components/facturas/AuditModal";

export default function AuditFacturasPage() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFactura, setSelectedFactura] = useState<any>(null);

  const fetchFacturas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/facturas/audit");
      const json = await res.json();
      if (json.success) {
        setFacturas(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  const handleApprove = async (id: number, correctedData: any, auditMetadata: any) => {
    try {
      // 1. Guardar cambios en postgres
      await fetch("/api/facturas/audit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, datosExtraidos: correctedData })
      });
      
      // 2. Aprobar
      const res = await fetch(`/api/facturas/audit/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          observaciones: auditMetadata.observacionAuditoria
        })
      });
      
      if (res.ok) {
        setSelectedFactura(null);
        fetchFacturas();
      } else {
        const error = await res.json();
        alert(error.error || "Error al aprobar");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    }
  };

  const handleDiscard = async (id: number) => {
    if (!confirm("¿Seguro que deseas descartar esta factura permanentemente?")) return;
    try {
      const res = await fetch(`/api/facturas/audit?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedFactura(null);
        fetchFacturas();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Auditoría de Facturas</h1>
          <p className="text-gray-500">Revisa y corrige los datos extraídos por la IA antes de enviarlos a contabilidad.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : facturas.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-1">Bandeja limpia</h3>
            <p className="text-gray-500">No hay facturas pendientes de auditoría.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="px-6 py-4 cursor-help" title="Fecha en que Hermes IA subió el documento al sistema">Fecha de Escaneo</th>
                <th className="px-6 py-4 cursor-help" title="Número consecutivo de la factura">N° Factura</th>
                <th className="px-6 py-4 cursor-help" title="Razón social y NIT del emisor de la factura">Proveedor (NIT)</th>
                <th className="px-6 py-4 text-right cursor-help" title="Costo neto de la factura detectado por el modelo de IA">Total Leído</th>
                <th className="px-6 py-4 text-center cursor-help" title="Opciones de corrección, auditoría de sumatorias o borrado">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facturas.map((f) => {
                let data: any = {};
                try {
                  const parsed = JSON.parse(f.datosExtraidos);
                  data = parsed.factura_compra || parsed;
                } catch (e) {
                  console.error("Error parseando factura:", e);
                }

                return (
                  <tr key={f.id} className="hover:bg-blue-50/50 transition">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(f.creadoEn).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {data?.numero_factura || "Desconocido"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800">{data?.proveedor?.razon_social || "N/A"}</div>
                      <div className="text-xs text-gray-500">NIT: {data?.proveedor?.nit || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-blue-600">
                      {new Intl.NumberFormat('es-CO', { 
                        style: 'currency', 
                        currency: 'COP',
                        minimumFractionDigits: 2
                      }).format(data?.items?.reduce((acc: number, item: any) => acc + (Number(item.costo_total_linea) || 0), 0) || Number(data?.totales?.total_factura || 0))}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedFactura(f)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition tooltip"
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
        )}
      </div>

      {selectedFactura && (
        <AuditModal 
          factura={selectedFactura} 
          onClose={() => setSelectedFactura(null)}
          onApprove={handleApprove}
          onDiscard={handleDiscard}
          onUpdate={(newData: any) => {
            // Actualizar el estado local para que al cerrar el modal la lista refleje los cambios
            setFacturas(prev => prev.map(f => 
              f.id === selectedFactura.id 
                ? { ...f, datosExtraidos: JSON.stringify({ factura_compra: newData }) } 
                : f
            ));
            // Actualizar también la factura seleccionada por si acaso
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
